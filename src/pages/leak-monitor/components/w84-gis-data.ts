import rawData from "../data/w84-network-demo.json";
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
