/**
 * 算法分析接口封装，提供算法分析结果的分页查询和详情查看。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 *
 * 漏点分析页使用的关联音频分页查询也在此封装，避免直接依赖 data-analysis 模块共用服务。
 * 本封装只负责 /api/sampling-audio/page 的分页查询，WAV/TXT 媒体读取不在本轮范围内。
 */
import { createCrudService } from "@/services/shared/crud";

const algorithmResultApi = createCrudService("/api/algorithm-result");
const associatedAudioApi = createCrudService("/api/sampling-audio");

export const getAlgorithmAnalysisPage = algorithmResultApi.getPage;
export const getAlgorithmAnalysisDetail = algorithmResultApi.getDetail;

/**
 * 查询关联音频分页（按 deviceNumber 完整扫描，严格匹配 audioFileId）。
 * 仅封装 /api/sampling-audio/page，参数和响应结构与 sampling-audio 资源一致。
 */
export const getAssociatedAudioPage = associatedAudioApi.getPage;

export default {
  getAlgorithmAnalysisPage,
  getAlgorithmAnalysisDetail,
  getAssociatedAudioPage,
};
