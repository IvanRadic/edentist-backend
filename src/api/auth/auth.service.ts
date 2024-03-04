import { UserService } from '../user/user.service'
import {
  IAuthService,
  IChangePassword,
  ICheckCredentials,
  ILogout,
  IRefreshToken,
  IRegisterUser,
  IResendRegistrationEmail,
  IResetPassword,
  ISendResetPasswordEmail,
  ISignToken,
  IVerifyRegistration,
  UserSession,
} from './auth.interface'
import { AsyncResponse, ResponseCode } from '../../interfaces'
import { compare, hashString } from '../../services/bcrypt'
import { getResponseMessage } from '../../services/utils'
import { logger } from '../../logger'
import { KeyType, generateToken, verifyToken } from '../../services/jsonwebtoken'
import { AuthQueries } from './auth.queries'
import { query } from '../../services/mysql2'
import config from '../../config'
import { VerificationUIDService } from '../verification-uid/verification-uid.service'
import { ResultSetHeader } from 'mysql2'
import { VerificationUIDType } from '../verification-uid/verification-uid.interface'
import { generateUUID } from '../../services/uuid'
import { UserStatus } from '../user/user.interface'

export class AuthService implements IAuthService {
  private readonly userService: UserService
  private readonly verificationUIDService: VerificationUIDService

  constructor() {
    this.userService = new UserService()
    this.verificationUIDService = new VerificationUIDService()
  }

  async registerUser({ firstName, lastName, email, password }: IRegisterUser) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const passwordHash = await hashString(password)

      const profileImage = `${config.STORAGE_BASE_URL}${config.DEFAULT_PROFILE_IMAGE_LOCATION}`

      const { user, code } = await this.userService.createUser({
        firstName,
        lastName,
        email,
        password: passwordHash,
        profileImage,
      })
      if (!user) {
        return { code }
      }

      const { uid } = await this.verificationUIDService.setVerificationUID({
        userId: user.id,
        type: VerificationUIDType.REGISTRATION,
      })

