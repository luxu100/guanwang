/**
 * 指令下发记录接口封装。
 *
 * 对应后端 `/api/command-send-log` 资源。页面层应调用本文件导出的
 * 语义化方法，避免在组件内直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const commandSendLogApi = createCrudService("/api/command-send-log");

/** 分页查询指令下发记录。 */
export const getCommandSendLogPage = commandSendLogApi.getPage;

/** 根据 ID 获取指令下发记录详情。 */
export const getCommandSendLogDetail = commandSendLogApi.getDetail;

/** 获取全部指令下发记录。 */
export const getCommandSendLogList = commandSendLogApi.getList;

export default {
  getCommandSendLogPage,
  getCommandSendLogDetail,
  getCommandSendLogList,
};
