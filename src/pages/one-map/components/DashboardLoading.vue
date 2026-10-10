<template>
  <Transition name="dashboard-loading">
    <view v-if="active" class="dashboard-loading" role="status" aria-live="polite">
      <image class="dashboard-loading__icon" src="/static/icons/loadin_minior.svg" mode="aspectFit" />
      <text>{{ label }}</text>
    </view>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ active: boolean; label: string }>();
</script>

<style scoped>
.dashboard-loading {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, .9);
  color: #52677d;
  font-size: 11px;
  border-radius: inherit;
  cursor: wait;
}
.dashboard-loading__icon { width: 30px; height: 30px; animation: minor-spin 1.05s linear infinite; }
.dashboard-loading-enter-active, .dashboard-loading-leave-active { transition: opacity .18s ease; }
.dashboard-loading-enter-from, .dashboard-loading-leave-to { opacity: 0; }
@keyframes minor-spin { to { transform: rotate(360deg); } }
</style>
