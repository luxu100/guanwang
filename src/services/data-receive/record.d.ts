import type { ApiResponse, PageResult, ServiceId, ServiceQuery } from "@/services/data-receive/access";

export interface SamplingRecord {
  id?: ServiceId;
  deviceId?: ServiceId;
  deviceName?: string;
  deviceNumber?: string;
  tubeGroup?: string;
  samplingTime?: string;
  samplingAddress?: string;
  leakEsa?: number;
  leakIntensity?: number;
  leakFrequency?: number;
  leakStatus?: number;
  pressure?: string;
  createdAt?: string;
}

export interface SamplingDetail {
  id?: ServiceId;
  samplingId?: ServiceId;
  samplingName?: string;
  deviceName?: string;
  deviceNumber?: string;
  orderNumber?: number;
  leakEsa?: number;
  leakIntensity?: number;
  leakFrequency?: number;
  createdAt?: string;
}

export interface SamplingDaily {
  id?: ServiceId;
  deviceName?: string;
  deviceNumber?: string;
  deviceId?: ServiceId;
  leakProperty?: number;
  leakStatus?: number;
  samplingTime?: string;
  samplingAddress?: string;
}

export interface SamplingPressure {
  id?: ServiceId;
  deviceId?: ServiceId;
  deviceName?: string;
  deviceNumber?: string;
  pressureFileId?: ServiceId;
  pressureTime?: string;
  pressureAddress?: string;
  createdAt?: string;
}

export interface SamplingCssData {
  id?: ServiceId;
  deviceId?: ServiceId;
  deviceName?: string;
  deviceNumber?: string;
  samplingTime?: string;
  liquidDepth?: string;
  wellTemperature?: string;
  wellPressure?: string;
  cavityTemperature?: string;
  cavityPressure?: string;
  batteryVoltage?: string;
  batteryLevel?: string;
  analysisConclusion?: string;
  createdAt?: string;
}

export function getSamplingRecordPage(data: ServiceQuery): Promise<ApiResponse<PageResult<SamplingRecord>>>;
export function getSamplingRecordList(params?: ServiceQuery): Promise<ApiResponse<SamplingRecord[]>>;
export function getSamplingRecordDetail(id: ServiceId): Promise<ApiResponse<SamplingRecord>>;

export function getSamplingDetailPage(data: ServiceQuery): Promise<ApiResponse<PageResult<SamplingDetail>>>;
export function getSamplingDetailList(params?: ServiceQuery): Promise<ApiResponse<SamplingDetail[]>>;
export function getSamplingDetailDetail(id: ServiceId): Promise<ApiResponse<SamplingDetail>>;

export function getSamplingDailyPage(data: ServiceQuery): Promise<ApiResponse<PageResult<SamplingDaily>>>;
export function getSamplingDailyList(params?: ServiceQuery): Promise<ApiResponse<SamplingDaily[]>>;
export function getSamplingDailyDetail(id: ServiceId): Promise<ApiResponse<SamplingDaily>>;

export function getSamplingPressurePage(data: ServiceQuery): Promise<ApiResponse<PageResult<SamplingPressure>>>;
export function getSamplingPressureList(params?: ServiceQuery): Promise<ApiResponse<SamplingPressure[]>>;
export function getSamplingPressureDetail(id: ServiceId): Promise<ApiResponse<SamplingPressure>>;

export function getSamplingCssDataPage(data: ServiceQuery): Promise<ApiResponse<PageResult<SamplingCssData>>>;
export function getSamplingCssDataList(params?: ServiceQuery): Promise<ApiResponse<SamplingCssData[]>>;
export function getSamplingCssDataDetail(id: ServiceId): Promise<ApiResponse<SamplingCssData>>;

declare const service: {
  getSamplingRecordPage: typeof getSamplingRecordPage;
  getSamplingRecordList: typeof getSamplingRecordList;
  getSamplingRecordDetail: typeof getSamplingRecordDetail;
  getSamplingDetailPage: typeof getSamplingDetailPage;
  getSamplingDetailList: typeof getSamplingDetailList;
  getSamplingDetailDetail: typeof getSamplingDetailDetail;
  getSamplingDailyPage: typeof getSamplingDailyPage;
  getSamplingDailyList: typeof getSamplingDailyList;
  getSamplingDailyDetail: typeof getSamplingDailyDetail;
  getSamplingPressurePage: typeof getSamplingPressurePage;
  getSamplingPressureList: typeof getSamplingPressureList;
  getSamplingPressureDetail: typeof getSamplingPressureDetail;
  getSamplingCssDataPage: typeof getSamplingCssDataPage;
  getSamplingCssDataList: typeof getSamplingCssDataList;
  getSamplingCssDataDetail: typeof getSamplingCssDataDetail;
};

export default service;
