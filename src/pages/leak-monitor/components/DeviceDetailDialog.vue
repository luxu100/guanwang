<template>
  <view v-if="visible && device" class="detail-mask">
    <view class="detail-dialog" @click.stop>
      <view class="detail-header" :class="`detail-header--${device.status}`">
        <view class="detail-header__title">
          <text class="detail-header__number">{{ device.deviceNumber }}</text>
          <text class="detail-header__status">{{ device.statusText }} {{ probabilityText }}</text>
        </view>
        <button class="detail-header__close" type="button" @click="$emit('close')">×</button>
      </view>

      <scroll-view class="detail-body" scroll-y>
        <view class="tab-row">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-button"
            :class="{ active: activeTab === tab.key }"
            type="button"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </view>

        <view v-if="loading" class="dialog-state">详情加载中...</view>

        <template v-else>
          <view v-if="activeTab === 'noise'" class="chart-grid">
            <DeviceSpectrumChart title="频谱图" mode="spectrogram" />
            <DeviceSpectrumChart title="频率幅度" mode="line" />
            <DeviceSpectrumChart title="时域幅度" mode="line" />
            <DeviceSpectrumChart title="状态比例" mode="bar" />
          </view>

          <view v-else-if="activeTab === 'detail'" class="field-grid">
            <view v-for="item in detailFields" :key="item.label" class="field-item">
              <text class="field-item__label">{{ item.label }}</text>
              <text class="field-item__value">{{ item.value }}</text>
            </view>
          </view>

          <view v-else-if="activeTab === 'parameter'" class="field-grid">
            <view v-for="item in parameterFields" :key="item.label" class="field-item">
              <text class="field-item__label">{{ item.label }}</text>
              <text class="field-item__value">{{ item.value }}</text>
            </view>
          </view>

          <view v-else class="dialog-state">
            <text>{{ tabPlaceholder }}</text>
          </view>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DeviceDetailState, LeakMonitorDevice } from "../types";
import DeviceSpectrumChart from "./DeviceSpectrumChart.vue";

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  device: LeakMonitorDevice | null;
  detail: DeviceDetailState;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const activeTab = ref("noise");
const tabs = [
  { key: "noise", label: "噪声分析" },
  { key: "history", label: "历史数据" },
  { key: "detail", label: "设备详情" },
  { key: "repair", label: "拆装记录" },
  { key: "manual", label: "人工分析" },
  { key: "nearby", label: "关联分析" },
  { key: "parameter", label: "设备查找" },
];

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      activeTab.value = "noise";
    }
  },
);

const probabilityText = computed(() => {
  const probability = props.device?.probability;
  if (probability === undefined || probability === null || probability === "") {
    return "";
  }

  return `概率: ${probability}`;
});

const info = computed(() => props.detail.info || props.device?.raw || {});
const parameter = computed(() => props.detail.parameter || {});
const tabPlaceholder = computed(() => {
  if (activeTab.value === "nearby" && props.detail.nearby) {
    return JSON.stringify(props.detail.nearby);
  }

  return "该标签页的数据结构已预留，等待后端字段接入";
});

const detailFields = computed(() => buildFields(info.value));
const parameterFields = computed(() => buildFields(parameter.value));

function buildFields(data: Record<string, unknown>) {
  const entries = Object.entries(data).slice(0, 24);

  if (!entries.length && props.device) {
    return [
      { label: "设备编号", value: props.device.deviceNumber },
      { label: "设备名称", value: props.device.name },
      { label: "设备状态", value: props.device.statusText },
      { label: "经纬度", value: `${props.device.lng ?? "--"}, ${props.device.lat ?? "--"}` },
    ];
  }

  return entries.map(([label, value]) => ({
    label,
    value: value === undefined || value === null || value === "" ? "--" : String(value),
  }));
}
</script>

<style scoped lang="scss">
.detail-mask {
  position: absolute;
  top: 76px;
  right: 660px;
  bottom: 24px;
  left: 24px;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  pointer-events: none;
}

.detail-dialog {
  display: flex;
  flex-direction: column;
  width: min(900px, 100%);
  height: min(580px, 100%);
  overflow: hidden;
  pointer-events: auto;
  background: #fff;
  border: 1px solid #cbd8e5;
  border-radius: 6px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
}

.detail-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 14px;
  color: #fff;
  background: #0ea5e9;
}

.detail-header--normal { background: #00a870; }
.detail-header--suspect { background: #f59e0b; }
.detail-header--leak { background: #ef4444; }
.detail-header--unknown { background: #64748b; }

.detail-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.detail-header__number {
  overflow: hidden;
  font-size: 18px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-header__status {
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  white-space: nowrap;
}

.detail-header__close {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 26px;
  line-height: 32px;
  background: transparent;
  border: 0;
}

.detail-header__close::after,
.tab-button::after {
  border: 0;
}

.detail-body {
  flex: 1;
  min-height: 0;
  background: #fff;
}

.tab-row {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #d8e5ef;
}

.tab-button {
  height: 30px;
  margin: 0;
  padding: 0 10px;
  color: #26384d;
  font-size: 13px;
  font-weight: 800;
  line-height: 30px;
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 4px;
}

.tab-button.active {
  color: #fff;
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 10px;
  padding: 10px;
}

.field-item {
  min-width: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.field-item:hover {
  background: #f1f7fd;
  border-color: #c8dceb;
}

.field-item__label,
.field-item__value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-item__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.field-item__value {
  margin-top: 6px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
}

.dialog-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
  text-align: center;
  background: #fbfdff;
}

@media (max-width: 1500px) {
  .detail-mask {
    right: 660px;
    left: 16px;
  }
}

@media (max-width: 1100px) {
  .detail-mask {
    top: 84px;
    right: 16px;
    bottom: 16px;
    left: 16px;
    justify-content: center;
  }

  .detail-dialog {
    width: min(760px, 100%);
    height: min(520px, 100%);
  }

  .chart-grid,
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
