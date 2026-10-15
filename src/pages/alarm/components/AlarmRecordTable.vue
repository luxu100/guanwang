<template>
  <div ref="tableEl" class="alarm-record-table" :class="{ 'is-compact': compact, 'is-narrow': narrow }" :style="{ '--alarm-wide-actions-width': actionWidth || '240px' }">
    <div class="alarm-record-table__header" :style="{ paddingRight: `${scrollbarWidth}px` }">
      <div class="alarm-record-table__heading-viewport">
        <div class="alarm-record-table__grid alarm-record-table__headings" :style="{ ...gridStyle, transform: `translateX(-${scrollLeft}px)` }">
          <div v-for="column in columns" :key="column.key" class="alarm-record-table__cell">
            <slot name="heading" :column="column">{{ column.label }}</slot>
          </div>
        </div>
      </div>
      <div class="alarm-record-table__actions-heading"><slot name="actions-heading">操作</slot></div>
    </div>
    <div v-if="loading" class="alarm-record-table__state">{{ loadingText }}</div>
    <div v-else-if="records.length === 0" class="alarm-record-table__state">{{ emptyText }}</div>
    <div v-else ref="bodyEl" class="alarm-record-table__body">
      <div class="alarm-record-table__panes">
        <div ref="dataEl" class="alarm-record-table__data" @scroll="onDataScroll">
          <div class="alarm-record-table__rows" :style="{ minWidth: `${dataMinWidth}px` }">
            <div v-for="(row, index) in records" :key="row.id" class="alarm-record-table__grid alarm-record-table__row" :class="{ 'is-selected': selectedId === String(row.id), 'is-hovered': hoveredId === String(row.id) }" :style="gridStyle" @mouseenter="hoveredId = String(row.id)" @mouseleave="hoveredId = ''">
              <div v-for="column in columns" :key="column.key" class="alarm-record-table__cell" :class="column.className">
                <slot name="cell" :row="row" :column="column" :index="index" />
              </div>
            </div>
          </div>
        </div>
        <div class="alarm-record-table__actions">
          <div v-for="row in records" :key="row.id" class="alarm-record-table__actions-row alarm-record-table__row" :class="{ 'is-selected': selectedId === String(row.id), 'is-hovered': hoveredId === String(row.id) }" @mouseenter="hoveredId = String(row.id)" @mouseleave="hoveredId = ''">
            <slot name="actions" :row="row" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { AlarmRecord } from "@/services/alarm/processing";
import type { AlarmTableColumn } from "./alarmColumns";

const props = defineProps<{
  columns: AlarmTableColumn[];
  records: AlarmRecord[];
  selectedId: string;
  loading: boolean;
  loadingText: string;
  emptyText: string;
  actionWidth?: string;
}>();

const tableEl = ref<HTMLElement | null>(null);
const bodyEl = ref<HTMLElement | null>(null);
const dataEl = ref<HTMLElement | null>(null);
const scrollLeft = ref(0);
const scrollbarWidth = ref(0);
const hoveredId = ref("");
const compact = ref(false);
const narrow = ref(false);
const dataMinWidth = computed(() => props.columns.reduce((width, column) => width + Number(column.width.match(/\d+(?:\.\d+)?/)?.[0] || 0), 0));
const gridStyle = computed(() => ({ gridTemplateColumns: props.columns.map((column) => column.width).join(" "), minWidth: `${dataMinWidth.value}px` }));
let observer: ResizeObserver | undefined;

function syncSize() {
  const width = tableEl.value?.clientWidth || 0;
  compact.value = width > 0 && width < 600;
  narrow.value = width > 0 && width < 400;
  scrollbarWidth.value = bodyEl.value ? bodyEl.value.offsetWidth - bodyEl.value.clientWidth : 0;
  if (dataEl.value) scrollLeft.value = dataEl.value.scrollLeft;
}

function onDataScroll(event: Event) {
  scrollLeft.value = (event.target as HTMLElement).scrollLeft;
}

watch(() => [props.loading, props.records], async () => {
  await nextTick();
  observer?.disconnect();
  if (tableEl.value) observer?.observe(tableEl.value);
  if (bodyEl.value) observer?.observe(bodyEl.value);
  if (dataEl.value) observer?.observe(dataEl.value);
  syncSize();
}, { flush: "post" });

onMounted(() => {
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(syncSize);
    if (tableEl.value) observer.observe(tableEl.value);
    if (bodyEl.value) observer.observe(bodyEl.value);
    if (dataEl.value) observer.observe(dataEl.value);
  }
  syncSize();
});
onUnmounted(() => observer?.disconnect());
</script>

<style scoped lang="scss">
.alarm-record-table {
  --alarm-actions-width: var(--alarm-wide-actions-width, 240px);
  --alarm-row-height: 48px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #fff;
}
.alarm-record-table__header,
.alarm-record-table__panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--alarm-actions-width);
  min-width: 0;
}
.alarm-record-table__header {
  flex: none;
  box-sizing: border-box;
  background: #f6f9fc;
  border-bottom: 1px solid #dbe7f0;
  color: #415a73;
  font-size: 12px;
  font-weight: 700;
}
.alarm-record-table__heading-viewport { min-width: 0; overflow: hidden; }
.alarm-record-table__grid { display: grid; box-sizing: border-box; width: 100%; }
.alarm-record-table__headings { min-height: 46px; }
.alarm-record-table__body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
.alarm-record-table__data { min-width: 0; overflow-x: auto; overflow-y: hidden; }
.alarm-record-table__rows { width: 100%; }
.alarm-record-table__row {
  height: var(--alarm-row-height);
  box-sizing: border-box;
  border-bottom: 1px solid #edf1f5;
  background: #fff;
  color: #24384d;
  font-size: 13px;
}
.alarm-record-table__row:nth-child(even) { background: #fbfdff; }
.alarm-record-table__row.is-hovered { background: #edf7ff; }
.alarm-record-table__row.is-selected { background: #f2f9ff; }
.alarm-record-table__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  border-right: 1px solid #edf1f5;
  white-space: nowrap;
  text-align: center;
}
.alarm-record-table__actions,
.alarm-record-table__actions-heading { border-left: 1px solid #dbe7f0; }
.alarm-record-table__actions-heading,
.alarm-record-table__actions-row { display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.alarm-record-table__actions-row { flex-wrap: wrap; align-content: center; gap: 6px; padding: 4px 8px; }
.alarm-record-table__state { display: flex; flex: 1; min-height: 160px; align-items: center; justify-content: center; color: #7c8da1; font-size: 13px; }
.alarm-record-table__body,
.alarm-record-table__data { scrollbar-color: #9fb4c8 #edf3f8; scrollbar-width: thin; }
.alarm-record-table__body::-webkit-scrollbar,
.alarm-record-table__data::-webkit-scrollbar { width: 8px; height: 8px; }
.alarm-record-table__body::-webkit-scrollbar-thumb,
.alarm-record-table__data::-webkit-scrollbar-thumb { background: #9fb4c8; border-radius: 8px; }
.is-compact { --alarm-actions-width: 180px; --alarm-row-height: 80px; }
.is-narrow { --alarm-actions-width: 132px; --alarm-row-height: 112px; }
</style>
