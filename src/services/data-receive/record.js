/**
 * 数据记录接口封装，包含采样记录、采样明细、日报、压力和 CSS 采样数据。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
export const getSamplingDailyList = samplingDailyApi.getList;
export const getSamplingDailyDetail = samplingDailyApi.getDetail;
export const getSamplingPressurePage = samplingPressureApi.getPage;
export const getSamplingPressureList = samplingPressureApi.getList;
export const getSamplingPressureDetail = samplingPressureApi.getDetail;
export const getSamplingCssDataPage = samplingCssDataApi.getPage;
export const getSamplingCssDataList = samplingCssDataApi.getList;
export const getSamplingCssDataDetail = samplingCssDataApi.getDetail;

export default {
  getSamplingRecordPage,
  getSamplingRecordList,
  getSamplingRecordDetail,
  getSamplingDetailPage,
  getSamplingDetailList,
  getSamplingDetailDetail,
  getSamplingDailyPage,
  getSamplingDailyList,
  getSamplingDailyDetail,
  getSamplingPressurePage,
  getSamplingPressureList,
  getSamplingPressureDetail,
  getSamplingCssDataPage,
  getSamplingCssDataList,
  getSamplingCssDataDetail,
};
