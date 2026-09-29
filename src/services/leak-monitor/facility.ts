import { createCrudServiceTyped } from "@/services/shared/crud.typed";
import type { ApiResponse } from "@/types/api";
import type { FacilityType, LeakMonitorFacility } from "@/pages/leak-monitor/types";

export interface FacilityCreatePayload {
  facilityType: FacilityType;
  facilityNumber: string;
  facilityName?: string;
  longitude: number;
  latitude: number;
  coordinatePosition?: string;
  branchCompany?: string;
  region?: string;
  tubeBore?: string;
  tubeMaterial?: string;
  deptId: number;
  status: number;
  diameterMm?: number;
}

type FacilityApiRecord = Partial<LeakMonitorFacility> & {
  longitude?: unknown;
  latitude?: unknown;
  facilityType?: unknown;
  coordinateSystem?: unknown;
  countryCode?: unknown;
};

export interface FormalFacilityLoadResult {
  facilities: LeakMonitorFacility[];
  rejected: Array<{ id: number | null; facilityNumber: string | null; reason: string }>;
}

const facilityApi = createCrudServiceTyped<FacilityApiRecord>("/api/facility");
const FACILITY_TYPES = new Set<FacilityType>(["VALVE", "HYDRANT", "PUMP"]);

export async function createFacility(payload: FacilityCreatePayload) {
  const envelope = await facilityApi.create(payload);
  if (envelope?.code !== 200) {
    throw new Error(`设施创建失败（code=${envelope?.code ?? "未知"}${envelope?.msg ? `: ${envelope.msg}` : ""}）`);
  }
  return envelope.data;
}

function toFiniteNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeType(value: unknown): FacilityType | null {
  const type = String(value || "").trim().toUpperCase() as FacilityType;
  return FACILITY_TYPES.has(type) ? type : null;
}

export async function fetchFormalFacilities(): Promise<FormalFacilityLoadResult> {
  const envelope: ApiResponse<FacilityApiRecord[]> = await facilityApi.getList();
  if (Number(envelope?.code) !== 200) {
    throw new Error(`设施数据加载失败（code=${envelope?.code ?? "未知"}${envelope?.msg ? `: ${envelope.msg}` : ""}）`);
  }
  if (!Array.isArray(envelope.data)) {
    throw new Error("设施数据响应结构异常（data 非数组）");
  }

  const facilities: LeakMonitorFacility[] = [];
  const rejected: FormalFacilityLoadResult["rejected"] = [];
  envelope.data.forEach((row) => {
    const id = toFiniteNumber(row.id);
    const facilityType = normalizeType(row.facilityType);
    const longitude = toFiniteNumber(row.longitude);
    const latitude = toFiniteNumber(row.latitude);
    const coordinateSystem = String(row.coordinateSystem || "").trim().toUpperCase();
    const countryCode = String(row.countryCode || "").trim().toUpperCase();
    const reason = id === null
      ? "记录缺少有效 id"
      : !facilityType
        ? `设施类型非法（实际 ${JSON.stringify(row.facilityType)}）`
        : longitude === null || latitude === null || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
          ? "设施坐标缺失或越界"
          : coordinateSystem !== "WGS84"
            ? `coordinateSystem 缺失或不为 WGS84（实际 ${JSON.stringify(row.coordinateSystem)}）`
            : countryCode && !/^[A-Z]{2}$/.test(countryCode)
              ? `countryCode 非法（实际 ${JSON.stringify(row.countryCode)}）`
              : null;
    if (reason) {
      rejected.push({
        id,
        facilityNumber: row.facilityNumber == null ? null : String(row.facilityNumber),
        reason,
      });
      return;
    }

    facilities.push({
      id: id as number,
      facilityType: facilityType as FacilityType,
      facilityNumber: row.facilityNumber == null ? null : String(row.facilityNumber),
      facilityName: row.facilityName == null ? null : String(row.facilityName),
      longitude: longitude as number,
      latitude: latitude as number,
      coordinateSystem: "WGS84",
      countryCode: countryCode || null,
      status: toFiniteNumber(row.status),
      boundDeviceCount: toFiniteNumber(row.boundDeviceCount),
      diameterMm: toFiniteNumber(row.diameterMm),
    });
  });
  return { facilities, rejected };
}
