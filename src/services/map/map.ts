import type { LocaleCode } from "@/i18n/types";


const tencentMapKey = "JCDBZ-Z2HLI-V26GX-UL7VO-LJFO2-TIFMZ";
const googleMapKey  = "AIzaSyCFBSsQ8un1ugyT1yjGMwOBZijc6b3821g";

export type MapProvider = "tencent" | "google";



export const MAP_CONFIG = {
  tencentKey: import.meta.env.VITE_TENCENT_MAP_KEY?.trim() || "",
  googleKey: import.meta.env.VITE_GOOGLE_MAP_KEY?.trim() || "",
};

export function getMapProvider(locale: LocaleCode): MapProvider {
  return locale === "zh-CN" ? "tencent" : "google";
}
