<template>
  <view class="network-layer" :class="{ 'network-layer--google': provider === 'google' }">
    <view v-if="collapsed" class="network-layer__collapsed">
      <button
        class="network-layer__collapsed-button"
        type="button"
        :aria-label="t('pipePanel')"
        @click.stop="$emit('expand')"
      >
        <image class="network-layer__collapsed-icon" src="/static/icons/layers.svg" mode="aspectFit" />
        <text>{{ t("pipePanel") }}</text>
      </button>
    </view>

    <view v-else class="network-panel" :class="{ 'network-panel--creation-active': creationActive }" @click.stop>
      <view class="network-panel__head">
        <view class="network-panel__heading">
          <text class="network-panel__title">{{ t("pipeLayer") }}</text>
          <text class="network-panel__subtitle">{{ providerLabel }}</text>
        </view>
        <button
          class="network-panel__icon-button"
          type="button"
          :aria-label="visible ? t('hidden') : t('displayed')"
          :title="visible ? t('hidden') : t('displayed')"
          @click="$emit('toggle-visible')"
        >
          <image class="network-panel__action-icon" :src="visible ? '/static/icons/eye.svg' : '/static/icons/eye-off.svg'" mode="aspectFit" />
        </button>
        <button
          class="network-panel__icon-button"
          type="button"
          :aria-label="t('collapsePanel')"
          :title="t('collapsePanel')"
          @click="$emit('collapse')"
        >
          <image class="network-panel__action-icon" src="/static/icons/chevron-up.svg" mode="aspectFit" />
        </button>
      </view>

      <view class="network-panel__summary">
        <view>
          <text class="network-panel__summary-value">{{ pipes.length }}</text>
          <text class="network-panel__summary-label">{{ t("pipeLayer") }}</text>
        </view>
        <view>
          <text class="network-panel__summary-value">{{ facilities.length }}</text>
          <text class="network-panel__summary-label">{{ t("facilityDisplay") }}</text>
        </view>
        <view class="network-panel__summary-status" :class="{ 'network-panel__summary-status--loading': loading }">
          <text class="network-panel__status-dot"></text>
          <text>{{ loading ? t("networkLayerLoading") : source === "w84" ? t("w84PreviewLayer") : loaded ? t("pipeApiLayer") : t("networkLayerLoadFailed") }}</text>
        </view>
      </view>

      <view class="network-panel__section">
        <view class="network-panel__section-head">
          <text>{{ t("pipeDisplay") }}</text>
          <view class="network-panel__section-actions">
            <button class="network-panel__add-button" type="button" @click="$emit('start-creation', 'pipe')">＋ {{ t("createPipe") }}</button>
            <button v-if="source !== 'w84'" class="network-panel__text-button" type="button" :aria-label="t('refreshNetwork')" :title="t('refreshNetwork')" @click="$emit('refresh')">
              <image class="network-panel__action-icon" src="/static/icons/refresh-cw.svg" mode="aspectFit" />
            </button>
          </view>
        </view>
        <button
          class="network-panel__toggle-row"
          :class="{ 'network-panel__toggle-row--active': visible }"
          type="button"
          @click="$emit('toggle-visible')"
        >
          <text class="network-panel__swatch network-panel__swatch--pipe"></text>
          <text class="network-panel__toggle-label">{{ t("pipeLayer") }}</text>
          <text class="network-panel__toggle-count">{{ pipes.length }}</text>
          <text class="network-panel__switch" :class="{ 'network-panel__switch--on': visible }"></text>
        </button>
      </view>

      <view v-if="source === 'w84'" class="network-panel__note">
        <text>{{ t("w84PreviewNote") }}</text>
      </view>

      <view class="network-panel__section">
        <view class="network-panel__section-head">
          <text>{{ t("facilityDisplay") }}</text>
          <view class="network-panel__section-actions">
            <button class="network-panel__add-button" type="button" @click="$emit('start-creation', 'facility')">＋ {{ t("createFacility") }}</button>
            <text class="network-panel__section-count">{{ facilities.length }}</text>
          </view>
        </view>
        <button
          v-for="item in facilityItems"
          :key="item.type"
          class="network-panel__toggle-row"
          :class="{ 'network-panel__toggle-row--active': facilityVisibility[item.type] }"
          type="button"
          @click="$emit('toggle-facility', item.type)"
        >
          <text class="network-panel__swatch" :style="{ backgroundColor: item.color }"></text>
          <text class="network-panel__toggle-label">{{ item.label }}</text>
          <text class="network-panel__toggle-count">{{ item.count }}</text>
          <text class="network-panel__switch" :class="{ 'network-panel__switch--on': facilityVisibility[item.type] }"></text>
        </button>
      </view>

      <view class="network-panel__section network-panel__section--devices">
        <view class="network-panel__section-head">
          <text>{{ t("deviceBinding") }}</text>
          <text class="network-panel__section-count">{{ devicePoints.length }}</text>
        </view>
        <view v-for="item in deviceItems" :key="item.key" class="network-panel__device-row">
          <text class="network-panel__swatch" :style="{ backgroundColor: item.color }"></text>
          <text class="network-panel__toggle-label">{{ item.label }}</text>
          <text class="network-panel__toggle-count">{{ item.count }}</text>
        </view>
      </view>

      <view v-if="errorMessage" class="network-panel__error">
        <text>{{ errorMessage }}</text>
        <button v-if="source !== 'w84'" class="network-panel__retry" type="button" @click="$emit('refresh')">
          {{ t("retryNetworkLayer") }}
        </button>
      </view>

      <view class="network-panel__legend">
        <text class="network-panel__legend-title">{{ t("pipeLegend") }}</text>
        <view class="network-panel__legend-row">
          <text class="network-panel__legend-line network-panel__legend-line--active"></text>
          <text>{{ t("activePipe") }}</text>
        </view>
        <view class="network-panel__legend-row">
          <text class="network-panel__legend-line network-panel__legend-line--inactive"></text>
          <text>{{ t("inactivePipe") }}</text>
        </view>
        <view class="network-panel__legend-row">
          <text class="network-panel__legend-line network-panel__legend-line--unassessed"></text>
          <text>{{ t("unassessed") }}</text>
        </view>
      </view>

      <view class="network-panel__footer">
        <text>{{ t("pipeCount", { pipes: pipes.length, facilities: facilities.length }) }}</text>
        <button
          class="network-panel__locate"
          type="button"
          :aria-label="t('locateNetwork')"
          :title="t('locateNetwork')"
          @click="$emit('fit')"
        >
          <image class="network-panel__action-icon" src="/static/icons/crosshair.svg" mode="aspectFit" />
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LeakMonitorFacility, LeakMonitorPipe, FacilityType, MapDevicePoint } from "../types";
import { useLeakMonitorI18n } from "../i18n";

