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
