/**
 * 算法分析结果接口封装，供数据接收与解析模块查询算法输出记录。
 */
import { createCrudService } from "@/services/shared/crud";

const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getAlgorithmResultPage = algorithmResultApi.getPage;
export const getAlgorithmResultList = algorithmResultApi.getList;
export const getAlgorithmResultDetail = algorithmResultApi.getDetail;

export default {
  getAlgorithmResultPage,
  getAlgorithmResultList,
  getAlgorithmResultDetail,
};
