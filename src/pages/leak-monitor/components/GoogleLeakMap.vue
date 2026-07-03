<template>
  <view class="google-map">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="google-map__canvas"></div>
    <view v-if="mapError" class="google-map__error">{{ mapError }}</view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="google-map__error">当前地图 SDK 仅支持 H5 端展示</view>
    <!-- #endif -->
  </view>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { loadGoogleMaps} from "@/utils/googleMapsLoader";
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';


const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");

const props = withDefaults(defineProps<{
    lat?:number;
    lng?:number;
}>(), {
    lat: 31.2304,
    lng: 121.4737
});
 


let mapInstance: google.maps.Map | null = null;

onMounted(()=> {
  nextTick(()=>{
    initMap();

  });
});


onBeforeUnmount(() => {
  if (mapInstance) {
    // 清理地图实例
    google.maps.event.clearInstanceListeners(mapInstance);
  }
  mapInstance = null;

  if (mapContainer.value) {
    mapContainer.value.innerHTML = "";
  }
});


async function initMap(){

    if (!mapContainer.value) {
      mapError.value = "Google 地图容器初始化失败";
      return;
    }
    try{
        const {Map} = await loadGoogleMaps();
        mapError.value = "";
        mapInstance  = new Map(mapContainer.value, {
            center: {
        lat: props.lat,
        lng: props.lng,
      },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
        });
    }catch(error){
        mapError.value = "Google 地图加载失败，请检查 Key、域名限制和网络";
    }

}


</script>
<style scoped lang="scss">
.google-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
  background: #edf5ff;
}

.google-map__canvas {
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
}

.google-map__error {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  max-width: 420px;
  padding: 10px 14px;
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
}
</style>