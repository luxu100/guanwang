export const BRAND_LOGO_UPDATED_EVENT = "brand-logo-updated";

type UserBrandingRecord = Record<string, unknown>;

function getEnv() {
  return (import.meta as unknown as {
    env?: {
      VITE_API_BASE_URL?: string;
      VITE_DEV_PROXY_TARGET?: string;
    };
  }).env || {};
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getUserLogoId(userInfo: unknown): string {
  if (!userInfo || typeof userInfo !== "object" || Array.isArray(userInfo)) {
    return "";
  }

  const record = userInfo as UserBrandingRecord;
  const value = record.logoId;
  if ((typeof value === "string" || typeof value === "number") && String(value).trim()) {
    return String(value).trim();
  }

  return "";
}

export function getCurrentUserLogoId(): string {
  return getUserLogoId(uni.getStorageSync("userInfo"));
}

export function getLogoFileServer(): string {
  const env = getEnv();
  return trimTrailingSlash(
    env.VITE_DEV_PROXY_TARGET
      || env.VITE_API_BASE_URL
      || "",
  );
}

export function resolveLogoUrl(filePath: string): string {
  const normalizedPath = String(filePath || "").trim();
  if (!normalizedPath) {
    return "";
  }

  if (/^(?:https?:|data:|blob:)/i.test(normalizedPath)) {
    return normalizedPath;
  }

  const baseUrl = getLogoFileServer();
  if (!baseUrl) {
    return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  }

  const path = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${baseUrl}${path}`;
}

export function updateCurrentUserLogoId(logoId: unknown): string {
  const normalizedId = (typeof logoId === "string" || typeof logoId === "number")
    ? String(logoId).trim()
    : "";
  const userInfo = uni.getStorageSync("userInfo");
  const nextUserInfo: UserBrandingRecord = userInfo && typeof userInfo === "object" && !Array.isArray(userInfo)
    ? { ...userInfo as UserBrandingRecord }
    : {};

  if (normalizedId) {
    const numericId = Number(normalizedId);
    nextUserInfo.logoId = Number.isFinite(numericId) ? numericId : normalizedId;
  } else {
    nextUserInfo.logoId = null;
  }
  uni.setStorageSync("userInfo", nextUserInfo);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BRAND_LOGO_UPDATED_EVENT, {
      detail: { logoId: normalizedId },
    }));
  }

  return normalizedId;
}
