/**
 * 固件升级记录接口封装。
 *
 * 对应后端 `/api/firmware-upgrade-log` 资源。
 */
import { createCrudService } from "@/services/shared/crud";

const firmwareUpgradeLogApi = createCrudService("/api/firmware-upgrade-log");

/** 分页查询固件升级记录。 */
export const getFirmwareUpgradeLogPage = firmwareUpgradeLogApi.getPage;

/** 根据 ID 获取固件升级记录详情。 */
export const getFirmwareUpgradeLogDetail = firmwareUpgradeLogApi.getDetail;

/** 获取全部固件升级记录。 */
export const getFirmwareUpgradeLogList = firmwareUpgradeLogApi.getList;

export default {
  getFirmwareUpgradeLogPage,
  getFirmwareUpgradeLogDetail,
  getFirmwareUpgradeLogList,
};
