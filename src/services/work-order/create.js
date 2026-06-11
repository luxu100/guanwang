import { createCrudService } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const createWorksheet = worksheetApi.create;
export const getWorksheetCreatePage = worksheetApi.getPage;
export const getWorksheetCreateList = worksheetApi.getList;
export const getWorksheetCreateDetail = worksheetApi.getDetail;

export default {
  createWorksheet,
  getWorksheetCreatePage,
  getWorksheetCreateList,
  getWorksheetCreateDetail,
};
