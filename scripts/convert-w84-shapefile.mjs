import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const inputDir = process.argv[2] || "E:/w84 (shared)/w84 (shared)";
const outputFile = process.argv[3] || "src/pages/leak-monitor/data/w84-network-demo.json";

const layerDefinitions = [
  {
    key: "pipes",
    baseName: "POC_KG556_p",
    geometryType: "LineString",
    mapProperties: (properties) => ({
      sourceId: numberOrNull(properties.OBJECTID),
      dmzId: textOrNull(properties.DMZID),
      dmzName: textOrNull(properties.DMZNAME),
      district: textOrNull(properties.DISTRICT),
      districtId: textOrNull(properties.DISTRICTID),
      type: numberOrNull(properties.TYPE),
      classification: textOrNull(properties.CLASSIFICA),
      material: textOrNull(properties.MATERIAL),
      outerDiameterMm: numberOrNull(properties.OUTERDIAME),
      status: numberOrNull(properties.STATUS),
      shapeLengthM: numberOrNull(properties.Shape_Leng),
    }),
  },
  {
    key: "hydrants",
    baseName: "POC_KG556_h",
    geometryType: "Point",
    mapProperties: (properties) => ({
      sourceId: numberOrNull(properties.OBJECTID),
      facilityId: textOrNull(properties.FACILITYID),
      type: numberOrNull(properties.TYPE),
      material: textOrNull(properties.MATERIAL),
      hydrantSizeMm: numberOrNull(properties.HYDRANTSIZ),
      status: numberOrNull(properties.STATUS),
      condition: textOrNull(properties.CONDITION),
      installDate: dateOrNull(properties.INSTALLDAT),
      rotation: numberOrNull(properties.ROTATION),
      enabled: numberOrNull(properties.ENABLED),
      netBaseId: textOrNull(properties.NETBASEID),
      gisSysId: textOrNull(properties.GISSYSID),
    }),
  },
  {
    key: "pumps",
    baseName: "POC_KG556_pmp",
    geometryType: "Point",
    mapProperties: (properties) => ({
      sourceId: textOrNull(properties.pmp),
      latitude: numberOrNull(properties.latit),
      longitude: numberOrNull(properties.long),
      remark: textOrNull(properties.remark),
    }),
  },
  {
    key: "valves",
    baseName: "POC_KG556_v",
    geometryType: "Point",
    mapProperties: (properties) => ({
      sourceId: numberOrNull(properties.OBJECTID),
      facilityId: textOrNull(properties.FACILITYID),
      type: numberOrNull(properties.TYPE),
      material: textOrNull(properties.MATERIAL),
      valveClass: textOrNull(properties.VALVECLASS),
      valveSizeMm: numberOrNull(properties.VALVESIZE),
      status: numberOrNull(properties.STATUS),
      condition: textOrNull(properties.CONDITION),
      installDate: dateOrNull(properties.INSTALLDAT),
      currentlyOpen: numberOrNull(properties.CURRENTLYO),
      percentOpen: numberOrNull(properties.PERCENTOPE),
      location: textOrNull(properties.LOCATION),
      gisId: textOrNull(properties.GISID),
      operable: numberOrNull(properties.OPERABLE),
      netBaseId: textOrNull(properties.NETBASEID),
      gisSysId: textOrNull(properties.GISSYSID),
    }),
  },
];

const layers = {};
for (const definition of layerDefinitions) {
  layers[definition.key] = convertLayer(definition);
}

const crossings = findInteriorCrossings(layers.pipes.features);
const output = {
  version: "w84-demo-v1",
  coordinateSystem: "WGS84",
  coordinateOrder: "LNG_LAT",
  source: "POC_KG556",
  layers,
  crossings,
};

