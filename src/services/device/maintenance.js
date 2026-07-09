/**
 * 设备维护接口封装，围绕维护记录提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const maintenanceRecordApi = createCrudService("/api/maintenance-record");

export const getMaintenanceRecordPage = maintenanceRecordApi.getPage;
export const getMaintenanceRecordList = maintenanceRecordApi.getList;
export const getMaintenanceRecordDetail = maintenanceRecordApi.getDetail;
export const createMaintenanceRecord = maintenanceRecordApi.create;
export const updateMaintenanceRecord = maintenanceRecordApi.update;
export const deleteMaintenanceRecord = maintenanceRecordApi.delete;
export const batchDeleteMaintenanceRecord = maintenanceRecordApi.batchDelete;

export function getMaintenanceRecordManagePage(data) {
  return postRequest("/api/maintenance-record/manage/page", data);
}

export function getMaintenanceRecordManageDetail(id) {
  return getRequest(`/api/maintenance-record/manage/${id}`);
}

export default {
  getMaintenanceRecordPage,
  getMaintenanceRecordList,
  getMaintenanceRecordDetail,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  batchDeleteMaintenanceRecord,
  getMaintenanceRecordManagePage,
  getMaintenanceRecordManageDetail,
};
