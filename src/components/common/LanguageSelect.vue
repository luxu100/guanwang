<template>
  <picker
    mode="selector"
    :range="localeOptions"
    range-key="label"
    :value="currentIndex"
    @change="handleChange"
  >
    <view class="language-select">
      <text class="language-select__text">{{ localeLabel }}</text>
      <text class="language-select__arrow"></text>
    </view>
  </picker>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/i18n";

const { locale, localeLabel, localeOptions, setLocale } = useI18n();

const currentIndex = computed(() => {
  const index = localeOptions.findIndex((item) => item.value === locale.value);
  return index >= 0 ? index : 0;
});

function handleChange(event: { detail: { value: number } }) {
  const option = localeOptions[event.detail.value];
  if (option) {
    setLocale(option.value);
  }
}
</script>

<style scoped lang="scss">
.language-select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 94px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
}

.language-select__text {
  white-space: nowrap;
}

.language-select__arrow {
  width: 6px;
  height: 6px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
}
</style>
