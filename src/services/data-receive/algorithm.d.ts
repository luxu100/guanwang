import type { ApiResponse, PageResult, ServiceId, ServiceQuery } from "@/services/data-receive/access";

export interface AlgorithmResult {
  id?: ServiceId;
  deviceId?: ServiceId;
  deviceName?: string;
  deviceNumber?: string;
  samplingId?: ServiceId;
  samplingName?: string;
  audioFileId?: ServiceId;
  audioTime?: string;
  signalprocessingResult?: string;
  signalprocessingResult1?: string;
  signalprocessingResult2?: string;
  signalprocessingResult3?: string;
  createdAt?: string;
}

export interface AlgorithmResultQuery extends ServiceQuery {
  deviceName?: string;
  deviceNumber?: string;
  deviceId?: ServiceId;
  samplingId?: ServiceId;
}

export function getAlgorithmResultPage(data: AlgorithmResultQuery): Promise<ApiResponse<PageResult<AlgorithmResult>>>;
export function getAlgorithmResultList(params?: ServiceQuery): Promise<ApiResponse<AlgorithmResult[]>>;
export function getAlgorithmResultDetail(id: ServiceId): Promise<ApiResponse<AlgorithmResult>>;

declare const service: {
  getAlgorithmResultPage: typeof getAlgorithmResultPage;
  getAlgorithmResultList: typeof getAlgorithmResultList;
  getAlgorithmResultDetail: typeof getAlgorithmResultDetail;
};

export default service;
