/**
 * 漏点分析接口封装，包含漏点分页、算法分析、趋势、分布和修复统计。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
