export const TOKEN_KEY: string;
export const TOKEN_PREFIX_KEY: string;

export interface RequestOptions {
  url: string;
  method?: string;
  data?: unknown;
  header?: Record<string, string>;
  timeout?: number;
}

export interface RequestError {
  code: number;
  msg: string;
  data?: unknown;
}

export default function request<T = unknown>(options: RequestOptions): Promise<T>;
