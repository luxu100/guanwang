export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type AnalysisQuery = Record<string, unknown>;

export function getLeakAnalysisPage(data: AnalysisQuery): Promise<ApiResponse>;
export function getAlgorithmAnalysisPage(data: AnalysisQuery): Promise<ApiResponse>;
export function getLeakAnalysisDetail(id: number | string): Promise<ApiResponse>;
export function getAlgorithmAnalysisDetail(id: number | string): Promise<ApiResponse>;

declare const service: {
  getLeakAnalysisPage: typeof getLeakAnalysisPage;
  getAlgorithmAnalysisPage: typeof getAlgorithmAnalysisPage;
  getLeakAnalysisDetail: typeof getLeakAnalysisDetail;
  getAlgorithmAnalysisDetail: typeof getAlgorithmAnalysisDetail;
};

export default service;
