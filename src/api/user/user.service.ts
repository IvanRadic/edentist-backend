import config from '../../config'
import { AsyncResponse, ResponseCode, ResponseMessage } from '../../interfaces'
import { logger } from '../../logger'
import { query } from '../../services/mysql2'
import { getResponseMessage } from '../../services/utils'
import { UserQueries } from './user.queries'
import {
  FullUser,
  ICreateUser,
  IGetProfile,
  IGetUserByEmail,
  IGetUserById,
  IUpdateProfileImage,
  IUserService,
  Profile,
  IEditProfile,
  ISetUserStatus,
  UserRole,
  IUpdateUser,
} from './user.interface'
import { UserQueries } from './user.queries'

export class UserService implements IUserService {
  constructor() {}

  getUserByEmail = async ({ email }: IGetUserByEmail) => {
    let code = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(UserQueries.getUserByEmail, [
        email
      ])
      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  getUserById = async ({ userId }: IGetUserById) => {
    let code = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(UserQueries.getUserById, [userId])
      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  setUserStatus = async ({ userId, status }: ISetUserStatus) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      await query(UserQueries.setUserStatus, [status, userId])

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  createUser = async ({
    firstName,
    lastName,
    email,
    password,
    profileImage
  }: ICreateUser) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(
        UserQueries.createUser,
        [UserRole.PATIENT, firstName, lastName, email, password, profileImage],
        true
      )

      return { user, code }
    } catch (err: any) {
      switch (err.errno) {
        case 1062:
          code = ResponseCode.EMAIL_TAKEN
          break
        default:
          code = ResponseCode.SERVER_ERROR
          logger.error({
            code,
            message: getResponseMessage(code),
            stack: err.stack
          })
      }
    }

    return { code }
  }

  getProfile = async ({ userId }: IGetProfile) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [profile] = await query<[Profile]>(UserQueries.getProfile, [userId])
      if (!profile) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { profile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  async editProfile({
    userId,
    firstName,
    lastName
  }: IEditProfile) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [profile] = await query<[Profile]>(
        UserQueries.editProfile,
        [userId, firstName, lastName],
        true
      )

      return { profile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  updateProfileImage = async ({ userId, image }: IUpdateProfileImage) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code: userCode } = await this.getUserById({ userId })
      if (!user) {
        return { code: userCode }
      }

      if (image.size > config.FILE_UPLOAD_SIZE_LIMIT * 1024 * 1024) {
        return {
          code: ResponseCode.FILE_TOO_LARGE
        }
      }

      const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
      if (!ACCEPTED_IMAGE_TYPES.includes(image.mimetype)) {
        return {
          code: ResponseCode.WRONG_INPUT_PHOTO_TYPE
        }
      }

      const url = `${config.STORAGE_BASE_URL}${config.PROFILE_IMAGE_BASE_URL}${userId}`

      /*
        Upload related logic to specific service or location goes here
      */

      const [updatedProfile] = await query<[Profile]>(
        UserQueries.updateProfileImage,
        [userId, url],
        true
      )

      return { profile: updatedProfile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  async updateUser( updatedUser: IUpdateUser) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user: originalUser, code: userCode } = await this.getUserById({
        userId: updatedUser.id
      })
      if (!originalUser) {
        return { code: userCode }
      }

      let user = _.omit(originalUser, ['status', 'createdAt', 'updatedAt'])

      for (const key in updatedUser) {
        if (updatedUser[key as keyof IUpdateUser] !== user[key as keyof IUpdateUser]) {
          (user as any)[key] = updatedUser[key as keyof IUpdateUser];
        }
      }

      const [updatedProfile] = await query<[FullUser]>(
        UserQueries.updateUser,
        [user.id, user.firstName, user.lastName, user.email, user.password, user.profileImage],
        true
      )
      if (!updatedProfile) {
        return { code: ResponseCode.USER_NOT_UPDATED }
      }

      return { user: updatedProfile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

}
