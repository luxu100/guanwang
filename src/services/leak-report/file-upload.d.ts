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
  onProgress?: (progress: number) => void,
): Promise<ApiResponse<UploadFileData>>;

export function uploadImages(
  files: Array<{ name?: string } | unknown>,
  onProgress?: (index: number, progress: number) => void,
): Promise<ApiResponse[]>;

declare const service: {
  uploadFile: typeof uploadFile;
  uploadImages: typeof uploadImages;
};

export default service;