      /* 
      This is where an email would be sent with a link containing the UID
      */

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async verifyRegistration({ email, uid }: IVerifyRegistration) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code } = await this.userService.getUserByEmail({ email })
      if (!user) {
        return { code }
      }

      if (user.status === UserStatus.VERIFIED) {
        return { code: ResponseCode.ALREADY_VERIFIED }
      }

      const { valid, code: uidCode } = await this.verificationUIDService.verifyUID({
        userId: user.id,
        uid,
        type: VerificationUIDType.REGISTRATION,
      })
      if (!valid) {
        return { code: uidCode }
      }

      const { code: statusUpdateCode } = await this.userService.setUserStatus({
        userId: user.id,
        status: UserStatus.VERIFIED,
      })
      if (statusUpdateCode !== ResponseCode.OK) {
        return { code: statusUpdateCode }
      }

      return { valid, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async resendRegistrationEmail({ email }: IResendRegistrationEmail) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code } = await this.userService.getUserByEmail({ email })
      if (!user) {
        return { code }
      }

      if (user.status === UserStatus.VERIFIED) {
        return { code: ResponseCode.ALREADY_VERIFIED }
      }

      const { uid } = await this.verificationUIDService.setVerificationUID({
        userId: user.id,
        type: VerificationUIDType.REGISTRATION,
      })

      /* 
      This is where an email would be sent with a link containing the UID
      */

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async signToken({ user }: ISignToken) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const accessToken = generateToken({ sub: user.id }, KeyType.ACCESS_TOKEN_PRIVATE_KEY, {
        expiresIn: `${config.ACCESS_TOKEN_EXPIRES_IN}m`,
      })

      const [session] = await query<[UserSession]>(
        AuthQueries.createUserSession,
        [user.id],
        true
      )
      if (!session) {
        return { code: ResponseCode.SESSION_NOT_FOUND }
      }

      const refreshToken = generateToken(
        {
          sub: session.id,
          userId: session.userId,
        },
        KeyType.REFRESH_TOKEN_PRIVATE_KEY,
        {
          expiresIn: `${config.REFRESH_TOKEN_EXPIRES_IN}m`,
        }
      )

      const refreshTokenHash = await hashString(refreshToken)

      const [updatedSession] = await query<[UserSession]>(
        AuthQueries.storeUserSession,
        [session.id, user.id, refreshTokenHash],
        true
      )
      if (!updatedSession) {
        return { code: ResponseCode.SESSION_NOT_UPDATED }
      }

      return { tokens: { accessToken, refreshToken }, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async authenticatePassword({ email, password }: ICheckCredentials) {
    let code = ResponseCode.OK

    try {
      const { user, code } = await this.userService.getUserByEmail({ email })
      if (!user) {
        return { code }
      }

      const matches = await compare(password, user.password)
      if (!matches) {
        return { code: ResponseCode.WRONG_PASSWORD }
      }

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async refreshToken({ refreshToken }: IRefreshToken) {
    let code = ResponseCode.OK

    try {
      //Decode token
      const decodedToken = verifyToken<{ sub: number; userId: number; exp: number }>(
        refreshToken,
        KeyType.REFRESH_TOKEN_PRIVATE_KEY
      )
      if (!decodedToken) {
        return { code: ResponseCode.SESSION_EXPIRED }
      }

      const sessionId = decodedToken.sub
      const userId = decodedToken.userId

      //Fetch active session
      const [session] = await query<[UserSession]>(AuthQueries.getUserSessionById, [sessionId])
      if (!session) {
        return { code: ResponseCode.SESSION_EXPIRED }
      }

      //Compare sessions
      const matches = await compare(refreshToken, session.refreshToken)
      if (!matches) {
        await query(AuthQueries.deleteUserSessionById, [sessionId])
        return { code: ResponseCode.INVALID_TOKEN }
      }

      //Check if token has expired
      let refreshTokenExpiry = new Date(decodedToken.exp * 1000)
      if (refreshTokenExpiry < new Date()) {
        await query(AuthQueries.deleteUserSessionById, [sessionId])
        return { code: ResponseCode.SESSION_EXPIRED }
      }

      //Generate a new refresh token
      const newRefreshToken = generateToken(
        { sub: session.id, userId: session.userId },
        KeyType.REFRESH_TOKEN_PRIVATE_KEY,
        {
          expiresIn: `${config.REFRESH_TOKEN_EXPIRES_IN}m`,
        }
      )

      const refreshTokenHash = await hashString(newRefreshToken)

      const [newSession] = await query<[UserSession]>(
        AuthQueries.storeUserSession,
        [session.id, userId, refreshTokenHash],
        true
      )

      //Generate a new access token
      const accessToken = generateToken({ sub: userId }, KeyType.ACCESS_TOKEN_PRIVATE_KEY, {
        expiresIn: `${config.ACCESS_TOKEN_EXPIRES_IN}m`,
      })

      return { tokens: { accessToken, refreshToken: newRefreshToken }, code }
    } catch (err: any) {
      code = ResponseCode.INVALID_TOKEN
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async logout({ refreshToken }: ILogout) {
    let code = ResponseCode.OK

    try {
      //Decode token
      const decodedToken = verifyToken<{ sub: number; userId: number; exp: number }>(
        refreshToken,
        KeyType.REFRESH_TOKEN_PRIVATE_KEY
      )
      if (!decodedToken) {
        return { code: ResponseCode.SESSION_EXPIRED }
      }

      await query(AuthQueries.deleteUserSessionById, [decodedToken.sub])

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async changePassword({ userId, currentPassword, newPassword }: IChangePassword) {
    let code = ResponseCode.OK

    try {
      const { user, code } = await this.userService.getUserById({ userId })
      if (!user) {
        return { code }
      }

      const verified = await compare(currentPassword, user.password)
      if (!verified) {
        return { code: ResponseCode.WRONG_PASSWORD }
      }

      const passwordHash = await hashString(newPassword)

      await query<ResultSetHeader>(AuthQueries.updatePassword, [passwordHash, userId])

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async sendResetPasswordEmail({ email }: ISendResetPasswordEmail) {
    let code = ResponseCode.OK

    try {
      const { user } = await this.userService.getUserByEmail({ email })
      if (!user) {
        return { code }
      }

      const { uid } = await this.verificationUIDService.setVerificationUID({
        userId: user.id,
        type: VerificationUIDType.RESET_PASSWORD,
      })

      /* 
      This is where an email would be sent with a link containing the UID
      */

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  async resetPassword({ email, password, uid }: IResetPassword) {
    let code = ResponseCode.OK

    try {
      const { user, code: userCode } = await this.userService.getUserByEmail({
        email
      })
      if (!user) {
        return { code: userCode }
      }

      const { valid, code } = await this.verificationUIDService.verifyUID({
        userId: user.id,
        uid,
        type: VerificationUIDType.RESET_PASSWORD,
      })
      if (!valid) {
        return { code }
      }

      const passwordHash = await hashString(password)

      await query<ResultSetHeader>(AuthQueries.resetPassword, [
        user.id,
        passwordHash
      ])

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }
}
