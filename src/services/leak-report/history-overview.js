/**
 * 历史总览接口封装，聚合疑点和漏点历史分页与详情查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");
const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectHistoryPage = suspectedLeakApi.getPage;
export const getSuspectHistoryDetail = suspectedLeakApi.getDetail;
export const getLeakageHistoryPage = leakageRecordApi.getPage;
export const getLeakageHistoryDetail = leakageRecordApi.getDetail;

export default {
  getSuspectHistoryPage,
  getSuspectHistoryDetail,
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
};
