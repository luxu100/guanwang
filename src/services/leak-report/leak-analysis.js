import { createCrudService, postRequest } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");
const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getLeakAnalysisPage = leakageRecordApi.getPage;
export const getAlgorithmAnalysisPage = algorithmResultApi.getPage;

export function getLeakTrend(data) {
  return postRequest("/api/leakage-record/trend", data);
}

export function getLeakDistribution(data) {
  return postRequest("/api/leakage-record/distribution", data);
}

export function getLeakRepairStatistics(data) {
  return postRequest("/api/leakage-record/repair-statistics", data);
}

export default {
  getLeakAnalysisPage,
  getAlgorithmAnalysisPage,
  getLeakTrend,
  getLeakDistribution,
  getLeakRepairStatistics,
};
