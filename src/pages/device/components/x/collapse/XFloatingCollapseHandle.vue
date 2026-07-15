<template>
  <view
      class="collapse-handle"
      :class="{ expanded: modelValue }"
      @click="toggle"
  >
    <!-- rope -->
    <view class="rope"></view>

    <!-- icon slot / fallback -->
    <view class="icon-wrapper">
      <slot name="icon">
        <image v-if="icon" class="bird-icon" :src="icon" />
        <image v-else class="bird-icon" src="/static/bird.svg" />
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  icon?: string;
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>()

function toggle() {
  const next = !props.modelValue
  emit("update:modelValue", next)
}
</script>

<style scoped lang="scss">
.collapse-handle {
  position: absolute;
  right: 10px;

  width: 40px;
  height: 100px;

  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.2s ease;
}

/* rope */
.rope {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  width: 2px;
  height: 25px;

  background: #74879c;
  border-radius: 2px;

  transition: transform 0.15s ease, opacity 0.15s ease;
}

/* icon wrapper */
.icon-wrapper {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
}

/* icon */
.bird-icon {
  width: 22px;
  height: 22px;
  transform: translateX(0);
  transition: transform 0.15s ease, opacity 0.15s ease;
}

/* expanded */
.collapse-handle.expanded .bird-icon {
  height: 60px;
}

.collapse-handle.expanded .rope {
  height: 45px;
}

/* interaction */
.collapse-handle:active .bird-icon {
  transform: scale(0.88);
}
</style>