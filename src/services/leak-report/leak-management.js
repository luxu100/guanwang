/**
 * Leak point management API wrappers.
 *
 * All paths are present in jiekou/leak point docs: /api/leak-point.
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const leakPointApi = createCrudService("/api/leak-point");

export const getLeakPointPage = leakPointApi.getPage;
export const getLeakPointList = leakPointApi.getList;
export const getLeakPointDetail = leakPointApi.getDetail;
export const createLeakPoint = leakPointApi.create;
export const updateLeakPoint = leakPointApi.update;
export const deleteLeakPoint = leakPointApi.delete;

export function createLeakPointDirect(data) {
  return postRequest("/api/leak-point", data);
}

export default {
  getLeakPointPage,
  getLeakPointList,
  getLeakPointDetail,
  createLeakPoint,
  createLeakPointDirect,
  updateLeakPoint,
  deleteLeakPoint,
};
