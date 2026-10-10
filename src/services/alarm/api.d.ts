import type { AlarmRecord, AlarmMapItem } from "./processing";

export type { AlarmRecord, AlarmMapItem };

export declare function getRulePage(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: { records?: unknown[]; total?: number } }>;
export declare function createRule(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function updateRule(id: number | string, data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function deleteRule(id: number | string): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function toggleRule(id: number | string): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function getRuleFields(): Promise<{ code?: number; msg?: string; data?: Array<{ fieldName?: string; fieldCnName?: string; unit?: string; description?: string }> }>;
export declare function getAlarmPage(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: { records?: AlarmRecord[]; total?: number } }>;
export declare function getAlarmDetail(id: number | string): Promise<{ code?: number; msg?: string; data?: AlarmRecord | null }>;
export declare function getDevicePressureByNumber(deviceNumber: string): Promise<{ code?: number; msg?: string; data?: { records?: Array<{ pressure?: string | number | null }> } }>;
export declare function confirmAlarm(id: number | string, data?: { handleRemark?: string }): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function resolveAlarm(id: number | string, data?: { handleRemark?: string }): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function getLatestActiveAlarms(limit?: number): Promise<{ code?: number; msg?: string; data?: AlarmMapItem[] }>;
export declare function getAlarmTrend(data?: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function getAlarmOverview(data?: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function getAlarmMap(data?: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
