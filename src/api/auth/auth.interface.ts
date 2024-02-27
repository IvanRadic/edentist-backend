import { AsyncResponse } from '../../interfaces'
import { FullUser, User } from '../user/user.interface'

export type UserLoginTypes = {
  email: boolean
  google: boolean
  linkedIn: boolean
}

export type UserResetPassword = {
  userId: number
  resetPasswordUID: string
  createdAt: string
}

export type UserSession = {
  id: number
  userId: number
  refreshToken: string
  createdAt: string
  updatedAt: string
}

export interface IRegisterUser {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface ICheckCredentials {
  email: string
  password: string
}

export interface ISignToken {
  user: FullUser | User
}

export interface IRefreshToken {
  refreshToken: string
}

export interface ILogout {
  refreshToken: string
}

export interface ISendResetPasswordEmail {
  email: string
}

export interface IResetPassword {
  email: string
  password: string
  uid: string
}

export interface IChangePassword {
  userId: number
  currentPassword: string
  newPassword: string
}

export interface IResendRegistrationEmail {
  email: string
}

export interface IVerifyRegistration {
  email: string
  uid: string
}

export interface IAuthService {
  registerUser(params: IRegisterUser): AsyncResponse<FullUser>
  verifyRegistration(params: IVerifyRegistration): AsyncResponse<boolean>
  resendRegistrationEmail(params: IResendRegistrationEmail): AsyncResponse<null>
  authenticatePassword(params: ICheckCredentials): AsyncResponse<FullUser>
  signToken(params: ISignToken): AsyncResponse<{ accessToken: string, refreshToken: string }>
  refreshToken(params: IRefreshToken): AsyncResponse<{ accessToken: string, refreshToken: string }>
  logout(params: ILogout): AsyncResponse<boolean>
  sendResetPasswordEmail(params: ISendResetPasswordEmail): AsyncResponse<boolean>
  resetPassword(params: IResetPassword): AsyncResponse<any>
  changePassword(params: IChangePassword): AsyncResponse<number>
}
