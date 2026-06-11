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
