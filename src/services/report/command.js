/**
 * 指令管理接口封装，包含指令字典、参数、下发记录、固件和升级动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const commandDictApi = createCrudService("/api/command-dict");
const commandParamApi = createCrudService("/api/command-param");
const commandSendLogApi = createCrudService("/api/command-send-log");
const firmwareApi = createCrudService("/api/firmware");
const firmwareUpgradeLogApi = createCrudService("/api/firmware-upgrade-log");

export const getCommandDictPage = commandDictApi.getPage;
export const getCommandDictList = commandDictApi.getList;
export const getCommandDictDetail = commandDictApi.getDetail;
export const createCommandDict = commandDictApi.create;
export const updateCommandDict = commandDictApi.update;
export const deleteCommandDict = commandDictApi.delete;
export const batchDeleteCommandDict = commandDictApi.batchDelete;

export const getCommandParamPage = commandParamApi.getPage;
export const getCommandParamList = commandParamApi.getList;
export const getCommandParamDetail = commandParamApi.getDetail;
export const createCommandParam = commandParamApi.create;
export const updateCommandParam = commandParamApi.update;
export const deleteCommandParam = commandParamApi.delete;
export const batchDeleteCommandParam = commandParamApi.batchDelete;

export const getCommandSendLogPage = commandSendLogApi.getPage;
export const getCommandSendLogList = commandSendLogApi.getList;
export const getCommandSendLogDetail = commandSendLogApi.getDetail;

export const getFirmwarePage = firmwareApi.getPage;
export const getFirmwareList = firmwareApi.getList;
export const getFirmwareDetail = firmwareApi.getDetail;
export const createFirmware = firmwareApi.create;
export const updateFirmware = firmwareApi.update;
export const deleteFirmware = firmwareApi.delete;
export const batchDeleteFirmware = firmwareApi.batchDelete;

export const getFirmwareUpgradeLogPage = firmwareUpgradeLogApi.getPage;
export const getFirmwareUpgradeLogList = firmwareUpgradeLogApi.getList;
export const getFirmwareUpgradeLogDetail = firmwareUpgradeLogApi.getDetail;

export default {
  getCommandDictPage,
  getCommandDictList,
  getCommandDictDetail,
  createCommandDict,
  updateCommandDict,
  deleteCommandDict,
  batchDeleteCommandDict,
  getCommandParamPage,
  getCommandParamList,
  getCommandParamDetail,
  createCommandParam,
  updateCommandParam,
  deleteCommandParam,
  batchDeleteCommandParam,
  getCommandSendLogPage,
  getCommandSendLogList,
  getCommandSendLogDetail,
  getFirmwarePage,
  getFirmwareList,
  getFirmwareDetail,
  createFirmware,
  updateFirmware,
  deleteFirmware,
  batchDeleteFirmware,
  getFirmwareUpgradeLogPage,
  getFirmwareUpgradeLogList,
  getFirmwareUpgradeLogDetail,
};
