<template>
  <view
      v-if="visible"
      class="x-tooltip"
      :style="{
        left: x + 'px',
        top: y + 'px'
      }"
  >
    {{ text }}
  </view>
</template>


<script setup lang="ts">

defineProps<{
  visible: boolean;
  text: string;
  x: number;
  y: number;
}>();

</script>


<style scoped lang="scss">

.x-tooltip {
  position: fixed;
  z-index: 9999;

  max-width: 360px;
  min-width: 120px;

  padding: 10px 14px;

  color: #24384d;
  font-size: 13px;
  line-height: 20px;

  background: #fff;

  border: 1px solid #d8e5ef;
  border-radius: 6px;

  box-shadow: 0 8px 20px rgba(35,72,104,.15);

  white-space: normal;
  word-break: break-all;

  pointer-events: none;

  animation: tooltip-show .15s ease-out;
}


.x-tooltip::before {
  content: "";

  position: absolute;

  top: -6px;
  left: 18px;

  width: 10px;
  height: 10px;

  background: #fff;

  border-left: 1px solid #d8e5ef;
  border-top: 1px solid #d8e5ef;

  transform: rotate(45deg);
}


@keyframes tooltip-show {

  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }

}

</style>