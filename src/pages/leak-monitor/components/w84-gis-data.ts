import rawData from "../data/w84-network-demo.json";
import type { TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import type { MapCoordinate } from "../types";

export type W84LayerKey = "pipes" | "hydrants" | "pumps" | "valves";
export type W84GeometryType = "Point" | "LineString" | "MultiLineString";

export interface W84FeatureProperties {
  sourceId?: string | number | null;
  [key: string]: unknown;
}

export interface W84Feature {
  type: "Feature";
  id: string;
  geometry: {
    type: W84GeometryType;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: W84FeatureProperties;
}

export interface W84Crossing {
  crossingId: string;
  coordinate: [number, number];
  pipeIds: string[];
  connected: false;
  crossingType: "NON_CONNECTED";
  label: string;
}

export interface W84NetworkData {
  version: string;
  coordinateSystem: "WGS84";
  coordinateOrder: "LNG_LAT";
  source: string;
  layers: Record<W84LayerKey, {
    type: "FeatureCollection";
    features: W84Feature[];
  }>;
  crossings: W84Crossing[];
}

export const W84_NETWORK_DATA = rawData as W84NetworkData;

/**
 * 将已从 W84 Shapefile 解析并固化的 GeoJSON 风格数据转换为地图统一管线模型。
 * 这是当前阶段的本地预览源，不代表后端接口已经补齐字段；正式接口代码仍保留。
 */
export function buildW84TubeRecords(): TubeNetworkRecord[] {
  return W84_NETWORK_DATA.layers.pipes.features.flatMap((feature, index) => {
    const sourceId = Number(feature.properties.sourceId);
    const paths = featurePaths(feature);
    if (!Number.isFinite(sourceId) || paths.some((path) => path.length < 2)) return [];

    const sourceStatus = Number(feature.properties.status);
    const status = sourceStatus === 4 ? 1 : sourceStatus === 0 ? 0 : null;
    if (status === null) return [];

    const numberValue = (value: unknown) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };

    return [{
      id: sourceId || index + 1,
      tubeName: `POC_KG556_p-${sourceId}`,
      tubeType: numberValue(feature.properties.type),
      tubeShape: null,
      tubeOrder: null,
      status,
      deptId: 2,
      lineCoords: paths,
      material: String(feature.properties.material ?? "") || null,
      diameterMm: numberValue(feature.properties.outerDiameterMm),
      shapeLengthM: numberValue(feature.properties.shapeLengthM),
      coordinateSystem: "WGS84",
      countryCode: "MY",
      gisSource: "POC_KG556_p",
      gisSourceId: String(sourceId),
      remark: "W84 local preview",
    } satisfies TubeNetworkRecord];
  });
}

export const W84_LAYER_LABELS: Record<W84LayerKey, string> = {
  pipes: "GIS 管线",
  hydrants: "消防栓",
  pumps: "泵",
  valves: "阀门",
};

export const W84_LAYER_COLORS: Record<W84LayerKey, string> = {
  pipes: "#0F766E",
  hydrants: "#2563EB",
  pumps: "#7C3AED",
  valves: "#B45309",
};

export function featurePoint(feature: W84Feature): MapCoordinate | null {
  if (feature.geometry.type !== "Point") return null;
  const [lng, lat] = feature.geometry.coordinates as number[];
  return validCoordinate(lat, lng) ? { lat, lng } : null;
}

export function featurePaths(feature: W84Feature): number[][][] {
  if (feature.geometry.type === "LineString") {
    return [feature.geometry.coordinates as number[][]];
  }
  if (feature.geometry.type === "MultiLineString") {
    return feature.geometry.coordinates as number[][][];
  }
  return [];
}

export function w84Bounds() {
  const coordinates: MapCoordinate[] = [];
  Object.values(W84_NETWORK_DATA.layers).forEach((collection) => {
    collection.features.forEach((feature) => {
      if (feature.geometry.type === "Point") {
        const point = featurePoint(feature);
        if (point) coordinates.push(point);
        return;
      }
      featurePaths(feature).forEach((path) => {
        path.forEach(([lng, lat]) => {
          if (validCoordinate(lat, lng)) coordinates.push({ lat, lng });
        });
      });
    });
  });
  return coordinates.reduce<{ north: number; south: number; east: number; west: number } | null>(
    (bounds, point) => ({
      north: Math.max(bounds?.north ?? point.lat, point.lat),
      south: Math.min(bounds?.south ?? point.lat, point.lat),
      east: Math.max(bounds?.east ?? point.lng, point.lng),
      west: Math.min(bounds?.west ?? point.lng, point.lng),
    }),
    null,
  );
}

function validCoordinate(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
