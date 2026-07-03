import type { LocaleCode } from "@/i18n/types";

export type MapProvider = "tencent" | "google";

export const MAP_CONFIG = {
  tencentKey: import.meta.env.VITE_TENCENT_MAP_KEY?.trim() || "",
  googleKey: import.meta.env.VITE_GOOGLE_MAP_KEY?.trim() || "",
};

export function getMapProvider(locale: LocaleCode): MapProvider {
  return locale === "zh-CN" ? "tencent" : "google";
}