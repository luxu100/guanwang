/**
 * 渗漏数据分析接口封装，包含渗漏记录和算法结果查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");
const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getLeakageDataPage = leakageRecordApi.getPage;
export const getLeakageDataList = leakageRecordApi.getList;
export const getLeakageDataDetail = leakageRecordApi.getDetail;
export const createLeakageData = leakageRecordApi.create;
export const updateLeakageData = leakageRecordApi.update;
export const deleteLeakageData = leakageRecordApi.delete;
export const batchDeleteLeakageData = leakageRecordApi.batchDelete;

export const getAlgorithmResultPage = algorithmResultApi.getPage;
export const getAlgorithmResultList = algorithmResultApi.getList;
export const getAlgorithmResultDetail = algorithmResultApi.getDetail;

export default {
  getLeakageDataPage,
  getLeakageDataList,
  getLeakageDataDetail,
  createLeakageData,
  updateLeakageData,
  deleteLeakageData,
  batchDeleteLeakageData,
  getAlgorithmResultPage,
  getAlgorithmResultList,
  getAlgorithmResultDetail,
};
