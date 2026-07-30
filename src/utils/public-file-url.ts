/**
 * 安全附件 URL 解析工具。
 *
 * 替换漏点管理和历史总览中自行拼接 base URL 的 getPreviewUrl()。
 * 只解析确认安全的公共前缀，拒绝绝对路径、路径穿越和未批准的 URL。
 *
 * 注意：/files/** 当前绕过 /api/** JWT，是公开静态资源。
 * 本工具不等于附件授权；若产品要求图片/视频也按分区保护，
 * 需另开批次设计带 JWT 的文件流接口。
 */

// 初始公共路径只允许 /files/。
// DBA SQL A/B 回填后如确认存在其他合法静态前缀，再单独追加并补测试。
const PUBLIC_URL_PREFIXES = ["/files/"] as const;

export type PublicFileUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * 获取 API base URL（与 request.js#getBaseUrl 保持一致）。
 */
function getBaseUrl(): string {
  if (Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  return "";
}

/**
 * 标准化 URL（与 request.js#normalizeUrl 保持一致）。
 */
function normalizeUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
}

/**
 * 获取当前页面 origin（用于同源校验）。
 */
function getCurrentOrigin(): string {
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "";
}

/**
 * 获取 API origin（用于同源/同 host 校验）。
 */
function getApiOrigin(): string {
  const baseUrl = getBaseUrl();
  if (baseUrl && /^https?:\/\//.test(baseUrl)) {
    try {
      const u = new URL(baseUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      return "";
    }
  }
  // baseUrl 为空时走同源，与 request.js 一致
  return getCurrentOrigin();
}

/**
 * 解析附件路径为安全 URL。
 *
 * 解析顺序固定：
 * 1. 空值不可用；
 * 2. 拒绝控制字符、反斜杠、无法安全 decode 的值、编码斜杠以及解码后的 ./.. 路径段；
 * 3. Windows 绝对路径和已知 Unix 服务器目录不可用；
 * 4. /files/ 使用 normalizeUrl() 生成地址；
 * 5. 完整 HTTP(S) URL 只允许与当前页面 origin 或 API origin 完全相同；
 * 6. 其他斜杠路径、相对路径、纯数字和非 HTTP(S) scheme 均不可用；
 * 7. 返回 { ok: false, reason } 时页面显示"附件路径暂不可用"，不发错误网络请求。
 */
export function resolvePublicFileUrl(value: string | null | undefined): PublicFileUrlResult {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return { ok: false, reason: "空值" };
  }

  const raw = String(value);

  // 2. 拒绝控制字符、反斜杠
  if (/[\x00-\x1f\x7f]/.test(raw)) {
    return { ok: false, reason: "包含控制字符" };
  }
  if (raw.includes("\\")) {
    return { ok: false, reason: "包含反斜杠" };
  }

  // 拒绝编码斜杠（%2f %2F %5c %5C）
  const lower = raw.toLowerCase();
  if (lower.includes("%2f") || lower.includes("%5c")) {
    return { ok: false, reason: "包含编码斜杠" };
  }

  // 尝试 decode 后检查路径穿越
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return { ok: false, reason: "无法安全解码" };
  }

  // 拒绝解码后的 ./.. 路径段
  const segments = decoded.split(/[/\\]/);
  if (segments.some((s) => s === ".." || s === ".")) {
    return { ok: false, reason: "包含路径穿越段" };
  }

  // 3. Windows 绝对路径
  if (/^[A-Za-z]:[\\/]/.test(raw)) {
    return { ok: false, reason: "Windows 绝对路径" };
  }

  // 3. 已知 Unix 服务器绝对目录
  const unixAbsPrefixes = ["/opt/", "/var/", "/home/", "/root/", "/mnt/", "/srv/", "/tmp/", "/data/", "/etc/", "/usr/"];
  if (unixAbsPrefixes.some((prefix) => raw.startsWith(prefix))) {
    return { ok: false, reason: "Unix 绝对路径" };
  }

  // 5. 完整 HTTP(S) URL
  if (/^https?:\/\//.test(raw)) {
    try {
      const urlObj = new URL(raw);
      const apiOrigin = getApiOrigin();
      const currentOrigin = getCurrentOrigin();

      // 只允许与当前页面 origin 或 API origin 完全相同
      const allowedOrigins = [apiOrigin, currentOrigin].filter(Boolean);
      const urlOrigin = `${urlObj.protocol}//${urlObj.host}`;

      if (!allowedOrigins.includes(urlOrigin)) {
        return { ok: false, reason: "未批准的跨域 URL" };
      }

      // 同源或同 API origin 的完整 URL 直接返回
      return { ok: true, url: raw };
    } catch {
      return { ok: false, reason: "URL 解析失败" };
    }
  }

  // 非 HTTP(S) scheme
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("/")) {
    return { ok: false, reason: "非 HTTP(S) scheme" };
  }

  // 4. 命中公共 URL 白名单前缀
  for (const prefix of PUBLIC_URL_PREFIXES) {
    if (raw.startsWith(prefix)) {
      return { ok: true, url: normalizeUrl(raw) };
    }
  }

  // 6. 其他以 / 开头的路径（不在白名单）
  if (raw.startsWith("/")) {
    return { ok: false, reason: "未知路径前缀" };
  }

  // 6. 其他相对路径、纯数字
  return { ok: false, reason: "不支持的路径格式" };
}
