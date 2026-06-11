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
