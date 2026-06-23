/**
 * 疑点处理接口封装，围绕 leakage-record 资源提供确认、排除、转工单等处理能力。
 *
 * 疑点 = leakLevel=3 的渗漏记录，确认后改为 0/1/2 即变为漏点。
 */
import { createCrudService } from "@/services/shared/crud";
import { createWorksheet } from "@/services/work-order/create";

const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectProcessingPage = leakageRecordApi.getPage;
export const getSuspectProcessingList = leakageRecordApi.getList;
export const getSuspectProcessingDetail = leakageRecordApi.getDetail;

/**
 * 确认疑点：将 leakLevel 从 3 改为指定级别（0=轻度/1=中度/2=重度）。
 */
export function confirmSuspect(id, data) {
  return leakageRecordApi.update(id, data);
}

/**
 * 排除疑点：物理删除该条记录（is_force=true）。
 */
export function excludeSuspect(id) {
  return leakageRecordApi.delete(id, true);
}

/**
 * 转工单：创建工单并更新疑点的关联工单ID。
 */
export async function convertToWorksheet(suspectId, worksheetPayload) {
  const worksheetResponse = await createWorksheet(worksheetPayload);
  const worksheetId = worksheetResponse?.data?.id || worksheetResponse?.data;
  if (worksheetId) {
    await leakageRecordApi.update(suspectId, { referenceWorksheetId: worksheetId });
  }
  return worksheetResponse;
}

export default {
  getSuspectProcessingPage,
  getSuspectProcessingList,
  getSuspectProcessingDetail,
  confirmSuspect,
  excludeSuspect,
  convertToWorksheet,
};
