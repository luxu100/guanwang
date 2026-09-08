import type { AlarmRecord, AlarmMapItem } from "./processing";

export type { AlarmRecord, AlarmMapItem };

export declare function getRulePage(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: { records?: unknown[]; total?: number } }>;
export declare function getRuleList(params?: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown[] }>;
export declare function getRuleDetail(id: number | string): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function createRule(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function updateRule(id: number | string, data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: unknown }>;
export declare function deleteRule(id: number | string): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function getAlarmPage(data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: { records?: AlarmRecord[]; total?: number } }>;
export declare function getAlarmDetail(id: number | string): Promise<{ code?: number; msg?: string; data?: AlarmRecord | null }>;
export declare function deleteAlarm(id: number | string): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function confirmAlarm(id: number | string, data?: { handleRemark?: string }): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function ignoreAlarm(id: number | string, data?: { handleRemark?: string }): Promise<{ code?: number; msg?: string; data?: null }>;
export declare function batchConfirmAlarms(ids: Array<number | string>): Promise<{ code?: number; msg?: string; data?: { success: number[]; failed: unknown[] } | null }>;
export declare function dispatchAlarm(id: number | string, data: Record<string, unknown>): Promise<{ code?: number; msg?: string; data?: { worksheetNo: string; worksheetId: number } | null }>;
export declare function getUnreadAlarmCount(): Promise<{ code?: number; msg?: string; data?: number }>;
export declare function getLatestAlarms(since: string): Promise<{ code?: number; msg?: string; data?: AlarmRecord[] }>;
export declare function getLatestActiveAlarms(limit?: number): Promise<{ code?: number; msg?: string; data?: AlarmMapItem[] }>;
export declare function exportAlarms(query?: Record<string, unknown>): Promise<{ kind?: string; filename?: string; headers?: string[]; rows?: string[][] } | { filename: string; filePath?: string }>;
