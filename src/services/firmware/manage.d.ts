/** 后端通用响应结构。 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp?: number;
}

/** 固件记录。字段均与固件管理后端接口保持一致。 */
export interface Firmware {
  id?: number;
  firmwareName: string;
  firmwareVersion: string;
  filePath?: string;
  fileId?: number;
  instruction?: string;
  remark?: string;
  uploadTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 固件分页查询参数。 */
export interface FirmwarePageParams {
  pageNum: number;
  pageSize: number;
  firmwareName?: string;
  firmwareVersion?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: unknown;
}

/** 项目分页响应兼容结构。 */
export interface PageResult<T> {
  records?: T[];
  list?: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
  pages?: number;
  [key: string]: unknown;
}

/** 固件上传参数；H5 使用 file，其他 uni-app 平台使用 filePath。 */
export interface FirmwareUploadData {
  file?: File;
  filePath?: string;
  firmwareName: string;
  firmwareVersion: string;
  instruction?: string;
  remark?: string;
}

export type ServiceId = string | number;
export type UploadProgressCallback = (percent: number) => void;

/** 根据 ID 获取固件详情。 */
export function getFirmwareDetail(id: ServiceId): Promise<ApiResponse<Firmware>>;

/** 创建固件记录，不包含文件上传。 */
export function createFirmware(data: Firmware): Promise<ApiResponse<Firmware>>;

/** 根据 ID 更新固件记录。 */
export function updateFirmware(id: ServiceId, data: Firmware): Promise<ApiResponse<boolean>>;

/** 根据 ID 强制删除固件记录，is_force 固定为 true。 */
export function deleteFirmware(id: ServiceId): Promise<ApiResponse<void>>;

/** 分页查询固件记录。 */
export function getFirmwarePage(
  data: FirmwarePageParams,
): Promise<ApiResponse<PageResult<Firmware>>>;

/** 获取全部固件记录。 */
export function getFirmwareList(): Promise<ApiResponse<Firmware[]>>;

/** 批量强制删除固件记录，is_force 固定为 true。 */
export function batchDeleteFirmware(ids: ServiceId[]): Promise<ApiResponse<void>>;

/** 上传固件文件并创建固件记录。 */
export function uploadFirmware(
  data: FirmwareUploadData,
  onProgress?: UploadProgressCallback,
): Promise<ApiResponse<Firmware>>;

declare const service: {
  getFirmwareDetail: typeof getFirmwareDetail;
  createFirmware: typeof createFirmware;
  updateFirmware: typeof updateFirmware;
  deleteFirmware: typeof deleteFirmware;
  getFirmwarePage: typeof getFirmwarePage;
  getFirmwareList: typeof getFirmwareList;
  batchDeleteFirmware: typeof batchDeleteFirmware;
  uploadFirmware: typeof uploadFirmware;
};

export default service;
