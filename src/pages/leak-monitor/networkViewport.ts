import type { FacilityType, LeakMonitorFacility } from "./types";
import type { TubeNetworkRecord } from "@/services/leak-monitor/tube-network";

export function networkDepartmentKey(deptId?: number | null) {
  return deptId != null && deptId > 0 ? String(deptId) : "none";
}

export function getNetworkViewportCoordinates(
  tubes: TubeNetworkRecord[], facilities: LeakMonitorFacility[], pipeVisible: boolean,
  visibility: Record<FacilityType, boolean>, regionKey = "all",
) {
  const matches = (deptId?: number | null) => regionKey === "all" || networkDepartmentKey(deptId) === regionKey;
  const coordinates: Array<{ lng: number; lat: number; countryCode: string | null }> = [];
  if (pipeVisible) tubes.filter((tube) => matches(tube.deptId)).forEach((tube) => {
    (tube.lineCoords || []).forEach((path) => path.forEach(([lng, lat]) => {
      coordinates.push({ lng, lat, countryCode: tube.countryCode });
    }));
  });
  facilities.filter((facility) => visibility[facility.facilityType] && matches(facility.deptId)).forEach((facility) => {
    coordinates.push({ lng: facility.longitude, lat: facility.latitude, countryCode: facility.countryCode });
  });
  return coordinates.filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat) && Math.abs(point.lng) <= 180 && Math.abs(point.lat) <= 90);
}
