/**
 * 疑点管理接口封装，包含疑点 CRUD 和关联漏点记录查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");
const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectPage = suspectedLeakApi.getPage;
export const getSuspectList = suspectedLeakApi.getList;
export const getSuspectDetail = suspectedLeakApi.getDetail;
export const createSuspect = suspectedLeakApi.create;
export const updateSuspect = suspectedLeakApi.update;
export const deleteSuspect = suspectedLeakApi.delete;
export const batchDeleteSuspect = suspectedLeakApi.batchDelete;

export const getRelatedLeakageRecordPage = leakageRecordApi.getPage;

export default {
  getSuspectPage,
  getSuspectList,
  getSuspectDetail,
  createSuspect,
  updateSuspect,
  deleteSuspect,
  batchDeleteSuspect,
  getRelatedLeakageRecordPage,
};
