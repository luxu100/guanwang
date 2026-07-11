/** 渗漏级别枚举 */
export type LeakLevel = 0 | 1 | 2;

/** 渗漏级别选项 */
export interface LeakLevelOption {
    label: string;
    value: LeakLevel | "";
}

/** 新增/编辑漏点表单数据 */
export interface LeakPointForm {
    detectedTime: string;
    leakAddress: string;
    leakCoordinate: string;
    leakLevel: LeakLevel;
    leakPart: string;
    tubeMaterial: string;
    tubeBore: string;
    tubeDepth: string;
    detectAccount: string;
    referenceDevices: string;
    referenceWorksheetId: string;
    closestDeviceDistance: string;
    referenceAudio: string;
    leakPicture: string;
    remark: string;
}

/** 漏点记录 VO（与后端 LeakageRecordVO 对应） */
export interface LeakPointRecord {
    id?: string | number;
    detectedTime?: string;
    leakAddress?: string;
    leakCoordinate?: string;
    leakLevel?: LeakLevel;
    leakPart?: string;
    tubeMaterial?: string;
    tubeBore?: string;
    tubeDepth?: string;
    detectAccount?: string;
    referenceDevices?: string;
    referenceWorksheetId?: string | number;
    closestDeviceDistance?: string;
    referenceAudio?: string;
    leakPicture?: string;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

/** 分页查询参数 */
export interface LeakPointPageQuery {
    pageNum: number;
    pageSize: number;
    startTime?: string;
    endTime?: string;
    sortOrder?: string;
    sortField?: string;
    leakLevel?: number;
    detectAccount?: string;
}

/** 筛选条件 */
export interface LeakPointFilters {
    startTime: string;
    endTime: string;
    leakLevel: number | "";
    detectAccount: string;
}

/** 弹窗模式 */
export type DialogMode = "create" | "edit";

/** 详情 Tab */
export type DetailTab = "base" | "pipe" | "attach";