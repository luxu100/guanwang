export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface UploadFileData {
  id?: string;
  url?: string;
}

export function uploadFile(
  filePath: unknown,
  fileName?: string,
  onProgress?: (...args: unknown[]) => void,
): Promise<ApiResponse<UploadFileData>>;

export function uploadImages(
  files: Array<{ name?: string } | unknown>,
  onProgress?: (...args: unknown[]) => void,
): Promise<ApiResponse[]>;

declare const service: {
  uploadFile: typeof uploadFile;
  uploadImages: typeof uploadImages;
};

export default service;
