/**
 * 数据字典接口封装，包含字典类型和字典项 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const dictTypeApi = createCrudService("/api/dict-type");
const dictItemApi = createCrudService("/api/dict-item");

export const getDictTypePage = dictTypeApi.getPage;
export const getDictTypeList = dictTypeApi.getList;
export const getDictTypeDetail = dictTypeApi.getDetail;
export const createDictType = dictTypeApi.create;
export const updateDictType = dictTypeApi.update;
export const deleteDictType = dictTypeApi.delete;
export const batchDeleteDictType = dictTypeApi.batchDelete;

export const getDictItemPage = dictItemApi.getPage;
export const getDictItemList = dictItemApi.getList;
export const getDictItemDetail = dictItemApi.getDetail;
export const createDictItem = dictItemApi.create;
export const updateDictItem = dictItemApi.update;
export const deleteDictItem = dictItemApi.delete;
export const batchDeleteDictItem = dictItemApi.batchDelete;

export default {
  getDictTypePage,
  getDictTypeList,
  getDictTypeDetail,
  createDictType,
  updateDictType,
  deleteDictType,
  batchDeleteDictType,
  getDictItemPage,
  getDictItemList,
  getDictItemDetail,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  batchDeleteDictItem,
};
