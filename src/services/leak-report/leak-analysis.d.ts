export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type AnalysisQuery = Record<string, unknown>;
export type AssociatedAudioQuery = Record<string, unknown>;

export function getAlgorithmAnalysisPage(data: AnalysisQuery): Promise<ApiResponse>;
export function getAlgorithmAnalysisDetail(id: number | string): Promise<ApiResponse>;
export function getAssociatedAudioPage(data: AssociatedAudioQuery): Promise<ApiResponse>;

declare const service: {
  getAlgorithmAnalysisPage: typeof getAlgorithmAnalysisPage;
  getAlgorithmAnalysisDetail: typeof getAlgorithmAnalysisDetail;
  getAssociatedAudioPage: typeof getAssociatedAudioPage;
};

export default service;
