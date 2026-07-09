export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServicePayload = Record<string, unknown> | FormData;
export type ServiceQuery = Record<string, unknown>;
export type ServiceId = string | number;

export function getSysFilePage(data: ServiceQuery): Promise<ApiResponse>;
export function getSysFileList(params?: ServiceQuery): Promise<ApiResponse>;
export function getSysFileDetail(id: ServiceId): Promise<ApiResponse>;
export function createSysFile(data: ServicePayload): Promise<ApiResponse>;
export function updateSysFile(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteSysFile(id: ServiceId, isForce?: boolean): Promise<ApiResponse>;
export function batchDeleteSysFile(data: ServicePayload, isForce?: boolean): Promise<ApiResponse>;

export function uploadImage(data: ServicePayload): Promise<ApiResponse>;
export function uploadAudio(data: ServicePayload): Promise<ApiResponse>;
export function uploadVideo(data: ServicePayload): Promise<ApiResponse>;

declare const service: {
  getSysFilePage: typeof getSysFilePage;
  getSysFileList: typeof getSysFileList;
  getSysFileDetail: typeof getSysFileDetail;
  createSysFile: typeof createSysFile;
  updateSysFile: typeof updateSysFile;
  deleteSysFile: typeof deleteSysFile;
  batchDeleteSysFile: typeof batchDeleteSysFile;
  uploadImage: typeof uploadImage;
  uploadAudio: typeof uploadAudio;
  uploadVideo: typeof uploadVideo;
};

export default service;
