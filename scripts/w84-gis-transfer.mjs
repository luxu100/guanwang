import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_SOURCE_DIR = "E:/w84 (shared)/w84 (shared)";
const SUCCESS_CODE = 200;
const DATASETS = {
  pipes: { baseName: "POC_KG556_p", kind: "pipe" },
  hydrants: { baseName: "POC_KG556_h", kind: "HYDRANT" },
  pumps: { baseName: "POC_KG556_pmp", kind: "PUMP" },
  valves: { baseName: "POC_KG556_v", kind: "VALVE" },
};

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

export function readW84Source(sourceDir = DEFAULT_SOURCE_DIR) {
  const root = path.resolve(sourceDir);
  const pipes = readLayer(root, DATASETS.pipes);
  const hydrants = readLayer(root, DATASETS.hydrants);
  const pumps = readLayer(root, DATASETS.pumps);
  const valves = readLayer(root, DATASETS.valves);

  return {
    sourceDir: root,
    pipes,
    facilities: { hydrants, pumps, valves },
  };
}

export function buildImportPayloads(source, deptId = 2) {
  const normalizedDeptId = normalizeDeptId(deptId);
  const pipes = buildPipePayloads(source.pipes, normalizedDeptId);
  const facilities = [
    ...source.facilities.hydrants.map((record) => buildFacilityPayload(record, "HYDRANT", normalizedDeptId)),
    ...source.facilities.pumps.map((record) => buildFacilityPayload(record, "PUMP", normalizedDeptId)),
    ...source.facilities.valves.map((record) => buildFacilityPayload(record, "VALVE", normalizedDeptId)),
  ];

  validatePayloads(pipes, facilities, normalizedDeptId);
  return { pipes, facilities };
}

export function buildPipePayloads(records, deptId = 2) {
  const normalizedDeptId = normalizeDeptId(deptId);
  const counts = new Map();
  for (const record of records) {
    const objectId = requiredValue(record.attributes.OBJECTID, "pipe OBJECTID");
    counts.set(objectId, (counts.get(objectId) || 0) + 1);
  }
  const seen = new Map();
  return records.map((record) => {
    const objectId = requiredValue(record.attributes.OBJECTID, "pipe OBJECTID");
    const occurrence = (seen.get(objectId) || 0) + 1;
    seen.set(objectId, occurrence);
    return buildPipePayload(record, normalizedDeptId, counts.get(objectId) > 1 ? occurrence : null);
  });
}

export function selectSamplePayloads(payloads) {
  const pipe = payloads.pipes[0];
  const valve = payloads.facilities.find((item) => item.facilityType === "VALVE");
  const hydrant = payloads.facilities.find((item) => item.facilityType === "HYDRANT");
  const pump = payloads.facilities.find((item) => item.facilityType === "PUMP");

  if (!pipe || !valve || !hydrant || !pump) {
    throw new Error("W84 source is missing one of the required sample records");
  }

  return {
    pipes: [pipe],
    facilities: [valve, hydrant, pump],
  };
}

export function selectPipeOnlyPayloads(payloads) {
  const pipe = payloads.pipes[0];
  if (!pipe) throw new Error("W84 source is missing a pipe sample record");
  return { pipes: [pipe], facilities: [] };
}

export function validatePayloads(pipes, facilities, deptId = 2) {
  const forbidden = new Set([
    "id",
    "gisSource",
    "gisSourceId",
    "riskScore",
    "riskLevel",
    "riskColor",
    "shapeLengthM",
    "boundDeviceCount",
  ]);

  for (const payload of [...pipes, ...facilities]) {
    if (payload.deptId !== deptId) {
      throw new Error(`Payload ${payload.tubeName || payload.facilityNumber} has unexpected deptId`);
    }
    for (const key of forbidden) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        throw new Error(`Payload ${payload.tubeName || payload.facilityNumber} contains forbidden field ${key}`);
      }
    }
  }

  for (const payload of pipes) {
    if (!Array.isArray(payload.lineCoords) || payload.lineCoords.length === 0) {
      throw new Error(`Pipe ${payload.tubeName} has no lineCoords`);
    }
    for (const part of payload.lineCoords) {
      if (!Array.isArray(part) || part.length < 2) {
        throw new Error(`Pipe ${payload.tubeName} contains an invalid line part`);
      }
      for (const coordinate of part) validateCoordinate(coordinate, payload.tubeName);
    }
  }

  const pipeNames = new Set();
  for (const payload of pipes) {
    if (pipeNames.has(payload.tubeName)) {
      throw new Error(`Duplicate source pipe identifier: ${payload.tubeName}`);
    }
    pipeNames.add(payload.tubeName);
  }

  for (const payload of facilities) {
    validateCoordinate(
      [payload.longitude, payload.latitude],
      payload.facilityNumber,
    );
  }
}

