<template>
  <view class="locale-coordinate-map">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="locale-coordinate-map__canvas"></div>
    <view v-if="mapError" class="locale-coordinate-map__error">
      {{ mapError }}
    </view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="locale-coordinate-map__error">
      {{t('map.onlyH5')}}
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "@/i18n";
import { getMapProvider, MAP_CONFIG } from "@/services/map/map";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

/* ================= types ================= */

interface TencentLatLngValue {
  getLat?: () => number;
  getLng?: () => number;
}

interface TencentMapInstance {
  destroy?: () => void;
  on?: (
      event: string,
      handler: (event: { latLng: TencentLatLngValue }) => void,
  ) => void;
}

interface TencentMapApi {
  LatLng: new (lat: number, lng: number) => TencentLatLngValue;

  Map: new (
      container: HTMLElement,
      options: {
        center: TencentLatLngValue;
        zoom: number;
        pitch: number;
        rotation: number;
      },
  ) => TencentMapInstance;

  MultiMarker: new (options: {
    map: TencentMapInstance;
    geometries: Array<{
      id: string;
      position: TencentLatLngValue;
    }>;
  }) => any;
}

type TencentWindow = Window & {
  TMap?: TencentMapApi;
};

/* ================= props ================= */

const props = withDefaults(
    defineProps<{
      lng: number;
      lat: number;
      selectable?: boolean;
    }>(),
    {
      selectable: false,
    },
);

const emit = defineEmits<{
  (
      event: "pick",
      coordinate: { lng: number; lat: number },
  ): void;
}>();

const { locale } = useI18n();

const provider = computed(() => getMapProvider(locale.value));

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");

let mounted = false;

/* ================= map instances ================= */

let tencentMap: TencentMapInstance | null = null;
let tencentMarker: any = null;

let googleMap: google.maps.Map | null = null;
let googlePoint: google.maps.Circle | null = null;

let tencentLoadingPromise: Promise<TencentMapApi> | null = null;

/* ================= lifecycle ================= */

onMounted(() => {
  mounted = true;
  void renderMap();
});

onBeforeUnmount(() => {
  mounted = false;
  destroyMap();
});

watch(
    [provider, () => props.lng, () => props.lat],
    () => {
      if (mounted) void renderMap();
    },
);

/* ================= core ================= */

async function renderMap() {
  destroyMap();
  await nextTick();

  if (!mapContainer.value) return;

  const currentProvider = provider.value;

  try {
    if (currentProvider === "tencent") {
      const api = await loadTencentMaps();
      if (provider.value !== currentProvider) return;

      initTencentMap(api);
    } else {
      const mapsLibrary = await loadGoogleMaps();
      if (provider.value !== currentProvider) return;

      initGoogleMap(mapsLibrary);
    }

    mapError.value = "";
  } catch (e) {
    console.error(e);
    mapError.value = t('map.loadFailed');
  }
}

/* ================= shared update ================= */

function updatePoint(lng: number, lat: number) {
  // Google Maps
  if (googlePoint) {
    googlePoint.setCenter({ lat, lng }); // ✔ 修复点
  }

  // Tencent Maps
  if (tencentMarker && (window as TencentWindow).TMap) {
    const api = (window as TencentWindow).TMap!;
    tencentMarker.setGeometries?.([
      {
        id: "coordinate-point",
        position: new api.LatLng(lat, lng),
      },
    ]);
  }
}

/* ================= tencent ================= */

function loadTencentMaps(): Promise<TencentMapApi> {
  const runtimeWindow = window as TencentWindow;

  if (runtimeWindow.TMap) return Promise.resolve(runtimeWindow.TMap);

  if (tencentLoadingPromise) return tencentLoadingPromise;

  if (!MAP_CONFIG.tencentKey) {
    return Promise.reject(new Error(t("mapKeyEmpty")));
  }

  tencentLoadingPromise = new Promise((resolve, reject) => {
    const scriptId = "shared-tencent-map-sdk";

    const done = () => {
      if (runtimeWindow.TMap) resolve(runtimeWindow.TMap);
      else reject(new Error(t("apiUnavailable")));
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error(t("scriptLoadFailed"))), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${MAP_CONFIG.tencentKey}`;
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error(t("scriptLoadFailed"))), {
      once: true,
    });

    document.head.appendChild(script);
  });

  return tencentLoadingPromise;
}

function initTencentMap(api: TencentMapApi) {
  if (!mapContainer.value) return;

  const center = new api.LatLng(props.lat, props.lng);

  tencentMap = new api.Map(mapContainer.value, {
    center,
    zoom: 15,
    pitch: 0,
    rotation: 0,
  });

  tencentMarker = new api.MultiMarker({
    map: tencentMap,
    geometries: [
      {
        id: "coordinate-point",
        position: center,
      },
    ],
  });

  if (props.selectable) {
    tencentMap.on?.("click", (event) => {
      const lng = event.latLng.getLng?.();
      const lat = event.latLng.getLat?.();
      if (lng == null || lat == null) return;

      updatePoint(lng, lat);
      emit("pick", { lng, lat });
    });
  }
}

/* ================= google ================= */

function initGoogleMap(mapsLibrary: google.maps.MapsLibrary) {
  if (!mapContainer.value) return;

  const { Map, Circle } = mapsLibrary;

  const center = { lat: props.lat, lng: props.lng };

  googleMap = new Map(mapContainer.value, {
    center,
    zoom: 15,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  });

  googlePoint = new Circle({
    map: googleMap,
    center,
    radius: 8,
    fillColor: "#ef4444",
    fillOpacity: 0.9,
    strokeColor: "#ffffff",
    strokeOpacity: 1,
    strokeWeight: 2,
  });

  if (props.selectable) {
    googleMap.addListener("click", (event: google.maps.MapMouseEvent) => {
      const latLng = event.latLng;
      if (!latLng) return;

      const lng = latLng.lng();
      const lat = latLng.lat();

      updatePoint(lng, lat);
      emit("pick", { lng, lat });
    });
  }
}

/* ================= destroy ================= */

function destroyMap() {
  tencentMap?.destroy?.();
  tencentMap = null;
  tencentMarker = null;

  if (googleMap) {
    google.maps.event.clearInstanceListeners(googleMap);
  }

  googlePoint?.setMap(null);
  googlePoint = null;
  googleMap = null;

  if (mapContainer.value) {
    mapContainer.value.innerHTML = "";
  }
}
</script>

<style scoped lang="scss">
.locale-coordinate-map,
.locale-coordinate-map__canvas {
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.locale-coordinate-map {
  position: relative;
  overflow: hidden;
}

.locale-coordinate-map__error {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 8px 12px;
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
}
</style>