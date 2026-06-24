export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp: number;
}

export interface PermissionItem {
  id: number;
  permissionName: string;
  permissionCode: string;
  permissionType: number;
  parentId: number;
  path: string;
  status: number;
}

export interface RoleItem {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  sort: number;
  createdAt: string;
  permissions: PermissionItem[];
}

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  email: string;
  phone: string;
  avatar: string;
  status: number;
  roles?: RoleItem[];
}

export interface User extends UserInfo {
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  password?: string;
  lastLoginTime?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  tokenPrefix: string;
  userInfo: UserInfo;
  permissions: string[];
  roles: RoleItem[];
}

export interface RegisterParams {
  username: string;
  password: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  deptIds?: Array<number | string>;
  roleIds?: Array<number | string>;
}

export type CreateUserParams = Partial<User>;
export type UpdateUserParams = Partial<User>;

export interface UpdatePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export interface UserPageParams {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: "asc" | "desc" | string;
  sortField?: string;
  username?: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export function login(data: LoginParams): Promise<ApiResponse<LoginResult>>;
export function register(data: RegisterParams): Promise<ApiResponse<UserInfo>>;
export function createUser(data: CreateUserParams): Promise<ApiResponse<UserInfo>>;
export function getUserPage(data: UserPageParams): Promise<ApiResponse<PageResult<UserInfo>>>;
export function getUserList(): Promise<ApiResponse<UserInfo[]>>;
export function getUserDetail(id: number | string): Promise<ApiResponse<UserInfo>>;
export function updateUser(id: number | string, data: UpdateUserParams): Promise<ApiResponse<boolean>>;
export function deleteUser(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteUser(data: Array<number | string>, isForce?: boolean): Promise<ApiResponse<void>>;
export function assignUserRoles(id: number | string, data: Array<number | string>): Promise<ApiResponse<void>>;
export function updateUserPassword(id: number | string, data: UpdatePasswordParams): Promise<ApiResponse<void>>;

declare const userService: {
  login: typeof login;
  register: typeof register;
  createUser: typeof createUser;
  getUserPage: typeof getUserPage;
  getUserList: typeof getUserList;
  getUserDetail: typeof getUserDetail;
  updateUser: typeof updateUser;
  deleteUser: typeof deleteUser;
  batchDeleteUser: typeof batchDeleteUser;
  assignUserRoles: typeof assignUserRoles;
  updateUserPassword: typeof updateUserPassword;
};

export default userService;