export async function requestJson(baseUrl, endpoint, options = {}, fetchImpl = fetch) {
  const url = `${String(baseUrl).replace(/\/$/, "")}${endpoint}`;
  const response = await fetchImpl(url, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.token
        ? { Authorization: `${options.tokenPrefix || "Bearer"} ${options.token}` }
        : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || !body || body.code !== SUCCESS_CODE) {
    const businessCode = body?.code === undefined ? "missing" : body.code;
    throw new Error(`${options.method || "GET"} ${endpoint} failed: HTTP ${response.status}, code ${businessCode}, ${body?.msg || "unknown error"}`);
  }

  return body;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const source = readW84Source(options.sourceDir);
  const payloads = buildImportPayloads(source, options.deptId);
  const selected = options.pipesOnly
    ? (options.all ? { pipes: payloads.pipes, facilities: [] } : selectPipeOnlyPayloads(payloads))
    : options.sample
      ? selectSamplePayloads(payloads)
      : payloads;

  if (!options.apply) {
    printSummary(source, payloads, selected, options);
    return;
  }

  if (!options.pipesOnly || (!options.sample && !options.all)) {
    throw new Error("--apply requires --pipes-only and either --sample or --all");
  }
  if (options.sample && options.all) {
    throw new Error("--sample and --all cannot be used together");
  }

  const baseUrl = options.baseUrl || process.env.W84_API_BASE_URL;
  if (!baseUrl) throw new Error("W84_API_BASE_URL is required for --apply");

  const requestOptions = {
    token: process.env.W84_TOKEN || "",
    tokenPrefix: normalizeTokenPrefix(process.env.W84_TOKEN_PREFIX || "Bearer"),
  };

  await verifyDepartment(baseUrl, options.deptId, requestOptions);
  const existing = await readExistingRecords(
    baseUrl,
    requestOptions,
    selected.facilities.length > 0,
  );
  const existingNames = new Set(existing.pipes.map((item) => item?.tubeName).filter(Boolean));
  const alreadyPresent = selected.pipes.filter((pipe) => existingNames.has(pipe.tubeName)).map((pipe) => pipe.tubeName);
  const toCreate = selected.pipes.filter((pipe) => !existingNames.has(pipe.tubeName));
  if (!options.all && alreadyPresent.length > 0) {
    throw new Error(`pipe already exists: ${alreadyPresent[0]}`);
  }
  printSummary(source, payloads, { pipes: toCreate, facilities: [] }, { ...options, existingPipeNames: alreadyPresent });

  const report = { created: [], alreadyPresent, startedAt: new Date().toISOString() };
  for (const pipe of toCreate) {
    try {
      const response = await requestJson(baseUrl, "/api/tube-network/create", {
        ...requestOptions,
        method: "POST",
        body: pipe,
      });
      report.created.push({ resource: "pipe", key: pipe.tubeName, response: response.data ?? null });
      console.log(`created pipe ${pipe.tubeName}`);
      writeReport(options.report, report);
    } catch (error) {
      report.failed = { resource: "pipe", key: pipe.tubeName, error: error?.message || String(error) };
      report.finishedAt = new Date().toISOString();
      writeReport(options.report, report);
      console.error(JSON.stringify(report, null, 2));
      throw error;
    }
  }
  for (const facility of selected.facilities) {
    const response = await requestJson(baseUrl, "/api/facility/create", {
      ...requestOptions,
      method: "POST",
      body: facility,
    });
    report.created.push({ resource: "facility", key: facility.facilityNumber, response: response.data ?? null });
    console.log(`created facility ${facility.facilityNumber}`);
  }

  const verified = await verifyCreatedRecords(baseUrl, { pipes: [...alreadyPresent.map((tubeName) => payloads.pipes.find((pipe) => pipe.tubeName === tubeName)), ...toCreate], facilities: [] }, requestOptions, { pipesOnly: options.pipesOnly });
  report.verified = verified;
  report.finishedAt = new Date().toISOString();
  writeReport(options.report, report);
  console.log(JSON.stringify(report, null, 2));
}

