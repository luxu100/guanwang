import { computed, ref } from "vue";
import enUS from "./locales/en-US";
import zhCN from "./locales/zh-CN";
import deviceZhCN from "@/pages/device/locales/zh-CN.json";
import deviceEnUS from "@/pages/device/locales/en-US.json";
import appShellZhCN from "@/components/locales/zh-CN.json";
import appShellEnUS from "@/components/locales/en-US.json";
import type { I18nParams, LocaleCode, LocaleOption } from "./types";

export const LOCALE_STORAGE_KEY = "locale";

export const DEFAULT_LOCALE: LocaleCode = "zh-CN";

export const localeOptions: LocaleOption[] = [
  { label: "简体中文", value: "zh-CN" },
  { label: "English", value: "en-US" },
];

Object.assign(zhCN, deviceZhCN);
Object.assign(enUS, deviceEnUS);
Object.assign(zhCN, appShellZhCN);
Object.assign(enUS, appShellEnUS);

const messages = {
  "zh-CN": zhCN,
  "en-US": enUS,
} as const;

const currentLocale = ref<LocaleCode>(getInitialLocale());

export function isLocaleCode(value: unknown): value is LocaleCode {
  return value === "zh-CN" || value === "en-US";
}

export function normalizeLocale(value: unknown, fallback: LocaleCode = DEFAULT_LOCALE): LocaleCode {
  return isLocaleCode(value) ? value : fallback;
}

export function getStoredLocale(): LocaleCode | null {
  const locale = uni.getStorageSync(LOCALE_STORAGE_KEY);
  return isLocaleCode(locale) ? locale : null;
}

export function getUserLocale(userInfo = uni.getStorageSync("userInfo")): LocaleCode | null {
  const userLocale = userInfo?.locale || userInfo?.defaultLanguage || userInfo?.language;
  if (isLocaleCode(userLocale)) {
    return userLocale;
  }

  return getLocaleByRegion(userInfo?.region);
}

export function getLocaleByRegion(region: unknown): LocaleCode | null {
  if (typeof region !== "string") {
    return null;
  }

  const normalizedRegion = region.trim().toLowerCase();
  if (normalizedRegion === "国内" || normalizedRegion === "china" || normalizedRegion === "cn") {
    return "zh-CN";
  }

  if (normalizedRegion === "国外" || normalizedRegion === "overseas" || normalizedRegion === "foreign" || normalizedRegion === "en") {
    return "en-US";
  }

  return null;
}

export function getInitialLocale(): LocaleCode {
  return getUserLocale() || getStoredLocale() || DEFAULT_LOCALE;
}

export function getLocale() {
  return currentLocale.value;
}

export function setLocale(locale: LocaleCode) {
  currentLocale.value = locale;
  uni.setStorageSync(LOCALE_STORAGE_KEY, locale);
}

export function applyUserLocale(userInfo = uni.getStorageSync("userInfo")) {
  const userLocale = getUserLocale(userInfo);
  if (userLocale) {
    setLocale(userLocale);
  }
  return userLocale;
}

function getByPath(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function formatMessage(message: string, params?: I18nParams) {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (full, key) => {
    const value = params[key];
    return value === null || value === undefined ? full : String(value);
  });
}

export function t(key: string, paramsOrFallback?: I18nParams | string, fallback?: string): string {
  const params = typeof paramsOrFallback === "string" ? undefined : paramsOrFallback;
  const fallbackText = typeof paramsOrFallback === "string" ? paramsOrFallback : fallback;

  const localeValue = getByPath(messages[currentLocale.value], key);
  const defaultValue = getByPath(messages[DEFAULT_LOCALE], key);
  const message = localeValue ?? defaultValue ?? fallbackText ?? key;

  return formatMessage(String(message), params);
}

export function useI18n() {
  const localeLabel = computed(() => {
    return localeOptions.find((item) => item.value === currentLocale.value)?.label || "";
  });

  return {
    locale: currentLocale,
    localeLabel,
    localeOptions,
    t,
    setLocale,
    getLocale,
    applyUserLocale,
  };
}

export function createScopedT(prefix: string) {
  return (
      key: string,
      paramsOrFallback?: I18nParams | string,
      fallback?: string,
  ) => {
    return t(`${prefix}.${key}`, paramsOrFallback, fallback);
  };
}

export function createScopedTm(prefix: string) {
  return <T = unknown>(key: string, fallback?: T): T => {
    return tm<T>(`${prefix}.${key}`, fallback);
  };
}

export function tm<T = unknown>(key: string, fallback?: T): T {
  const localeValue = getByPath(messages[currentLocale.value], key);
  const defaultValue = getByPath(messages[DEFAULT_LOCALE], key);

  return (localeValue ?? defaultValue ?? fallback) as T;
}

export default {
  applyUserLocale,
  getInitialLocale,
  getLocale,
  getLocaleByRegion,
  getStoredLocale,
  getUserLocale,
  isLocaleCode,
  localeOptions,
  normalizeLocale,
  setLocale,
  t,
  useI18n,
  createScopedT,
  createScopedTm,
  tm,
};
