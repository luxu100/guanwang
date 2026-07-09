export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface RegionOption extends Record<string, unknown> {
  id: number;
  deptName: string;
}

export function getRegionList(params?: Record<string, unknown>): Promise<ApiResponse<RegionOption[]>>;

declare const service: {
  getRegionList: typeof getRegionList;
};

export default service;
