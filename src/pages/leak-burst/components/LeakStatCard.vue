<template>
  <view class="stat-card" :class="`stat-card--${tone}`">
    <view class="stat-card__head">
      <view class="stat-card__title">
        <text class="stat-card__marker" />
        <text class="stat-card__label">{{ label }}</text>
      </view>
    </view>
    <view class="stat-card__body">
      <text class="stat-card__value" :class="{ 'stat-card__value--compact': compact }">{{ value ?? '-' }}</text>
      <text v-if="unit" class="stat-card__unit">{{ unit }}</text>
    </view>
    <view v-if="progress != null" class="stat-card__progress">
      <view class="stat-card__progress-bar" :style="{ width: progressPercent + '%' }" />
    </view>
    <slot name="footer" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

// 数据格式化由页面负责；卡片只负责统一展示和可选的进度、补充信息。
const props = withDefaults(defineProps<{
  label: string;
  value?: string | number | null;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  unit?: string;
  compact?: boolean;
  progress?: number | null;
}>(), {
  tone: "primary",
  compact: false,
});

const progressPercent = computed(() => {
  const value = props.progress;
  return value != null && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
});
</script>

<style scoped>
@import "@/pages/device/components/x/common/status.css";

.stat-card__value--compact {
  font-size: 15px;
}
</style>
