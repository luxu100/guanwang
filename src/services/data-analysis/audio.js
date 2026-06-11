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
