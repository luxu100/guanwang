export type RecordLike = Record<string, unknown>;

export interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  list?: unknown[];
  items?: unknown[];
  total?: number;
  count?: number;
}

export function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = isObject(data) ? data : {};
  const records = getFirstArray(pageData, ["records", "rows", "list", "items", "data"]);
  const topLevelRecords = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = records.length > 0 ? records : topLevelRecords;
  const totalValue = getFirstNumber(pageData, ["total", "count", "totalCount"]) ?? getFirstNumber(response, ["total", "count"]);

  return {
    records: finalRecords.map((item) => (isObject(item) ? item : { value: item })),
    total: totalValue ?? finalRecords.length,
  };
}

export function parseListResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  if (Array.isArray(data)) {
    return data.map((item) => (isObject(item) ? item : { value: item }));
  }

  return parsePageResponse(response).records;
}

export function getId(item: RecordLike | null | undefined) {
  if (!item) {
    return "";
  }

  const value = getValue(item, ["id"]);
  return typeof value === "number" || typeof value === "string" ? value : "";
}

export function getText(item: RecordLike, keys: string[], fallback = "") {
  const value = getValue(item, keys);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

export function getValue(item: RecordLike, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      return item[key];
    }
  }

  return undefined;
}

export function getArrayValue(item: RecordLike, keys: string[]) {
  const value = getValue(item, keys);
  return Array.isArray(value) ? value : [];
}

export function getFirstArray(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return [];
  }

  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function getFirstNumber(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return undefined;
  }

  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

export function formatDateTime(value: string) {
  const text = String(value || "").trim();
  if (!text || text === "-") {
    return text || "-";
  }

  const matched = text.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
  if (matched) {
    return `${matched[1]} ${matched[2]}`;
  }

  return text.replace("T", " ").replace(/\.\d+(?:Z|[+-]\d{2}:?\d{2})?$/, "").replace(/Z$/, "");
}

export function removeEmptyFields(data: RecordLike) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

export function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }

  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

export function toastError(error: unknown, fallback: string) {
  uni.showToast({
    title: (error as { msg?: string })?.msg || fallback,
    icon: "none",
  });
}

export function isObject(value: unknown): value is RecordLike {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
