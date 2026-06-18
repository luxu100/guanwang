import type { ApiResponse, PageResult } from "@/services/user/user";

export interface DictTypeItem {
  id: number;
  dictCode?: string;
  dictType?: string;
  typeCode?: string;
  code?: string;
  dictName?: string;
  typeName?: string;
  name?: string;
  status?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface DictItem {
  id: number;
  dictTypeId?: number | string;
  dictType?: string;
  dictCode?: string;
  itemCode?: string;
  dictKey?: string;
  value?: string;
  itemName?: string;
  dictValue?: string;
  label?: string;
  sort?: number;
  status?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type DictPayload = Record<string, unknown>;

export function getDictTypePage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<DictTypeItem>>>;
export function getDictTypeList(params?: Record<string, unknown>): Promise<ApiResponse<DictTypeItem[]>>;
export function getDictTypeDetail(id: number | string): Promise<ApiResponse<DictTypeItem>>;
export function createDictType(data: DictPayload): Promise<ApiResponse<DictTypeItem>>;
export function updateDictType(id: number | string, data: DictPayload): Promise<ApiResponse<boolean>>;
export function deleteDictType(id: number | string): Promise<ApiResponse<void>>;
export function batchDeleteDictType(data: Array<number | string>): Promise<ApiResponse<void>>;

export function getDictItemPage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<DictItem>>>;
export function getDictItemList(params?: Record<string, unknown>): Promise<ApiResponse<DictItem[]>>;
export function getDictItemDetail(id: number | string): Promise<ApiResponse<DictItem>>;
export function createDictItem(data: DictPayload): Promise<ApiResponse<DictItem>>;
export function updateDictItem(id: number | string, data: DictPayload): Promise<ApiResponse<boolean>>;
export function deleteDictItem(id: number | string): Promise<ApiResponse<void>>;
export function batchDeleteDictItem(data: Array<number | string>): Promise<ApiResponse<void>>;

declare const dictService: {
  getDictTypePage: typeof getDictTypePage;
  getDictTypeList: typeof getDictTypeList;
  getDictTypeDetail: typeof getDictTypeDetail;
  createDictType: typeof createDictType;
  updateDictType: typeof updateDictType;
  deleteDictType: typeof deleteDictType;
  batchDeleteDictType: typeof batchDeleteDictType;
  getDictItemPage: typeof getDictItemPage;
  getDictItemList: typeof getDictItemList;
  getDictItemDetail: typeof getDictItemDetail;
  createDictItem: typeof createDictItem;
  updateDictItem: typeof updateDictItem;
  deleteDictItem: typeof deleteDictItem;
  batchDeleteDictItem: typeof batchDeleteDictItem;
};

export default dictService;