const props = withDefaults(defineProps<{
  provider?: "tencent" | "google";
  providerLabel: string;
  pipes?: LeakMonitorPipe[];
  facilities?: LeakMonitorFacility[];
  devicePoints?: MapDevicePoint[];
  visible?: boolean;
  collapsed?: boolean;
  loaded?: boolean;
  loading?: boolean;
  errorMessage?: string;
  facilityVisibility?: Record<FacilityType, boolean>;
  source?: "api" | "w84";
  creationActive?: boolean;
}>(), {
  provider: "tencent",
  pipes: () => [],
  facilities: () => [],
  devicePoints: () => [],
  visible: true,
  collapsed: true,
  loaded: false,
  loading: false,
  errorMessage: "",
  facilityVisibility: () => ({ VALVE: true, HYDRANT: true, PUMP: true }),
  source: "api",
  creationActive: false,
});

defineEmits<{
  (event: "expand"): void;
  (event: "collapse"): void;
  (event: "toggle-visible"): void;
  (event: "toggle-facility", type: FacilityType): void;
  (event: "refresh"): void;
  (event: "fit"): void;
  (event: "start-creation", mode: "pipe" | "facility"): void;
}>();

const { t } = useLeakMonitorI18n();

const facilityItems = computed(() => {
  const countByType = props.facilities.reduce<Record<FacilityType, number>>((result, facility) => {
    result[facility.facilityType] += 1;
    return result;
  }, { VALVE: 0, HYDRANT: 0, PUMP: 0 });
  return [
    { type: "VALVE" as const, label: t("facilityValve"), count: countByType.VALVE, color: "#2F80ED" },
    { type: "HYDRANT" as const, label: t("facilityHydrant"), count: countByType.HYDRANT, color: "#F59E0B" },
    { type: "PUMP" as const, label: t("facilityPump"), count: countByType.PUMP, color: "#8B5CF6" },
  ];
});

