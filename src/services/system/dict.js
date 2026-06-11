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
