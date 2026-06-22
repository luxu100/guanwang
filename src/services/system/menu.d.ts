import type { ApiResponse, PageResult, PermissionItem } from "@/services/user/user";

export type MenuPayload = Partial<PermissionItem> & Record<string, unknown>;

export function getMenuPage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<PermissionItem>>>;
export function getMenuList(params?: Record<string, unknown>): Promise<ApiResponse<PermissionItem[]>>;
export function getMenuDetail(id: number | string): Promise<ApiResponse<PermissionItem>>;
export function createMenu(data: MenuPayload): Promise<ApiResponse<PermissionItem>>;
export function updateMenu(id: number | string, data: MenuPayload): Promise<ApiResponse<boolean>>;
export function deleteMenu(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteMenu(data: Array<number | string>): Promise<ApiResponse<void>>;
export function getMenuTree(params?: Record<string, unknown>): Promise<ApiResponse<PermissionItem[]>>;

declare const menuService: {
  getMenuPage: typeof getMenuPage;
  getMenuList: typeof getMenuList;
  getMenuDetail: typeof getMenuDetail;
  createMenu: typeof createMenu;
  updateMenu: typeof updateMenu;
  deleteMenu: typeof deleteMenu;
  batchDeleteMenu: typeof batchDeleteMenu;
  getMenuTree: typeof getMenuTree;
};

export default menuService;
