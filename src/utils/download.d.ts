export interface DownloadBinaryOptions {
  filename?: string;
  mimeType?: string;
  header?: Record<string, string>;
}

export function downloadBinaryFile(
  url: string,
  options?: DownloadBinaryOptions,
): Promise<unknown>;
