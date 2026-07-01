import type { ApiResponse, PageResult, ServiceId, ServiceQuery } from "@/services/data-receive/access";

export interface AlgorithmResult {
  id?: ServiceId;
  deviceId?: ServiceId;
  deviceNumber?: string;
  samplingId?: ServiceId;
  audioFileId?: ServiceId;
  audioTime?: string;
  signalprocessingResult?: string;
  signalprocessingResult1?: string;
  signalprocessingResult2?: string;
  signalprocessingResult3?: string;
  createdAt?: string;
}

export interface AlgorithmResultQuery extends ServiceQuery {
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
