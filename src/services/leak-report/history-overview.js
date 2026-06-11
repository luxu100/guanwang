import { createCrudService } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");
const leakageRecordApi = createCrudService("/api/leakage-record");

export const getSuspectHistoryPage = suspectedLeakApi.getPage;
export const getSuspectHistoryDetail = suspectedLeakApi.getDetail;
export const getLeakageHistoryPage = leakageRecordApi.getPage;
export const getLeakageHistoryDetail = leakageRecordApi.getDetail;

export default {
  getSuspectHistoryPage,
  getSuspectHistoryDetail,
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
};
