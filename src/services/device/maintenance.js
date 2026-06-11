import { createCrudService } from "@/services/shared/crud";

const maintenanceRecordApi = createCrudService("/api/maintenance-record");

export const getMaintenanceRecordPage = maintenanceRecordApi.getPage;
export const getMaintenanceRecordList = maintenanceRecordApi.getList;
export const getMaintenanceRecordDetail = maintenanceRecordApi.getDetail;
export const createMaintenanceRecord = maintenanceRecordApi.create;
export const updateMaintenanceRecord = maintenanceRecordApi.update;
export const deleteMaintenanceRecord = maintenanceRecordApi.delete;
export const batchDeleteMaintenanceRecord = maintenanceRecordApi.batchDelete;

export default {
  getMaintenanceRecordPage,
  getMaintenanceRecordList,
  getMaintenanceRecordDetail,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  batchDeleteMaintenanceRecord,
};
