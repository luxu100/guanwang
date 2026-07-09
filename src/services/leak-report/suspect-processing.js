/**
 * Suspected leak processing API wrappers.
 *
 * Every endpoint here is backed by the interface files in jiekou:
 * /api/suspected-leak/page, /list, /{id}, /{id}/confirm-leak-point and /{id}/dispatch.
 */
import { createCrudService } from "@/services/shared/crud";
import { dispatchSuspect, confirmSuspectAsLeakPoint } from "@/services/leak-report/suspect-management";

const suspectedLeakApi = createCrudService("/api/suspected-leak");

export const getSuspectProcessingPage = suspectedLeakApi.getPage;
export const getSuspectProcessingList = suspectedLeakApi.getList;
export const getSuspectProcessingDetail = suspectedLeakApi.getDetail;

export function confirmSuspect(id, data) {
  return confirmSuspectAsLeakPoint(id, data);
}

export function excludeSuspect(id) {
  return suspectedLeakApi.delete(id, true);
}

export function convertToWorksheet(suspectId, worksheetPayload) {
  const { title, type, description, ...rest } = worksheetPayload || {};

  return dispatchSuspect(suspectId, {
    ...rest,
    workOrderCategory: type,
    detail: title,
    remark: description,
    sourceType: "suspected-leak",
    sourceId: suspectId,
  });
}

export default {
  getSuspectProcessingPage,
  getSuspectProcessingList,
  getSuspectProcessingDetail,
  confirmSuspect,
  excludeSuspect,
  convertToWorksheet,
};
