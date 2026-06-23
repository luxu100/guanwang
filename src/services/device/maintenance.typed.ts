/**
 * 设备维护接口封装，围绕维护记录提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import {createCrudServiceTyped, getRequestT} from "@/services/shared/crud.typed";
import type {DeviceProduct, MaintenanceRecord} from "@/services/device/types";
import type {ApiResponse} from "@/types/api";

const maintenanceRecordApi = createCrudServiceTyped<MaintenanceRecord>("/api/maintenance-record");

export const getMaintenanceRecordPageT = maintenanceRecordApi.getPage;
export const getMaintenanceRecordListT = maintenanceRecordApi.getList;
export const getMaintenanceRecordDetailT = maintenanceRecordApi.getDetail;
export const createMaintenanceRecordT = maintenanceRecordApi.create;
export const updateMaintenanceRecordT = maintenanceRecordApi.update;
export const deleteMaintenanceRecordT = maintenanceRecordApi.delete;
export const batchDeleteMaintenanceRecordT = maintenanceRecordApi.batchDelete;

export default {
  getMaintenanceRecordPageT,
  getMaintenanceRecordListT,
  getMaintenanceRecordDetailT,
  createMaintenanceRecordT,
  updateMaintenanceRecordT,
  deleteMaintenanceRecordT,
  batchDeleteMaintenanceRecordT,
};

