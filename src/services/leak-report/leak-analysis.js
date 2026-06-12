/**
 * 漏点分析接口封装，包含漏点分页、算法分析、趋势、分布和修复统计。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leakage-record");
const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getLeakAnalysisPage = leakageRecordApi.getPage;
export const getAlgorithmAnalysisPage = algorithmResultApi.getPage;
export const getLeakAnalysisDetail = leakageRecordApi.getDetail;
export const getAlgorithmAnalysisDetail = algorithmResultApi.getDetail;

export default {
  getLeakAnalysisPage,
  getAlgorithmAnalysisPage,
  getLeakAnalysisDetail,
  getAlgorithmAnalysisDetail,
};
