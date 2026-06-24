<template>
  <view v-if="visible" class="map-popup-mask" @click="close">
    <view class="map-popup" @click.stop>

      <!-- header -->
      <view class="map-popup__header">

        <view class="left">
          <text class="title">{{ title }}</text>

          <view class="coord">
            <text class="coord-item">经度：{{ safeLng.toFixed(6) }}</text>
            <text class="coord-item">纬度：{{ safeLat.toFixed(6) }}</text>
          </view>
        </view>

        <text class="close-btn" @click="close">×</text>

      </view>

      <!-- map -->
      <view class="map-popup__body">
        <XTencentMap :lng="safeLng" :lat="safeLat" />
      </view>

    </view>
  </view>
</template>


<script setup lang="ts">
import XTencentMap from "@/pages/device/components/x/XTencentMap.vue";
import { computed } from "vue";

const props = defineProps<{
  title?: string;
  visible: boolean;
  lng?: number;
  lat?: number;
}>();

const safeLng = computed(() => props.lng ?? 116.397);
const safeLat = computed(() => props.lat ?? 39.909);

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
}>();

const close = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.map-popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.map-popup {
  width: 92%;
  height: 75%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.map-popup__header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e8edf3;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
}

/* 左侧整体 */
.left {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 标题（放大） */
.title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* 经纬度（同一行辅助信息） */
.coord {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #6b7b8c;
}

/* 每个字段 */
.coord-item {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* 关闭按钮 */
.close-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #6b7b8c;
  border-radius: 6px;
}

.close-btn:active {
  background: #eef2f7;
  color: #111827;
}
</style>