export function parseArgs(argv) {
  const options = {
    sourceDir: DEFAULT_SOURCE_DIR,
    deptId: 2,
    sample: false,
    pipesOnly: false,
    all: false,
    apply: false,
    report: "",
    baseUrl: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source-dir") options.sourceDir = requireValue(argv, ++index, arg);
    else if (arg === "--dept-id") options.deptId = requireValue(argv, ++index, arg);
    else if (arg === "--base-url") options.baseUrl = requireValue(argv, ++index, arg);
    else if (arg === "--report") options.report = requireValue(argv, ++index, arg);
    else if (arg === "--sample") options.sample = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--pipes-only") options.pipesOnly = true;
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--dry-run") options.apply = false;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.all && options.sample) {
    throw new Error("--sample and --all cannot be used together");
  }
  if (options.apply && (!options.pipesOnly || (!options.sample && !options.all))) {
    throw new Error("--apply requires --pipes-only and either --sample or --all");
  }
  options.deptId = normalizeDeptId(options.deptId);
  return options;
}

function readLayer(root, definition) {
  const shpPath = path.join(root, `${definition.baseName}.shp`);
  const dbfPath = path.join(root, `${definition.baseName}.dbf`);
  const prjPath = path.join(root, `${definition.baseName}.prj`);
  const projection = fs.readFileSync(prjPath, "utf8");
  if (!/WGS[_ ]?1984/i.test(projection)) {
    throw new Error(`${definition.baseName}.prj is not WGS84`);
  }

  const geometries = readShapefile(shpPath);
  const records = readDbf(dbfPath);
  if (geometries.length !== records.length) {
    throw new Error(`${definition.baseName}: SHP records ${geometries.length} do not match DBF records ${records.length}`);
  }

  return records.map((attributes, index) => ({
    attributes,
    geometry: geometries[index],
    source: definition.baseName,
    index,
  }));
}

function buildPipePayload(record, deptId, duplicateOrdinal = null) {
  const attributes = record.attributes;
  const objectId = requiredValue(attributes.OBJECTID, "pipe OBJECTID");
  const status = mapPipeStatus(attributes.STATUS, `pipe ${objectId}`);
  const lineCoords = record.geometry.parts;
  const tubeName = `POC_KG556_p-${objectId}${duplicateOrdinal === null ? "" : `-seg${duplicateOrdinal}`}`;
  const payload = {
    tubeName,
    tubeType: requiredNumber(attributes.TYPE, `pipe ${objectId} TYPE`),
    status,
    deptId,
    lineCoords,
    coordinateSystem: "WGS84",
    countryCode: "MY",
  };
  addIfPresent(payload, "material", textValue(attributes.MATERIAL));
  addIfPositive(payload, "diameterMm", attributes.OUTERDIAME);
  payload.remark = `W84 source: ${record.source}, OBJECTID=${objectId}${duplicateOrdinal === null ? "" : `, duplicate segment ${duplicateOrdinal}`}`;
  return payload;
}

function buildFacilityPayload(record, facilityType, deptId) {
  const attributes = record.attributes;
  const geometry = record.geometry;
  const identifier = facilityType === "PUMP"
    ? requiredValue(attributes.pmp, "pump identifier")
    : requiredValue(attributes.OBJECTID, `${facilityType} OBJECTID`);
  const point = geometry.point;
  if (!point) throw new Error(`${facilityType} ${identifier} is not a point`);

  const payload = {
    facilityType,
    facilityNumber: `POC_KG556_${facilityType === "HYDRANT" ? "h" : facilityType === "VALVE" ? "v" : "pmp"}-${identifier}`,
    deptId,
    longitude: point[0],
    latitude: point[1],
    status: mapFacilityStatus(attributes, `${facilityType} ${identifier}`),
  };

  const diameter = facilityType === "VALVE" ? attributes.VALVESIZE : attributes.HYDRANTSIZ;
  addIfPositive(payload, "diameterMm", diameter);
  return payload;
}

