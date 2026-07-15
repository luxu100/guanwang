/**
 * 算法分析接口封装，提供算法分析结果的分页查询和详情查看。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getAlgorithmAnalysisPage = algorithmResultApi.getPage;
export const getAlgorithmAnalysisDetail = algorithmResultApi.getDetail;

export default {
  getAlgorithmAnalysisPage,
  getAlgorithmAnalysisDetail,
};
