import type { ApiResponse, PageResult, PermissionItem, RoleItem } from "@/services/user/user";

export interface RolePageParams {
  pageNum?: number;
  pageSize?: number;
  roleName?: string;
  roleCode?: string;
  status?: number | string;
}

export type RolePayload = Partial<RoleItem> & Record<string, unknown>;
export type PermissionPayload = Partial<PermissionItem> & Record<string, unknown>;
export type OperationLogPayload = Record<string, unknown>;

export function getRolePage(data: RolePageParams): Promise<ApiResponse<PageResult<RoleItem>>>;
export function getRoleList(params?: RolePageParams): Promise<ApiResponse<RoleItem[]>>;
export function getRoleDetail(id: number | string): Promise<ApiResponse<RoleItem>>;
export function createRole(data: RolePayload): Promise<ApiResponse<RoleItem>>;
export function updateRole(id: number | string, data: RolePayload): Promise<ApiResponse<boolean>>;
export function deleteRole(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteRole(data: Array<number | string>): Promise<ApiResponse<void>>;

export function getPermissionPage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<PermissionItem>>>;
export function getPermissionList(params?: Record<string, unknown>): Promise<ApiResponse<PermissionItem[]>>;
export function getPermissionDetail(id: number | string): Promise<ApiResponse<PermissionItem>>;
export function createPermission(data: PermissionPayload): Promise<ApiResponse<PermissionItem>>;
export function updatePermission(id: number | string, data: PermissionPayload): Promise<ApiResponse<boolean>>;
export function deletePermission(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeletePermission(data: Array<number | string>): Promise<ApiResponse<void>>;
export function getPermissionTree(data?: Record<string, unknown>): Promise<ApiResponse<PermissionItem[]>>;
export function assignRolePermissions(roleId: number | string, data: Array<number | string>): Promise<ApiResponse<void>>;
export function getRolePermissions(roleId: number | string): Promise<ApiResponse<PermissionItem[]>>;

export function getOperationLogPage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<Record<string, unknown>>>>;
export function getOperationLogList(params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>[]>>;
export function getOperationLogDetail(id: number | string): Promise<ApiResponse<Record<string, unknown>>>;
export function createOperationLog(data: OperationLogPayload): Promise<ApiResponse<Record<string, unknown>>>;
export function updateOperationLog(id: number | string, data: OperationLogPayload): Promise<ApiResponse<boolean>>;
export function deleteOperationLog(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteOperationLog(data: Array<number | string>): Promise<ApiResponse<void>>;

declare const authService: {
  getRolePage: typeof getRolePage;
  getRoleList: typeof getRoleList;
  getRoleDetail: typeof getRoleDetail;
  createRole: typeof createRole;
  updateRole: typeof updateRole;
  deleteRole: typeof deleteRole;
  batchDeleteRole: typeof batchDeleteRole;
  getPermissionPage: typeof getPermissionPage;
  getPermissionList: typeof getPermissionList;
  getPermissionDetail: typeof getPermissionDetail;
  createPermission: typeof createPermission;
  updatePermission: typeof updatePermission;
  deletePermission: typeof deletePermission;
  batchDeletePermission: typeof batchDeletePermission;
  getPermissionTree: typeof getPermissionTree;
  assignRolePermissions: typeof assignRolePermissions;
  getRolePermissions: typeof getRolePermissions;
  getOperationLogPage: typeof getOperationLogPage;
  getOperationLogList: typeof getOperationLogList;
  getOperationLogDetail: typeof getOperationLogDetail;
  createOperationLog: typeof createOperationLog;
  updateOperationLog: typeof updateOperationLog;
  deleteOperationLog: typeof deleteOperationLog;
  batchDeleteOperationLog: typeof batchDeleteOperationLog;
};

export default authService;
