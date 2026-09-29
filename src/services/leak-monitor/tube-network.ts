import { createCrudServiceTyped } from "@/services/shared/crud.typed";
import type { ApiResponse } from "@/types/api";

/**
 * 正式管线（后端 /api/tube-network）共享契约与适配层。
 *
 * 与演示数据（w84-network-demo.json 静态 import）严格区分：
 * - 本模块只从后端 API 加载，失败显式抛错，绝不回退演示 JSON；
 * - 坐标策略由 countryCode 显式驱动（CN 做 WGS84→GCJ02，MY 等海外原样），
 *   禁止用粗矩形猜测中国境内；
 * - 元数据缺失/冲突的记录进入 rejected 列表由 UI 显式提示并跳过渲染，
 *   不做静默兜底。
 */

/** 后端 TubeNetworkVO 的前端契约（见 docs/w84/frontend-integration.md） */
export interface TubeNetworkRecord {
  id: number;
  tubeName: string | null;
  tubeType: number | null;
  tubeShape: number | null;
  tubeOrder: number | null;
  status: number | null;
  deptId: number | null;
  /** 折线组坐标(WGS84)：[[[lng,lat],...],...]，每个子数组一段，段间不连续 */
  lineCoords: number[][][] | null;
  material: string | null;
  diameterMm: number | null;
  shapeLengthM: number | null;
  /** 固定 "WGS84" */
  coordinateSystem: string | null;
  /** ISO 3166-1 alpha-2，如 "MY" / "CN" */
  countryCode: string | null;
  gisSource: string | null;
  gisSourceId: string | null;
  remark: string | null;
}

export interface TubeNetworkCreatePayload {
  tubeName: string;
  tubeType: number;
  tubeShape: number;
  status: number;
  deptId: number;
  lineCoords: number[][][];
  coordinateSystem: "WGS84";
  countryCode: string;
  material?: string;
  diameterMm?: number;
  shapeLengthM?: number;
  remark?: string;
}

/** 单条记录的校验拒绝原因（显式呈现，不静默丢弃） */
export interface RejectedTubeRecord {
  id: number | null;
  tubeName: string | null;
  reason: string;
}

export interface FormalTubeLoadResult {
  tubes: TubeNetworkRecord[];
  rejected: RejectedTubeRecord[];
}

const ISO_COUNTRY_CODE = /^[A-Z]{2}$/;
const EXPECTED_COORDINATE_SYSTEM = "WGS84";

const tubeNetworkApi = createCrudServiceTyped<TubeNetworkRecord>("/api/tube-network");

/** 手动新增使用单条 create 接口；GIS import-batch 不用于此流程。 */
export async function createTubeNetwork(payload: TubeNetworkCreatePayload) {
  const envelope = await tubeNetworkApi.create(payload);
  if (envelope?.code !== 200) {
    throw new Error(`管线创建失败（code=${envelope?.code ?? "未知"}${envelope?.msg ? `: ${envelope.msg}` : ""}）`);
  }
  return envelope.data;
}

/** 校验单条记录：坐标系必须 WGS84、国家代码必须 alpha-2、几何必须是合法多段折线。 */
export function validateFormalTubeRecord(record: TubeNetworkRecord): string | null {
  if (!record || typeof record.id !== "number") {
    return "记录缺少有效 id";
  }
  const coordinateSystem = (record.coordinateSystem || "").trim().toUpperCase();
  if (coordinateSystem !== EXPECTED_COORDINATE_SYSTEM) {
    return `coordinateSystem 缺失或不为 WGS84（实际 ${JSON.stringify(record.coordinateSystem)}）`;
  }
  const countryCode = (record.countryCode || "").trim().toUpperCase();
  if (!ISO_COUNTRY_CODE.test(countryCode)) {
    return `countryCode 缺失或非法（实际 ${JSON.stringify(record.countryCode)}），坐标策略无法判定`;
  }
  const coords = record.lineCoords;
  if (!Array.isArray(coords) || coords.length === 0) {
    return "lineCoords 缺失";
  }
  for (let partIndex = 0; partIndex < coords.length; partIndex += 1) {
    const part = coords[partIndex];
    if (!Array.isArray(part) || part.length < 2) {
      return `第 ${partIndex} 段坐标点数不足（须 ≥ 2）`;
    }
    for (const point of part) {
      if (!Array.isArray(point) || point.length !== 2) {
        return `第 ${partIndex} 段存在非 [lng,lat] 结构的点`;
      }
      const [lng, lat] = point;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)
          || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return `第 ${partIndex} 段坐标越界 (${lng}, ${lat})`;
      }
    }
  }
  return null;
}

/**
 * 加载当前用户可见的全部正式管线。
 * - HTTP 失败或业务 code !== 200：抛错（调用方必须显式展示，不得回退演示数据）；
 * - 逐条校验元数据：非法记录进入 rejected（跳过渲染并显式计数），合法记录返回。
 */
export async function fetchFormalTubeNetworks(): Promise<FormalTubeLoadResult> {
  const envelope: ApiResponse<TubeNetworkRecord[]> = await tubeNetworkApi.getList();
  const code = Number(envelope?.code);
  if (code !== 200) {
    throw new Error(`管线数据加载失败（code=${code}${envelope?.msg ? `: ${envelope.msg}` : ""}）`);
  }
  const rows = envelope?.data;
  if (!Array.isArray(rows)) {
    throw new Error("管线数据响应结构异常（data 非数组）");
  }
  const tubes: TubeNetworkRecord[] = [];
  const rejected: RejectedTubeRecord[] = [];
  rows.forEach((row) => {
    const record: TubeNetworkRecord = {
      ...row,
      countryCode: (row?.countryCode || "").toString().trim().toUpperCase() || null,
    };
    const reason = validateFormalTubeRecord(record);
    if (reason) {
      rejected.push({ id: record?.id ?? null, tubeName: record?.tubeName ?? null, reason });
    } else {
      tubes.push(record);
    }
  });
  return { tubes, rejected };
}
