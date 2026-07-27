/** 后端通用响应结构。 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp?: number;
}

/** TCP 音频补帧任务状态。 */
export type AudioRepairStatus =
  | "COLLECTING"
  | "REPAIR_PENDING"
  | "WAITING_UPLOAD"
  | "COMPLETE"
  | "FAILED";

/** TCP 音频补帧分页查询参数，与后端 TcpAudioRepairPageDTO 保持一致。 */
export interface AudioRepairPageParams {
  pageNum: number;
  pageSize: number;
  deviceNumber?: string;
  status?: AudioRepairStatus | string;
  startTime?: string;
  endTime?: string;
  sortOrder?: "asc" | "desc" | string;
  [key: string]: unknown;
}

/** TCP 音频补帧任务分页记录，具体字段与后端 TcpAudioRepairTaskVO 保持一致。 */
export interface AudioRepairTask {
  id?: number;
  transferId?: number;
  deviceNumber?: string;
  status?: AudioRepairStatus | string;
  [key: string]: unknown;
}

/** TCP 音频补帧任务详情，具体字段与后端 TcpAudioRepairDetailVO 保持一致。 */
export interface AudioRepairDetail extends AudioRepairTask {
  missingFrameNumbers?: number[];
  [key: string]: unknown;
}

/** 已接收分片摘要，具体字段与后端 TcpAudioRepairFrameSummaryVO 保持一致。 */
export interface AudioRepairFrameSummary {
  id: number;
  transferId: number;
  frameNo: number;
  rawHexBytes: number;
  receivedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/** 单个分片详情，具体字段与后端 TcpAudioRepairFrameDetailVO 保持一致。 */
export interface AudioRepairFrameDetail extends AudioRepairFrameSummary {
  rawHex?: string;
  contentData?: string;
  [key: string]: unknown;
}

/** 补帧相关指令记录，具体字段与后端 TcpAudioRepairCommandVO 保持一致。 */
export interface AudioRepairCommand {
  id?: number;
  commandType?: "AUDIO_REPAIR" | "AUDIO_COMPLETE" | string;
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

export type ServiceId = string | number;

/** 分页查询 TCP 音频补帧任务。 */
export function getAudioRepairPage(
  data: AudioRepairPageParams,
): Promise<ApiResponse<PageResult<AudioRepairTask>>>;

/** 查询 TCP 音频补帧任务详情。 */
export function getAudioRepairDetail(
  transferId: ServiceId,
): Promise<ApiResponse<AudioRepairDetail>>;

/** 查询 TCP 音频补帧已接收分片摘要列表。 */
export function getAudioRepairFrames(
  transferId: ServiceId,
): Promise<ApiResponse<AudioRepairFrameSummary[]>>;

/** 查询 TCP 音频补帧单个分片详情。 */
export function getAudioRepairFrameDetail(
  transferId: ServiceId,
  frameId: ServiceId,
): Promise<ApiResponse<AudioRepairFrameDetail>>;

/** 查询 TCP 音频补帧相关指令记录。 */
export function getAudioRepairCommands(
  transferId: ServiceId,
): Promise<ApiResponse<AudioRepairCommand[]>>;

declare const service: {
  getAudioRepairPage: typeof getAudioRepairPage;
  getAudioRepairDetail: typeof getAudioRepairDetail;
  getAudioRepairFrames: typeof getAudioRepairFrames;
  getAudioRepairFrameDetail: typeof getAudioRepairFrameDetail;
  getAudioRepairCommands: typeof getAudioRepairCommands;
};

export default service;
