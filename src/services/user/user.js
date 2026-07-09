/**
 * 用户接口封装，包含登录、注册、用户 CRUD、角色分配和密码更新。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import request from "@/utils/request";

function appendForceDeleteParam(url, isForce = true) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${new URLSearchParams({ is_force: String(isForce) }).toString()}`;
}

export function login(data) {
  return request({
    url: "/api/user/login",
    method: "post",
    data,
  });
}

export function register(data) {
  return request({
    url: "/api/user/register",
    method: "post",
    data,
  });
}

export function createUser(data) {
  return request({
    url: "/api/user/create",
    method: "post",
    data,
  });
}

export function getUserPage(data) {
  return request({
    url: "/api/user/page",
    method: "post",
    data,
  });
}

export function getUserList() {
  return request({
    url: "/api/user/list",
    method: "get",
  });
}

export function getUserDetail(id) {
  return request({
    url: `/api/user/${id}`,
    method: "get",
  });
}

export function updateUser(id, data) {
  return request({
    url: `/api/user/${id}`,
    method: "put",
    data,
  });
}

export function deleteUser(id, isForce = true) {
  return request({
    url: appendForceDeleteParam(`/api/user/${id}`, isForce),
    method: "delete",
  });
}

export function batchDeleteUser(data, isForce = true) {
  return request({
    url: appendForceDeleteParam("/api/user/batch-delete", isForce),
    method: "delete",
    data,
  });
}

export function assignUserRoles(id, data) {
  return request({
    url: `/api/user/${id}/roles`,
    method: "post",
    data,
  });
}

export function updateUserPassword(id, data) {
  return request({
    url: `/api/user/${id}/password`,
    method: "post",
    data,
  });
}

export function getUserDepts(id) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "get",
  });
}

export function assignUserDepts(id, data) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "put",
    data,
  });
}

export function appendUserDepts(id, data) {
  return request({
    url: `/api/user/${id}/depts`,
    method: "post",
    data,
  });
}

export function removeUserDept(id, deptId) {
  return request({
    url: `/api/user/${id}/depts/${deptId}`,
    method: "delete",
  });
}

export default {
  login,
  register,
  createUser,
  getUserPage,
  getUserList,
  getUserDetail,
  updateUser,
  deleteUser,
  batchDeleteUser,
  assignUserRoles,
  updateUserPassword,
  getUserDepts,
  assignUserDepts,
  appendUserDepts,
  removeUserDept,
};
