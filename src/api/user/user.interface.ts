import fileUpload from 'express-fileupload'
import { AsyncResponse } from '../../interfaces'

export type FullUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  status: UserStatus
  profileImage: string
  createdAt: string
  updatedAt: string
}

export type User = Omit<FullUser, 'password' | 'createdAt' | 'updatedAt'>

export enum UserRole {
  ADMIN = 'Admin',
  DENTIST = 'Dentist',
  PATIENT = 'Patient'
}

export interface ICreateUser {
  firstName: string
  lastName: string
  email: string
  password: string
  profileImage: string
}

export interface IGetUserByEmail {
  email: string
}

export interface IGetUserById {
  userId: number
}

export enum UserStatus {
  UNVERIFIED = 'Unverified',
  VERIFIED = 'Verified',
  DELETED = 'Deleted'
}

export type Profile = Omit<User, 'email' | 'status'>

export interface IUpdateProfileImage {
  userId: number
  image: fileUpload.UploadedFile
}

export interface IGetProfile {
  userId: number
}

export interface IEditProfile {
  userId: number
  firstName: string
  lastName: string
}

export interface ISetUserStatus {
  userId: number,
  status: UserStatus
}

export interface IUpdateUser {
  id: number
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  password?: string | null
  profileImage?: string | null
}

export interface IDeleteUser {
  userId: number
}

export interface IUserService {
  getUserByEmail(params: IGetUserByEmail): AsyncResponse<FullUser>
  getUserById(params: IGetUserById): AsyncResponse<FullUser>
  createUser(params: ICreateUser): AsyncResponse<FullUser>
  setUserStatus(params: ISetUserStatus): AsyncResponse<null>
  getProfile(params: IGetProfile): AsyncResponse<Profile>
  editProfile(params: IEditProfile): AsyncResponse<Profile>
  updateProfileImage(params: IUpdateProfileImage): AsyncResponse<Profile>
  updateUser(params: IUpdateUser): AsyncResponse<FullUser>
  deleteUser(params: IDeleteUser): AsyncResponse<null>
}
