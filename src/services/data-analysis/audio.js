/**
 * 音频数据分析接口封装，包含采样音频和采样明细查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const samplingAudioApi = createCrudService("/api/sampling-audio");
const samplingDetailApi = createCrudService("/api/sampling-detail");

export const getAudioDataPage = samplingAudioApi.getPage;
export const getAudioDataList = samplingAudioApi.getList;
export const getAudioDataDetail = samplingAudioApi.getDetail;

export const getSamplingDetailPage = samplingDetailApi.getPage;
export const getSamplingDetailList = samplingDetailApi.getList;
export const getSamplingDetailDetail = samplingDetailApi.getDetail;

export default {
  getAudioDataPage,
  getAudioDataList,
  getAudioDataDetail,
  getSamplingDetailPage,
  getSamplingDetailList,
  getSamplingDetailDetail,
};
