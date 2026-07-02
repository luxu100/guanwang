import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";
import { MAP_CONFIG } from "@/services/map/map";

let configured = false;

export async function loadGoogleMaps(): Promise<google.maps.MapsLibrary> {
  if (!MAP_CONFIG.googleKey) {
    throw new Error("VITE_GOOGLE_MAP_KEY is empty");
  }

  // Google的setOptions 只能有效调用一次，放在统一加载器中。
  if (!configured) {
    setOptions({
      key: MAP_CONFIG.googleKey,
      v: "weekly",
      language: "en",
      region: "CN",
    });

    configured = true;
  }

  return importLibrary("maps");
}