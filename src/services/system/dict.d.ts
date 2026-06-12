export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type DictQuery = Record<string, unknown>;
export type DictPayload = Record<string, unknown>;

export function getDictTypePage(data: DictQuery): Promise<ApiResponse>;
export function getDictTypeList(params?: DictQuery): Promise<ApiResponse>;
export function getDictTypeDetail(id: number | string): Promise<ApiResponse>;
export function createDictType(data: DictPayload): Promise<ApiResponse>;
export function updateDictType(id: number | string, data: DictPayload): Promise<ApiResponse>;
export function deleteDictType(id: number | string): Promise<ApiResponse>;
export function batchDeleteDictType(data: Array<number | string>): Promise<ApiResponse>;

export function getDictItemPage(data: DictQuery): Promise<ApiResponse>;
export function getDictItemList(params?: DictQuery): Promise<ApiResponse>;
export function getDictItemDetail(id: number | string): Promise<ApiResponse>;
export function createDictItem(data: DictPayload): Promise<ApiResponse>;
export function updateDictItem(id: number | string, data: DictPayload): Promise<ApiResponse>;
export function deleteDictItem(id: number | string): Promise<ApiResponse>;
export function batchDeleteDictItem(data: Array<number | string>): Promise<ApiResponse>;

declare const service: {
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

export default service;
