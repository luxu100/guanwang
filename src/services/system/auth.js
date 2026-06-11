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
