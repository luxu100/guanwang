export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type HistoryQuery = Record<string, unknown>;

export function getLeakageHistoryPage(data: HistoryQuery): Promise<ApiResponse>;
export function getLeakageHistoryDetail(id: number | string): Promise<ApiResponse>;
export function getDeviceStatusUploadPage(data: HistoryQuery): Promise<ApiResponse>;
export function getDeviceStatusUploadDetail(id: number | string): Promise<ApiResponse>;
export function getAlgorithmInvokeLogHistoryPage(data: HistoryQuery): Promise<ApiResponse>;
export function getAlgorithmInvokeLogHistoryDetail(id: number | string): Promise<ApiResponse>;
export function getSamplingRecordHistoryPage(data: HistoryQuery): Promise<ApiResponse>;
export function getSamplingRecordHistoryDetail(id: number | string): Promise<ApiResponse>;
export function getSamplingDetailHistoryPage(data: HistoryQuery): Promise<ApiResponse>;
export function getSamplingDetailHistoryDetail(id: number | string): Promise<ApiResponse>;
export function getSamplingDailyHistoryPage(data: HistoryQuery): Promise<ApiResponse>;
export function getSamplingDailyHistoryDetail(id: number | string): Promise<ApiResponse>;

declare const service: {
  getLeakageHistoryPage: typeof getLeakageHistoryPage;
  getLeakageHistoryDetail: typeof getLeakageHistoryDetail;
  getDeviceStatusUploadPage: typeof getDeviceStatusUploadPage;
  getDeviceStatusUploadDetail: typeof getDeviceStatusUploadDetail;
  getAlgorithmInvokeLogHistoryPage: typeof getAlgorithmInvokeLogHistoryPage;
  getAlgorithmInvokeLogHistoryDetail: typeof getAlgorithmInvokeLogHistoryDetail;
  getSamplingRecordHistoryPage: typeof getSamplingRecordHistoryPage;
  getSamplingRecordHistoryDetail: typeof getSamplingRecordHistoryDetail;
  getSamplingDetailHistoryPage: typeof getSamplingDetailHistoryPage;
  getSamplingDetailHistoryDetail: typeof getSamplingDetailHistoryDetail;
  getSamplingDailyHistoryPage: typeof getSamplingDailyHistoryPage;
  getSamplingDailyHistoryDetail: typeof getSamplingDailyHistoryDetail;
};

export default service;
