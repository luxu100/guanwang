/**
 * 菜单管理接口封装，基于 permission 资源维护菜单和权限树。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, deleteRequest, getRequest } from "@/services/shared/crud";

const permissionApi = createCrudService("/api/permission");

export const getMenuPage = permissionApi.getPage;
export const getMenuList = permissionApi.getList;
export const getMenuDetail = permissionApi.getDetail;
export const createMenu = permissionApi.create;
export const updateMenu = permissionApi.update;
export const deleteMenu = permissionApi.delete;

// Menu cleanup may involve cascading permission relations, so allow more time than the global request timeout.
export function batchDeleteMenu(data, isForce = true) {
  return deleteRequest("/api/permission/batch-delete", data, isForce, 60000);
}

export function getMenuTree(params) {
  return getRequest("/api/permission/tree", params);
}

export default {
  getMenuPage,
  getMenuList,
  getMenuDetail,
  createMenu,
  updateMenu,
  deleteMenu,
  batchDeleteMenu,
  getMenuTree,
};
