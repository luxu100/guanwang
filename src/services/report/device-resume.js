/**
 * 运维报表已发布接口封装。
 */
import { postRequest } from "@/services/shared/crud";
import { getPartitionTree } from "@/services/partition/partition";
import { getDevicePage, getDeviceDetail, getDeviceFullDetail } from "@/services/device/info";
import {
  getMaintenanceRecordPage,
  getMaintenanceRecordManagePage,
  getMaintenanceRecordDetail,
} from "@/services/device/maintenance";
import { getWorksheetStatisticsPage } from "@/services/work-order/statistics";
import { getAlarmPage, getAlarmTrend } from "@/services/alarm/api";
import { getRequest } from "@/services/shared/crud";

/**
 * 查询设备履历入口列表。
 *
 * device-info/page 提供所属分区等聚合字段，device/page 提供 onlineStatus。
 * 两个分页结果按设备编号合并，避免页面在分区名称与在线状态之间二选一。
 */
export async function getDeviceResumePage(data) {
  const [infoResult, deviceResult] = await Promise.allSettled([
    postRequest("/api/device-query/device-info/page", data),
    getDevicePage(data),
  ]);

  if (infoResult.status === "rejected") {
    throw infoResult.reason;
  }

  const infoResponse = infoResult.value;
  const infoRecords = Array.isArray(infoResponse?.data?.records)
    ? infoResponse.data.records
    : [];
  const deviceRecords = deviceResult.status === "fulfilled"
    && Array.isArray(deviceResult.value?.data?.records)
    ? deviceResult.value.data.records
    : [];
  const devicesByNumber = new Map(
    deviceRecords
      .filter((device) => device?.deviceNumber)
      .map((device) => [String(device.deviceNumber), device]),
  );

  return {
    ...infoResponse,
    data: {
      ...infoResponse.data,
      records: infoRecords.map((info) => {
        const device = devicesByNumber.get(String(info.deviceNumber)) || {};
        return {
          ...device,
          ...info,
          id: info.id ?? device.id,
          onlineStatus: device.onlineStatus ?? info.onlineStatus,
        };
      }),
    },
  };
}

/** 获取分区筛选树，复用分区模块请求。 */
export function getDeviceResumeDeptTree() {
  return getPartitionTree();
}

/** 设备台账使用当前用户可见设备的分页与详情接口。 */
export const getDeviceLedgerPage = getDevicePage;
export const getDeviceLedgerDetail = getDeviceDetail;
export const getDeviceLedgerInstallDetail = getDeviceFullDetail;
export function getDeviceLedgerRelationInfo(deviceId) {
  return getRequest(`/api/device/${deviceId}/relation-info`);
}
export function getDeviceLedgerValveDetail(valveId) {
  return getRequest(`/api/valve/${valveId}`);
}

/** 拆装、维护和巡检记录，可按设备编号查询。 */
export const getDeviceMaintenancePage = getMaintenanceRecordPage;
export const getDeviceMaintenanceManagePage = getMaintenanceRecordManagePage;
export const getDeviceMaintenanceDetail = getMaintenanceRecordDetail;

/** 运行分析可复用的原始工单、报警及报警趋势数据。 */
export const getReportWorksheetPage = getWorksheetStatisticsPage;
export const getReportAlarmPage = getAlarmPage;
export const getReportAlarmTrend = getAlarmTrend;

export default {
  getDeviceResumePage,
  getDeviceResumeDeptTree,
  getDeviceLedgerPage,
  getDeviceLedgerDetail,
  getDeviceLedgerInstallDetail,
  getDeviceLedgerRelationInfo,
  getDeviceLedgerValveDetail,
  getDeviceMaintenancePage,
  getDeviceMaintenanceManagePage,
  getDeviceMaintenanceDetail,
  getReportWorksheetPage,
  getReportAlarmPage,
  getReportAlarmTrend,
};
