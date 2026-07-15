export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServiceQuery = Record<string, unknown>;

export function getAudioDataPage(data: ServiceQuery): Promise<ApiResponse>;
export function getAudioDataList(params?: ServiceQuery): Promise<ApiResponse>;
export function getAudioDataDetail(id: number | string): Promise<ApiResponse>;

export function getSamplingDetailPage(data: ServiceQuery): Promise<ApiResponse>;
export function getSamplingDetailList(params?: ServiceQuery): Promise<ApiResponse>;
export function getSamplingDetailDetail(id: number | string): Promise<ApiResponse>;

export function getDataQueryAudioPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDataQueryAudioDetail(id: number | string): Promise<ApiResponse>;

export function getAudioWav(id: number | string, download?: boolean): Promise<unknown>;

declare const service: {
  getAudioDataPage: typeof getAudioDataPage;
  getAudioDataList: typeof getAudioDataList;
  getAudioDataDetail: typeof getAudioDataDetail;
  getSamplingDetailPage: typeof getSamplingDetailPage;
  getSamplingDetailList: typeof getSamplingDetailList;
  getSamplingDetailDetail: typeof getSamplingDetailDetail;
  getDataQueryAudioPage: typeof getDataQueryAudioPage;
  getDataQueryAudioDetail: typeof getDataQueryAudioDetail;
  getAudioWav: typeof getAudioWav;
};

export default service;
