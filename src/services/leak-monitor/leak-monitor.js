/**
 * 渗漏监测接口封装，聚合地图所需设备、管网、漏点、音频和算法结果数据。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const deviceApi = createCrudService("/api/device");
const tubeNetworkApi = createCrudService("/api/tube-network");
const leakageRecordApi = createCrudService("/api/leakage-record");
const samplingAudioApi = createCrudService("/api/sampling-audio");
const samplingDetailApi = createCrudService("/api/sampling-detail");
const algorithmResultApi = createCrudService("/api/algorithm-result");

export const getMapDevicePage = deviceApi.getPage;
export const getMapDeviceList = deviceApi.getList;
export const getMapDeviceDetail = deviceApi.getDetail;
export const getTubeNetworkList = tubeNetworkApi.getList;
export const getTubeNetworkPage = tubeNetworkApi.getPage;
export const getLeakageRecordPage = leakageRecordApi.getPage;
export const getLeakageRecordDetail = leakageRecordApi.getDetail;
export const getSamplingAudioPage = samplingAudioApi.getPage;
export const getSamplingAudioDetail = samplingAudioApi.getDetail;
export const getSamplingDetailPage = samplingDetailApi.getPage;
export const getAlgorithmResultPage = algorithmResultApi.getPage;

export default {
  getMapDevicePage,
  getMapDeviceList,
  getMapDeviceDetail,
  getTubeNetworkList,
  getTubeNetworkPage,
  getLeakageRecordPage,
  getLeakageRecordDetail,
  getSamplingAudioPage,
  getSamplingAudioDetail,
  getSamplingDetailPage,
  getAlgorithmResultPage,
};
