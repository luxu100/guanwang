<!--
  LeakDataTable.vue - 漏点报告通用表格组件

  参考 XDataTable 设计，通过列配置驱动渲染：
  - 内置 renderType: index, text, dateTime, title
  - 自定义 renderType: 通过 #cell-{renderType} slot 处理
  - 自定义列头: 通过 #header-{renderType} slot 处理

  用法示例:
  <LeakDataTable
    :columns="columnDefs"
    :data="records"
    :loading="loading"
    :grid-template-columns="tableGridTemplateColumns"
    :min-width="tableMinWidth"
    :selected-key="selectedRecordKey"
    :sort-field="sortField"
    :sort-order="sortOrder"
    :empty-text="t('leakAnalysis.noAnalysisData')"
    :loading-text="t('common.loading')"
    :page-num="pagination.pageNum"
    :page-size="pagination.pageSize"
    :get-row-key="getRowKey"
    :get-field-value="getFieldValue"
    :format-date-time="formatDateTime"
    :label-fn="t"
    @sort="toggleSort"
    @row-click="selectRecord"
  >
    <template #cell-statusTag="{ row, col }">
      <text class="status-tag" :class="getStatusClass(row)">{{ getStatusLabel(row) }}</text>
    </template>
  </LeakDataTable>
-->
<template>
  <view class="data-table" :style="{ minWidth }">
    <!-- 列头 -->
    <view
      :class="['data-row', 'data-row--header', headerRowClass]"
      :style="{ gridTemplateColumns, minWidth }"
    >
      <view
        v-for="col in columns"
        :key="col.key"
        class="data-cell"
        :class="[col.cellClass, { 'data-cell--sortable': col.sortable }]"
        @click.stop="col.sortable && emit('sort', col.key)"
      >
        <slot :name="`header-${col.renderType}`" :col="col">
          <text>{{ getLabel(col) }}</text>
          <text
            v-if="col.sortable"
            class="sort-arrow"
            :class="{ 'sort-arrow--active': sortField === col.key }"
          >{{ sortField === col.key ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</text>
        </slot>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="table-state table-state--loading">
      <view class="state-spinner"></view>
      <text class="state-text">{{ loadingText }}</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!data.length" class="table-state table-state--empty">
      <view class="state-icon-empty"></view>
      <text class="state-text">{{ emptyText }}</text>
    </view>

    <!-- 数据行 -->
    <view v-else>
      <view
        v-for="(item, index) in data"
        :key="getRowKey(item, index)"
        :class="['data-row', bodyRowClass, { 'data-row--active': selectedKey === getRowKey(item, index) }]"
        :style="{ gridTemplateColumns, minWidth }"
        @click="emit('row-click', item, index)"
      >
        <view
          v-for="col in columns"
          :key="col.key"
          class="data-cell"
          :class="col.cellClass"
          :title="getCellTitle(col, item)"
        >
          <!-- 改进 B：formatter 优先级最高 -->
          <template v-if="col.formatter">{{ col.formatter(fieldFn(item, col.key), item) }}</template>
          <!-- 改进 A：options 选项映射（自动显示标签 + tagClass 样式） -->
          <template v-else-if="col.options">
            <text v-if="getOption(col, fieldFn(item, col.key))" class="status-tag" :class="getOption(col, fieldFn(item, col.key))?.tagClass">{{ getOptionLabel(col, fieldFn(item, col.key)) }}</text>
            <text v-else>-</text>
          </template>
          <!-- 内置 renderType: index -->
          <template v-else-if="col.renderType === 'index'">{{ (pageNum - 1) * pageSize + index + 1 }}</template>
          <!-- 内置 renderType: dateTime -->
          <template v-else-if="col.renderType === 'dateTime'">{{ formatDateTime(fieldFn(item, col.key)) }}</template>
          <!-- 内置 renderType: title -->
          <template v-else-if="col.renderType === 'title'">{{ displayValue(fieldFn(item, col.key)) }}</template>
          <!-- 内置 renderType: text -->
          <template v-else-if="col.renderType === 'text'">{{ displayValue(fieldFn(item, col.key)) }}</template>
          <!-- 自定义 renderType: 通过 slot 处理 -->
          <slot v-else :name="`cell-${col.renderType}`" :row="item" :col="col" :index="index">
            {{ displayValue(fieldFn(item, col.key)) }}
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 列配置接口（统一类型定义，与 columnTypes.ts 的 ColumnDef 兼容）
 *
 * 改进 C：统一类型定义，不再维护两套列类型。
 * renderType 为 string 类型，支持自定义 renderType 通过 slot 处理。
 */
export interface LeakDataColumn {
  /** 数据字段名 */
  key: string;
  /** 国际化 key（优先使用） */
  labelKey?: string;
  /** 固定标签（labelKey 不可用时回退） */
  label?: string;
  /** 渲染类型: index, text, dateTime, title 为内置; 其他通过 slot 处理 */
  renderType?: string;
  /** 中文列宽 */
  widthZh?: string;
  /** 英文列宽 */
  widthEn?: string;
  /** 单元格额外 class */
  cellClass?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可导出 */
  exportable?: boolean;
  /** statusTag 变体（自定义属性，通过 slot 使用） */
  statusVariant?: string;
  /**
   * 改进 A：选项映射
   * 声明式配置 value->label 映射，自动显示对应标签和样式。
   * 配置后无需手写 #cell-statusTag slot。
   */
  options?: LeakDataColumnOption[];
  /**
   * 改进 B：自定义格式化函数
   * 优先级：formatter > options > 内置 renderType > slot
   */
  formatter?: (value: any, row: any) => string;
}

/** 选项映射条目 */
export interface LeakDataColumnOption {
  /** 原始值 */
  value: any;
  /** 显示标签（固定文本） */
  label?: string;
  /** 国际化 key（优先于 label） */
  labelKey?: string;
  /** 状态标签 CSS class（如 "status-tag--success"） */
  tagClass?: string;
}

const props = withDefaults(defineProps<{
  /** 列配置 */
  columns: LeakDataColumn[];
  /** 数据数组 */
  data: any[];
  /** 加载状态 */
  loading?: boolean;
  /** Grid 列宽模板 */
  gridTemplateColumns: string;
  /** 最小宽度 */
  minWidth?: string;
  /** 选中行的 key */
  selectedKey?: string;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: string;
  /** 空数据文本 */
  emptyText?: string;
  /** 加载中文本 */
  loadingText?: string;
  /** 列头行额外 class */
  headerRowClass?: string;
  /** 数据行额外 class */
  bodyRowClass?: string;
  /** 当前页码（用于 index renderType） */
  pageNum?: number;
  /** 每页条数（用于 index renderType） */
  pageSize?: number;
  /** 行 key 获取函数 */
  getRowKey?: (row: any, index: number) => string;
  /** 字段值获取函数 */
  getFieldValue?: (row: any, key: string) => unknown;
  /** 日期时间格式化函数 */
  formatDateTime?: (value: unknown) => string;
  /** 标签获取函数（传入 t 函数） */
  labelFn?: (key: string) => string;
}>(), {
  loading: false,
  minWidth: '',
  selectedKey: '',
  sortField: '',
  sortOrder: 'asc',
  emptyText: '-',
  loadingText: '...',
  headerRowClass: '',
  bodyRowClass: '',
  pageNum: 1,
  pageSize: 10,
});

const emit = defineEmits<{
  (e: 'sort', key: string): void;
  (e: 'row-click', row: Record<string, unknown>, index: number): void;
}>();

/** 获取行 key */
function getRowKey(row: Record<string, unknown>, index: number): string {
  if (props.getRowKey) return props.getRowKey(row, index);
  return String(row.id ?? index);
}

/** 获取字段值 */
function fieldFn(row: Record<string, unknown> | null, key: string): unknown {
  if (props.getFieldValue) return props.getFieldValue(row, key);
  if (!row) return '';
  return row[key];
}

/** 格式化日期时间 */
function formatDateTime(value: unknown): string {
  if (props.formatDateTime) return props.formatDateTime(value);
  if (!value) return '-';
  return String(value);
}

/** 显示值：只把 null/undefined/空字符串显示为 '-'，保留合法的 0/false */
function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

/** 获取列头标签 */
function getLabel(col: LeakDataColumn): string {
  if (col.labelKey && props.labelFn) return props.labelFn(col.labelKey);
  return col.label || col.labelKey || col.key;
}

/** 改进 A：根据 value 获取对应的 option 对象 */
function getOption(col: LeakDataColumn, value: unknown): LeakDataColumnOption | undefined {
  if (!col.options) return undefined;
  return col.options.find((opt) => opt.value === value);
}

/** 改进 A：根据 value 获取显示标签 */
function getOptionLabel(col: LeakDataColumn, value: unknown): string {
  const opt = getOption(col, value);
  if (!opt) return '-';
  if (opt.labelKey && props.labelFn) return props.labelFn(opt.labelKey);
  return opt.label || String(value);
}

/**
 * 获取单元格 title（鼠标悬浮提示）
 * 对可能溢出的 renderType（text/title/dateTime/options）返回完整文本，
 * 对 index/checkbox/audio/video/link 等图标类列返回空字符串避免多余提示。
 */
function getCellTitle(col: LeakDataColumn, row: Record<string, unknown>): string {
  const raw = fieldFn(row, col.key);
  if (col.formatter) return col.formatter(raw, row);
  if (col.options) return getOptionLabel(col, raw);
  const rt = col.renderType;
  if (rt === 'index' || rt === 'checkbox' || rt === 'audio' || rt === 'video' || rt === 'link') return '';
  if (rt === 'dateTime') return formatDateTime(raw);
  return raw == null || raw === '' ? '' : String(raw);
}
</script>

<!--
  表格样式：scoped，所有表格结构样式在组件内部维护。
  父组件只需为 slot 内容（statusTag、checkbox 等）提供样式。
  与 XDataTable 的模式一致。
-->
<style scoped lang="scss">
.data-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #ffffff;
}

.data-row {
  display: grid;
  min-height: 42px;
  width: 100%;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
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
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-right: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.data-cell:last-child { border-right: 0; }

.data-cell--index { justify-content: center; color: #64748b; }
.data-cell--device { color: #0f4c81; }
.data-cell--time { color: #0f4c81; }
.data-cell--address { justify-content: center; text-align: center; }

/* 迁移自父组件（scoped CSS 无法穿透到子组件内部） */
.data-cell--checkbox { justify-content: center; }
.data-cell--leakpart { justify-content: center; text-align: center; color: #475569; }
.data-cell--type { justify-content: center; text-align: center; color: #475569; }
.data-cell--locator { justify-content: center; text-align: center; color: #475569; }
.data-cell--audio { justify-content: center; }
.data-cell--video { justify-content: center; }

.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #3b82f6; }

.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #3b82f6; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }

.data-cell--error {
  color: #475569;
  text-align: center;
  justify-content: center;
}

/* 状态标签（options 映射渲染） */
.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.status-tag--normal {
  color: #22c55e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.status-tag--unknown {
  color: #f59e0b;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.status-tag--pending {
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.status-tag--success {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.status-tag--failed {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.status-tag--skipped {
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  color: #a0aec0;
  font-size: 14px;
  text-align: center;
}

.state-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: leak-data-table-spin 0.7s linear infinite;
}

@keyframes leak-data-table-spin {
  to { transform: rotate(360deg); }
}

.state-icon-empty {
  width: 40px;
  height: 40px;
  border: 2px dashed #cbd5e1;
  border-radius: 50%;
  position: relative;
}

.state-icon-empty::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 2px;
  background: #cbd5e1;
  transform: translate(-50%, -50%);
}
</style>
