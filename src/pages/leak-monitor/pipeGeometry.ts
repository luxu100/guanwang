import type { TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import type { PipeCreationDraft, PipeCreationFacility, PipeCreationPoint } from "./pipeCreation";

const COORDINATE_EPSILON = 1e-10;

export function parseCoordinate(point: Pick<PipeCreationPoint, "lng" | "lat">) {
  if (!point.lng.trim() || !point.lat.trim()) return null;
  const lng = Number(point.lng);
  const lat = Number(point.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return { lng, lat };
}

export function coordinateError(point: Pick<PipeCreationPoint, "lng" | "lat">) {
  const hasValue = point.lng.trim() !== "" || point.lat.trim() !== "";
  if (!hasValue) return "";
  if (!point.lng.trim() || !point.lat.trim()) return "请输入完整的经度和纬度";
  if (!Number.isFinite(Number(point.lng)) || !Number.isFinite(Number(point.lat))) {
    return "请输入有效的经度和纬度";
  }
  if (!parseCoordinate(point)) return "经度应为 -180 至 180，纬度应为 -90 至 90";
  return "";
}

/** 只取从第一行开始连续完整的坐标，避免跨过空行拼接管线。 */
export function getDraftPointCoordinates(draft: PipeCreationDraft) {
  const points: Array<{ lng: number; lat: number }> = [];
  for (const point of draft.points) {
    const coordinate = parseCoordinate(point);
    if (!coordinate) break;
    points.push(coordinate);
  }
  return points;
}

export function getFacilityCoordinate(
  facility: Pick<PipeCreationFacility, "mode" | "segmentIndex" | "positionRatio" | "longitude" | "latitude">,
  points: Array<{ lng: number; lat: number }>,
) {
  if (facility.mode === "manual") {
    if (!facility.longitude.trim() || !facility.latitude.trim()) return null;
    const longitude = Number(facility.longitude);
    const latitude = Number(facility.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    return { lng: longitude, lat: latitude };
  }

  const start = points[facility.segmentIndex];
  const end = points[facility.segmentIndex + 1];
  if (!start || !end) return null;
  const ratio = Math.min(1, Math.max(0, facility.positionRatio));
  return {
    lng: start.lng + (end.lng - start.lng) * ratio,
    lat: start.lat + (end.lat - start.lat) * ratio,
  };
}

type Point = { lng: number; lat: number };
type Segment = { start: Point; end: Point };

function orientation(a: Point, b: Point, c: Point) {
  return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
}

function samePoint(left: Point, right: Point) {
  return Math.abs(left.lng - right.lng) <= COORDINATE_EPSILON &&
    Math.abs(left.lat - right.lat) <= COORDINATE_EPSILON;
}

function boundingBoxesOverlap(first: Segment, second: Segment) {
  return Math.max(Math.min(first.start.lng, first.end.lng), Math.min(second.start.lng, second.end.lng)) <=
      Math.min(Math.max(first.start.lng, first.end.lng), Math.max(second.start.lng, second.end.lng)) + COORDINATE_EPSILON &&
    Math.max(Math.min(first.start.lat, first.end.lat), Math.min(second.start.lat, second.end.lat)) <=
      Math.min(Math.max(first.start.lat, first.end.lat), Math.max(second.start.lat, second.end.lat)) + COORDINATE_EPSILON;
}

/** 真正穿越或发生线段重叠；单纯端点相接允许作为正常连接。 */
function segmentsConflict(first: Segment, second: Segment) {
  if (!boundingBoxesOverlap(first, second)) return false;
  const firstStart = orientation(first.start, first.end, second.start);
  const firstEnd = orientation(first.start, first.end, second.end);
  const secondStart = orientation(second.start, second.end, first.start);
  const secondEnd = orientation(second.start, second.end, first.end);
  const properCross = ((firstStart > COORDINATE_EPSILON && firstEnd < -COORDINATE_EPSILON) ||
    (firstStart < -COORDINATE_EPSILON && firstEnd > COORDINATE_EPSILON)) &&
    ((secondStart > COORDINATE_EPSILON && secondEnd < -COORDINATE_EPSILON) ||
      (secondStart < -COORDINATE_EPSILON && secondEnd > COORDINATE_EPSILON));
  if (properCross) return true;

  const collinear = Math.abs(firstStart) <= COORDINATE_EPSILON &&
    Math.abs(firstEnd) <= COORDINATE_EPSILON &&
    Math.abs(secondStart) <= COORDINATE_EPSILON &&
    Math.abs(secondEnd) <= COORDINATE_EPSILON;
  if (!collinear) {
    const onSegment = (point: Point, segment: Segment) =>
      Math.abs(orientation(segment.start, segment.end, point)) <= COORDINATE_EPSILON &&
      point.lng >= Math.min(segment.start.lng, segment.end.lng) - COORDINATE_EPSILON &&
      point.lng <= Math.max(segment.start.lng, segment.end.lng) + COORDINATE_EPSILON &&
      point.lat >= Math.min(segment.start.lat, segment.end.lat) - COORDINATE_EPSILON &&
      point.lat <= Math.max(segment.start.lat, segment.end.lat) + COORDINATE_EPSILON;
    const interiorTouch = (point: Point, segment: Segment) =>
      onSegment(point, segment) && !samePoint(point, segment.start) && !samePoint(point, segment.end);
    return interiorTouch(first.start, second) || interiorTouch(first.end, second) ||
      interiorTouch(second.start, first) || interiorTouch(second.end, first);
  }

  const overlapLng = Math.min(Math.max(first.start.lng, first.end.lng), Math.max(second.start.lng, second.end.lng)) -
    Math.max(Math.min(first.start.lng, first.end.lng), Math.min(second.start.lng, second.end.lng));
  const overlapLat = Math.min(Math.max(first.start.lat, first.end.lat), Math.max(second.start.lat, second.end.lat)) -
    Math.max(Math.min(first.start.lat, first.end.lat), Math.min(second.start.lat, second.end.lat));
  if (Math.max(overlapLng, overlapLat) <= COORDINATE_EPSILON) return false;
  return true;
}

/** 只判断严格穿越，不把端点连接算作交叉。 */
export function properSegmentsCross(a: Point, b: Point, c: Point, d: Point) {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  return ((first > COORDINATE_EPSILON && second < -COORDINATE_EPSILON) ||
    (first < -COORDINATE_EPSILON && second > COORDINATE_EPSILON)) &&
    ((third > COORDINATE_EPSILON && fourth < -COORDINATE_EPSILON) ||
      (third < -COORDINATE_EPSILON && fourth > COORDINATE_EPSILON));
}

function tubeParts(tube: TubeNetworkRecord): Point[][] {
  return (tube.lineCoords || [])
    .filter((part) => Array.isArray(part) && part.length >= 2)
    .map((part) => part
      .map(([lng, lat]) => ({ lng: Number(lng), lat: Number(lat) }))
      .filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat)));
}

export function findPipeCrossings(points: Point[], existingTubes: TubeNetworkRecord[]) {
  const errors: string[] = [];
  if (points.some((point, index) => index > 0 && samePoint(point, points[index - 1]))) {
    errors.push("相邻坐标不能相同");
  }
  const newSegments: Segment[] = points.slice(0, -1).map((start, index) => ({ start, end: points[index + 1] }));

  for (let first = 0; first < newSegments.length; first += 1) {
    for (let second = first + 2; second < newSegments.length; second += 1) {
      if (segmentsConflict(newSegments[first], newSegments[second])) {
        errors.push("新管线自身存在非相邻线段交叉或重叠");
        break;
      }
    }
    if (errors.length) break;
  }

  for (const tube of existingTubes) {
    const existingSegments = tubeParts(tube).flatMap((part) => part.slice(0, -1).map((start, index) => ({
      start,
      end: part[index + 1],
    })));
    if (newSegments.some((candidate) => existingSegments.some((existing) => segmentsConflict(candidate, existing)))) {
      errors.push(`新管线与已有管线${tube.tubeName ? `“${tube.tubeName}”` : ""}交叉或重叠`);
    }
  }
  return [...new Set(errors)];
}

export function projectToSegment(point: Point, start: Point, end: Point) {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= COORDINATE_EPSILON) return 0;
  return Math.min(1, Math.max(0, ((point.lng - start.lng) * dx + (point.lat - start.lat) * dy) / lengthSquared));
}

export function findNearestPipeSegment(point: Point, paths: Point[][]) {
  let nearest: { pathIndex: number; segmentIndex: number; ratio: number; distanceM: number; coordinate: Point } | null = null;
  const scale = Math.cos(point.lat * Math.PI / 180);
  paths.forEach((path, pathIndex) => {
    path.slice(0, -1).forEach((start, segmentIndex) => {
      const end = path[segmentIndex + 1];
      const ratio = projectToSegment(
        { lng: point.lng * scale, lat: point.lat },
        { lng: start.lng * scale, lat: start.lat },
        { lng: end.lng * scale, lat: end.lat },
      );
      const coordinate = { lng: start.lng + (end.lng - start.lng) * ratio, lat: start.lat + (end.lat - start.lat) * ratio };
      const distanceM = Math.hypot((point.lng - coordinate.lng) * scale, point.lat - coordinate.lat) * 111320;
      if (!nearest || distanceM < nearest.distanceM) nearest = { pathIndex, segmentIndex, ratio, distanceM, coordinate };
    });
  });
  return nearest as { pathIndex: number; segmentIndex: number; ratio: number; distanceM: number; coordinate: Point } | null;
}
