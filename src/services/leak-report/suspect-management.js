/**
 * 疑点管理接口封装，包含疑点 CRUD 和关联漏点记录查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");

export const getRelatedLeakageRecordPage = leakageRecordApi.getPage;
export const getRelatedLeakageRecordList = leakageRecordApi.getList;
export const getRelatedLeakageRecordDetail = leakageRecordApi.getDetail;

export default {
  getRelatedLeakageRecordPage,
  getRelatedLeakageRecordList,
  getRelatedLeakageRecordDetail,
};
