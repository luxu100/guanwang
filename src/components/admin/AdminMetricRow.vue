<template>
  <view class="admin-metric-row">
    <view v-for="item in items" :key="item.label" class="admin-metric-card">
      <text class="admin-metric-card__label">{{ item.label }}</text>
      <text class="admin-metric-card__value">{{ item.value }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string;
    value: string | number;
  }>;
}>();
</script>

<style scoped lang="scss">
.admin-metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 10px;
  flex: none;
  margin-bottom: 12px;
}

.admin-metric-card {
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid $color-admin-panel-border;
  border-radius: 6px;
  box-shadow: $shadow-admin-panel;
}

.admin-metric-card__label {
  display: block;
  color: $color-admin-muted;
  font-size: 13px;
  font-weight: 700;
}

.admin-metric-card__value {
  display: block;
  margin-top: 7px;
  color: $color-admin-title;
  font-size: 20px;
  font-weight: 900;
}

@media (max-width: 1100px) {
  .admin-metric-row {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}
</style>
