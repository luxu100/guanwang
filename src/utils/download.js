import { TOKEN_KEY, TOKEN_PREFIX_KEY } from "@/utils/request";

const DEFAULT_BASE_URL = "";

function getBaseUrl() {
  if (Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_API_BASE_URL")) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return DEFAULT_BASE_URL;
}

function getFileBaseUrl() {
  if (Object.prototype.hasOwnProperty.call(import.meta.env, "VITE_FILE_BASE_URL")) {
    return import.meta.env.VITE_FILE_BASE_URL.replace(/\/$/, "");
  }
  return "";
}

function getOriginForFileUrl() {
  const fileBase = getFileBaseUrl();
  if (fileBase) return fileBase;
  const baseUrl = getBaseUrl();
  if (!baseUrl) return "";
  const match = baseUrl.match(/^(https?:\/\/[^/]+)/);
  return match ? match[1] : baseUrl;
}

function normalizeUrl(url) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const isRelativeRoot = url.startsWith("./");
  const cleaned = url.replace(/^\.\//, "/");

  if (isRelativeRoot) {
    const fileOrigin = getOriginForFileUrl();
    return `${fileOrigin}${cleaned}`;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${baseUrl}${path}`;
}

function getAuthHeader() {
  const token = uni.getStorageSync(TOKEN_KEY);
  const tokenPrefix = uni.getStorageSync(TOKEN_PREFIX_KEY);

  if (!token) {
    return {};
  }

  const normalizedPrefix = typeof tokenPrefix === "string" ? tokenPrefix.trim() : "";

  return {
    Authorization: normalizedPrefix ? `${normalizedPrefix} ${token}` : token,
  };
}

function parseFilenameFromDisposition(header) {
  if (!header) return "";
  const filenameStar = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStar) {
    return decodeURIComponent(filenameStar[1]);
  }
  const filename = header.match(/filename="?([^";\n]+)"?/i);
  return filename ? filename[1] : "";
}

export function downloadBinaryFile(url, options = {}) {
  const { filename = "download", mimeType = "application/octet-stream", header: extraHeader = {} } = options;
  const headers = { ...getAuthHeader(), ...extraHeader };
  const fullUrl = normalizeUrl(url);

  if (process.env.UNI_PLATFORM === "h5") {
    return new Promise((resolve) => {
      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        resolve({ statusCode: 200 });
      }, 150);
    });
  }

  return uni.downloadFile({ url: fullUrl, header: headers });
}
