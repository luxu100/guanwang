import type { ApiResponse } from "@/types/api";

type ServiceId = number | string;
type ServiceQuery = Record<string, unknown>;

export function getLeakageDataPage(data: ServiceQuery): Promise<ApiResponse>;
export function getLeakageDataList(params?: ServiceQuery): Promise<ApiResponse>;
export function getLeakageDataDetail(id: ServiceId): Promise<ApiResponse>;
export function createLeakageData(data: ServiceQuery): Promise<ApiResponse>;
export function updateLeakageData(id: ServiceId, data: ServiceQuery): Promise<ApiResponse>;
export function deleteLeakageData(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteLeakageData(ids: ServiceId[], isForce?: boolean): Promise<ApiResponse>;

export function getAlgorithmResultPage(data: ServiceQuery): Promise<ApiResponse>;
export function getAlgorithmResultList(params?: ServiceQuery): Promise<ApiResponse>;
export function getAlgorithmResultDetail(id: ServiceId): Promise<ApiResponse>;

export function getDataQueryLeakagePage(data: ServiceQuery): Promise<ApiResponse>;
export function getDataQueryLeakageDetail(id: ServiceId): Promise<ApiResponse>;

declare const service: {
  getLeakageDataPage: typeof getLeakageDataPage;
  getLeakageDataList: typeof getLeakageDataList;
  getLeakageDataDetail: typeof getLeakageDataDetail;
  createLeakageData: typeof createLeakageData;
  updateLeakageData: typeof updateLeakageData;
  deleteLeakageData: typeof deleteLeakageData;
  batchDeleteLeakageData: typeof batchDeleteLeakageData;
  getAlgorithmResultPage: typeof getAlgorithmResultPage;
  getAlgorithmResultList: typeof getAlgorithmResultList;
  getAlgorithmResultDetail: typeof getAlgorithmResultDetail;
  getDataQueryLeakagePage: typeof getDataQueryLeakagePage;
  getDataQueryLeakageDetail: typeof getDataQueryLeakageDetail;
};

export default service;
