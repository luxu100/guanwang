<template>
  <view class="work-order-select" :class="{ 'work-order-select--open': open, 'work-order-select--disabled': disabled }">
    <view class="work-order-select__control" @click.stop="toggleOpen">
      <text class="work-order-select__value">{{ selectedLabel }}</text>
      <text class="work-order-select__arrow"></text>
    </view>
    <view v-if="open" class="work-order-select__menu" @click.stop>
      <view
        v-for="item in options"
        :key="`${item.value}`"
        class="work-order-select__option"
        :class="{ 'work-order-select__option--active': isSelected(item.value) }"
        @click.stop="selectOption(item.value)"
      >
        <text>{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

type SelectValue = string | number;
type SelectOption = {
  label: string;
  value: SelectValue;
};

const props = withDefaults(defineProps<{
  modelValue: SelectValue;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}>(), {
  placeholder: "",
  disabled: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: SelectValue): void;
  (event: "change", value: SelectValue): void;
}>();

const selectId = `work-order-select-${Math.random().toString(36).slice(2)}`;
const open = ref(false);
const selectedLabel = computed(() => props.options.find((item) => isSameValue(item.value, props.modelValue))?.label || props.placeholder);

onMounted(() => {
  // #ifdef H5
  document.addEventListener("click", closeOpen);
  document.addEventListener("work-order-select-open", handleOtherSelectOpen as EventListener);
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  document.removeEventListener("click", closeOpen);
  document.removeEventListener("work-order-select-open", handleOtherSelectOpen as EventListener);
  // #endif
});

function toggleOpen() {
  if (props.disabled) return;
  const nextOpen = !open.value;
  if (nextOpen) {
    // #ifdef H5
    document.dispatchEvent(new CustomEvent("work-order-select-open", { detail: selectId }));
    // #endif
  }
  open.value = nextOpen;
}

function closeOpen() {
  open.value = false;
}

function selectOption(value: SelectValue) {
  emit("update:modelValue", value);
  emit("change", value);
  open.value = false;
}

function handleOtherSelectOpen(event: Event) {
  const detail = (event as CustomEvent<string>).detail;
  if (detail !== selectId) {
    open.value = false;
  }
}

function isSelected(value: SelectValue) {
  return isSameValue(value, props.modelValue);
}

function isSameValue(left: SelectValue, right: SelectValue) {
  return String(left) === String(right);
}
</script>

<style scoped lang="scss">
.work-order-select {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: visible !important;
}

.work-order-select--open {
  z-index: 2100;
}

.work-order-select__control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  height: 100%;
  gap: 8px;
  cursor: pointer;
}

.work-order-select__value {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-order-select__arrow {
  flex: none;
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.18s ease;
}

.work-order-select--open .work-order-select__arrow {
  transform: translateY(2px) rotate(225deg);
}

.work-order-select__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 2000;
  max-height: 220px;
  overflow-y: auto;
  padding: 5px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 6px;
  box-shadow: 0 14px 34px rgba(15, 35, 55, 0.18);
}

.work-order-select__option {
  box-sizing: border-box;
  min-height: 30px;
  padding: 7px 9px;
  color: #253b52;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  cursor: pointer;
  border-radius: 4px;
}

.work-order-select__option:hover,
.work-order-select__option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.work-order-select--disabled {
  opacity: 0.62;
  pointer-events: none;
}
</style>
