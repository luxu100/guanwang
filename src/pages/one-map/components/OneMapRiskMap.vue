<template>
  <section class="risk-map-block" :class="{ 'risk-map-block--expanded': expanded, 'risk-map-block--google': provider === 'google' }" :aria-busy="loading">
    <div class="risk-map-block__head">
      <div><text class="risk-map-block__hint" :title="rejectedCount ? tx(`${rejectedCount} 条管线坐标或元数据不完整，未显示`, `${rejectedCount} pipes have incomplete coordinates or metadata`) : ''">{{ visibleTubes.length }} {{ tx('条管线', 'pipes') }}</text></div>
      <div class="risk-map-block__actions">
        <select v-model="region" :aria-label="tx('管网分区', 'Network region')"><option value="all">{{ tx('全部管网', 'All regions') }}</option><option v-for="item in regions" :key="item.key" :value="item.key">{{ item.label }}</option></select>
        <button class="risk-map-block__locate" type="button" :title="tx('定位管线', 'Locate pipes')" :aria-label="tx('定位管线', 'Locate pipes')" @click="fitNetwork"><image src="/static/icons/crosshair.svg" /><text>{{ tx('定位管线', 'Locate pipes') }}</text></button>
        <button type="button" :title="expanded ? tx('收起地图', 'Collapse map') : tx('放大地图', 'Expand map')" :aria-label="expanded ? tx('收起地图', 'Collapse map') : tx('放大地图', 'Expand map')" @click="expanded = !expanded"><image src="/static/icons/chevron-up.svg" :class="{ 'expand-icon': !expanded }" /></button>
      </div>
    </div>
    <div class="risk-map-block__canvas">
      <TencentLeakMap v-if="provider === 'tencent'" ref="mapRef" compact :points="locatedPoints" :selected-device-number="selectedDevice" @device-click="selectDevice" @ready="ready" />
      <GoogleLeakMap v-else ref="mapRef" compact :points="locatedPoints" :selected-device-number="selectedDevice" @device-click="selectDevice" @ready="ready" />
      <MapAlarmLayer :provider="provider" :map-instance="mapInstance" :points="locatedPoints" :alarms="alarms || []" @select="focusAlarm" />
      <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
      <div v-if="error" class="risk-map-block__message" role="alert">{{ error }}</div>
      <div v-if="notice" class="risk-map-block__notice" role="status">{{ notice }}</div>
      <div v-if="selectedDevice" class="risk-map-block__selection" :title="`${selectedDevice} · ${tx('报警设备', 'Alarm device')}`">{{ selectedDevice }} · {{ tx('报警设备', 'Alarm device') }}</div>
      <div v-if="selectedTube" class="risk-inspection">
        <button class="risk-inspection__close" type="button" :aria-label="tx('关闭详情', 'Close details')" @click="selectedTube = null">×</button>
        <strong>{{ selectedTube.tubeName || selectedTube.id }}</strong>
        <dl><dt>{{ tx('风险等级', 'Risk level') }}</dt><dd>{{ bandLabel(selectedTube) }}</dd>
          <dt>{{ tx('风险评分', 'Risk score') }}</dt><dd>{{ selectedTube.riskScore ?? '--' }}</dd>
          <dt>{{ tx('材质', 'Material') }}</dt><dd>{{ selectedTube.material || '--' }}</dd>
          <dt>{{ tx('管径', 'Diameter') }}</dt><dd>{{ selectedTube.diameterMm == null ? '--' : `${selectedTube.diameterMm} mm` }}</dd>
          <dt>{{ tx('建造年份', 'Construction year') }}</dt><dd>{{ selectedTube.constructionYear || '--' }}</dd>
          <dt>{{ tx('评估时间', 'Assessed at') }}</dt><dd>{{ selectedTube.riskEvaluatedAt?.replace('T', ' ') || '--' }}</dd></dl>
      </div>
    </div>
    <div class="risk-map-block__legend">
      <span v-for="band in bands" :key="band.key"><i :style="{ background: band.color }" />{{ band.label }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from '@/i18n';
import { getMapProvider } from '@/services/map/map';
import type { TubeNetworkRecord } from '@/services/leak-monitor/tube-network';
import TencentLeakMap from '@/pages/leak-monitor/components/TencentLeakMap.vue';
import GoogleLeakMap from '@/pages/leak-monitor/components/GoogleLeakMap.vue';
import { riskBand, riskColor, RISK_COLORS } from '../risk';
import { tencentDisplayCoordinate } from '@/pages/leak-monitor/coordinateTransform';
import DashboardLoading from './DashboardLoading.vue';
import MapAlarmLayer from '@/pages/leak-monitor/components/MapAlarmLayer.vue';
import type { MapDevicePoint } from '@/pages/leak-monitor/types';
import type { ActiveMapAlarm } from '@/pages/leak-monitor/activeMapAlarms';

interface TencentLayer { setMap(map: unknown): void; setGeometries(geometries: unknown[]): void; on(event: string, handler: (event: any) => void): void; }
const props = defineProps<{ tubes: TubeNetworkRecord[]; points?: MapDevicePoint[]; alarms?: ActiveMapAlarm[]; loading: boolean; error: string; rejectedCount: number }>();
const { locale } = useI18n();
const provider = computed(() => getMapProvider(locale.value));
const mapRef = ref<any>(null);
const mapInstance = shallowRef<any>(null);
const expanded = ref(false);
const region = ref('all');
const notice = ref('');
const selectedTube = ref<TubeNetworkRecord | null>(null);
const selectedDevice = ref('');
const locatedPoints = computed(() => {
  const points = new Map((props.points || []).map((point) => [point.deviceNumber, point]));
  for (const alarm of props.alarms || []) {
    const point = points.get(alarm.deviceNumber);
    // Alarm coordinates are WGS84; only replace a device position when its metadata is known.
    if (alarm.longitude == null || alarm.latitude == null || !(alarm.countryCode || point?.countryCode)) continue;
    points.set(alarm.deviceNumber, {
      id: point?.id || alarm.deviceNumber, deviceNumber: alarm.deviceNumber, title: point?.title || alarm.deviceNumber,
      status: point?.status || 'unknown', manualStatus: point?.manualStatus || 'unknown', algorithmStatus: point?.algorithmStatus || 'unknown',
      leakProperty: point?.leakProperty ?? null, regionId: point?.regionId ?? null, onlineStatus: point?.onlineStatus,
      coordinateSystem: 'WGS84', countryCode: alarm.countryCode || point?.countryCode,
      lat: alarm.latitude, lng: alarm.longitude,
    });
  }
  return [...points.values()];
});
const googleLines = new Map<string, google.maps.Polyline>();
let tencentLayer: TencentLayer | null = null;
let frame: number | null = null;
const visibleTubes = computed(() => region.value === 'all' ? props.tubes : props.tubes.filter((tube) => String(tube.deptId ?? 'none') === region.value));
const regions = computed(() => [...new Set(props.tubes.map((tube) => String(tube.deptId ?? 'none')))].map((key) => ({ key, label: key === 'none' ? tx('未分区', 'Unassigned') : tx(`分区 ${key}`, `Region ${key}`) })));
const bands = computed(() => [{ key: 'HIGH', color: RISK_COLORS.HIGH, label: tx('高风险', 'High') }, { key: 'MEDIUM', color: RISK_COLORS.MEDIUM, label: tx('中风险', 'Medium') }, { key: 'LOW', color: RISK_COLORS.LOW, label: tx('低风险', 'Low') }, { key: 'UNASSESSED', color: RISK_COLORS.UNASSESSED, label: tx('未评估', 'Unassessed') }]);
function tx(zh: string, en: string) { return locale.value === 'en-US' ? en : zh; }
function bandLabel(tube: TubeNetworkRecord) { return bands.value.find((band) => band.key === riskBand(tube))?.label; }
function clear() {
  googleLines.forEach((line) => { google.maps.event.clearInstanceListeners(line); line.setMap(null); }); googleLines.clear();
  tencentLayer?.setMap(null); tencentLayer = null;
}
function ready() { mapInstance.value = mapRef.value?.getMapInstance(); schedule(); }
function resize() { mapRef.value?.resize(); }
function selectDevice(point: MapDevicePoint) { selectedDevice.value = point.deviceNumber; }
function focusAlarm(deviceNumber: string) {
  if (!locatedPoints.value.some((point) => point.deviceNumber === deviceNumber)) {
    notice.value = tx(`设备 ${deviceNumber} 缺少有效坐标，无法定位`, `Device ${deviceNumber} has no valid coordinates`); return;
  }
  if (!mapInstance.value) { notice.value = tx('地图正在加载，请稍后再试', 'Map is loading; try again shortly'); return; }
  notice.value = ''; selectedTube.value = null; selectedDevice.value = deviceNumber;
  mapRef.value?.focusDevice(deviceNumber);
}
defineExpose({ focusAlarm, resize });
function schedule() { if (frame === null) frame = requestAnimationFrame(() => { frame = null; sync(); }); }
function sync() {
  if (!mapInstance.value) return;
  if (provider.value === 'google') {
    const keys = new Set<string>();
    visibleTubes.value.forEach((tube) => (tube.lineCoords || []).forEach((part, index) => {
      const key = `${tube.id}-${index}`; keys.add(key);
      let line = googleLines.get(key);
      if (!line) {
        line = new google.maps.Polyline({ map: mapInstance.value });
        line.addListener('click', () => { selectedTube.value = props.tubes.find((item) => item.id === tube.id) || null; });
        googleLines.set(key, line);
      }
      line.setOptions({ path: part.map(([lng, lat]) => ({ lng, lat })), strokeColor: riskColor(tube), strokeWeight: 6, strokeOpacity: tube.status === 0 ? .45 : .95 });
    }));
    googleLines.forEach((line, key) => { if (!keys.has(key)) { google.maps.event.clearInstanceListeners(line); line.setMap(null); googleLines.delete(key); } });
  } else {
    const TMap = (window as any).TMap;
    if (!TMap?.MultiPolyline) return;
    const styles = Object.fromEntries(Object.entries(RISK_COLORS).map(([key, color]) => [key, new TMap.PolylineStyle({ color, width: 6 })]));
    if (!tencentLayer) {
      tencentLayer = new TMap.MultiPolyline({ map: mapInstance.value, styles, geometries: [] });
      tencentLayer!.on('click', (event) => { const id = event.geometry?.properties?.tubeId; selectedTube.value = props.tubes.find((tube) => tube.id === id) || null; });
    }
    tencentLayer!.setGeometries(visibleTubes.value.flatMap((tube) => (tube.lineCoords || []).map((part, index) => ({ id: `${tube.id}-${index}`, styleId: riskBand(tube), properties: { tubeId: tube.id }, paths: part.map(([lng, lat]) => { const point = tencentDisplayCoordinate({ lng, lat }, tube.countryCode); return new TMap.LatLng(point.lat, point.lng); }) }))));
  }
}
function fitNetwork() {
  const points = visibleTubes.value.flatMap((tube) => (tube.lineCoords || []).flatMap((part) => part.map(([lng, lat]) => provider.value === 'tencent' ? tencentDisplayCoordinate({ lng, lat }, tube.countryCode) : { lng, lat })));
  if (!points.length || !mapInstance.value) { notice.value = tx('当前分区没有可定位的管线', 'No locatable pipes in this region'); return; }
  notice.value = '';
  if (provider.value === 'google') {
    const bounds = new google.maps.LatLngBounds(); points.forEach((point) => bounds.extend(point)); mapInstance.value.fitBounds(bounds, 60);
  } else {
    const TMap = (window as any).TMap; const bounds = new TMap.LatLngBounds(); points.forEach((point) => bounds.extend(new TMap.LatLng(point.lat, point.lng))); mapInstance.value.fitBounds(bounds, { padding: 60 });
  }
}
function escape(event: KeyboardEvent) { if (event.key === 'Escape') expanded.value = false; }
watch([visibleTubes, () => props.tubes], () => { selectedTube.value = null; schedule(); });
watch(provider, () => { clear(); mapInstance.value = null; selectedTube.value = null; });
watch(expanded, () => void nextTick(() => mapRef.value?.resize()));
watch(regions, (items) => { if (region.value !== 'all' && !items.some((item) => item.key === region.value)) region.value = 'all'; });
onMounted(() => document.addEventListener('keydown', escape));
onBeforeUnmount(() => { document.removeEventListener('keydown', escape); if (frame !== null) cancelAnimationFrame(frame); clear(); });
</script>

<style scoped>
.risk-map-block { display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: #fff; border: 1px solid #d8e6f1; border-radius: 6px; margin-bottom: 14px; }
.risk-map-block--expanded { position: fixed; inset: 24px; z-index: 1200; margin: 0; box-shadow: 0 0 0 100vmax rgba(12,25,40,.5); }
.risk-map-block__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px 10px; border-bottom: 1px solid #edf3f7; }
.risk-map-block__title { display: block; color: #21425e; font-size: 15px; font-weight: 700; }.risk-map-block__hint { display: block; margin-top: 4px; color: #64788c; font-size: 12px; }
.risk-map-block__actions { display: flex; gap: 6px; }.risk-map-block__actions select { height: 32px; min-width: 120px; color: #335b75; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; }.risk-map-block__actions button { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #f3f8fc; border: 1px solid #d7e6f0; border-radius: 4px; cursor: pointer; }.risk-map-block__actions image { width: 18px; height: 18px; }.expand-icon { transform: rotate(180deg); }
.risk-map-block__canvas { position: relative; height: 340px; min-height: 0; background: #eaf3f8; }.risk-map-block--expanded .risk-map-block__canvas { flex: 1; height: auto; }
.risk-map-block__selection { position: absolute; bottom: 30px; right: 12px; max-width: calc(100% - 24px); box-sizing: border-box; padding: 7px 10px; background: #fff; border: 1px solid #d8e6f1; border-radius: 4px; color: #335b75; font-size: 12px; overflow-wrap: anywhere; pointer-events: none; }
.risk-map-block__actions .risk-map-block__locate { display: flex; align-items: center; justify-content: center; gap: 5px; width: auto; padding: 0 9px; color: #1769aa; font-size: 12px; white-space: nowrap; }
.risk-map-block__message, .risk-map-block__notice { position: absolute; top: 60px; left: 16px; right: 16px; z-index: 4; padding: 10px 12px; color: #b42318; font-size: 12px; background: #fff5f3; border: 1px solid #ffc9c0; border-radius: 4px; }.risk-map-block__notice { top: auto; bottom: 24px; color: #335b75; background: #fff; border-color: #cbd8e5; }
.risk-map-block__legend { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; padding: 10px 16px 12px; color: #52677d; font-size: 12px; }.risk-map-block__legend span { display: inline-flex; align-items: center; gap: 5px; }.risk-map-block__legend em { margin-left: auto; color: #8191a2; font-style: normal; }.risk-map-block__legend i { width: 18px; height: 4px; border-radius: 2px; }.alarm-legend { display: grid; place-items: center; width: 16px; height: 16px; background: #dc2626; color: #fff; border-radius: 50%; font: 700 12px Arial; }
.risk-map-block__rejected { padding: 0 16px 12px; font-size: 12px; color: #a35b13; }
.risk-inspection { position: absolute; right: 16px; bottom: 24px; z-index: 5; width: 260px; padding: 14px; background: #fff; border: 1px solid #cbd8e5; border-radius: 6px; box-shadow: 0 5px 16px #18344d22; }.risk-inspection strong { display: block; padding-right: 22px; overflow-wrap: anywhere; font-size: 14px; }.risk-inspection dl { display: grid; grid-template-columns: 82px minmax(0,1fr); gap: 8px; margin: 12px 0 0; font-size: 12px; }.risk-inspection dt { color: #64788c; }.risk-inspection dd { margin: 0; overflow-wrap: anywhere; }.risk-inspection__close { position: absolute; right: 8px; top: 6px; background: none; border: 0; font-size: 20px; cursor: pointer; }
@media (min-width: 1051px) {
  .risk-map-block:not(.risk-map-block--expanded) { position: relative; height: 400px; }
  .risk-map-block--expanded { height: auto; }
  .risk-map-block__canvas { flex: 1; width: 100%; height: 100%; }
  .risk-map-block__head { position: absolute; top: 12px; left: 50%; right: auto; transform: translateX(-50%); width: max-content; max-width: calc(100% - 152px); z-index: 6; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding: 0; border: 0; pointer-events: none; }
  .risk-map-block__hint { margin: 0; padding: 8px 10px; color: #335b75; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; box-shadow: 0 2px 8px #18344d14; pointer-events: auto; }
  .risk-map-block__actions { flex-wrap: wrap; justify-content: center; max-width: 100%; gap: 6px; pointer-events: auto; }
  .risk-map-block__actions select { min-width: 0; width: 106px; max-width: 100%; }
  .risk-map-block__actions button { background: #fff; box-shadow: 0 2px 8px #18344d14; }
  .risk-map-block__legend { position: absolute; left: 50%; right: auto; transform: translateX(-50%); bottom: 24px; z-index: 4; width: max-content; max-width: calc(100% - 152px); box-sizing: border-box; justify-content: center; gap: 6px 12px; padding: 7px 9px; background: #fff; border: 1px solid #d8e6f1; border-radius: 4px; pointer-events: none; }
  .risk-map-block__selection { right: 76px; bottom: 24px; max-width: max(48px, calc(50% - 238px)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .risk-map-block__notice { left: 12px; right: 76px; bottom: 156px; }
  .risk-map-block__message { top: 132px; left: 12px; right: 76px; }
  .risk-inspection { right: 76px; bottom: 116px; max-width: calc(100% - 120px); }
}
</style>
