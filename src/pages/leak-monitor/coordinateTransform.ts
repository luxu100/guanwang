import type {
  CoordinateSystem,
  MapCoordinate,
} from "./types";

const PI = Math.PI;
const AXIS = 6378245;
const OFFSET = 0.006693421622965943;

export function convertMapCoordinate(
  coordinate: MapCoordinate,
  source: CoordinateSystem,
  target: CoordinateSystem,
): MapCoordinate {
  if (source === target || isOutsideChina(coordinate.lng, coordinate.lat)) {
    return coordinate;
  }

  return source === "WGS84"
    ? wgs84ToGcj02(coordinate)
    : gcj02ToWgs84(coordinate);
}

/**
 * 国家驱动的坐标策略（正式管线数据链路专用）。
 *
 * 返回是否应对该国家/地区的 WGS84 数据执行 WGS84→GCJ02 转换：
 * - CN：腾讯/高德等 GCJ02 底图需要转换；
 * - 其他已声明国家（如 MY）：底图坐标与 WGS84 一致，禁止任何偏移转换
 *   （既不做正向 GCJ02，也不做逆向"纠偏"）。
 *
 * 与 convertMapCoordinate 的粗矩形判断互不依赖：正式数据必须携带
 * countryCode，缺失时在数据层校验拒绝（见 services/leak-monitor/tube-network.ts），
 * 不得退化为矩形猜测。旧设备/演示图层继续走原路径，行为不变。
 */
export function shouldApplyGcj02TransformForCountry(countryCode?: string | null): boolean {
  return (countryCode || "").trim().toUpperCase() === "CN";
}

/** WGS84 点按国家策略转成腾讯底图坐标：CN 转 GCJ02，其余原样返回。 */
export function tencentDisplayCoordinate(
  coordinate: MapCoordinate,
  countryCode?: string | null,
): MapCoordinate {
  return shouldApplyGcj02TransformForCountry(countryCode)
    ? wgs84ToGcj02(coordinate)
    : coordinate;
}

/** 腾讯底图拖动点反解为草稿 WGS84；由国家代码决定，海外数据不偏移。 */
export function tencentSourceCoordinate(
  coordinate: MapCoordinate,
  countryCode?: string | null,
): MapCoordinate {
  return shouldApplyGcj02TransformForCountry(countryCode)
    ? gcj02ToWgs84(coordinate)
    : coordinate;
}

export function normalizeCoordinateSystem(
  value: unknown,
  fallback: CoordinateSystem,
): CoordinateSystem {
  const normalized = String(value || "")
    .replace(/[-_\s]/g, "")
    .toUpperCase();

  if (normalized === "WGS84" || normalized === "EPSG4326") {
    return "WGS84";
  }

  if (normalized === "GCJ02" || normalized === "MARS") {
    return "GCJ02";
  }

  return fallback;
}

function wgs84ToGcj02(coordinate: MapCoordinate): MapCoordinate {
  const delta = coordinateDelta(coordinate.lng, coordinate.lat);
  return {
    lng: coordinate.lng + delta.lng,
    lat: coordinate.lat + delta.lat,
  };
}

function gcj02ToWgs84(coordinate: MapCoordinate): MapCoordinate {
  const converted = wgs84ToGcj02(coordinate);
  return {
    lng: coordinate.lng * 2 - converted.lng,
    lat: coordinate.lat * 2 - converted.lat,
  };
}

function coordinateDelta(lng: number, lat: number): MapCoordinate {
  let deltaLat = transformLat(lng - 105, lat - 35);
  let deltaLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtMagic = Math.sqrt(magic);

  deltaLat =
    (deltaLat * 180) /
    (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
  deltaLng =
    (deltaLng * 180) /
    ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);

  return { lng: deltaLng, lat: deltaLat };
}

function transformLat(x: number, y: number) {
  let result =
    -100 +
    2 * x +
    3 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  result +=
    ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result +=
    ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  result +=
    ((160 * Math.sin((y / 12) * PI) +
      320 * Math.sin((y * PI) / 30)) *
      2) /
    3;
  return result;
}

function transformLng(x: number, y: number) {
  let result =
    300 +
    x +
    2 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  result +=
    ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result +=
    ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  result +=
    ((150 * Math.sin((x / 12) * PI) +
      300 * Math.sin((x / 30) * PI)) *
      2) /
    3;
  return result;
}

function isOutsideChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
