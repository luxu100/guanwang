<template>
  <view v-if="visible" class="valve-panel">
    <view class="valve-panel__header">
      <text class="valve-panel__title">阀门管理</text>
      <text class="valve-panel__subtitle">
        当前设备：{{ deviceData?.deviceNumber || "未选择设备" }}
      </text>
    </view>

    <view class="valve-panel__body">
      <text class="valve-panel__empty">这里是阀门管理页面，后续功能可在这里继续补充。</text>
    </view>
  </view>

  <view v-else class="valve-panel valve-panel--hidden"></view>
</template>

<script setup lang="ts">
import type { Device } from "@/services/device/types";

defineProps<{
  visible: boolean;
  deviceData: Partial<Device>;
}>();
</script>

<style scoped lang="scss">
.valve-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: #f7f8fa;
}

.valve-panel--hidden {
  padding: 0;
  background: transparent;
}

.valve-panel__header {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.valve-panel__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.valve-panel__subtitle {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #4e5969;
}

.valve-panel__body {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  margin-top: 16px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.valve-panel__empty {
  font-size: 14px;
  color: #86909c;
  text-align: center;
}
</style>