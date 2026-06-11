import { createCrudService } from "@/services/shared/crud";

const samplingRecordApi = createCrudService("/api/sampling-record");
const samplingDetailApi = createCrudService("/api/sampling-detail");
const samplingDailyApi = createCrudService("/api/sampling-daily");
const samplingPressureApi = createCrudService("/api/sampling-pressure");
const samplingCssDataApi = createCrudService("/api/sampling-css-data");

export const getSamplingRecordPage = samplingRecordApi.getPage;
export const getSamplingRecordList = samplingRecordApi.getList;
export const getSamplingRecordDetail = samplingRecordApi.getDetail;

export const getSamplingDetailPage = samplingDetailApi.getPage;
export const getSamplingDetailList = samplingDetailApi.getList;
export const getSamplingDetailDetail = samplingDetailApi.getDetail;

export const getSamplingDailyPage = samplingDailyApi.getPage;
export const getSamplingPressurePage = samplingPressureApi.getPage;
export const getSamplingCssDataPage = samplingCssDataApi.getPage;

export default {
  getSamplingRecordPage,
  getSamplingRecordList,
  getSamplingRecordDetail,
  getSamplingDetailPage,
  getSamplingDetailList,
  getSamplingDetailDetail,
  getSamplingDailyPage,
  getSamplingPressurePage,
  getSamplingCssDataPage,
};
