<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="toolbar-row toolbar-row--filters">
          <view class="filter-group">
          <text class="filter-label">报警类型</text>
          <picker :range="alarmTypeOptions" range-key="label" :value="filters.alarmTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ alarmTypeOptions[filters.alarmTypeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">报警级别</text>
          <picker :range="alarmLevelOptions" range-key="label" :value="filters.alarmLevelIndex" @change="handleFilterLevelChange">
            <view class="filter-select">
              <text>{{ alarmLevelOptions[filters.alarmLevelIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">状态</text>
          <picker :range="statusOptions" range-key="label" :value="filters.statusIndex" @change="handleFilterStatusChange">
            <view class="filter-select">
              <text>{{ statusOptions[filters.statusIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">设备编号</text>
          <input v-model="filters.deviceNumber" class="filter-input" :placeholder="'请输入设备编号'" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">部门</text>
          <picker :range="deptPickerOptions" range-key="label" :value="filters.deptIndex" @change="handleFilterDeptChange">
            <view class="filter-select">
              <text>{{ deptPickerOptions[filters.deptIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        </view>

        <view class="toolbar-row toolbar-row--bottom">
          <view class="filter-group filter-group--date">
          <text class="filter-label">时间段</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" @click="searchAlarms">查询</button>
          <button class="toolbar-button" @click="resetFilters">重置</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 表格 + 右侧统计地图栏（同数据分析页左右网格）；行"详情"以覆盖层形式盖在右栏上 -->
    <view class="main-layout" :style="layoutStyle">
      <view class="table-panel">
      <view class="table-head">
        <text>报警处理</text>
        <view class="table-head__aux">
          <text v-if="pollFailed" class="refresh-status refresh-status--failed">更新失败，正在重试</text>
          <text v-else-if="lastRefreshSuccessAt" class="refresh-status">已更新 {{ fmtClock(lastRefreshSuccessAt) }}</text>
          <text class="table-head__meta">共 {{ pagination.total }} 条</text>
        </view>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header record-table-row" :style="{ gridTemplateColumns: processingGridColumnsNoCheck }">
            <view v-for="column in recordColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ column.label }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">加载中...</view>
          <view v-else-if="alarmList.length === 0" class="table-state">暂无报警数据</view>

          <view
            v-for="(item, index) in alarmList"
            v-else
            :key="item.id"
            class="table-row record-table-row"
            :class="{ 'table-row--selected': selectedRecordKey === String(item.id) }"
            :style="{ gridTemplateColumns: processingGridColumnsNoCheck }"
          >
            <template v-for="column in recordColumns" :key="column.key">
              <text v-if="column.renderType === 'index'" class="table-cell" :class="column.className">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
              <view v-else-if="column.renderType === 'level-pill'" class="table-cell" :class="column.className">
                <text class="level-pill" :class="getLevelClass(getCellValue(item, column.key) as string | null)">{{ getLevelText(getCellValue(item, column.key) as string | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'status-pill'" class="table-cell" :class="column.className">
                <text class="status-pill" :class="getStatusClass(getCellValue(item, column.key) as string | null)">{{ getStatusText(getCellValue(item, column.key) as string | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'action'" class="table-cell col-action">
                <button class="table-action-btn" :class="{ 'table-action-btn--active': selectedRecordKey === String(item.id) }" @click.stop="toggleDetail(item)">详情</button>
                <button v-if="item.status === 'ACTIVE'" class="table-action-btn" @click.stop="openHandleDialog(item)">确认</button>
                <button v-if="item.status === 'ACTIVE' || item.status === 'CONFIRMED'" class="table-action-btn" @click.stop="openResolveDialog(item)">关闭</button>
              </view>
              <text v-else class="table-cell" :class="column.className" :title="cellText(item, column)">{{ cellText(item, column) }}</text>
            </template>
          </view>
        </view>
      </scroll-view>

      <view class="pagination-bar">
        <button class="page-btn" :disabled="pagination.current <= 1" @click="handlePageChange(pagination.current - 1)">
          上一页
        </button>
        <text class="page-info">第 {{ pagination.current }} / {{ totalPages }} 页</text>
        <button class="page-btn" :disabled="pagination.current >= totalPages" @click="handlePageChange(pagination.current + 1)">
          下一页
        </button>
        <text class="page-info">到第</text>
        <input v-model.number="jumpPage" class="page-input" type="number" @keyup.enter="handlePageChange(jumpPage)" />
        <text class="page-info">页</text>
        <button class="page-btn" :disabled="jumpPage === null || jumpPage < 1 || jumpPage > totalPages" @click="handlePageChange(jumpPage)">
          跳转
        </button>
      </view>
      </view>

      <!-- 左右分栏手柄（学爆管识别页交互）：拖动调宽度，单击折叠/展开右栏；
           箭头指向下一次点击后面板移动的方向（展开时指向右=收起，收起时指向左=展开） -->
      <view class="split-handle" @mousedown="startResize">
        <view class="split-handle__btn">{{ isSideCollapsed ? "⟨" : "⟩" }}</view>
      </view>

    <!-- 右侧常驻栏上半：报警概况（总览数字 + 分布 + 近 7 天趋势） -->
    <view class="side-column" :class="{ 'side-column--hidden': isSideCollapsed }">
      <view class="side-card side-card--stats">
        <view class="side-card__head">
          <text class="side-card__title">报警概况</text>
        </view>
        <scroll-view class="side-card__body" scroll-y>
          <view class="side-stats">
            <view class="side-stat">
              <text class="side-stat__label">今日新增</text>
              <text class="side-stat__num">{{ overviewStats?.todayTotal ?? "-" }}</text>
            </view>
            <view class="side-stat">
              <text class="side-stat__label">当前活跃</text>
              <text class="side-stat__num">{{ overviewStats?.activeTotal ?? "-" }}</text>
            </view>
            <view class="side-stat">
              <text class="side-stat__label">今日已处理</text>
              <text class="side-stat__num">{{ overviewStats?.resolvedToday ?? "-" }}</text>
            </view>
          </view>
          <view class="side-breakdown">
            <view class="side-breakdown__group">
              <text class="side-breakdown__label">按级别</text>
              <view v-for="lv in levelBreakdownItems" :key="lv.key" class="side-breakdown__item">
                <text class="side-breakdown__dot" :class="`side-breakdown__dot--${lv.key}`"></text>
                <text>{{ lv.label }}</text>
                <text class="side-breakdown__num">{{ lv.count }}</text>
              </view>
            </view>
            <view class="side-breakdown__group">
              <text class="side-breakdown__label">按类型</text>
              <view v-for="tp in typeBreakdownItems" :key="tp.name" class="side-breakdown__item">
                <text>{{ tp.name }}</text>
                <text class="side-breakdown__num">{{ tp.count }}</text>
              </view>
              <text v-if="typeBreakdownItems.length === 0" class="side-breakdown__item side-breakdown__item--na">暂无数据</text>
            </view>
          </view>
          <text class="side-chart-caption">近 7 天新增报警记录数</text>
          <div ref="overviewChartEl" class="side-chart side-chart--trend"></div>
        </scroll-view>
      </view>

      <!-- 右侧常驻栏下半：报警分布地图（stats/map 散点，筛选后重查） -->
      <view class="side-card side-card--map">
        <view class="side-card__head side-card__head--map">
          <text class="side-card__title">报警分布地图</text>
          <!-- 自定义下拉（uni picker 底部弹层在本布局里会被视口裁剪，改为按钮下方弹菜单） -->
          <view class="map-filters">
            <view class="map-filter">
              <view class="map-filter__select" @click.stop="toggleMapSelect('status')">
                <text>{{ mapStatusLabels[mapFilters.statusIndex] }}</text>
              </view>
              <view v-if="activeMapSelect === 'status'" class="map-select-menu">
                <view
                  v-for="(option, index) in mapStatusOptions"
                  :key="option.label"
                  class="map-select-option"
                  :class="{ 'map-select-option--active': mapFilters.statusIndex === index }"
                  @click.stop="selectMapStatus(index)"
                >
                  {{ option.label }}
                </view>
              </view>
            </view>
            <view class="map-filter">
              <view class="map-filter__select" @click.stop="toggleMapSelect('level')">
                <text>{{ mapLevelLabels[mapFilters.levelIndex] }}</text>
              </view>
              <view v-if="activeMapSelect === 'level'" class="map-select-menu">
                <view
                  v-for="(option, index) in mapLevelOptions"
                  :key="option.label"
                  class="map-select-option"
                  :class="{ 'map-select-option--active': mapFilters.levelIndex === index }"
                  @click.stop="selectMapLevel(index)"
                >
                  {{ option.label }}
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="side-card__body side-card__body--map">
          <div ref="mapChartEl" class="side-chart side-chart--map"></div>
          <view v-if="mapLoading" class="map-foot">加载中...</view>
          <view v-else-if="mapError" class="map-foot map-foot--error">分布数据加载失败，切换筛选可重试</view>
          <view v-else class="map-legend">
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.CRITICAL === 0 }"><text class="side-breakdown__dot side-breakdown__dot--CRITICAL"></text>严重 {{ mapLevelCounts.CRITICAL }}</text>
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.WARNING === 0 }"><text class="side-breakdown__dot side-breakdown__dot--WARNING"></text>警告 {{ mapLevelCounts.WARNING }}</text>
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.INFO === 0 }"><text class="side-breakdown__dot side-breakdown__dot--INFO"></text>提示 {{ mapLevelCounts.INFO }}</text>
            <text v-if="mapLevelCounts.other > 0" class="map-legend__item">其他 {{ mapLevelCounts.other }}</text>
            <text class="map-legend__meta">共 {{ mapPointCount }} 个报警点（无坐标设备不显示）</text>
          </view>
        </view>
      </view>

    <!-- 右侧详情覆盖层（同漏点页交互：点"详情"盖在右栏上，再点一次隐藏） -->
    <view v-if="selectedRecord" class="detail-panel detail-panel--overlay">
      <view class="detail-panel__head">
        <view class="detail-panel__title-wrap">
          <text class="detail-panel__title">报警详情</text>
          <text class="detail-panel__subtitle">{{ selectedRecord.ruleName || "-" }}</text>
        </view>
        <button class="icon-button" hover-class="icon-button--hover" :aria-label="'关闭'" @click="closeDetail">
          <text class="close-icon"></text>
        </button>
      </view>
      <scroll-view class="detail-panel__body detail-section" scroll-y>
        <!-- 摘要卡：设备 + 类型 + 级别 + 状态（蓝色竖线强调，同漏点详情） -->
        <view class="detail-summary">
          <view class="detail-summary__main">
            <text class="detail-summary__label">设备编号</text>
            <text class="detail-summary__value">{{ selectedRecord.deviceNumber || "-" }}<text v-if="selectedRecord.deviceAlias" class="detail-summary__alias">{{ selectedRecord.deviceAlias }}</text></text>
          </view>
          <view class="detail-summary__badges">
            <text class="detail-summary__badge detail-summary__badge--type">{{ getRuleTypeText(selectedRecord.alarmType, selectedRecord.alarmTypeName) }}</text>
            <text class="level-pill" :class="getLevelClass(selectedRecord.alarmLevel)">{{ getLevelText(selectedRecord.alarmLevel) }}</text>
            <text class="status-pill" :class="getStatusClass(selectedRecord.status)">{{ getStatusText(selectedRecord.status) }}</text>
          </view>
          <view class="detail-summary__meta">
            <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">设备别名</text><text class="detail-summary__meta-value">{{ selectedRecord.deviceAlias || "-" }}</text></view>
            <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">规则类型</text><text class="detail-summary__meta-value">{{ getRuleKindText(selectedRecord.ruleKind) }}</text></view>
          </view>
        </view>

        <!-- 触发信息 -->
        <text class="detail-section-title">触发信息</text>
        <view class="detail-grid">
          <view class="detail-item"><text class="detail-item__label">命中规则</text><text class="detail-item__value">{{ selectedRecord.ruleName || "-" }}</text></view>
          <view class="detail-item"><text class="detail-item__label">自定义字段</text><text class="detail-item__value">{{ selectedRecord.fieldName || "-" }}</text></view>
          <view class="detail-item"><text class="detail-item__label">触发值</text><text class="detail-item__value">{{ selectedRecord.triggerValue == null ? "-" : String(selectedRecord.triggerValue) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">触发次数</text><text class="detail-item__value">{{ selectedRecord.triggerCount == null ? "-" : String(selectedRecord.triggerCount) }}</text></view>
        </view>

        <!-- 时间信息（整行） -->
        <text class="detail-section-title">时间信息</text>
        <view class="detail-grid detail-grid--single">
          <view class="detail-item"><text class="detail-item__label">首次触发</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.firstTriggeredAt) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">最后触发</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.lastTriggeredAt) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">恢复时间</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.recoveredAt) }}</text></view>
        </view>

        <!-- 处理信息 -->
        <text class="detail-section-title">处理信息</text>
        <view class="detail-grid detail-grid--single">
          <view class="detail-item"><text class="detail-item__label">处理人</text><text class="detail-item__value">{{ selectedRecord.handleUserId == null ? "-" : String(selectedRecord.handleUserId) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">处理备注</text><text class="detail-item__value">{{ selectedRecord.handleRemark || "-" }}</text></view>
        </view>
      </scroll-view>
    </view>
    </view>
    </view>

    <view v-if="handleVisible" class="dialog-mask" @click="handleVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">确认报警</text>
            <text class="dialog-subtitle">{{ handleRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="'关闭'" @click="handleVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">处理备注</text>
            <textarea v-model="handleRemark" class="form-textarea" :placeholder="'请输入处理备注'" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="handleVisible = false">取消</button>
          <button class="toolbar-button toolbar-button--primary" :loading="handling" @click="submitHandle">确认</button>
        </view>
      </view>
    </view>

    <!-- 关闭报警弹窗（resolve：人工关闭，写恢复时间） -->
    <view v-if="resolveVisible" class="dialog-mask" @click="resolveVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">关闭报警</text>
            <text class="dialog-subtitle">{{ resolveRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="'关闭'" @click="resolveVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">处理备注</text>
            <textarea v-model="resolveRemark" class="form-textarea" :placeholder="'请输入处理备注'" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="resolveVisible = false">取消</button>
          <button class="toolbar-button toolbar-button--primary" :loading="resolving" @click="submitResolve">确认关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import * as echarts from "echarts";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import {
  getAlarmPage,
  getAlarmDetail,
  getAlarmTrend,
  getAlarmOverview,
  getAlarmMap,
  confirmAlarm,
  resolveAlarm,
  getLatestActiveAlarms,
} from "@/services/alarm/api";
import type { AlarmRecord, AlarmMapItem } from "@/services/alarm/api";
import {
  processingColumns,
  processingDetailFields,
  processingGridColumnsNoCheck,
  type AlarmDetailField,
  type AlarmTableColumn,
} from "@/pages/alarm/components/alarmColumns";
import {
  ALARM_LEVEL_MAP,
  ALARM_STATUS_MAP,
  ALARM_TYPE_MAP as ALARM_TYPE_MAP_LOCAL,
  RULE_KIND_MAP as RULE_KIND_MAP_LOCAL,
  alarmLevelOptions as publicAlarmLevelOptions,
  alarmStatusOptions as publicAlarmStatusOptions,
  alarmTypeOptions as publicAlarmTypeOptions,
  mapEnumText,
} from "@/pages/alarm/components/alarmLocale";
import { getDeptList } from "@/services/partition/partition";

/** 报警类型筛选（首项"不限"= 不过滤）；枚举文案统一读 alarmLocale.ts */
const alarmTypeOptions = [
  { label: "不限", value: null as string | null },
  ...publicAlarmTypeOptions((zh) => zh),
];
const alarmLevelOptions = [
  { label: "不限", value: null as string | null },
  ...publicAlarmLevelOptions((zh) => zh),
];
/** 三态状态机（后端：ACTIVE→CONFIRMED→RESOLVED）；首项"不限"= 不过滤 */
const statusOptions = [
  { label: "不限", value: null as string | null },
  ...publicAlarmStatusOptions((zh) => zh),
];

interface DeptItem {
  id: number;
  deptName: string;
}

const filters = reactive({
  alarmTypeIndex: 0,
  alarmLevelIndex: 0,
  statusIndex: 0,
  deviceNumber: "",
  deptIndex: 0,
  startTime: "",
  endTime: "",
});

const POLL_INTERVAL = 45 * 1000;
const loading = ref(false);
const alarmList = ref<AlarmRecord[]>([]);
const deptList = ref<DeptItem[]>([]);
const pagination = reactive({ current: 1, size: 10, total: 0 });
/** 轮询健康状态：最后一次成功刷新时间 / 是否处于失败态（供页面显示，不弹窗） */
const lastRefreshSuccessAt = ref<number | null>(null);
const pollFailed = ref(false);
const jumpPage = ref<number | null>(null);

const recordColumns = processingColumns;
const detailFields = processingDetailFields;

/* 文案映射（后端字符串枚举；类型优先取后端附带的中文名） */
const textFormatters: Record<string, (item: AlarmRecord) => string> = {
  alarmType: (item) => getRuleTypeText(item.alarmType, item.alarmTypeName),
  lastTriggeredAt: (item) => fmtDateTime(item.lastTriggeredAt),
};
const detailFormatters: Record<string, (item: AlarmRecord) => string> = {
  alarmType: (item) => getRuleTypeText(item.alarmType, item.alarmTypeName),
  ruleKind: (item) => getRuleKindText(item.ruleKind),
  triggerCount: (item) => (item.triggerCount == null ? "-" : String(item.triggerCount)),
  firstTriggeredAt: (item) => fmtDateTime(item.firstTriggeredAt),
  lastTriggeredAt: (item) => fmtDateTime(item.lastTriggeredAt),
  recoveredAt: (item) => fmtDateTime(item.recoveredAt),
};

/** 时间戳格式化为 HH:mm:ss（轮询状态展示用） */
function fmtClock(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 后端 LocalDateTime 形如 2026-09-09T12:02:00.146924，格式化为 YYYY-MM-DD HH:mm:ss */
function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) return String(value);
  return `${m[1]} ${m[2]}:${m[3] || "00"}`;
}

function getCellValue(item: AlarmRecord, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function cellText(item: AlarmRecord, column: AlarmTableColumn): string {
  const formatter = column.formatKey ? textFormatters[column.formatKey] : undefined;
  if (formatter) return formatter(item);
  const raw = getCellValue(item, column.key);
  return raw == null || raw === "" ? "-" : String(raw);
}

function detailPillValue(field: AlarmDetailField): string | null | undefined {
  if (!selectedRecord.value) return undefined;
  return (selectedRecord.value as Record<string, unknown>)[field.key] as string | null | undefined;
}

function detailValue(field: AlarmDetailField): string {
  const record = selectedRecord.value;
  if (!record) return "-";
  const formatter = field.formatKey ? detailFormatters[field.formatKey] : undefined;
  if (formatter) return formatter(record);
  const raw = (record as Record<string, unknown>)[field.key];
  return raw == null || raw === "" ? "-" : String(raw);
}

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.size)));

const deptPickerOptions = computed(() => [
  { label: "不限", value: null as number | null },
  ...deptList.value.map((dept) => ({ label: dept.deptName, value: dept.id as number | null })),
]);

/* ========================= 文案映射（读公共枚举映射 alarmLocale.ts） ========================= */

function getRuleTypeText(value?: string | null, fallbackName?: string | null) {
  return mapEnumText(ALARM_TYPE_MAP_LOCAL, value, (zh) => zh, fallbackName);
}

function getRuleKindText(value?: string | null) {
  return mapEnumText(RULE_KIND_MAP_LOCAL, value, (zh) => zh);
}

function getLevelText(value?: string | null) {
  return mapEnumText(ALARM_LEVEL_MAP, value, (zh) => zh);
}

function getLevelClass(value?: string | number | null) {
  if (value === "INFO") return "level-pill--info";
  if (value === "WARNING") return "level-pill--warning";
  if (value === "CRITICAL") return "level-pill--critical";
  return "level-pill--muted"; // 未知级别用中性色，不误标为严重
}

function getStatusText(value?: string | null) {
  return mapEnumText(ALARM_STATUS_MAP, value, (zh) => zh);
}

function getStatusClass(value?: string | null) {
  if (value === "ACTIVE") return "status-pill--processing";
  if (value === "CONFIRMED") return "status-pill--done";
  if (value === "RESOLVED") return "status-pill--muted";
  return "status-pill--open";
}

/* ========================= 数据加载 ========================= */

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) {
    return undefined;
  }
  const normalizedValue = normalizeDisplayDatetime(value);
  if (normalizedValue.includes("T")) {
    return normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
  }
  return `${normalizedValue}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

/** 已应用的查询条件快照：点"查询"（或重置/翻页）时保存；轮询只使用它，
 * 不会把用户正在编辑、尚未点击查询的条件应用到请求里。 */
const appliedQuery = ref<Record<string, unknown>>({});

/** 从当前筛选表单收集查询条件（不含分页） */
function collectFilterParams(): Record<string, unknown> {
  const filterParams: Record<string, unknown> = {};
  const alarmType = alarmTypeOptions[filters.alarmTypeIndex].value;
  if (alarmType !== null) filterParams.alarmType = alarmType;
  const alarmLevel = alarmLevelOptions[filters.alarmLevelIndex].value;
  if (alarmLevel !== null) filterParams.alarmLevel = alarmLevel;
  const status = statusOptions[filters.statusIndex].value;
  if (status !== null) filterParams.status = status;
  if (filters.deviceNumber.trim()) filterParams.deviceNumber = filters.deviceNumber.trim();
  const deptId = deptPickerOptions.value[filters.deptIndex].value;
  if (deptId !== null) filterParams.deptId = deptId;
  filterParams.startTime = normalizeDateForApi(filters.startTime, false);
  filterParams.endTime = normalizeDateForApi(filters.endTime, true);
  return filterParams;
}

let fetchRequestId = 0;

async function loadAlarms(page = 1, opts: { silent?: boolean; applyFilters?: boolean } = {}) {
  // 统一竞态守卫：静默刷新（轮询/页面恢复可见）遇到用户请求在途时让路，
  // 避免后发的静默请求作废用户正在等待的手动查询/翻页/操作后刷新
  if (opts.silent && loading.value) return;
  const requestId = ++fetchRequestId;
  if (!opts.silent) loading.value = true;
  // 仅显式 applyFilters（点查询/重置）才应用当前表单条件；
  // 操作成功后的刷新、翻页、轮询一律沿用已有快照，避免把未提交的筛选带进请求
  if (opts.applyFilters) appliedQuery.value = collectFilterParams();
  const params: Record<string, unknown> = {
    pageNum: page,
    pageSize: pagination.size,
    ...appliedQuery.value,
  };
  try {
    const res = (await getAlarmPage(params as never)) as { code?: number; msg?: string; data?: { records?: AlarmRecord[]; total?: number } };
    if (requestId !== fetchRequestId) return;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    lastRefreshSuccessAt.value = Date.now();
    pollFailed.value = false; // 列表已成功更新，立即清除"更新失败"提示
    const pageData = res.data || {};
    alarmList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
    // 打开中的详情随列表刷新同步：列表更新使旧详情请求失效
    if (selectedRecord.value) {
      detailRequestId++;
      const refreshed = alarmList.value.find((item) => String(item.id) === selectedRecordKey.value);
      if (refreshed) {
        selectedRecord.value = refreshed;
      } else {
        closeDetail();
      }
    }
  } catch {
    if (requestId !== fetchRequestId) return;
    if (opts.silent) {
      pollFailed.value = true;
      return;
    }
    alarmList.value = [];
    pagination.total = 0;
    pagination.current = page;
    uni.showToast({ title: "加载报警列表失败", icon: "none" });
  } finally {
    if (requestId === fetchRequestId) {
      loading.value = false;
      jumpPage.value = null;
    }
  }
}

/** 点"查询"：应用当前表单条件并回到第一页 */
function searchAlarms() {
  loadAlarms(1, { applyFilters: true });
}

function resetFilters() {
  filters.alarmTypeIndex = 0;
  filters.alarmLevelIndex = 0;
  filters.statusIndex = 0;
  filters.deviceNumber = "";
  filters.deptIndex = 0;
  filters.startTime = "";
  filters.endTime = "";
  loadAlarms(1, { applyFilters: true });
}

function handlePageChange(page: number | null) {
  if (page == null || page < 1 || page > totalPages.value || page === pagination.current) return;
  loadAlarms(page);
}

/* ========================= 筛选事件 ========================= */

function handleFilterTypeChange(event: { detail: { value: number } }) {
  filters.alarmTypeIndex = Number(event.detail.value);
}
function handleFilterLevelChange(event: { detail: { value: number } }) {
  filters.alarmLevelIndex = Number(event.detail.value);
}
function handleFilterStatusChange(event: { detail: { value: number } }) {
  filters.statusIndex = Number(event.detail.value);
}
function handleFilterDeptChange(event: { detail: { value: number } }) {
  filters.deptIndex = Number(event.detail.value);
}

/* ========================= 右侧详情面板（同漏点页：点详情出现，再点隐藏） ========================= */

const selectedRecord = ref<AlarmRecord | null>(null);
const selectedRecordKey = ref("");

const detailLoading = ref(false);
let detailRequestId = 0;

async function toggleDetail(item: AlarmRecord) {
  const key = String(item.id);
  if (selectedRecordKey.value === key) {
    // 关闭面板时同步使在途详情请求失效，旧响应不允许再回写
    detailRequestId++;
    closeDetail();
    return;
  }
  // 先展示行数据（秒开），再拉详情接口校准最新值（报警合并/他人处理会持续变化）
  detailRequestId++;
  selectedRecord.value = item;
  selectedRecordKey.value = key;
  const requestId = detailRequestId;
  detailLoading.value = true;
  try {
    const res = (await getAlarmDetail(item.id as number)) as { code?: number; msg?: string; data?: AlarmRecord };
    if (requestId !== detailRequestId) return; // 期间切换过详情/关闭/列表刷新，丢弃
    if (res.code !== undefined && res.code !== 200) return; // 失败保留行数据
    // 仍选中同一条才回写；期间面板已换行/关闭则丢弃
    if (res.data && selectedRecordKey.value === key) {
      selectedRecord.value = res.data;
    }
  } catch {
    // 静默：详情接口失败时保留列表行数据展示
  } finally {
    if (requestId === detailRequestId) detailLoading.value = false;
  }
}

function closeDetail() {
  selectedRecord.value = null;
  selectedRecordKey.value = "";
}

/* ========================= 确认 ========================= */

const handleVisible = ref(false);
const handleRecord = ref<AlarmRecord | null>(null);
const handleRemark = ref("");
const handling = ref(false);

function openHandleDialog(item: AlarmRecord) {
  handleRecord.value = item;
  handleRemark.value = "";
  handleVisible.value = true;
}

async function submitHandle() {
  if (!handleRecord.value?.id || handling.value) return;
  handling.value = true;
  try {
    const payload = { handleRemark: handleRemark.value.trim() };
    const res = (await confirmAlarm(handleRecord.value.id, payload)) as { code?: number; msg?: string };

    if (res.code !== undefined && res.code !== 200) {
      uni.showToast({ title: res.msg || "处理失败", icon: "none" });
      return;
    }
    uni.showToast({ title: "确认成功", icon: "success" });
    handleVisible.value = false;
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "处理失败", icon: "none" });
  } finally {
    handling.value = false;
  }
}

/* ========================= 关闭（resolve：写恢复时间与处理备注） ========================= */

const resolveVisible = ref(false);
const resolveRecord = ref<AlarmRecord | null>(null);
const resolveRemark = ref("");
const resolving = ref(false);

function openResolveDialog(item: AlarmRecord) {
  resolveRecord.value = item;
  resolveRemark.value = "";
  resolveVisible.value = true;
}

async function submitResolve() {
  if (!resolveRecord.value?.id || resolving.value) return;
  resolving.value = true;
  try {
    const payload = { handleRemark: resolveRemark.value.trim() };
    const res = (await resolveAlarm(resolveRecord.value.id, payload)) as { code?: number; msg?: string };
    if (res.code !== undefined && res.code !== 200) {
      uni.showToast({ title: res.msg || "关闭失败", icon: "none" });
      return;
    }
    uni.showToast({ title: "已关闭", icon: "success" });
    resolveVisible.value = false;
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "关闭失败", icon: "none" });
  } finally {
    resolving.value = false;
  }
}

/* 实时刷新轮询状态：以"见过的报警 ID 集合"为基准判新增（避免同时间戳报警漏提示）；
 * 首次成功轮询只建基准不提示。集合仅由轮询更新，与当前分页/筛选解耦。 */
const pollBaselineReady = ref(false);
const seenAlarmIds = ref<Set<number>>(new Set());

/* ========================= 实时刷新轮询（latest-active，仅 H5） ========================= */
// #ifdef H5
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollInFlight = false;

async function pollLatestAlarms() {
  if (document.hidden || pollInFlight) return;
  // 用户请求在途时本轮让路（兜底，统一守卫在 loadAlarms 内）
  if (loading.value) return;
  pollInFlight = true;
  try {
    // latest-active 返回 AlarmMapItemVO（含 alarmRecordId），非 AlarmRecord
    const res = (await getLatestActiveAlarms(200)) as { code?: number; msg?: string; data?: Array<{ alarmRecordId?: number }> };
    if (res.code !== undefined && res.code !== 200) {
      pollFailed.value = true;
      return;
    }
    const active = res.data || [];
    // 新报警判定（按 ID 去重，避免同秒报警漏提示）：
    // 首次成功轮询只建立基准（seenIds），不把已有报警当新报警提示
    const currentIds = new Set(active.map((item) => item.alarmRecordId).filter((id): id is number => id != null));
    let hasNew = false;
    if (pollBaselineReady.value) {
      for (const id of currentIds) {
        if (!seenAlarmIds.value.has(id)) {
          hasNew = true;
          break;
        }
      }
    } else {
      pollBaselineReady.value = true;
    }
    seenAlarmIds.value = currentIds;
    // 每轮都刷新当前列表（按已应用条件快照）：已有报警的触发次数/状态变化也能同步
    if (hasNew) {
      uni.showToast({ title: "检测到新报警，已自动刷新", icon: "none" });
    }
    // 成功/失败状态由随后的 loadAlarms(silent) 按列表实际结果更新（分开管理）；
    // 用户请求在途时 loadAlarms 内的统一守卫会让路
    await loadAlarms(pagination.current, { silent: true });
    // 右栏统计与地图随轮询同步刷新（内部有 in-flight 守卫，不会叠加请求）
    loadOverview();
    loadAlarmMap();
  } catch {
    // 轮询失败：保留上次成功数据，标记失败态（页面显示"更新失败"，不弹窗）
    pollFailed.value = true;
  } finally {
    pollInFlight = false;
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(pollLatestAlarms, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function onVisibilityChange() {
  if (!document.hidden) {
    // silent 刷新：用户请求在途时由 loadAlarms 内统一守卫让路，不会覆盖手动翻页/查询
    loadAlarms(pagination.current, { silent: true });
  }
}
// #endif

/* ========================= 报警概况（总览数字 + 近 7 天新增趋势） ========================= */

/** stats/overview 响应结构（对齐 AlarmOverviewVO） */
interface AlarmOverviewStats {
  todayTotal?: number;
  activeTotal?: number;
  resolvedToday?: number;
  byLevel?: Partial<Record<"INFO" | "WARNING" | "CRITICAL", number>>;
  byType?: Array<{ alarmType?: string | null; alarmTypeName?: string | null; count?: number }>;
}

const overviewStats = ref<AlarmOverviewStats | null>(null);
const overviewChartEl = ref<HTMLElement | null>(null);
const overviewHasData = ref(false);
let overviewChart: echarts.ECharts | null = null;
let overviewResizeObserver: ResizeObserver | null = null;
let overviewLoading = false;

/** 按级别分布（固定 INFO/WARNING/CRITICAL 顺序；数据未加载时计数显示 "-"） */
const levelBreakdownItems = computed(() => {
  const stats = overviewStats.value;
  return (["INFO", "WARNING", "CRITICAL"] as const).map((key) => ({
    key,
    label: getLevelText(key),
    count: stats ? stats.byLevel?.[key] ?? 0 : "-",
  }));
});

/** 按类型分布（名称优先取后端附带的 alarmTypeName） */
const typeBreakdownItems = computed(() => {
  const stats = overviewStats.value;
  if (!stats) return [];
  return (stats.byType || []).map((row) => ({
    name: row.alarmTypeName || getRuleTypeText(row.alarmType) || "-",
    count: row.count ?? 0,
  }));
});

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 展开时才加载：近 7 天趋势（stats/trend，按天）+ 总览数字与分布（stats/overview） */
async function loadOverview() {
  if (overviewLoading) return;
  overviewLoading = true;
  try {
    const end = fmtDate(Date.now());
    const start = fmtDate(Date.now() - 6 * 24 * 3600 * 1000);
    const res = (await getAlarmTrend({ startTime: start, endTime: end })) as {
      code?: number;
      data?: { items?: Array<{ bucket: string; total: number }> };
    };
    if (res.code === 200 || res.code === undefined) {
      const items = (res.data && res.data.items) || [];
      overviewHasData.value = items.some((i) => i.total > 0);
      renderOverviewChart(items);
    }
    // activeTotal 是后端真实活跃数，替代此前 latest-active 长度的近似
    const overview = (await getAlarmOverview({})) as { code?: number; data?: AlarmOverviewStats };
    if (overview.code === 200 || overview.code === undefined) {
      overviewStats.value = overview.data || {};
    }
  } catch {
    // 概况加载失败静默
  } finally {
    overviewLoading = false;
  }
}

function renderOverviewChart(items: Array<{ bucket: string; total: number }>) {
  if (!overviewChartEl.value) return;
  if (!overviewChart) {
    overviewChart = echarts.init(overviewChartEl.value);
  }
  overviewChart.setOption(
    {
      grid: { left: 44, right: 20, top: 30, bottom: 30 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(23, 32, 51, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#ffffff", fontSize: 12 },
        formatter: (params: Array<{ name: string; value: number }>) =>
          `${params[0].name}
新增报警记录: ${params[0].value} 条`,
      },
      xAxis: {
        type: "category",
        data: items.map((i) => i.bucket),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#d8e5ef" } },
        axisLabel: { color: "#52677b", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#edf3f8", type: "dashed" } },
        axisLabel: { color: "#8191a2", fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          data: items.map((i) => i.total),
          barMaxWidth: 26,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#60a5fa" },
              { offset: 1, color: "#2563eb" },
            ]),
          },
        },
      ],
    },
    true,
  );
}

/* ========================= 报警分布地图（stats/map，echarts 散点） ========================= */

/** 散点系列：按级别分桶着色（对齐后端文档建议 红/橙/蓝），未知级别归入灰色"其他" */
const MAP_LEVEL_SERIES = [
  { key: "CRITICAL", label: "严重", color: "#ef4444" },
  { key: "WARNING", label: "警告", color: "#f59e0b" },
  { key: "INFO", label: "提示", color: "#3b82f6" },
  { key: "other", label: "其他", color: "#94a3b8" },
] as const;

const mapStatusOptions = [
  { label: "全部状态", value: null as string | null },
  { label: "活跃", value: "ACTIVE" },
  { label: "已确认", value: "CONFIRMED" },
  { label: "已关闭", value: "RESOLVED" },
];
const mapStatusLabels = mapStatusOptions.map((option) => option.label);
const mapLevelOptions = [
  { label: "全部级别", value: null as string | null },
  { label: "提示", value: "INFO" },
  { label: "警告", value: "WARNING" },
  { label: "严重", value: "CRITICAL" },
];
const mapLevelLabels = mapLevelOptions.map((option) => option.label);

const mapLoading = ref(false);
const mapError = ref(false);
const mapPointCount = ref(0);
/** 当前已加载的点位（供图例按级别计数） */
const mapItems = ref<AlarmMapItem[]>([]);
const mapLevelCounts = computed(() => {
  const counts = { CRITICAL: 0, WARNING: 0, INFO: 0, other: 0 };
  for (const item of mapItems.value) {
    if (item.alarmLevel === "CRITICAL" || item.alarmLevel === "WARNING" || item.alarmLevel === "INFO") {
      counts[item.alarmLevel] += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
});
const mapFilters = reactive({ statusIndex: 1, levelIndex: 0 });
const mapChartEl = ref<HTMLElement | null>(null);
let mapChart: echarts.ECharts | null = null;
let mapResizeObserver: ResizeObserver | null = null;
/** 最近一次成功加载的筛选串（当前实现下拉即重查，仅作变更核对留用） */
let mapLoadedQuery = "";

function currentMapQuery(): string {
  return JSON.stringify([mapStatusOptions[mapFilters.statusIndex].value, mapLevelOptions[mapFilters.levelIndex].value]);
}

/** 自定义下拉开合（status/level 互斥）；点页面其他区域由 document mousedown 关闭 */
const activeMapSelect = ref<"status" | "level" | null>(null);

function closeMapSelect(event?: Event) {
  // 点的还在筛选下拉区域内（触发器/菜单选项）时不关：交给各自的 click 逻辑处理，
  // 否则 mousedown 先关菜单会让随后的选项 click 落空
  if (event) {
    const target = event.target as HTMLElement | null;
    if (target && target.closest && target.closest(".map-filters")) return;
  }
  activeMapSelect.value = null;
}

function toggleMapSelect(key: "status" | "level") {
  activeMapSelect.value = activeMapSelect.value === key ? null : key;
}

function selectMapStatus(index: number) {
  mapFilters.statusIndex = index;
  activeMapSelect.value = null;
  if (mapChart) loadAlarmMap();
}

function selectMapLevel(index: number) {
  mapFilters.levelIndex = index;
  activeMapSelect.value = null;
  if (mapChart) loadAlarmMap();
}

async function loadAlarmMap() {
  if (mapLoading.value) return;
  mapLoading.value = true;
  mapError.value = false;
  const body: Record<string, unknown> = {};
  const status = mapStatusOptions[mapFilters.statusIndex].value;
  if (status !== null) body.status = status;
  const level = mapLevelOptions[mapFilters.levelIndex].value;
  if (level !== null) body.alarmLevel = level;
  try {
    const res = (await getAlarmMap(body)) as { code?: number; msg?: string; data?: { items?: AlarmMapItem[] } };
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    // 坐标非法的点位（后端已滤 999 哨兵值，这里再兜底一次类型异常）
    const items = ((res.data && res.data.items) || []).filter(
      (item) => typeof item.longitude === "number" && typeof item.latitude === "number",
    );
    mapPointCount.value = items.length;
    mapItems.value = items;
    mapLoadedQuery = currentMapQuery();
    renderMapChart(items);
  } catch {
    mapError.value = true;
  } finally {
    mapLoading.value = false;
  }
}

function renderMapChart(items: AlarmMapItem[]) {
  if (!mapChartEl.value || !mapChart) return;
  // 轴标签小数位按数据跨度自适应：设备集中（跨度<0.01°）保留 4 位，跨度大时缩短，
  // 配合 splitNumber=3 + hideOverlap，避免窄栏里经度数字叠在一起
  const axisDecimals = (values: number[]) => {
    if (values.length < 2) return 4;
    const span = Math.max(...values) - Math.min(...values);
    if (span >= 0.1) return 2;
    if (span >= 0.01) return 3;
    return 4;
  };
  const lngDecimals = axisDecimals(items.map((item) => item.longitude as number));
  const latDecimals = axisDecimals(items.map((item) => item.latitude as number));
  const series = MAP_LEVEL_SERIES.map((seriesDef) => {
    const matches =
      seriesDef.key === "other"
        ? (item: AlarmMapItem) => item.alarmLevel !== "CRITICAL" && item.alarmLevel !== "WARNING" && item.alarmLevel !== "INFO"
        : (item: AlarmMapItem) => item.alarmLevel === seriesDef.key;
    return {
      name: seriesDef.label,
      type: "scatter" as const,
      symbolSize: 16,
      itemStyle: { color: seriesDef.color, borderColor: "#ffffff", borderWidth: 1, opacity: 0.92 },
      data: items.filter(matches).map((item) => ({ value: [item.longitude, item.latitude], item })),
    };
  });
  mapChart.setOption(
    {
      // grid 底部留足 45° 斜排标签的空间（学爆管识别页 rotate 先例）
      grid: { left: 64, right: 26, top: 40, bottom: 56 },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(23, 32, 51, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#ffffff", fontSize: 12 },
        formatter: (params: { data?: { item?: AlarmMapItem } }) => {
          const item = params.data?.item;
          if (!item) return "";
          return [
            `设备：${item.deviceNumber || "-"}${item.deviceAlias ? `（${item.deviceAlias}）` : ""}`,
            `类型：${item.alarmTypeName || getRuleTypeText(item.alarmType)}`,
            `级别：${getLevelText(item.alarmLevel)}`,
            `触发值：${item.triggerValue == null ? "-" : String(item.triggerValue)}`,
            `首次触发：${fmtDateTime(item.firstTriggeredAt)}`,
          ].join("\n");
        },
      },
      // 图例用面板底部的色点条（带计数说明），图表内不再重复绘制 legend
      xAxis: {
        // 单位进轴名（学爆管识别页"压力(MPa)"写法）；标签 45° 斜排显示完整数值
        name: "经度(°E)",
        nameTextStyle: { color: "#8191a2", fontSize: 11 },
        type: "value",
        scale: true,
        splitNumber: 3,
        axisLine: { lineStyle: { color: "#d8e5ef" } },
        axisLabel: { color: "#52677b", fontSize: 11, rotate: 45, hideOverlap: true, formatter: (value: number) => value.toFixed(lngDecimals) },
        splitLine: { lineStyle: { color: "#edf3f8", type: "dashed" } },
      },
      yAxis: {
        name: "纬度(°N)",
        nameTextStyle: { color: "#8191a2", fontSize: 11 },
        type: "value",
        scale: true,
        splitNumber: 3,
        axisLine: { lineStyle: { color: "#d8e5ef" } },
        axisLabel: { color: "#52677b", fontSize: 11, hideOverlap: true, formatter: (value: number) => value.toFixed(latDecimals) },
        splitLine: { lineStyle: { color: "#edf3f8", type: "dashed" } },
      },
      series,
    },
    true,
  );
}

/* ========================= 左右分栏手柄（学爆管识别页：拖动调宽 / 单击折叠） ========================= */

/** 右栏初始宽度：跟随 clamp(360px, 22vw, 430px) 的默认档 */
const sideWidth = ref(
  typeof window !== "undefined" ? Math.min(430, Math.max(360, Math.round(window.innerWidth * 0.22))) : 420,
);
const isSideCollapsed = ref(false);
/** 宽屏才启用左右分栏（窄屏交给媒体查询单列堆叠，不用手柄） */
const wideLayout = ref(typeof window === "undefined" || window.innerWidth > 1024);

function syncWideLayout() {
  wideLayout.value = window.innerWidth > 1024;
}

const layoutStyle = computed<Record<string, string> | undefined>(() => {
  if (!wideLayout.value) return undefined;
  if (isSideCollapsed.value) {
    return { gridTemplateColumns: "minmax(0, 1fr) 24px" };
  }
  return { gridTemplateColumns: `minmax(0, 1fr) 24px minmax(0, ${sideWidth.value}px)` };
});

let resizeStartX = 0;
let resizeStartWidth = 0;
let resizeDragging = false;

function startResize(event: MouseEvent) {
  resizeStartX = event.clientX;
  resizeStartWidth = sideWidth.value;
  resizeDragging = false;
  document.addEventListener("mousemove", onSideResizeMove);
  document.addEventListener("mouseup", stopSideResize);
}

function onSideResizeMove(event: MouseEvent) {
  const diff = resizeStartX - event.clientX;
  // 位移超 3px 才算拖拽（与爆管识别页一致），否则视为单击
  if (Math.abs(diff) > 3) {
    resizeDragging = true;
  }
  // 下限 300 保证筛选可用，上限 55vw 不吞表格
  const maxWidth = Math.min(760, Math.floor(window.innerWidth * 0.55));
  sideWidth.value = Math.max(300, Math.min(maxWidth, resizeStartWidth + diff));
}

function stopSideResize() {
  document.removeEventListener("mousemove", onSideResizeMove);
  document.removeEventListener("mouseup", stopSideResize);
  if (!resizeDragging) {
    // 单击：折叠/展开右栏（display 隐藏保留图表实例，展开后 resize 复位）
    isSideCollapsed.value = !isSideCollapsed.value;
  }
  nextTick(() => {
    overviewChart && overviewChart.resize();
    mapChart && mapChart.resize();
  });
}

/* ========================= 生命周期 ========================= */

/** 右栏常驻图表：挂载后初始化（容器已在视口内），并拉概况/地图首批数据 */
function initSideCharts() {
  if (overviewChartEl.value && !overviewChart) {
    overviewChart = echarts.init(overviewChartEl.value);
    overviewResizeObserver = new ResizeObserver(() => overviewChart && overviewChart.resize());
    overviewResizeObserver.observe(overviewChartEl.value);
  }
  if (mapChartEl.value && !mapChart) {
    mapChart = echarts.init(mapChartEl.value);
    mapResizeObserver = new ResizeObserver(() => mapChart && mapChart.resize());
    mapResizeObserver.observe(mapChartEl.value);
  }
  loadOverview();
  loadAlarmMap();
}

async function loadDeptOptions() {
  try {
    const res = (await getDeptList()) as { code?: number; data?: DeptItem[] };
    deptList.value = res.data || [];
  } catch {
    deptList.value = [];
  }
}

onMounted(() => {
  loadAlarms(1, { applyFilters: true });
  loadDeptOptions();
  nextTick(initSideCharts);
  window.addEventListener("resize", syncWideLayout);
  // 下拉外部关闭用 mousedown：与触发器 click 不同事件，避免同一次点击"先开后关"
  document.addEventListener("mousedown", closeMapSelect);
  // #ifdef H5
  startPolling();
  // 页面从后台切回时立即刷新一次（轮询在 hidden 时跳过，回来可能已错过更新）
  document.addEventListener("visibilitychange", onVisibilityChange);
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  stopPolling();
  document.removeEventListener("visibilitychange", onVisibilityChange);
  // 拖拽中途卸载：摘掉挂在 document/window 上的监听
  document.removeEventListener("mousemove", onSideResizeMove);
  document.removeEventListener("mouseup", stopSideResize);
  window.removeEventListener("resize", syncWideLayout);
  document.removeEventListener("mousedown", closeMapSelect);
  if (overviewResizeObserver) {
    overviewResizeObserver.disconnect();
    overviewResizeObserver = null;
  }
  if (overviewChart) {
    overviewChart.dispose();
    overviewChart = null;
  }
  if (mapResizeObserver) {
    mapResizeObserver.disconnect();
    mapResizeObserver = null;
  }
  if (mapChart) {
    mapChart.dispose();
    mapChart = null;
  }
  // #endif
});
</script>

<style scoped lang="scss">
.alarm-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  /* 概况/地图面板展开后内容超出视口：允许整页滚动，避免底部内容被裁掉 */
  overflow-y: auto;
  overflow-x: hidden;
  background: #eef4f8;
}

/* 右侧常驻栏：概况 + 地图（同数据分析页左右网格的右栏模式） */
.side-column {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.side-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

/* 概况卡：按内容自适应（上限 52%），地图占剩余空间 */
.side-card--stats {
  flex: 0 1 auto;
  max-height: 52%;
}

/* 地图卡：占剩余空间，图表自适应填充；筛选菜单要向上弹出卡片外，故不裁溢出 */
.side-card--map {
  flex: 1;
  overflow: visible;
}

.side-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: none;
  padding: 12px 14px;
  border-bottom: 1px solid #edf3f8;
}

.side-card__head--map {
  flex-wrap: wrap;
}

.side-card__title {
  color: #172033;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.side-card__body {
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  box-sizing: border-box;
}

.side-card__body--map {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 概况：三个统计数字 */
.side-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.side-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 6px;
  text-align: center;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 4px;
}

.side-stat__label {
  color: #52677b;
  font-size: 12px;
  font-weight: 700;
}

.side-stat__num {
  color: #0f4c81;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
}

/* 概况：按级别 / 按类型分布 */
.side-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 4px;
}

.side-breakdown__group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 14px;
  min-width: 0;
}

.side-breakdown__label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
}

.side-breakdown__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #34495e;
  font-size: 12px;
  font-weight: 700;
}

.side-breakdown__item--na {
  color: #94a3b8;
  font-weight: 600;
}

.side-breakdown__num {
  color: #0f4c81;
  font-weight: 900;
}

.side-breakdown__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.side-breakdown__dot--INFO {
  background: #3b82f6;
}

.side-breakdown__dot--WARNING {
  background: #f59e0b;
}

.side-breakdown__dot--CRITICAL {
  background: #ef4444;
}

.side-chart-caption {
  display: block;
  margin-bottom: 6px;
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
}

.side-chart--trend {
  width: 100%;
  height: 140px;
}

.side-chart--map {
  flex: 1;
  width: 100%;
  min-height: 200px;
}

/* 地图筛选下拉（自定义菜单：uni picker 底部弹层在本布局会被裁，改为按钮下方弹出） */
.map-filters {
  display: flex;
  gap: 6px;
}

.map-filter {
  position: relative;
}

.map-filter__select {
  height: 24px;
  padding: 0 8px;
  color: #31506d;
  font-size: 11px;
  font-weight: 700;
  line-height: 24px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
}

.map-select-menu {
  position: absolute;
  /* 向上弹出：筛选按钮常在视口下缘，向下弹会整体出屏 */
  bottom: calc(100% + 4px);
  top: auto;
  right: 0;
  z-index: 30;
  min-width: 96px;
  max-height: 180px;
  overflow: hidden auto;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
}

.map-select-option {
  min-height: 32px;
  padding: 0 12px;
  color: #172033;
  font-size: 12px;
  font-weight: 700;
  line-height: 32px;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.map-select-option:last-child {
  border-bottom: 0;
}

.map-select-option:hover,
.map-select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.map-foot {
  flex: none;
  padding: 4px 2px 0;
  color: #52677b;
  font-size: 12px;
  font-weight: 700;
}

.map-foot--error {
  color: #b42318;
}

.map-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  flex: none;
  padding: 4px 2px 0;
}

.map-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #34495e;
  font-size: 12px;
  font-weight: 700;
}

.map-legend__item--zero {
  color: #a5b3c2;
}

.map-legend__item--zero .side-breakdown__dot {
  opacity: 0.45;
}

.map-legend__meta {
  margin-left: auto;
  color: #8191a2;
  font-size: 11px;
  font-weight: 600;
}

/* 表格 + 右侧统计地图栏（同数据分析页 sheet-layout 网格模式）；
   宽屏列模板由 layoutStyle 内联写入（手柄拖拽/折叠），此处默认值兜底 */
.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, clamp(360px, 22vw, 430px));
  flex: 1 0 auto;
  min-height: 420px;
  gap: 12px;
  margin-top: 12px;
  min-width: 0;
}

/* 左右分栏手柄（学爆管识别页交互）：拖动调宽度，单击折叠/展开右栏；
   胶囊按钮 + col-resize 光标 */
.split-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  user-select: none;
  z-index: 10;
}

.split-handle__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 56px;
  color: #0d82ee;
  font-size: 15px;
  font-weight: 900;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 999px;
  box-shadow: 0 4px 10px rgba(35, 72, 104, 0.14);
  transition: background 0.15s ease, color 0.15s ease;
}

.split-handle:hover .split-handle__btn {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

/* 概况卡：按内容自适应（上限 52%），地图占剩余空间 */
.side-card--stats {
  flex: 0 1 auto;
  max-height: 52%;
}

/* 折叠态：display 隐藏（图表实例保留，展开后 resize 复位） */
.side-column--hidden {
  display: none;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

/* 详情覆盖层：点"详情"时盖在右栏上，关闭后露出概况/地图 */
.detail-panel--overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
}

.detail-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e3edf5;
}

.detail-panel__title-wrap {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.detail-panel__title {
  color: #172033;
  font-size: 15px;
  font-weight: 800;
}

.detail-panel__subtitle {
  color: #52677b;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-panel__body {
  flex: 1;
  min-height: 0;
  padding: 14px 16px;
  box-sizing: border-box;
}

/* 摘要卡（蓝色竖线强调，同漏点详情） */
.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-summary__main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.detail-summary__label {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary__value {
  color: #0f4c81;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.detail-summary__alias {
  margin-left: 8px;
  color: #52677b;
  font-size: 13px;
  font-weight: 700;
}

.detail-summary__badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-summary__badge--type {
  display: inline-block;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  border-radius: 10px;
  color: #3b82f6;
  background: #eff6ff;
}

.detail-summary__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #edf3f8;
}

.detail-summary__meta-item {
  min-width: 0;
  padding: 7px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e8eef5;
}

.detail-summary__meta-label {
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.detail-summary__meta-value {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
}

/* 分组标题 */
.detail-section-title {
  display: block;
  margin: 14px 0 10px;
  color: #183755;
  font-size: 14px;
  font-weight: 900;
}

.detail-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  /* 单列堆叠时不需要分栏手柄，右栏始终展示 */
  .split-handle {
    display: none;
  }
  .side-column--hidden {
    display: flex;
  }
  /* 窄屏单列堆叠时右栏给足高度，地图/详情覆盖层才有空间 */
  .side-column {
    min-height: 560px;
  }
}

.toolbar-panel {
  flex: none;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.alarm-toolbar {
  display: grid;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  width: 100%;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.filter-group--date {
  flex: 0 0 auto;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input,
.filter-select {
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
  padding: 0 10px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.filter-datetime {
  flex: 0 0 205px;
  width: 205px;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  align-self: end;
  margin-left: 0;
}

.table-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
  margin-top: 0;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.refresh-status {
  color: #8191a2;
  font-size: 12px;
}

.refresh-status--failed {
  color: #d64541;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  height: 50px;
  padding: 0 20px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3ed;
}

.table-head__aux {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  min-width: 0;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table {
  width: 100%;
  background: #ffffff;
  font-size: 12px;
}

.table-row {
  display: grid;
  width: 100%;
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.record-table-row {
  /* 列宽模板由 alarmColumns.ts 的 processingGridColumns 内联绑定（字段配置化） */
  min-width: 1180px;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #20384f;
  min-height: 44px;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row:not(.table-row--header):nth-child(odd) {
  background: #ffffff;
}

.table-row:not(.table-row--header):nth-child(even) {
  background: #fbfdff;
}

.table-row:not(.table-row--header):hover {
  background: #edf7ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 3;
}

.table-row--header .table-cell {
  color: #415a73;
  font-size: 12px;
  background: #ffffff;
}

.table-cell:last-child {
  border-right: 0;
}

.col-index {
  justify-content: center;
  color: #64748b;
}

.col-check {
  justify-content: center;
}

.col-alarm-no,
.col-alarm-time {
  justify-content: center;
}

.col-action {
  gap: 6px;
  /* 操作列固定右侧：横向滚动时按钮始终可见，不再被裁切 */
  position: sticky;
  right: 0;
  z-index: 2;
  background: #ffffff;
  border-left: 1px solid #e3edf5;
}

.table-row--header .col-action {
  z-index: 3;
}

.table-row--selected .col-action {
  background: #f2f9ff;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 1px solid #9db4c9;
  border-radius: 3px;
  cursor: pointer;
}

.checkbox--checked,
.checkbox--partial {
  background: #0d82ee;
  border-color: #0d82ee;
}

.checkbox__mark {
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.table-action-btn {
  min-width: 52px;
  height: 28px;
  padding: 0 8px;
  margin: 0;
  color: #0d82ee;
  font-size: 12px;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 4px;
}

.table-action-btn--active {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.table-row--selected .table-cell {
  background: #f2f9ff;
}

.table-action-btn::after {
  border: 0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
  flex-shrink: 0;
}

.page-info {
  color: #64748b;
  font-size: 13px;
  padding: 10px;
}

.page-input {
  width: 40px;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
}

.page-btn {
  height: 30px;
  color: #31506d;
  font-size: 13px;
  margin: 0;
  padding: 0 12px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-btn::after {
  border: none;
}

.page-btn[disabled] {
  opacity: 0.5;
}

/* ========================= 按钮（对齐工单页规格） ========================= */

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.toolbar-actions .toolbar-button {
  height: 38px;
  line-height: 1.2;
}

.toolbar-button[disabled] {
  color: #93a5b8;
  background: #f1f5f9;
  border-color: #d8e1ea;
  cursor: not-allowed;
  box-shadow: none;
}


/* ========================= 状态胶囊 ========================= */

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
}

.status-pill--open {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.status-pill--processing {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.status-pill--done {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--closed {
  color: #6941c6;
  background: #f3f0ff;
  border-color: #d8ceff;
}

.level-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
}

.level-pill--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.level-pill--info {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.level-pill--warning {
  color: #b54708;
  background: #fffaeb;
  border-color: #fedf89;
}

.level-pill--critical {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

/* ========================= 弹窗 ========================= */

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-panel--form {
  width: min(860px, 96vw);
  max-height: min(760px, 92vh);
}

.dialog-panel--narrow {
  width: min(480px, 96vw);
  max-height: min(480px, 92vh);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 22px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  color: #5f7188;
  font-size: 13px;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.error-summary {
  flex: none;
  margin: 12px 24px 0;
  padding: 9px 12px;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
  background: #fff5f3;
  border: 1px solid #ffc9c0;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  padding: 14px 24px;
  background: #f8fbfe;
  border-top: 1px solid #edf3f8;
}

.dialog-footer .toolbar-button {
  min-width: 72px;
  height: 38px;
  line-height: 1.2;
}

/* ========================= 详情网格 ========================= */

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  background: #f8fbfe;
  border: 1px solid #e6eef5;
  border-radius: 6px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-item__label {
  color: #6a7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-item__value {
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========================= 表单 ========================= */

.alarm-dialog-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.form-field {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
}

.form-field--full {
  grid-column: 1 / -1;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  flex-shrink: 0;
  color: #64748b;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 4px;
}

.icon-button::after {
  border: 0;
}

.icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
}

.close-icon {
  position: relative;
  width: 14px;
  height: 14px;
}

.close-icon::before,
.close-icon::after {
  position: absolute;
  top: 6px;
  left: 0;
  width: 14px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 2px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::after {
  margin-left: 4px;
  color: #ef4444;
  content: "*";
}

.form-input,
.form-select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 38px;
  line-height: 38px;
  padding: 0 12px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  text-overflow: ellipsis;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.form-input:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 90px;
  padding: 10px 12px;
  color: #172033;
  font-size: 14px;
  line-height: 1.5;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-select--dropdown {
  background: #f7fbff;
  cursor: pointer;
}

.form-select--open {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-control--error,
.form-control--error:focus {
  background: #fffafa;
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: block;
  margin-top: 5px;
  color: #d92d20;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.select-field {
  position: relative;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 20;
  margin-top: 4px;
  overflow: hidden auto;
  max-height: 250px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
}

.select-option {
  min-height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.select-option:last-child {
  border-bottom: 0;
}

.select-option:hover,
.select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.input-placeholder {
  color: #9aa9b8;
}
</style>
