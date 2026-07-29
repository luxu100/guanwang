/**
 * 历史总览接口封装，聚合疑点和漏点历史分页与详情查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const leakageRecordApi = createCrudService("/api/leak-point");
const deviceStatusUploadApi = createCrudService("/api/device-status-upload");
const algorithmInvokeLogApi = createCrudService("/api/algorithm-invoke-log");
const samplingRecordApi = createCrudService("/api/sampling-record");
const samplingDetailApi = createCrudService("/api/sampling-detail");
const samplingDailyApi = createCrudService("/api/device-daily-data");

// 渗漏记录
export const getLeakageHistoryPage = leakageRecordApi.getPage;
export const getLeakageHistoryDetail = leakageRecordApi.getDetail;

// 设备参数上报
export const getDeviceStatusUploadPage = deviceStatusUploadApi.getPage;
export const getDeviceStatusUploadDetail = deviceStatusUploadApi.getDetail;

// 算法调用日志
export const getAlgorithmInvokeLogHistoryPage = algorithmInvokeLogApi.getPage;
export const getAlgorithmInvokeLogHistoryDetail = algorithmInvokeLogApi.getDetail;

// 采样记录
export const getSamplingRecordHistoryPage = samplingRecordApi.getPage;
export const getSamplingRecordHistoryDetail = samplingRecordApi.getDetail;

// 采样明细
export const getSamplingDetailHistoryPage = samplingDetailApi.getPage;
export const getSamplingDetailHistoryDetail = samplingDetailApi.getDetail;

// 采样日报
export const getSamplingDailyHistoryPage = samplingDailyApi.getPage;
export const getSamplingDailyHistoryDetail = samplingDailyApi.getDetail;

export default {
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadDetail,
  getAlgorithmInvokeLogHistoryPage,
  getAlgorithmInvokeLogHistoryDetail,
  getSamplingRecordHistoryPage,
  getSamplingRecordHistoryDetail,
  getSamplingDetailHistoryPage,
  getSamplingDetailHistoryDetail,
  getSamplingDailyHistoryPage,
  getSamplingDailyHistoryDetail,
};