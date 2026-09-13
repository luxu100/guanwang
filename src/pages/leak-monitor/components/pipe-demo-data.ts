import { convertMapCoordinate } from "../coordinateTransform";
import type { CoordinateSystem, MapCoordinate, MapDevicePoint } from "../types";

export type DemoPipeStyleId = "normal" | "warning" | "danger";
export type DemoJunctionType = "endpoint" | "crossing" | "device";

export interface DemoJunction {
  id: string;
  coordinate: MapCoordinate;
  type: DemoJunctionType;
  connected: boolean;
  label: string;
  coordinateSystem?: CoordinateSystem;
}

export interface DemoPipe {
  id: string;
  name: string;
  path: MapCoordinate[];
  radius: number;
  styleId: DemoPipeStyleId;
  riskLevel: "low" | "medium" | "high";
  deviceNumbers: string[];
  startJunctionId?: string;
  endJunctionId?: string;
  connectedJunctionIds: string[];
  coordinateSystem?: CoordinateSystem;
}

const FALLBACK_CENTER: MapCoordinate = {
  lat: 30.2741,
  lng: 120.1551,
};

export function createDemoPipeNetwork(points: MapDevicePoint[]) {
  const anchors = normalizeAnchors(points);
  const junctions: DemoJunction[] = [];
  const addJunction = (
    id: string,
    coordinate: MapCoordinate,
    type: DemoJunctionType,
    connected: boolean,
    label: string,
  ) => {
    const junction: DemoJunction = {
      id,
      coordinate,
      type,
      connected,
      label,
    };
    junctions.push(junction);
    return junction;
  };

  const connectedCross = addJunction(
    "demo-connected-cross",
    anchors[1],
    "crossing",
    true,
    "连通",
  );
  const tJunction = addJunction(
    "demo-t-junction",
    anchors[0],
    "crossing",
    true,
    "连通",
  );

  anchors.slice(0, 4).forEach((coordinate, index) => {
    addJunction(
      `demo-device-junction-${index + 1}`,
      coordinate,
      "device",
      true,
      points[index]?.deviceNumber || `设备点 ${index + 1}`,
    );
  });

  const pipes: DemoPipe[] = [
    {
      id: "demo-mainline",
      name: "演示主干管线",
      path: [
        anchors[0],
        offsetCoordinate(anchors[0], 80, 50),
        connectedCross.coordinate,
        offsetCoordinate(anchors[2], -70, 45),
        anchors[3],
      ],
      radius: 4,
      styleId: "normal",
      riskLevel: "low",
      deviceNumbers: points.slice(0, 4).map((point) => point.deviceNumber),
      startJunctionId: tJunction.id,
      endJunctionId: "demo-device-junction-4",
      connectedJunctionIds: [
        tJunction.id,
        connectedCross.id,
        "demo-device-junction-4",
      ],
    },
    {
      id: "demo-connected-cross-branch",
      name: "连通十字支线",
      path: [
        offsetCoordinate(connectedCross.coordinate, 0, -150),
        connectedCross.coordinate,
        offsetCoordinate(connectedCross.coordinate, 0, 150),
      ],
      radius: 4,
      styleId: "warning",
      riskLevel: "medium",
      deviceNumbers: points[1] ? [points[1].deviceNumber] : [],
      startJunctionId: connectedCross.id,
      endJunctionId: "demo-device-junction-2",
      connectedJunctionIds: [
        connectedCross.id,
        "demo-device-junction-2",
      ],
    },
    {
      id: "demo-t-branch",
      name: "演示 T 型支线",
      path: [
        tJunction.coordinate,
        offsetCoordinate(tJunction.coordinate, -120, 80),
        offsetCoordinate(tJunction.coordinate, -220, 125),
      ],
      radius: 4,
      styleId: "normal",
      riskLevel: "low",
      deviceNumbers: points[0] ? [points[0].deviceNumber] : [],
      startJunctionId: tJunction.id,
      connectedJunctionIds: [tJunction.id],
    },
  ];

  const separateCross = offsetCoordinate(anchors[2], 150, 30);
  addJunction(
    "demo-separate-cross",
    separateCross,
    "crossing",
    false,
    "不连通",
  );

  pipes.push(
    {
      id: "demo-separate-horizontal",
      name: "不连通交叉横向管线",
      path: [
        offsetCoordinate(separateCross, -180, 0),
        separateCross,
        offsetCoordinate(separateCross, 180, 0),
      ],
      radius: 4,
      styleId: "danger",
      riskLevel: "high",
      deviceNumbers: [],
      connectedJunctionIds: [],
    },
    {
      id: "demo-separate-vertical",
      name: "不连通交叉纵向管线",
      path: [
        offsetCoordinate(separateCross, 0, -145),
        separateCross,
        offsetCoordinate(separateCross, 0, 145),
      ],
      radius: 4,
      styleId: "normal",
      riskLevel: "low",
      deviceNumbers: points[2] ? [points[2].deviceNumber] : [],
      connectedJunctionIds: [],
    },
  );

  return { pipes, junctions };
}

function normalizeAnchors(points: MapDevicePoint[]) {
  const available = points
    .filter((point) => isValidCoordinate(point.lat, point.lng))
    .slice(0, 4)
    .map((point) => convertMapCoordinate(
      { lat: point.lat, lng: point.lng },
      point.coordinateSystem,
      "WGS84",
    ));

  const fallback = [
    offsetCoordinate(FALLBACK_CENTER, -260, -170),
    offsetCoordinate(FALLBACK_CENTER, -80, 90),
    offsetCoordinate(FALLBACK_CENTER, 110, 45),
    offsetCoordinate(FALLBACK_CENTER, 280, 210),
  ];

  return available.concat(fallback).slice(0, 4);
}

function offsetCoordinate(
  coordinate: MapCoordinate,
  eastMeters: number,
  northMeters: number,
): MapCoordinate {
  const latitudeDelta = northMeters / 111_320;
  const longitudeDelta =
    eastMeters / (111_320 * Math.max(0.2, Math.cos(coordinate.lat * Math.PI / 180)));

  return {
    lat: coordinate.lat + latitudeDelta,
    lng: coordinate.lng + longitudeDelta,
  };
}

function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
}
