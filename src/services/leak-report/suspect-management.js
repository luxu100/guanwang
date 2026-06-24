/**
 * 疑点管理接口封装，围绕 leakage-record 资源提供 CRUD 能力。
 *
 * 后端暂未提供专门的疑点接口，疑点与漏点共用 /api/leakage-record 资源，
 * 业务上通过页面语义区分：疑点管理负责疑似漏点的录入与基础信息维护。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectPage = leakageRecordApi.getPage;
export const getSuspectList = leakageRecordApi.getList;
export const getSuspectDetail = leakageRecordApi.getDetail;
export const createSuspect = leakageRecordApi.create;
export const updateSuspect = leakageRecordApi.update;
export const deleteSuspect = leakageRecordApi.delete;
export const batchDeleteSuspect = leakageRecordApi.batchDelete;

export default {
  getSuspectPage,
  getSuspectList,
  getSuspectDetail,
  createSuspect,
  updateSuspect,
  deleteSuspect,
  batchDeleteSuspect,
};
