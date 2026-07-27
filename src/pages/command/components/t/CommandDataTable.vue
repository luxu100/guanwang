<template>
  <view class="data-table-container">
    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text v-if="showIndex" class="data-cell data-cell--index">{{ localeText("序号", "No.") }}</text>
          <view
            v-for="column in columns"
            :key="column.key"
            class="data-cell"
            :class="column.className"
            :style="cellStyle(column)"
          >
            <slot :name="`header-${column.key}`" :column="column" :label="column.label">
              {{ column.label }}
            </slot>
          </view>
        </view>

        <view v-if="loading" class="loading-mask">{{ loadingText || localeText("正在加载…", "Loading…") }}</view>
        <view v-else-if="!data.length" class="table-state">{{ emptyText || localeText("暂无数据", "No data") }}</view>

        <view
          v-for="(row, index) in data"
          v-else
          :key="row[idKey] ?? index"
          class="data-row"
          :class="{ 'data-row--active': selected === (row[idKey] ?? index) }"
          @click="emit('row-click', row)"
        >
          <text v-if="showIndex" class="data-cell data-cell--index">{{ pageIndex(index) }}</text>
          <view
            v-for="column in columns"
            :id="`command-cell-${index}-${column.key}`"
            :key="column.key"
            class="data-cell"
            :class="[column.className, column.bodyClassName]"
            :style="cellStyle(column)"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :column="column"
              :value="formatValue(row, column)"
              :index="index"
            >
              <text class="cell-text">{{ formatValue(row, column) }}</text>
            </slot>
          </view>
        </view>
      </view>
    </scroll-view>

    <slot name="footer" />
  </view>
</template>

<script setup lang="ts">
import { useLocaleText } from "@/i18n/localeText";
import type { CommandTableColumn } from "./types";

const localeText = useLocaleText();

const props = withDefaults(defineProps<{
  columns: CommandTableColumn[];
  data: any[];
  loading?: boolean;
  idKey?: string;
  showIndex?: boolean;
  pageCurrent?: number;
  pageSize?: number;
  loadingText?: string;
  emptyText?: string;
  selected?: any;
}>(), {
  loading: false,
  idKey: "id",
  showIndex: true,
  pageCurrent: 1,
  pageSize: 10,
  loadingText: "",
  emptyText: "",
});

const emit = defineEmits<{
  (event: "row-click", row: any): void;
}>();

function cellStyle(column: CommandTableColumn) {
  return {
    width: `${column.width || 120}px`,
    textAlign: "center",
    justifyContent: column.align === "right" ? "flex-end" : "center",
  };
}

function pageIndex(index: number) {
  return (props.pageCurrent - 1) * props.pageSize + index + 1;
}

function formatValue(row: any, column: CommandTableColumn) {
  const value = row[column.key];
  const formatted = column.formatter ? column.formatter(value, row) : value;
  return formatted === null || formatted === undefined || formatted === "" ? "-" : String(formatted);
}

</script>

<style scoped lang="scss">
.data-table-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  white-space: nowrap;
  background: #fff;
}

.data-table {
  display: inline-flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
}

.data-row {
  display: flex;
  width: max-content;
  min-width: 100%;
  min-height: 42px;
  cursor: pointer;
  border-bottom: 1px solid #edf1f5;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  cursor: default;
  background: #f6f9fc;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #fff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #f1f8ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.data-row--active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.data-cell {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  width: 140px;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  box-sizing: border-box;
}

.cell-text {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-row--header .data-cell {
  justify-content: center !important;
  color: #415a73;
  font-size: 12px;
  font-weight: 800;
}

.data-cell--index {
  justify-content: center;
  width: 50px;
  color: #64748b;
}

.data-cell--number {
  color: #0f4c81;
  font-weight: 800;
}

.data-cell--time {
  color: #64748b;
  font-size: 12px;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.loading-mask {
  position: absolute;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #31506d;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.65);
}
</style>
