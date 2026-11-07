import type { ApiResponse, ServiceId } from "./manage";

/** 固件升级记录，具体业务字段与后端 FirmwareUpgradeLogVO 保持一致。 */
export interface FirmwareUpgradeLog {
  id?: number | string;
  deviceNumber?: string;
  firmwareId?: number;
  firmwareVersion?: string;
  executeStatus?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  transportChannel?: "DIRECT_TCP" | "AEP_NB" | "AEP_TCP" | string | null;
  upgradeStage?: string | null;
  finishPercent?: number | null;
  frameCount?: number | null;
  receivedFrameCount?: number | null;
  repairRound?: number | null;
  frameStatus?: string | null;
  failureReason?: string | null;
  startTime?: string | null;
  finishTime?: string | null;
  lastFrameSentAt?: string | null;
  lastReportAt?: string | null;
  firmwareMd5?: string | null;
  [key: string]: unknown;
}

/** 固件升级记录分页查询参数。 */
export interface FirmwareUpgradeLogPageParams {
  pageNum: number;
  pageSize: number;
  [key: string]: unknown;
}

/** 通用分页结果，兼容 records 和 list 两种记录字段。 */
export interface PageResult<T> {
  records?: T[];
  list?: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
  pages?: number;
  [key: string]: unknown;
}

/** 分页查询固件升级记录。 */
export function getFirmwareUpgradeLogPage(
  data: FirmwareUpgradeLogPageParams,
): Promise<ApiResponse<PageResult<FirmwareUpgradeLog>>>;

/** 根据 ID 获取固件升级记录详情。 */
export function getFirmwareUpgradeLogDetail(
  id: ServiceId,
): Promise<ApiResponse<FirmwareUpgradeLog>>;

/** 获取全部固件升级记录。 */
export function getFirmwareUpgradeLogList(): Promise<ApiResponse<FirmwareUpgradeLog[]>>;

declare const service: {
  getFirmwareUpgradeLogPage: typeof getFirmwareUpgradeLogPage;
  getFirmwareUpgradeLogDetail: typeof getFirmwareUpgradeLogDetail;
  getFirmwareUpgradeLogList: typeof getFirmwareUpgradeLogList;
};

export default service;