function mapPipeStatus(value, label) {
  if (value === 0 || value === 1) return value;
  if (value === 4) return 1;
  throw new Error(`${label} has unsupported STATUS=${String(value)}`);
}

function mapFacilityStatus(attributes, label) {
  for (const key of ["OPERABLE", "ENABLED"]) {
    if (attributes[key] === 0 || attributes[key] === 1) return attributes[key];
  }
  if (attributes.STATUS === 0 || attributes.STATUS === 1) return attributes.STATUS;
  if (attributes.STATUS === 4 || attributes.STATUS === null || attributes.STATUS === undefined) {
    // The pump source has no status column; the supplied GIS layer is treated as active.
    return 1;
  }
  throw new Error(`${label} has unsupported status fields`);
}

function readShapefile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 100 || buffer.readInt32BE(0) !== 9994) {
    throw new Error(`${filePath} is not a valid Shapefile`);
  }

  const geometries = [];
  let offset = 100;
  while (offset + 8 <= buffer.length) {
    const contentLength = buffer.readInt32BE(offset + 4) * 2;
    const contentStart = offset + 8;
    const contentEnd = contentStart + contentLength;
    if (contentLength < 4 || contentEnd > buffer.length) {
      throw new Error(`${filePath} contains a truncated record`);
    }

    const shapeType = buffer.readInt32LE(contentStart);
    if (shapeType === 1) {
      geometries.push({
        type: "Point",
        point: [buffer.readDoubleLE(contentStart + 4), buffer.readDoubleLE(contentStart + 12)],
      });
    } else if (shapeType === 3) {
      const partCount = buffer.readInt32LE(contentStart + 36);
      const pointCount = buffer.readInt32LE(contentStart + 40);
      const partsStart = contentStart + 44;
      const pointStart = partsStart + partCount * 4;
      const offsets = Array.from({ length: partCount }, (_, index) =>
        buffer.readInt32LE(partsStart + index * 4));
      const points = Array.from({ length: pointCount }, (_, index) => [
        buffer.readDoubleLE(pointStart + index * 16),
        buffer.readDoubleLE(pointStart + index * 16 + 8),
      ]);
      const parts = offsets.map((start, index) =>
        points.slice(start, offsets[index + 1] ?? points.length));
      geometries.push({ type: "Polyline", parts });
    } else if (shapeType === 0) {
      geometries.push({ type: "Null" });
    } else {
      throw new Error(`${filePath} contains unsupported shape type ${shapeType}`);
    }

    offset = contentEnd;
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
    if (recordStart + recordLength > buffer.length) {
      throw new Error(`${filePath} contains a truncated DBF record`);
    }
    const deleted = buffer[recordStart] === 0x2a;
    let cursor = recordStart + 1;
    const record = {};
    for (const field of fields) {
      const rawValue = buffer.subarray(cursor, cursor + field.length).toString("utf8").trim();
      record[field.name] = deleted ? null : parseDbfValue(rawValue, field);
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

async function verifyDepartment(baseUrl, deptId, requestOptions) {
  const response = await requestJson(baseUrl, `/api/dept/${deptId}`, requestOptions);
  const data = response.data || {};
  if (data.id !== deptId || data.deptName !== "金卡" || data.status !== 1) {
    throw new Error(`dept ${deptId} is not the active 金卡 partition`);
  }
}

async function readExistingRecords(baseUrl, requestOptions, includeFacilities = true) {
  const pipes = await requestJson(baseUrl, "/api/tube-network/list", requestOptions);
  const facilities = includeFacilities
    ? await requestJson(baseUrl, "/api/facility/list", requestOptions)
    : null;
  return {
    pipes: recordsFromResponse(pipes.data),
    facilities: facilities ? recordsFromResponse(facilities.data) : [],
  };
}

function assertNoDuplicates(selected, existing) {
  const pipeNames = new Set(existing.pipes.map((item) => item?.tubeName).filter(Boolean));
  const facilityNumbers = new Set(existing.facilities.map((item) => item?.facilityNumber).filter(Boolean));
  for (const pipe of selected.pipes) {
    if (pipeNames.has(pipe.tubeName)) throw new Error(`pipe already exists: ${pipe.tubeName}`);
  }
  for (const facility of selected.facilities) {
    if (facilityNumbers.has(facility.facilityNumber)) throw new Error(`facility already exists: ${facility.facilityNumber}`);
  }
}

async function verifyCreatedRecords(baseUrl, selected, requestOptions, options = {}) {
  const existing = await readExistingRecords(
    baseUrl,
    requestOptions,
    !options.pipesOnly && selected.facilities.length > 0,
  );
  const pipeResults = selected.pipes.map((payload) => {
    const record = existing.pipes.find((item) => item?.tubeName === payload.tubeName);
    assertReadback(record, payload.tubeName, payload);
    return summarizeReadback(record);
  });
  const facilityResults = selected.facilities.map((payload) => {
    const record = existing.facilities.find((item) => item?.facilityNumber === payload.facilityNumber);
    assertReadback(record, payload.facilityNumber, payload);
    return summarizeReadback(record);
  });
  return { pipes: pipeResults, facilities: facilityResults };
}

function assertReadback(record, key, payload) {
  if (!record) throw new Error(`created record was not returned by list: ${key}`);
  if (record.deptId !== payload.deptId) throw new Error(`readback deptId mismatch: ${key}`);
  if (JSON.stringify(record.lineCoords) !== JSON.stringify(payload.lineCoords)) {
    throw new Error(`readback lineCoords mismatch: ${key}`);
  }
}

function summarizeReadback(record) {
  return {
    id: record.id ?? null,
    name: record.tubeName ?? record.facilityNumber ?? null,
    deptId: record.deptId ?? null,
    coordinateSystem: record.coordinateSystem ?? null,
    countryCode: record.countryCode ?? null,
  };
}

function recordsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["records", "rows", "list", "tubes", "facilities"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function normalizeDeptId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid dept id: ${String(value)}`);
  return id;
}

function normalizeTokenPrefix(value) {
  return String(value || "").trim();
}

function requiredValue(value, label) {
  if (value === null || value === undefined || value === "") throw new Error(`Missing ${label}`);
  return value;
}

function requiredNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Missing ${label}`);
  return value;
}

function textValue(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function addIfPresent(target, key, value) {
  if (value !== null && value !== undefined && value !== "") target[key] = value;
}

function addIfPositive(target, key, value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) target[key] = value;
}

function validateCoordinate(coordinate, label) {
  const [longitude, latitude] = coordinate;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180
    || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`${label} has invalid WGS84 coordinate`);
  }
}

