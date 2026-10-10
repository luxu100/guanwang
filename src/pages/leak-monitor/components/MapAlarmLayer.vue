<template><div class="map-alarm-layer" aria-hidden="true"></div></template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import type { MapProvider } from '@/services/map/map';
import type { MapDevicePoint } from '../types';
import type { ActiveMapAlarm } from '../composables/useActiveMapAlarms';
import { convertMapCoordinate, tencentDisplayCoordinate } from '../coordinateTransform';
import './map-alarm-layer.css';

const props = defineProps<{ provider: MapProvider; mapInstance: unknown; alarms: ActiveMapAlarm[]; points: MapDevicePoint[] }>();
const emit = defineEmits<{ (event: 'select', deviceNumber: string): void }>();
let overlays: Array<{ setMap: (map: any) => void }> = [];
let frame: number | null = null;
function clear() { overlays.forEach((overlay) => overlay.setMap(null)); overlays = []; }
function markerDOM(alarm: ActiveMapAlarm) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `monitor-alarm-pulse monitor-alarm-pulse--${alarm.level.toLowerCase()}`;
  node.title = `${alarm.deviceNumber} · ${alarm.level} (${alarm.count})`;
  node.setAttribute('aria-label', node.title);
  node.textContent = '!';
  node.onclick = (event) => { event.stopPropagation(); emit('select', alarm.deviceNumber); };
  return node;
}
function sync() {
  clear();
  if (!props.mapInstance) return;
  const TMap = (window as any).TMap;
  const devices = new Map(props.points.map((point) => [point.deviceNumber, point]));
  for (const alarm of props.alarms) {
    const point = devices.get(alarm.deviceNumber);
    // Without country metadata, use the existing device position rather than guessing an offset.
    if (!point && (!alarm.countryCode || alarm.longitude == null || alarm.latitude == null)) continue;
    const source = point || { lng: alarm.longitude!, lat: alarm.latitude!, coordinateSystem: 'WGS84' as const, countryCode: alarm.countryCode };
    const wgs84 = convertMapCoordinate(source, source.coordinateSystem, 'WGS84');
    const node = markerDOM(alarm);
    if (props.provider === 'google' && typeof google !== 'undefined') {
      const position = new google.maps.LatLng(wgs84.lat, wgs84.lng);
      const overlay = new google.maps.OverlayView();
      overlay.onAdd = () => { overlay.getPanes()?.overlayMouseTarget.appendChild(node); google.maps.OverlayView.preventMapHitsAndGesturesFrom(node); };
      overlay.draw = () => {
        const pixel = overlay.getProjection()?.fromLatLngToDivPixel(position);
        if (pixel) { node.style.left = `${pixel.x}px`; node.style.top = `${pixel.y}px`; }
      };
      overlay.onRemove = () => node.remove();
      overlay.setMap(props.mapInstance as google.maps.Map);
      overlays.push(overlay);
    } else if (TMap?.DOMOverlay) {
      const coordinate = source.countryCode ? tencentDisplayCoordinate(wgs84, source.countryCode) : convertMapCoordinate(source, source.coordinateSystem, 'GCJ02');
      const position = new TMap.LatLng(coordinate.lat, coordinate.lng);
      class AlarmOverlay extends TMap.DOMOverlay {
        constructor(options: { map: unknown }) { super(options); }
        createDOM() { return node; }
        updateDOM() {
          const pixel = this.map.projectToContainer(position);
          node.style.left = `${pixel.x}px`;
          node.style.top = `${pixel.y}px`;
        }
        onDestroy() { node.remove(); }
      }
      const overlay = new AlarmOverlay({ map: props.mapInstance });
      overlays.push(overlay as any);
    }
  }
}
watch(() => [props.mapInstance, props.alarms, props.points, props.provider], () => {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => { frame = null; sync(); });
}, { immediate: true });
onBeforeUnmount(() => { if (frame !== null) cancelAnimationFrame(frame); clear(); });
</script>

