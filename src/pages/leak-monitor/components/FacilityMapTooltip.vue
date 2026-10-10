<template>
  <view v-if="hover" class="facility-map-tooltip" role="tooltip" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
    {{ hover.text }}
  </view>
</template>

<script setup lang="ts">
defineProps<{ hover: { text: string; x: number; y: number } | null }>();
</script>

<style scoped>
.facility-map-tooltip {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  box-sizing: border-box;
  max-width: 240px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2937;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
  box-shadow: 0 3px 12px rgb(0 0 0 / 12%);
}
</style>
