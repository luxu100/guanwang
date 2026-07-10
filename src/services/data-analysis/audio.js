/**
 * 音频数据分析接口封装，包含采样音频和采样明细查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const samplingAudioApi = createCrudService("/api/sampling-audio");
const samplingDetailApi = createCrudService("/api/sampling-detail");

export const getAudioDataPage = samplingAudioApi.getPage;
export const getAudioDataList = samplingAudioApi.getList;
export const getAudioDataDetail = samplingAudioApi.getDetail;

export const getSamplingDetailPage = samplingDetailApi.getPage;
export const getSamplingDetailList = samplingDetailApi.getList;
export const getSamplingDetailDetail = samplingDetailApi.getDetail;

export function getDataQueryAudioPage(data) {
  return postRequest("/api/data-query/audio/page", data);
}

export function getDataQueryAudioDetail(audioId) {
  return getRequest(`/api/data-query/audio/${audioId}`);
}

export function getSamplingAudioWav(id, params) {
  return getRequest(`/api/sampling-audio/${id}/wav`, params);
}

export function migrateAudioBinToTxt(data) {
  return postRequest("/api/admin/audio/migrate-bin-to-txt", data);
}

export default {
  getAudioDataPage,
  getAudioDataList,
  getAudioDataDetail,
  getSamplingDetailPage,
  getSamplingDetailList,
  getSamplingDetailDetail,
  getDataQueryAudioPage,
  getDataQueryAudioDetail,
  getSamplingAudioWav,
  migrateAudioBinToTxt,
};
