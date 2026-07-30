export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServicePayload = Record<string, unknown> | FormData;
export type ServiceQuery = Record<string, unknown>;
export type ServiceId = string | number;

export interface SysFileVO {
  id?: ServiceId;
  fileName?: string;
  fileType?: string;
  filePath?: string;
  fileMd5?: string;
  fileCategory?: number;
  createdAt?: string;
}

export function getSysFilePage(data: ServiceQuery): Promise<ApiResponse>;
export function getSysFileList(params?: ServiceQuery): Promise<ApiResponse>;
export function getSysFileDetail(id: ServiceId): Promise<ApiResponse<SysFileVO>>;
export function createSysFile(data: ServicePayload): Promise<ApiResponse>;
export function updateSysFile(id: ServiceId, data: ServicePayload): Promise<ApiResponse<boolean>>;
export function deleteSysFile(id: ServiceId, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteSysFile(data: ServicePayload, isForce?: boolean): Promise<ApiResponse>;

export function uploadImage(data: ServicePayload): Promise<ApiResponse>;
export function uploadLogoImage(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ApiResponse<SysFileVO>>;
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
  uploadLogoImage: typeof uploadLogoImage;
  uploadAudio: typeof uploadAudio;
  uploadVideo: typeof uploadVideo;
};

export default service;
