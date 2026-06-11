/**
 * 系统用户配置接口封装，复用 user/user.js 中的用户管理能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
export {
  assignUserRoles,
  batchDeleteUser,
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  getUserPage,
  updateUser,
  updateUserPassword,
} from "@/services/user/user";

export { default } from "@/services/user/user";
