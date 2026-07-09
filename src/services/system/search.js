/**
 * 动态协议解析字段查询模板接口封装。
 *
 * 后端资源路径：/api/protocol-query-template。
 */
import { createCrudService } from "@/services/shared/crud";

const searchTemplateApi = createCrudService("/api/protocol-query-template");

export const getSearchTemplatePage = searchTemplateApi.getPage;
export const getSearchTemplateList = searchTemplateApi.getList;
export const getSearchTemplateDetail = searchTemplateApi.getDetail;
export const createSearchTemplate = searchTemplateApi.create;
export const updateSearchTemplate = searchTemplateApi.update;
export const deleteSearchTemplate = searchTemplateApi.delete;
export const batchDeleteSearchTemplate = searchTemplateApi.batchDelete;

export default {
  getSearchTemplatePage,
  getSearchTemplateList,
  getSearchTemplateDetail,
  createSearchTemplate,
  updateSearchTemplate,
  deleteSearchTemplate,
  batchDeleteSearchTemplate,
};
