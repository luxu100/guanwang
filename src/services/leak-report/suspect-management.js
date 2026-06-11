import { createCrudService } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");
const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectPage = suspectedLeakApi.getPage;
export const getSuspectList = suspectedLeakApi.getList;
export const getSuspectDetail = suspectedLeakApi.getDetail;
export const createSuspect = suspectedLeakApi.create;
export const updateSuspect = suspectedLeakApi.update;
export const deleteSuspect = suspectedLeakApi.delete;
export const batchDeleteSuspect = suspectedLeakApi.batchDelete;

export const getRelatedLeakageRecordPage = leakageRecordApi.getPage;

export default {
  getSuspectPage,
  getSuspectList,
  getSuspectDetail,
  createSuspect,
  updateSuspect,
  deleteSuspect,
  batchDeleteSuspect,
  getRelatedLeakageRecordPage,
};
