/**
 * 工单处理接口封装。
 *
 * Swagger 当前仅提供 worksheet 的标准 CRUD 接口，处理、关闭等动作通过更新工单字段完成。
 */
import { createCrudService } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const getWorksheetProcessPage = worksheetApi.getPage;
export const getWorksheetProcessDetail = worksheetApi.getDetail;
export const updateWorksheetProcess = worksheetApi.update;

export function assignWorksheet(id, data) {
  return updateWorksheetProcess(id, data);
}

export function urgeWorksheet(id, data) {
  return updateWorksheetProcess(id, data);
}

export function closeWorksheet(id, data) {
  return updateWorksheetProcess(id, {
    ...data,
    worksheetStatus: 3,
  });
}

export default {
  getWorksheetProcessPage,
  getWorksheetProcessDetail,
  updateWorksheetProcess,
  assignWorksheet,
  urgeWorksheet,
  closeWorksheet,
};