const resolvedOutput = path.resolve(outputFile);
fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
fs.writeFileSync(resolvedOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${resolvedOutput}`);
console.log({
  pipes: layers.pipes.features.length,
  hydrants: layers.hydrants.features.length,
  pumps: layers.pumps.features.length,
  valves: layers.valves.features.length,
  crossings: crossings.length,
});

function convertLayer(definition) {
  const sourcePath = path.join(inputDir, `${definition.baseName}.shp`);
  const dbfPath = path.join(inputDir, `${definition.baseName}.dbf`);
  const geometries = readShapefile(sourcePath);
  const records = readDbf(dbfPath);
  const features = geometries
    .map((geometry, index) => {
      const properties = definition.mapProperties(records[index] || {});
      const idValue = properties.sourceId ?? index + 1;
      return {
        type: "Feature",
        id: `${definition.key}-${String(idValue)}`,
        geometry: geometry.type === definition.geometryType
          ? geometry
          : { type: definition.geometryType, coordinates: geometry.coordinates },
        properties,
      };
    })
    .filter((feature) => feature.geometry && hasValidGeometry(feature.geometry));

  return {
    type: "FeatureCollection",
    features,
  };
}

function readShapefile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const geometries = [];
  let offset = 100;

  while (offset + 8 <= buffer.length) {
    const contentLength = buffer.readInt32BE(offset + 4) * 2;
    const recordEnd = offset + 8 + contentLength;
    if (contentLength < 4 || recordEnd > buffer.length) break;

    const shapeType = buffer.readInt32LE(offset + 8);
    if (shapeType === 1) {
      geometries.push({
        type: "Point",
        coordinates: [buffer.readDoubleLE(offset + 12), buffer.readDoubleLE(offset + 20)],
      });
    } else if (shapeType === 3) {
      const partCount = buffer.readInt32LE(offset + 44);
      const pointCount = buffer.readInt32LE(offset + 48);
      const pointStart = offset + 56;
      const coordinates = [];
      for (let index = 0; index < pointCount; index += 1) {
        const pointOffset = pointStart + index * 16;
        coordinates.push([
          buffer.readDoubleLE(pointOffset),
          buffer.readDoubleLE(pointOffset + 8),
        ]);
      }

      if (partCount === 1) {
        geometries.push({ type: "LineString", coordinates });
      } else {
        const partOffsets = Array.from({ length: partCount }, (_, index) =>
          buffer.readInt32LE(offset + 52 + index * 4));
        geometries.push({
          type: "MultiLineString",
          coordinates: partOffsets.map((start, index) =>
            coordinates.slice(start, partOffsets[index + 1] ?? coordinates.length)),
        });
      }
    } else {
      geometries.push(null);
    }

    offset = recordEnd;
  }

  return geometries;
}

function readDbf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];

  for (let offset = 32; offset + 32 <= headerLength - 1; offset += 32) {
    const rawName = buffer.subarray(offset, offset + 11);
    const terminator = rawName.indexOf(0);
    const name = rawName.subarray(0, terminator < 0 ? 11 : terminator).toString("ascii").trim();
    if (!name) break;
    fields.push({
      name,
      type: String.fromCharCode(buffer[offset + 11]),
      length: buffer[offset + 16],
      decimals: buffer[offset + 17],
    });
  }

  return Array.from({ length: recordCount }, (_, recordIndex) => {
    const recordStart = headerLength + recordIndex * recordLength;
    const deleted = buffer[recordStart] === 0x2a;
    let cursor = recordStart + 1;
    const record = {};
    for (const field of fields) {
      const rawValue = buffer.subarray(cursor, cursor + field.length).toString("utf8").trim();
      record[field.name] = deleted ? "" : parseDbfValue(rawValue, field);
      cursor += field.length;
    }
    return record;
  });
}

function parseDbfValue(value, field) {
  if (!value) return null;
  if (field.type === "N" || field.type === "F") {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return value;
}

function findInteriorCrossings(features) {
  const crossings = [];
  for (let firstIndex = 0; firstIndex < features.length; firstIndex += 1) {
    const first = features[firstIndex];
    const firstPath = first.geometry.type === "LineString" ? first.geometry.coordinates : [];
    for (let secondIndex = firstIndex + 1; secondIndex < features.length; secondIndex += 1) {
      const second = features[secondIndex];
      const secondPath = second.geometry.type === "LineString" ? second.geometry.coordinates : [];
      for (let firstPoint = 0; firstPoint < firstPath.length - 1; firstPoint += 1) {
        for (let secondPoint = 0; secondPoint < secondPath.length - 1; secondPoint += 1) {
          const coordinate = interiorIntersection(
            firstPath[firstPoint],
            firstPath[firstPoint + 1],
            secondPath[secondPoint],
            secondPath[secondPoint + 1],
          );
          if (!coordinate || crossings.some((item) => distanceMeters(item.coordinate, coordinate) < 2)) {
            continue;
          }
          crossings.push({
            crossingId: `crossing-${crossings.length + 1}`,
            coordinate,
            pipeIds: [String(first.id), String(second.id)],
            connected: false,
            crossingType: "NON_CONNECTED",
            label: "不连通",
          });
        }
      }
    }
  }
  return crossings;
}

function interiorIntersection(firstStart, firstEnd, secondStart, secondEnd) {
  const denominator =
    (secondEnd[1] - secondStart[1]) * (firstEnd[0] - firstStart[0]) -
    (secondEnd[0] - secondStart[0]) * (firstEnd[1] - firstStart[1]);
  if (Math.abs(denominator) < 1e-12) return null;

  const firstRatio = (
    (secondEnd[0] - secondStart[0]) * (firstStart[1] - secondStart[1]) -
    (secondEnd[1] - secondStart[1]) * (firstStart[0] - secondStart[0])
  ) / denominator;
  const secondRatio = (
    (firstEnd[0] - firstStart[0]) * (firstStart[1] - secondStart[1]) -
    (firstEnd[1] - firstStart[1]) * (firstStart[0] - secondStart[0])
  ) / denominator;
  if (firstRatio <= 1e-8 || firstRatio >= 1 - 1e-8 || secondRatio <= 1e-8 || secondRatio >= 1 - 1e-8) {
    return null;
  }
  return [
    firstStart[0] + firstRatio * (firstEnd[0] - firstStart[0]),
    firstStart[1] + firstRatio * (firstEnd[1] - firstStart[1]),
  ];
}

function distanceMeters(first, second) {
  const latScale = 111320;
  const lngScale = 111320 * Math.max(0.2, Math.cos(first[1] * Math.PI / 180));
  return Math.sqrt(((first[1] - second[1]) * latScale) ** 2 + ((first[0] - second[0]) * lngScale) ** 2);
}

function hasValidGeometry(geometry) {
  if (geometry.type === "Point") {
    return Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2 &&
      geometry.coordinates.every((value) => Number.isFinite(value));
  }
  return Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2;
}

function textOrNull(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateOrNull(value) {
  return typeof value === "string" && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : textOrNull(value);
}
