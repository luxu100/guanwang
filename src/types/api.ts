export interface ApiResponse<T = unknown> {
    code?: number;
    msg?: string;
    data?: T;
    timestamp?: number;
}

export interface PageResult<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
}