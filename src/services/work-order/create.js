/**
 * 工单创建接口封装，围绕 worksheet 资源提供创建和查询能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