function printSummary(source, payloads, selected, options) {
  const existingNames = options.existingPipeNames || [];
  console.log(JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    transfer: options.pipesOnly ? "pipes-only" : "pipes-and-facilities",
    sourceDir: source.sourceDir,
    deptId: options.deptId,
    counts: {
      pipes: source.pipes.length,
      hydrants: source.facilities.hydrants.length,
      pumps: source.facilities.pumps.length,
      valves: source.facilities.valves.length,
    },
    selected: {
      pipes: selected.pipes.length,
      facilities: selected.facilities.length,
      alreadyPresent: existingNames.length,
      toCreate: selected.pipes.length,
    },
    samplePayloads: options.sample ? selected : undefined,
    payloadCount: {
      pipes: payloads.pipes.length,
      facilities: payloads.facilities.length,
    },
  }, null, 2));
}

function writeReport(reportPath, report) {
  if (!reportPath) return;
  const resolved = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`report written to ${resolved}`);
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function printHelp() {
  console.log(`W84 GIS transfer\n\n  --dry-run                 Parse and validate without network writes\n  --pipes-only              Transfer only pipe data; never calls facility endpoints\n  --pipes-only --sample --apply  Send one sample pipe\n  --pipes-only --all --apply     Send all pipes not already present\n  --source-dir <path>       Shapefile directory\n  --dept-id <id>            Target partition, defaults to 2\n  --base-url <url>          API base URL, or W84_API_BASE_URL\n  --report <path>           Write a progress report without credentials\n`);
}

if (isMain) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
