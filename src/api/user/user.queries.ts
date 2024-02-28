import { UserStatus } from './user.interface'

export const UserQueries = {
  getUserById: `
  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    profile_image as 'profileImage', 
    status, 
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user 
  WHERE id = ?
    AND status != '${UserStatus.DELETED}'
  `,

  getUserByEmail: `
  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    profile_image as 'profileImage', 
    status, 
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user 
  WHERE email = ?
    AND status != '${UserStatus.DELETED}'
  `,

  createUser: `
  SET @roleId = (SELECT id FROM role WHERE name = ?);
  SELECT @roleId;

  INSERT INTO user(first_name, last_name, email, password, profile_image, role_id)
  VALUES(?, ?, ?, ?, ?, @roleId);

  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password,
    profile_image as 'profileImage',
    status,
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user
  WHERE id = LAST_INSERT_ID();
  `,

  setUserStatus: `
  UPDATE user
  SET status = ?
  WHERE id = ?
  `,

  getProfile: `
  SELECT id,
    first_name as 'firstName',
    last_name as 'lastName',
    profile_image as 'profileImage'
  FROM user
  WHERE id = ?
  AND status != '${UserStatus.DELETED}'
  `,

  editProfile: `
  SET @user_id = ?;

  UPDATE user 
  SET first_name = ?,
    last_name = ?
  WHERE id = @user_id;

  SELECT id,
    first_name as 'firstName',
    last_name as 'lastName',
    profile_image as 'profileImage'
  FROM user
  WHERE id = @user_id
    AND status != '${UserStatus.DELETED}';
  `,

  updateProfileImage: `
  SET @user_id = ?;

  UPDATE user
  SET profile_image = ?
  WHERE id = @user_id;

  SELECT id,
    first_name as 'firstName',
    last_name as 'lastName',
    profile_image as 'profileImage'
  FROM user
  WHERE id = @user_id
    AND status != '${UserStatus.DELETED}';
  `,

  updateUser: `
  SET @user_id = ?;

  UPDATE user
  SET first_name = ?,
    last_name = ?,
    email = ?,
    password = ?,
    profile_image = ?
  WHERE id = @user_id;

  SELECT id, 
    first_name as 'firstName', 
    last_name as 'lastName', 
    email, 
    password, 
    profile_image as 'profileImage', 
    status, 
    created_at as 'createdAt', 
    updated_at as 'updatedAt'
  FROM user 
  WHERE id = @user_id
    AND status != '${UserStatus.DELETED}';
  `,
}
