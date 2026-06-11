/**
 * 漏点管理接口封装，围绕 leakage-record 资源提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");

export const getLeakPointPage = leakageRecordApi.getPage;
export const getLeakPointList = leakageRecordApi.getList;
export const getLeakPointDetail = leakageRecordApi.getDetail;
export const createLeakPoint = leakageRecordApi.create;
export const updateLeakPoint = leakageRecordApi.update;
export const deleteLeakPoint = leakageRecordApi.delete;
export const batchDeleteLeakPoint = leakageRecordApi.batchDelete;

export default {
  getLeakPointPage,
  getLeakPointList,
  getLeakPointDetail,
  createLeakPoint,
  updateLeakPoint,
  deleteLeakPoint,
  batchDeleteLeakPoint,
};
