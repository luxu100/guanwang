import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";
import { MAP_CONFIG } from "@/services/map/map";

let configured = false;
let mapsLibraryPromise: Promise<google.maps.MapsLibrary> | null = null;

const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 12_000;

export type GoogleMapsLoadErrorCode =
  | "missing-key"
  | "network"
  | "load-failed";

export class GoogleMapsLoadError extends Error {
  constructor(
    public readonly code: GoogleMapsLoadErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GoogleMapsLoadError";
  }
}

export async function loadGoogleMaps(): Promise<google.maps.MapsLibrary> {
  if (!MAP_CONFIG.googleKey) {
    throw new GoogleMapsLoadError(
      "missing-key",
      "VITE_GOOGLE_MAP_KEY is empty",
    );
  }

  if (!configured) {
    setOptions({
      key: MAP_CONFIG.googleKey,
      v: "weekly",
      language: "en",
      region: "CN",
    });

    configured = true;
  }

  if (!mapsLibraryPromise) {
    mapsLibraryPromise = withTimeout(
      importLibrary("maps"),
      GOOGLE_MAPS_LOAD_TIMEOUT_MS,
    ).catch((error: unknown) => {
      throw normalizeGoogleMapsError(error);
    });
  }

  return mapsLibraryPromise;
}

export function getGoogleMapsErrorMessage(error: unknown) {
  if (error instanceof GoogleMapsLoadError) {
    if (error.code === "missing-key") {
      return "Google 地图 Key 未配置，请设置 VITE_GOOGLE_MAP_KEY";
    }

    if (error.code === "network") {
      return "无法连接 Google 地图服务，请检查代理、防火墙或当前网络";
    }
  }

  return "Google 地图加载失败，请检查 Key、账单、API 启用状态和域名限制";
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new GoogleMapsLoadError(
          "network",
          `Google Maps request timed out after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function normalizeGoogleMapsError(error: unknown) {
  if (error instanceof GoogleMapsLoadError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/could not load|network|failed to fetch|load failed/i.test(message)) {
    return new GoogleMapsLoadError(
      "network",
      message,
      error instanceof Error ? { cause: error } : undefined,
    );
  }

  return new GoogleMapsLoadError(
    "load-failed",
    message,
    error instanceof Error ? { cause: error } : undefined,
  );
}
