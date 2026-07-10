/**
 * 分区接口封装，用于获取当前用户可见分区列表。
 * 调用 GET /api/region/list，后端自动按用户权限过滤。
 */
import { getRequest } from "@/services/shared/crud";

export function getRegionList(params) {
  return getRequest("/api/region/list", params);
}

export default {
  getRegionList,
};