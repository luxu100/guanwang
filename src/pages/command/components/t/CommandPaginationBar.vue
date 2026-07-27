<template>
  <view class="pagination-bar">
    <view class="page-size">
      {{ localeText("每页", "Per page") }}
      <picker :range="pageSizeOptions" :value="pageSizeIndex" @change="changeSize">
        <text class="page-size__value">{{ size }}</text>
      </picker>
      {{ localeText("条", "items") }}
    </view>
    <button class="page-button" :disabled="current <= 1" @click="emit('change-page', current - 1)">{{ localeText("上一页", "Previous") }}</button>
    <text class="page-info">{{ localizedPageInfo(current, totalPages) }}</text>
    <button class="page-button" :disabled="current >= totalPages" @click="emit('change-page', current + 1)">{{ localeText("下一页", "Next") }}</button>
    <view class="jump-box">
      {{ localeText("前往", "Go to") }}
      <input v-model.number="jumpPage" class="page-input" type="number" />
      {{ localeText("页", "page") }}
      <button class="page-button" @click="jumpToPage">{{ localeText("确定", "Go") }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useLocaleText, useLocalizedPageInfo } from "@/i18n/localeText";

const localeText = useLocaleText();
const localizedPageInfo = useLocalizedPageInfo();

const props = withDefaults(defineProps<{
  current?: number;
  size?: number;
  total?: number;
  pageSizeOptions?: number[];
}>(), {
  current: 1,
  size: 10,
  total: 0,
  pageSizeOptions: () => [10, 20, 50, 100],
});

const emit = defineEmits<{
  (event: "change-page", page: number): void;
  (event: "change-size", size: number): void;
}>();

const jumpPage = ref<number | null>(null);
const totalPages = computed(() => Math.ceil(props.total / props.size) || 1);
const pageSizeIndex = computed(() => Math.max(0, props.pageSizeOptions.indexOf(props.size)));

function changeSize(event: { detail: { value: number | string } }) {
  emit("change-size", Number(props.pageSizeOptions[Number(event.detail.value)]));
}

function jumpToPage() {
  const page = Number(jumpPage.value);
  if (page >= 1 && page <= totalPages.value) emit("change-page", page);
}
</script>

<style scoped lang="scss">
.pagination-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 48px;
  padding: 0 14px;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
  border-top: 1px solid #edf3f8;
}

.page-size,
.jump-box {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
}

.page-size__value,
.page-input {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-sizing: border-box;
}

.page-size__value {
  min-width: 50px;
  padding: 0 10px;
}

.page-input {
  width: 40px;
  padding: 0 6px;
}

.page-button {
  flex-shrink: 0;
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button::after {
  border: 0;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}
</style>
