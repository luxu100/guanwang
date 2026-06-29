<template>
  <view class="suspect-process-view">
    <SuspectTableView mode="processing" />
  </view>
</template>

<script setup lang="ts">
import SuspectTableView from "./SuspectTableView.vue";
</script>

<style scoped lang="scss">
.suspect-process-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}
</style>