/**
 * 漏损报告模块状态 code 常量
 *
 * 用途：替代代码中硬编码的中文字符串匹配（如 === "已修复"），
 * 避免国际化后中英文环境状态判断出错。
 *
 * 使用方式：
 *   import { LEAK_STATUS } from "@/pages/leak-report/constants/status";
 *   if (status === LEAK_STATUS.REPAIRED) { ... }
 *
 * 注意：常量值与后端返回的原始字段值保持一致（后端返回中文则用中文），
 * 显示文案通过 i18n 翻译 key 获取，与 code 解耦。
 */

/** 渗漏状态 code（leakStatus 字段）*/
export const LEAK_STATUS = {
  /** 已修复 */
  REPAIRED: "已修复",
  /** 未修复 */
  UNREPAIRED: "未修复",
  /** 渗漏 */
  LEAK: "渗漏",
  /** 正常 */
  NORMAL: "正常",
  /** 疑似 */
  SUSPECTED: "疑似",
  /** 未知 */
  UNKNOWN: "未知",
  /** 无数据 */
  NO_DATA: "无数据",
} as const;

export type LeakStatusCode = typeof LEAK_STATUS[keyof typeof LEAK_STATUS];

/** 算法状态 code（algorithmStatus 字段，后端返回英文）*/
export const ALGORITHM_STATUS = {
  /** 等待处理 */
  PENDING: "PENDING",
  /** 处理成功 */
  SUCCESS: "SUCCESS",
  /** 处理失败 */
  FAILED: "FAILED",
  /** 跳过 */
  SKIPPED: "SKIPPED",
  /** 超时 */
  TIMEOUT: "TIMEOUT",
} as const;

export type AlgorithmStatusCode = typeof ALGORITHM_STATUS[keyof typeof ALGORITHM_STATUS];

/** 渗漏等级 code（leakLevel 字段）*/
export const LEAK_LEVEL = {
  /** 轻度 */
  LIGHT: "轻度",
  /** 中度 */
  MEDIUM: "中度",
  /** 重度 */
  SEVERE: "重度",
} as const;

export type LeakLevelCode = typeof LEAK_LEVEL[keyof typeof LEAK_LEVEL];

/**
 * 判断字符串是否为已修复状态
 * 兼容 "已修复" 中文匹配和未来可能的 code 匹配
 */
export function isRepairedStatus(status: unknown): boolean {
  return status === LEAK_STATUS.REPAIRED || status === "repaired";
}

/**
 * 判断字符串是否为未修复状态
 */
export function isUnrepairedStatus(status: unknown): boolean {
  return status === LEAK_STATUS.UNREPAIRED || status === "unrepaired";
}

/**
 * 判断是否为渗漏状态（设备上报 tab：leakStatus=0）
 */
export function isLeakStatus(status: unknown): boolean {
  return status === LEAK_STATUS.LEAK || status === 0 || status === "0" || status === "leak";
}

/**
 * 判断是否为正常状态（设备上报 tab：leakStatus=1）
 */
export function isNormalStatus(status: unknown): boolean {
  return status === LEAK_STATUS.NORMAL || status === 1 || status === "1" || status === "normal";
}

/**
 * 判断是否为疑似状态（设备上报 tab：leakStatus=2）
 */
export function isSuspectedStatus(status: unknown): boolean {
  return status === LEAK_STATUS.SUSPECTED || status === 2 || status === "2" || status === "suspected";
}

/**
 * 判断是否为无数据状态（设备上报 tab：leakStatus=4）
 */
export function isNoDataStatus(status: unknown): boolean {
  return status === LEAK_STATUS.NO_DATA || status === 4 || status === "4" || status === "no_data";
}

/**
 * 判断算法状态是否为成功
 */
export function isAlgorithmSuccess(status: unknown): boolean {
  return String(status || "").toUpperCase() === ALGORITHM_STATUS.SUCCESS;
}

/**
 * 判断算法状态是否为失败
 */
export function isAlgorithmFailed(status: unknown): boolean {
  return String(status || "").toUpperCase() === ALGORITHM_STATUS.FAILED;
}

/**
 * 判断算法状态是否为超时
 */
export function isAlgorithmTimeout(status: unknown): boolean {
  return String(status || "").toUpperCase() === ALGORITHM_STATUS.TIMEOUT;
}

/**
 * 判断算法状态是否为跳过
 */
export function isAlgorithmSkipped(status: unknown): boolean {
  return String(status || "").toUpperCase() === ALGORITHM_STATUS.SKIPPED;
}

/**
 * 归一化 leakStatus：将各种输入（数字编码、中文字符串）转换为统一的 LEAK_STATUS code
 *
 * - leakage tab：返回 "已修复"/"未修复"
 * - deviceUpload tab：返回 "渗漏"/"正常"/"疑似"/"未知"/"无数据"
 *
 * 用于状态匹配，避免代码依赖中文字符串。
 */
export function normalizeLeakStatusCode(raw: unknown, tab: "leakage" | "deviceUpload"): string {
  if (raw == null || raw === "") return LEAK_STATUS.UNKNOWN;

  // 字符串文本形式（leakage tab 后端返回中文）
  const s = String(raw);
  if (tab === "leakage") {
    if (s === LEAK_STATUS.REPAIRED || s === "repaired") return LEAK_STATUS.REPAIRED;
    if (s === LEAK_STATUS.UNREPAIRED || s === "unrepaired") return LEAK_STATUS.UNREPAIRED;
  } else {
    if (s === LEAK_STATUS.LEAK || s === "leak") return LEAK_STATUS.LEAK;
    if (s === LEAK_STATUS.NORMAL || s === "normal") return LEAK_STATUS.NORMAL;
    if (s === LEAK_STATUS.SUSPECTED || s === "suspected") return LEAK_STATUS.SUSPECTED;
  }

  // 数字编码形式（deviceUpload tab 后端返回数字）
  const n = Number(raw);
  if (!Number.isNaN(n)) {
    if (tab === "leakage") {
      return n === 1 ? LEAK_STATUS.REPAIRED : n === 0 ? LEAK_STATUS.UNREPAIRED : LEAK_STATUS.UNKNOWN;
    }
    return n === 0 ? LEAK_STATUS.LEAK : n === 1 ? LEAK_STATUS.NORMAL : n === 2 ? LEAK_STATUS.SUSPECTED : n === 4 ? LEAK_STATUS.NO_DATA : LEAK_STATUS.UNKNOWN;
  }

  return s;
}

/**
 * 漏点记录专用状态归一化（leak_point_record.leakStatus）。
 *
 * 与 normalizeLeakStatusCode 的区别：
 * - 已修复等价值（已修复/repaired/REPAIRED）统一返回"已修复"；
 * - DBA SQL C 回填前，NULL 和其他非已修复值（包括"处理中"等历史脏值）都返回"未修复"；
 * - 不返回"未知"，避免筛选语义、状态标签、KPI 和图表口径不一致。
 *
 * 设备上报状态仍使用原有数字状态归一化，不能混用本函数。
 */
// TODO: 待 DBA SQL C 回填后移除历史脏状态兼容
export function normalizeLeakPointRecordStatus(raw: unknown): string {
  if (raw == null || raw === "") return LEAK_STATUS.UNREPAIRED;
  const s = String(raw);
  if (s === LEAK_STATUS.REPAIRED || s.toLowerCase() === "repaired") {
    return LEAK_STATUS.REPAIRED;
  }
  // NULL 和其他非已修复值（包括"未修复"、"unrepaired"、"处理中"等脏值）统一归为"未修复"
  return LEAK_STATUS.UNREPAIRED;
}
