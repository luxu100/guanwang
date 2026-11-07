import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Synthetic, test-only GIS records. No local W84 dataset or API access is needed.
export function writeW84Fixture(directory) {
  writeLayer(directory, "POC_KG556_p", 3, [
    {
      attributes: { OBJECTID: 4, TYPE: 1, STATUS: 4, MATERIAL: "PVC", OUTERDIAME: 100 },
      parts: [
        [[101.1, 3.1], [101.101, 3.101]],
        [[101.101, 3.101], [101.102, 3.102]],
      ],
    },
    {
      attributes: { OBJECTID: 8, TYPE: 2, STATUS: 1, MATERIAL: "DI", OUTERDIAME: 150 },
      parts: [[[101.102, 3.102], [101.103, 3.103]]],
    },
    {
      attributes: { OBJECTID: 8, TYPE: 2, STATUS: 1, MATERIAL: "DI", OUTERDIAME: 150 },
      parts: [[[101.103, 3.103], [101.104, 3.104]]],
    },
  ], [
    ["OBJECTID", "N", 8], ["TYPE", "N", 4], ["STATUS", "N", 4],
    ["MATERIAL", "C", 12], ["OUTERDIAME", "N", 8],
  ]);
  writeLayer(directory, "POC_KG556_h", 1, [
    { attributes: { OBJECTID: 11, ENABLED: 0, HYDRANTSIZ: 80 }, point: [101.101, 3.101] },
  ], [["OBJECTID", "N", 8], ["ENABLED", "N", 4], ["HYDRANTSIZ", "N", 8]]);
  writeLayer(directory, "POC_KG556_pmp", 1, [
    { attributes: { pmp: "PUMP-1" }, point: [101.102, 3.102] },
  ], [["pmp", "C", 12]]);
  writeLayer(directory, "POC_KG556_v", 1, [
    { attributes: { OBJECTID: 21, OPERABLE: 1, VALVESIZE: 200 }, point: [101.103, 3.103] },
  ], [["OBJECTID", "N", 8], ["OPERABLE", "N", 4], ["VALVESIZE", "N", 8]]);
}

function writeLayer(directory, name, shapeType, records, fields) {
  writeFileSync(join(directory, `${name}.shp`), shapefile(shapeType, records));
  writeFileSync(join(directory, `${name}.dbf`), dbf(records, fields));
  writeFileSync(join(directory, `${name}.prj`),
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.0174532925199433]]');
}

function writeBounds(buffer, offset, points) {
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  const bounds = [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
  bounds.forEach((value, index) => buffer.writeDoubleLE(value, offset + index * 8));
}

function shapefile(shapeType, records) {
  const contents = records.map((record) => {
    if (shapeType === 1) {
      const content = Buffer.alloc(20);
      content.writeInt32LE(1, 0);
      content.writeDoubleLE(record.point[0], 4);
      content.writeDoubleLE(record.point[1], 12);
      return content;
    }

    const points = record.parts.flat();
    const content = Buffer.alloc(44 + record.parts.length * 4 + points.length * 16);
    content.writeInt32LE(3, 0);
    writeBounds(content, 4, points);
    content.writeInt32LE(record.parts.length, 36);
    content.writeInt32LE(points.length, 40);
    let pointOffset = 0;
    record.parts.forEach((part, index) => {
      content.writeInt32LE(pointOffset, 44 + index * 4);
      pointOffset += part.length;
    });
    const pointsStart = 44 + record.parts.length * 4;
    points.forEach(([longitude, latitude], index) => {
      content.writeDoubleLE(longitude, pointsStart + index * 16);
      content.writeDoubleLE(latitude, pointsStart + index * 16 + 8);
    });
    return content;
  });

  const header = Buffer.alloc(100);
  const byteLength = 100 + contents.reduce((sum, content) => sum + 8 + content.length, 0);
  header.writeInt32BE(9994, 0);
  header.writeInt32BE(byteLength / 2, 24);
  header.writeInt32LE(1000, 28);
  header.writeInt32LE(shapeType, 32);
  writeBounds(header, 36, records.flatMap((record) => record.point ? [record.point] : record.parts.flat()));

  return Buffer.concat([header, ...contents.flatMap((content, index) => {
    const recordHeader = Buffer.alloc(8);
    recordHeader.writeInt32BE(index + 1, 0);
    recordHeader.writeInt32BE(content.length / 2, 4);
    return [recordHeader, content];
  })]);
}

function dbf(records, fields) {
  const headerLength = 32 + fields.length * 32 + 1;
  const recordLength = 1 + fields.reduce((sum, [, , length]) => sum + length, 0);
  const buffer = Buffer.alloc(headerLength + records.length * recordLength + 1);
  buffer[0] = 0x03;
  buffer[1] = 126; // 2026-01-01, fixed for deterministic fixtures.
  buffer[2] = 1;
  buffer[3] = 1;
  buffer.writeUInt32LE(records.length, 4);
  buffer.writeUInt16LE(headerLength, 8);
  buffer.writeUInt16LE(recordLength, 10);
  fields.forEach(([name, type, length], index) => {
    const offset = 32 + index * 32;
    buffer.write(name, offset, "ascii");
    buffer[offset + 11] = type.charCodeAt(0);
    buffer[offset + 16] = length;
  });
  buffer[headerLength - 1] = 0x0d;

  records.forEach((record, index) => {
    let offset = headerLength + index * recordLength;
    buffer[offset++] = 0x20;
    for (const [name, type, length] of fields) {
      const value = String(record.attributes[name] ?? "");
      const padded = type === "N" ? value.padStart(length) : value.padEnd(length);
      buffer.write(padded, offset, length, "ascii");
      offset += length;
    }
  });
  buffer[buffer.length - 1] = 0x1a;
  return buffer;
}