const deviceItems = computed(() => {
  const countByType = props.devicePoints.reduce<Record<string, number>>((result, point) => {
    const key = point.facilityType || "NONE";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return [
    { key: "VALVE", label: t("boundValve"), count: countByType.VALVE || 0, color: "#2F80ED" },
    { key: "HYDRANT", label: t("boundHydrant"), count: countByType.HYDRANT || 0, color: "#F59E0B" },
    { key: "PUMP", label: t("boundPump"), count: countByType.PUMP || 0, color: "#8B5CF6" },
    { key: "NONE", label: t("unboundDevice"), count: countByType.NONE || 0, color: "#64748B" },
  ];
});
</script>

<style scoped lang="scss">
.network-layer { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.network-layer__collapsed { position: absolute; top: 18px; left: 18px; pointer-events: auto; }
.network-layer__collapsed-button { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 13px; color: #1f2d3d; font-size: 13px; font-weight: 700; background: #fff; border: 1px solid rgba(201,216,232,.95); border-radius: 5px; box-shadow: 0 8px 20px rgba(18,43,70,.14); }
.network-layer__collapsed-button::after, .network-panel button::after { border: 0; }
.network-layer__collapsed-icon { display: block; width: 16px; height: 16px; }
.network-panel { position: absolute; top: 18px; left: 18px; display: flex; flex-direction: column; width: min(380px, calc(100vw - 120px)); max-height: calc(100% - 36px); padding: 0; overflow-y: auto; pointer-events: auto; background: #fff; border: 1px solid rgba(201,216,232,.95); border-radius: 8px; box-shadow: 0 16px 34px rgba(18,43,70,.18); transition: top .16s ease; }
.network-panel--creation-active { top: min(426px, calc(18px + 44vh)); max-height: calc(100% - min(444px, calc(44vh + 36px))); }
.network-panel__head, .network-panel__footer, .network-panel__section-head, .network-panel__toggle-row, .network-panel__legend-row { display: flex; align-items: center; }
.network-panel__head, .network-panel__footer, .network-panel__section-head { justify-content: space-between; gap: 9px; }
.network-panel__head { flex: none; min-height: 46px; padding: 0 10px 0 16px; background: linear-gradient(180deg,#fff 0%,#f5f8fb 100%); border-bottom: 1px solid #e6edf4; }
.network-panel__heading { flex: 1; min-width: 0; }.network-panel__title, .network-panel__subtitle { display: block; }
.network-panel__title { color: #1f2d3d; font-size: 17px; font-weight: 800; }.network-panel__subtitle { margin-top: 3px; color: #64748b; font-size: 12px; font-weight: 700; }
.network-panel__icon-button, .network-panel__text-button, .network-panel__locate { display: inline-flex; align-items: center; justify-content: center; flex: none; margin: 0; padding: 0; color: #52677d; background: #eef5fb; border: 0; border-radius: 5px; }
.network-panel__icon-button { width: 30px; height: 30px; }.network-panel__text-button, .network-panel__locate { width: 28px; height: 28px; }
.network-panel__action-icon { display: block; width: 16px; height: 16px; }
.network-panel__summary { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; margin: 0 12px; padding: 9px 0; border-bottom: 1px solid #edf2f7; }
.network-panel__summary > view { min-width: 0; }.network-panel__summary-value, .network-panel__summary-label { display: block; }.network-panel__summary-value { color: #1d66c2; font-size: 19px; font-weight: 900; line-height: 21px; }.network-panel__summary-label { margin-top: 3px; color: #64748b; font-size: 12px; font-weight: 700; white-space: nowrap; }.network-panel__summary-status { grid-column: 1 / -1; display: flex; align-items: center; gap: 5px; min-width: 0; padding-top: 2px; color: #047857; font-size: 12px; line-height: 1.25; }.network-panel__summary-status--loading { color: #b45309; }.network-panel__status-dot { width: 7px; height: 7px; flex: none; background: currentColor; border-radius: 50%; }
.network-panel__section { margin: 9px 12px 0; }.network-panel__section-head { color: #26384d; font-size: 13px; font-weight: 800; }.network-panel__section-count { color: #64748b; font-size: 12px; font-weight: 700; }.network-panel__section-actions { display: inline-flex; align-items: center; gap: 6px; }.network-panel__add-button { height: 26px; margin: 0; padding: 0 7px; color: #2477c5; font-size: 11px; font-weight: 700; background: #f2f8fd; border: 1px solid #b8d5ed; border-radius: 4px; }
.network-panel__toggle-row { width: 100%; min-height: 32px; margin-top: 4px; padding: 0 7px; gap: 8px; color: #31435a; text-align: left; background: #fff; border: 1px solid transparent; border-radius: 4px; }.network-panel__toggle-row--active { color: #1e293b; background: #f6fbff; border-color: #e2ebf3; }.network-panel__swatch { width: 9px; height: 9px; flex: none; border-radius: 50%; }.network-panel__swatch--pipe { background: #16a34a; }.network-panel__toggle-label { flex: 1; min-width: 0; font-size: 13px; font-weight: 700; }.network-panel__toggle-count { color: #64748b; font-size: 12px; }
.network-panel__error { display: flex; align-items: center; gap: 8px; margin: 9px 12px 0; padding: 8px; color: #b42318; font-size: 12px; line-height: 1.35; background: #fff1ee; border: 1px solid #ffd3cb; border-radius: 4px; }.network-panel__error > text { flex: 1; min-width: 0; }.network-panel__retry { flex: none; margin: 0; padding: 3px 6px; color: #b42318; font-size: 12px; background: #fff; border: 1px solid #f1aaa0; border-radius: 4px; }
.network-panel__note { margin: 9px 12px 0; padding: 8px; color: #52677d; font-size: 12px; line-height: 1.35; background: #f7fafc; border: 1px solid #e3ebf3; border-radius: 4px; }
.network-panel__legend { display: grid; gap: 6px; margin: 9px 12px 0; padding-top: 9px; border-top: 1px solid #edf2f7; }.network-panel__legend-title { color: #52677d; font-size: 12px; font-weight: 800; }.network-panel__legend-row { gap: 8px; color: #52677d; font-size: 12px; }.network-panel__legend-line { width: 25px; height: 4px; border-radius: 2px; }.network-panel__legend-line--active { background: #16a34a; }.network-panel__legend-line--inactive { background: repeating-linear-gradient(90deg, #94a3b8 0 5px, transparent 5px 8px); }.network-panel__legend-line--unassessed { background: #cbd5e1; }
.network-panel__footer { flex: none; min-height: 42px; margin: 8px 12px 0; color: #64748b; font-size: 12px; border-top: 1px solid #edf2f7; }
.network-layer--google .network-layer__collapsed,
.network-layer--google .network-panel:not(.network-panel--creation-active) { top: 72px; }
@media (max-width: 900px) {
  .network-layer__collapsed { top: 68px; left: 10px; }
  .network-panel { top: 68px; left: 10px; width: min(380px, calc(100vw - 20px)); max-height: calc(100% - 78px); }
  .network-panel--creation-active { top: min(476px, calc(68px + 50vh)); max-height: calc(100% - min(494px, calc(50vh + 78px))); }
  .network-layer--google .network-layer__collapsed,
  .network-layer--google .network-panel:not(.network-panel--creation-active) { top: 84px; }
}
</style>
