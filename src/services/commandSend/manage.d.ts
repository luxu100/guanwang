/** 后端通用响应结构。 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp?: number;
}

/** 指令下发记录，额外字段由后端 VO 决定。 */
export interface CommandSendLog {
  id?: number;
  [key: string]: unknown;
}

/** 指令下发记录分页查询参数。 */
export interface CommandSendLogPageParams {
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

export type ServiceId = string | number;

/** 分页查询指令下发记录。 */
export function getCommandSendLogPage(
  data: CommandSendLogPageParams,
): Promise<ApiResponse<PageResult<CommandSendLog>>>;

/** 根据 ID 获取指令下发记录详情。 */
export function getCommandSendLogDetail(
  id: ServiceId,
): Promise<ApiResponse<CommandSendLog>>;

/** 获取全部指令下发记录。 */
export function getCommandSendLogList(): Promise<ApiResponse<CommandSendLog[]>>;

declare const service: {
  getCommandSendLogPage: typeof getCommandSendLogPage;
  getCommandSendLogDetail: typeof getCommandSendLogDetail;
  getCommandSendLogList: typeof getCommandSendLogList;
};

export default service;
