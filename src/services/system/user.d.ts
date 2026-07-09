export {
  assignUserRoles,
  batchDeleteUser,
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  getUserPage,
  register,
  updateUser,
  updateUserPassword,
  getUserDepts,
  assignUserDepts,
  appendUserDepts,
  removeUserDept,
} from "@/services/user/user";

export type { RegisterParams, UserPageParams, UserInfo, User } from "@/services/user/user";

export { default } from "@/services/user/user";
