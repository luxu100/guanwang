/**
 * 权限管理接口封装，包含角色、权限、权限树和角色授权能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const roleApi = createCrudService("/api/role");
const permissionApi = createCrudService("/api/permission");

export const getRolePage = roleApi.getPage;
export const getRoleList = roleApi.getList;
export const getRoleDetail = roleApi.getDetail;
export const createRole = roleApi.create;
export const updateRole = roleApi.update;
export const deleteRole = roleApi.delete;
export const batchDeleteRole = roleApi.batchDelete;

export const getPermissionPage = permissionApi.getPage;
export const getPermissionList = permissionApi.getList;
export const getPermissionDetail = permissionApi.getDetail;
export const createPermission = permissionApi.create;
export const updatePermission = permissionApi.update;
export const deletePermission = permissionApi.delete;
export const batchDeletePermission = permissionApi.batchDelete;

export function getPermissionTree(data) {
  return getRequest("/api/permission/tree", data);
}

export function assignRolePermissions(roleId, data) {
  return postRequest(`/api/role/${roleId}/permissions`, data);
}

export default {
  getRolePage,
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  batchDeleteRole,
  getPermissionPage,
  getPermissionList,
  getPermissionDetail,
  createPermission,
  updatePermission,
  deletePermission,
  batchDeletePermission,
  getPermissionTree,
  assignRolePermissions,
};
