import type { ApiResponse, PageResult } from "@/services/user/user";

export interface SearchTemplateItem {
  id: number | string;
  templateName?: string;
  name?: string;
  templateCode?: string;
  code?: string;
  scopeType?: string;
  protocolId?: number | string;
  deviceId?: number | string;
  fieldNames?: string[];
  enabled?: boolean;
  remark?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type SearchTemplatePayload = Record<string, unknown>;

export function getSearchTemplatePage(data: Record<string, unknown>): Promise<ApiResponse<PageResult<SearchTemplateItem>>>;
export function getSearchTemplateList(params?: Record<string, unknown>): Promise<ApiResponse<SearchTemplateItem[]>>;
export function getSearchTemplateDetail(id: number | string): Promise<ApiResponse<SearchTemplateItem>>;
export function createSearchTemplate(data: SearchTemplatePayload): Promise<ApiResponse<SearchTemplateItem>>;
export function updateSearchTemplate(id: number | string, data: SearchTemplatePayload): Promise<ApiResponse<boolean>>;
export function deleteSearchTemplate(id: number | string, isForce?: boolean): Promise<ApiResponse<void>>;
export function batchDeleteSearchTemplate(data: Array<number | string>, isForce?: boolean): Promise<ApiResponse<void>>;
export function resolveSearchTemplate(params: {
  protocolId?: number | string;
  deviceId?: number | string;
  templateCode?: string;
}): Promise<ApiResponse<SearchTemplateItem>>;

declare const searchTemplateService: {
  getSearchTemplatePage: typeof getSearchTemplatePage;
  getSearchTemplateList: typeof getSearchTemplateList;
  getSearchTemplateDetail: typeof getSearchTemplateDetail;
  createSearchTemplate: typeof createSearchTemplate;
  updateSearchTemplate: typeof updateSearchTemplate;
  deleteSearchTemplate: typeof deleteSearchTemplate;
  batchDeleteSearchTemplate: typeof batchDeleteSearchTemplate;
  resolveSearchTemplate: typeof resolveSearchTemplate;
};

export default searchTemplateService;
