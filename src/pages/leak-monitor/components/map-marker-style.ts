import type { FacilityType, LeakDeviceStatus, MapDevicePoint } from "../types";

export const FACILITY_COLORS: Record<FacilityType, string> = {
  VALVE: "#2F80ED",
  HYDRANT: "#F59E0B",
  PUMP: "#8B5CF6",
};

export const UNBOUND_DEVICE_COLOR = "#64748B";

export const STATUS_COLORS: Record<LeakDeviceStatus, string> = {
  normal: "#00A870",
  suspect: "#F59E0B",
  leak: "#EF4444",
  unknown: "#94A3B8",
};

export function deviceBindingColor(point: Pick<MapDevicePoint, "facilityType">) {
  return point.facilityType ? FACILITY_COLORS[point.facilityType] : UNBOUND_DEVICE_COLOR;
}
