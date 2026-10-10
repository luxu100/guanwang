<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="toolbar-row toolbar-row--filters">
          <view class="filter-group">
          <text class="filter-label">{{ localeText("报警类型", "Alarm Type") }}</text>
          <picker :range="alarmTypeOptions" range-key="label" :value="filters.alarmTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ alarmTypeOptions[filters.alarmTypeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("报警级别", "Alarm Level") }}</text>
          <picker :range="alarmLevelOptions" range-key="label" :value="filters.alarmLevelIndex" @change="handleFilterLevelChange">
            <view class="filter-select">
              <text>{{ alarmLevelOptions[filters.alarmLevelIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("状态", "Status") }}</text>
          <picker :range="statusOptions" range-key="label" :value="filters.statusIndex" @change="handleFilterStatusChange">
            <view class="filter-select">
              <text>{{ statusOptions[filters.statusIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("设备编号", "Device No.") }}</text>
          <input v-model="filters.deviceNumber" class="filter-input" :placeholder="localeText('请输入设备编号', 'Enter device no.')" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("部门", "Department") }}</text>
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
          <text class="filter-label">{{ localeText("时间段", "Time Range") }}</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" :title="filterDateText.startTitle" :placeholder="filterDateText.startPlaceholder" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" :title="filterDateText.endTitle" :placeholder="filterDateText.endPlaceholder" />
          </view>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" @click="searchAlarms">{{ localeText("查询", "Search") }}</button>
          <button class="toolbar-button" @click="resetFilters">{{ localeText("重置", "Reset") }}</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 表格 + 右侧统计地图栏（同数据分析页左右网格）；行"详情"以覆盖层形式盖在右栏上 -->
    <view class="main-layout" :style="layoutStyle">
      <view class="table-panel">
      <view class="table-head">
        <text>{{ localeText("报警处理", "Alarm Management") }}</text>
        <view class="table-head__aux">
          <text v-if="pollFailed" class="refresh-status refresh-status--failed">{{ localeText("更新失败，正在重试", "Update failed. Retrying...") }}</text>
          <text v-else-if="lastRefreshSuccessAt" class="refresh-status">{{ localeText("已更新", "Updated") }} {{ fmtClock(lastRefreshSuccessAt) }}</text>
          <text class="table-head__meta">{{ localizedTotal(pagination.total) }}</text>
        </view>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header record-table-row" :style="{ gridTemplateColumns: processingGridColumnsNoCheck }">
            <view v-for="column in recordColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ localeText(column.label, column.labelEn) }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">{{ localeText("加载中...", "Loading...") }}</view>
          <view v-else-if="alarmList.length === 0" class="table-state">{{ localeText("暂无报警数据", "No alarms") }}</view>

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
                <button class="table-action-btn" :class="{ 'table-action-btn--active': selectedRecordKey === String(item.id) }" @click.stop="toggleDetail(item)">{{ localeText("详情", "Detail") }}</button>
                <button v-if="item.status === 'ACTIVE'" class="table-action-btn" @click.stop="openHandleDialog(item)">{{ localeText("确认", "Acknowledge") }}</button>
                <button v-if="item.status === 'ACTIVE' || item.status === 'CONFIRMED'" class="table-action-btn" @click.stop="openResolveDialog(item)">{{ localeText("关闭", "Close") }}</button>
              </view>
              <text v-else class="table-cell" :class="column.className" :title="cellText(item, column)">{{ cellText(item, column) }}</text>
            </template>
          </view>
        </view>
      </scroll-view>

      <view class="pagination-bar">
        <button class="page-btn" :disabled="pagination.current <= 1" @click="handlePageChange(pagination.current - 1)">
          {{ localeText("上一页", "Previous") }}
        </button>
        <text class="page-info">{{ localizedPageInfo(pagination.current, totalPages) }}</text>
        <button class="page-btn" :disabled="pagination.current >= totalPages" @click="handlePageChange(pagination.current + 1)">
          {{ localeText("下一页", "Next") }}
        </button>
        <text class="page-info">{{ localeText("到第", "Go to") }}</text>
        <input v-model.number="jumpPage" class="page-input" type="number" @keyup.enter="handlePageChange(jumpPage)" />
        <text class="page-info">{{ localeText("页", "page") }}</text>
        <button class="page-btn" :disabled="jumpPage === null || jumpPage < 1 || jumpPage > totalPages" @click="handlePageChange(jumpPage)">
          {{ localeText("跳转", "Go") }}
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
          <text class="side-card__title">{{ localeText("报警概况", "Alarm Overview") }}</text>
        </view>
        <scroll-view class="side-card__body" scroll-y>
          <view class="side-stats">
            <view class="side-stat">
              <text class="side-stat__label">{{ localeText("今日新增", "New Today") }}</text>
              <text class="side-stat__num">{{ overviewStats?.todayTotal ?? "-" }}</text>
            </view>
            <view class="side-stat">
              <text class="side-stat__label">{{ localeText("当前活跃", "Active") }}</text>
              <text class="side-stat__num">{{ overviewStats?.activeTotal ?? "-" }}</text>
            </view>
            <view class="side-stat">
              <text class="side-stat__label">{{ localeText("今日已处理", "Resolved Today") }}</text>
              <text class="side-stat__num">{{ overviewStats?.resolvedToday ?? "-" }}</text>
            </view>
          </view>
          <view class="side-breakdown">
            <view class="side-breakdown__group">
              <text class="side-breakdown__label">{{ localeText("按级别", "By Level") }}</text>
              <view v-for="lv in levelBreakdownItems" :key="lv.key" class="side-breakdown__item">
                <text class="side-breakdown__dot" :class="`side-breakdown__dot--${lv.key}`"></text>
                <text>{{ lv.label }}</text>
                <text class="side-breakdown__num">{{ lv.count }}</text>
              </view>
            </view>
            <view class="side-breakdown__group">
              <text class="side-breakdown__label">{{ localeText("按类型", "By Type") }}</text>
              <view v-for="tp in typeBreakdownItems" :key="tp.name" class="side-breakdown__item">
                <text>{{ tp.name }}</text>
                <text class="side-breakdown__num">{{ tp.count }}</text>
              </view>
              <text v-if="typeBreakdownItems.length === 0" class="side-breakdown__item side-breakdown__item--na">{{ localeText("暂无数据", "No data") }}</text>
            </view>
          </view>
          <text class="side-chart-caption">{{ localeText("近 7 天新增报警记录数", "New alarm records in the last 7 days") }}</text>
          <div ref="overviewChartEl" class="side-chart side-chart--trend"></div>
        </scroll-view>
      </view>

      <!-- 右侧常驻栏下半：报警分布地图（stats/map 散点，筛选后重查） -->
      <view class="side-card side-card--map">
        <view class="side-card__head side-card__head--map">
          <text class="side-card__title">{{ localeText("报警分布地图", "Alarm Distribution Map") }}</text>
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
                  {{ localeText(option.label, option.labelEn) }}
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
                  {{ localeText(option.label, option.labelEn) }}
                </view>
              </view>
            </view>
            <!-- 放大：弹大图弹窗查看（同筛选条件的点位） -->
            <view class="map-filter__select map-filter__select--action" @click.stop="openMapDialog">{{ localeText("放大", "Enlarge") }}</view>
          </view>
        </view>
        <view class="side-card__body side-card__body--map">
          <!-- 腾讯真实底图优先；SDK 加载失败（Key 域名白名单等）自动回退 echarts 散点 -->
          <div v-show="mapProvider === 'tencent'" ref="tMapContainer" class="side-chart side-chart--map"></div>
          <div v-show="mapProvider === 'google'" ref="gMapContainer" class="side-chart side-chart--map"></div>
          <div v-show="mapProvider === 'chart'" ref="mapChartEl" class="side-chart side-chart--map"></div>
          <view v-if="mapLoading" class="map-foot">{{ localeText("加载中...", "Loading...") }}</view>
          <view v-else-if="mapError" class="map-foot map-foot--error">{{ localeText("分布数据加载失败，切换筛选可重试", "Failed to load distribution, change filters to retry") }}</view>
          <view v-else class="map-legend">
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.CRITICAL === 0 }"><text class="side-breakdown__dot side-breakdown__dot--CRITICAL"></text>{{ localeText("严重", "Critical") }} {{ mapLevelCounts.CRITICAL }}</text>
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.WARNING === 0 }"><text class="side-breakdown__dot side-breakdown__dot--WARNING"></text>{{ localeText("警告", "Warning") }} {{ mapLevelCounts.WARNING }}</text>
            <text class="map-legend__item" :class="{ 'map-legend__item--zero': mapLevelCounts.INFO === 0 }"><text class="side-breakdown__dot side-breakdown__dot--INFO"></text>{{ localeText("提示", "Info") }} {{ mapLevelCounts.INFO }}</text>
            <text v-if="mapLevelCounts.other > 0" class="map-legend__item">{{ localeText("其他", "Other") }} {{ mapLevelCounts.other }}</text>
            <text class="map-legend__meta">{{ localeText("共", "Total") }} {{ mapPointCount }} {{ localeText("条报警 · ", "alarms at ") }} {{ mapGroups.length }} {{ localeText("个位置（无效坐标不显示）", "positions (invalid coordinates hidden)") }}</text>
          </view>
        </view>
      </view>

    <!-- 右侧详情覆盖层（同漏点页交互：点"详情"盖在右栏上，再点一次隐藏） -->
    <view v-if="selectedRecord" class="detail-panel detail-panel--overlay">
      <view class="detail-panel__head">
        <view class="detail-panel__title-wrap">
          <text class="detail-panel__title">{{ localeText("报警详情", "Alarm Details") }}</text>
          <text class="detail-panel__subtitle">{{ selectedRecord.ruleName || "-" }}</text>
        </view>
        <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeDetail">
          <text class="close-icon"></text>
        </button>
      </view>
      <scroll-view class="detail-panel__body detail-section" scroll-y>
        <!-- 摘要卡：设备 + 类型 + 级别 + 状态（蓝色竖线强调，同漏点详情） -->
        <view class="detail-summary">
          <view class="detail-summary__main">
            <text class="detail-summary__label">{{ localeText("设备编号", "Device No.") }}</text>
            <text class="detail-summary__value">{{ selectedRecord.deviceNumber || "-" }}<text v-if="selectedRecord.deviceAlias" class="detail-summary__alias">{{ selectedRecord.deviceAlias }}</text></text>
          </view>
          <view class="detail-summary__badges">
            <text class="detail-summary__badge detail-summary__badge--type">{{ getRuleTypeText(selectedRecord.alarmType, selectedRecord.alarmTypeName) }}</text>
            <text class="level-pill" :class="getLevelClass(selectedRecord.alarmLevel)">{{ getLevelText(selectedRecord.alarmLevel) }}</text>
            <text class="status-pill" :class="getStatusClass(selectedRecord.status)">{{ getStatusText(selectedRecord.status) }}</text>
          </view>
          <view class="detail-summary__meta">
            <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ localeText("设备别名", "Device Alias") }}</text><text class="detail-summary__meta-value">{{ selectedRecord.deviceAlias || "-" }}</text></view>
            <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ localeText("规则类型", "Rule Type") }}</text><text class="detail-summary__meta-value">{{ getRuleKindText(selectedRecord.ruleKind) }}</text></view>
            <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ localeText("最近有效压力", "Last Valid Pressure") }}</text><text class="detail-summary__meta-value">{{ devicePressureText }}</text></view>
          </view>
        </view>

        <!-- 触发信息 -->
        <text class="detail-section-title">{{ localeText("触发信息", "Trigger Details") }}</text>
        <view class="detail-grid">
          <view class="detail-item"><text class="detail-item__label">{{ localeText("命中规则", "Matched Rule") }}</text><text class="detail-item__value">{{ selectedRecord.ruleName || "-" }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("自定义字段", "Field") }}</text><text class="detail-item__value">{{ selectedRecord.fieldName || "-" }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("触发值", "Trigger Value") }}</text><text class="detail-item__value">{{ selectedRecord.triggerValue == null ? "-" : String(selectedRecord.triggerValue) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("触发次数", "Trigger Count") }}</text><text class="detail-item__value">{{ selectedRecord.triggerCount == null ? "-" : String(selectedRecord.triggerCount) }}</text></view>
        </view>

        <!-- 时间信息（整行） -->
        <text class="detail-section-title">{{ localeText("时间信息", "Timestamps") }}</text>
        <view class="detail-grid detail-grid--single">
          <view class="detail-item"><text class="detail-item__label">{{ localeText("首次触发", "First Triggered") }}</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.firstTriggeredAt) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("最后触发", "Last Triggered") }}</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.lastTriggeredAt) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("恢复时间", "Recovery Time") }}</text><text class="detail-item__value">{{ fmtDateTime(selectedRecord.recoveredAt) }}</text></view>
        </view>

        <!-- 处理信息 -->
        <text class="detail-section-title">{{ localeText("处理信息", "Handling Details") }}</text>
        <view class="detail-grid detail-grid--single">
          <view class="detail-item"><text class="detail-item__label">{{ localeText("处理人", "Handler") }}</text><text class="detail-item__value">{{ selectedRecord.handleUserId == null ? "-" : String(selectedRecord.handleUserId) }}</text></view>
          <view class="detail-item"><text class="detail-item__label">{{ localeText("处理备注", "Handling Notes") }}</text><text class="detail-item__value">{{ selectedRecord.handleRemark || "-" }}</text></view>
        </view>
      </scroll-view>
    </view>
    </view>
    </view>

    <view v-if="handleVisible" class="dialog-mask" @click="handleVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("确认报警", "Acknowledge Alarm") }}</text>
            <text class="dialog-subtitle">{{ handleRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="handleVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">{{ localeText("处理备注", "Handling Notes") }}</text>
            <textarea v-model="handleRemark" class="form-textarea" :placeholder="localeText('请输入处理备注', 'Enter handling notes')" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="handleVisible = false">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="handling" @click="submitHandle">{{ localeText("确认", "Acknowledge") }}</button>
        </view>
      </view>
    </view>

    <!-- 关闭报警弹窗（resolve：人工关闭，写恢复时间） -->
    <view v-if="resolveVisible" class="dialog-mask" @click="resolveVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("关闭报警", "Close Alarm") }}</text>
            <text class="dialog-subtitle">{{ resolveRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="resolveVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">{{ localeText("处理备注", "Handling Notes") }}</text>
            <textarea v-model="resolveRemark" class="form-textarea" :placeholder="localeText('请输入处理备注', 'Enter handling notes')" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="resolveVisible = false">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="resolving" @click="submitResolve">{{ localeText("确认关闭", "Confirm Close") }}</button>
        </view>
      </view>
    </view>

    <!-- 地图放大弹窗：大尺寸重绘当前筛选下的点位 -->
    <view v-if="mapDialogVisible" class="map-fullscreen-mask" @click="closeMapDialog">
      <view class="map-fullscreen" @click.stop>
        <view class="map-fullscreen__head">
          <text class="map-fullscreen__title">{{ localeText("报警分布地图", "Alarm Distribution Map") }}</text>
          <text class="map-fullscreen__meta">{{ localeText("共", "Total") }} {{ mapPointCount }} {{ localeText("条报警 · ", "alarms at ") }} {{ mapGroups.length }} {{ localeText("个位置", "positions") }}</text>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeMapDialog">
            <text class="close-icon"></text>
          </button>
        </view>
        <view class="map-fullscreen__body">
          <div v-show="mapProvider === 'tencent'" ref="mapDialogTContainer" class="map-fullscreen__canvas"></div>
          <div v-show="mapProvider === 'google'" ref="mapDialogGContainer" class="map-fullscreen__canvas"></div>
          <div v-show="mapProvider === 'chart'" ref="mapDialogChartEl" class="map-fullscreen__canvas"></div>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import * as echarts from "echarts";
import { useI18n } from "@/i18n";
import { MAP_CONFIG, getMapProvider } from "@/services/map/map";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";
import { useLocaleText, useLocalizedPageInfo, useLocalizedTotal } from "@/i18n/localeText";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import {
  getAlarmPage,
  getAlarmDetail,
  getDevicePressureByNumber,
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

const { locale } = useI18n();
const localeText = useLocaleText();
const localizedPageInfo = useLocalizedPageInfo();
const localizedTotal = useLocalizedTotal();


/** 报警类型筛选（后端字符串枚举；首项"不限"= 不过滤）。computed：随语言切换实时刷新。 */
const alarmTypeOptions = computed(() => publicAlarmTypeOptions(localeText));
const alarmLevelOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  ...publicAlarmLevelOptions(localeText),
]);
/** 三态状态机（后端：ACTIVE→CONFIRMED→RESOLVED；自动恢复 ACTIVE→RESOLVED） */
const statusOptions = computed(() => publicAlarmStatusOptions(localeText));
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

const isEnglishLocale = computed(() => locale.value === "en-US");
const filterDateText = computed(() => ({
  startTitle: isEnglishLocale.value ? "Select Start Time" : "选择开始时间",
  startPlaceholder: isEnglishLocale.value ? "Select Start Time" : "请选择开始时间",
  endTitle: isEnglishLocale.value ? "Select End Time" : "选择结束时间",
  endPlaceholder: isEnglishLocale.value ? "Select End Time" : "请选择结束时间",
}));
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
  return mapEnumText(ALARM_TYPE_MAP_LOCAL, value, localeText, fallbackName);
}

function getRuleKindText(value?: string | null) {
  return mapEnumText(RULE_KIND_MAP_LOCAL, value, localeText);
}

function getLevelText(value?: string | null) {
  return mapEnumText(ALARM_LEVEL_MAP, value, localeText);
}

function getLevelClass(value?: string | number | null) {
  if (value === "INFO") return "level-pill--info";
  if (value === "WARNING") return "level-pill--warning";
  if (value === "CRITICAL") return "level-pill--critical";
  return "level-pill--muted"; // 未知级别用中性色，不误标为严重
}

function getStatusText(value?: string | null) {
  return mapEnumText(ALARM_STATUS_MAP, value, localeText);
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

function buildPageParams(page: number, source: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = {
    pageNum: page,
    pageSize: pagination.size,
    ...source,
  };
  return params;
}

/** 从当前筛选表单收集查询条件（不含分页） */
function collectFilterParams(): Record<string, unknown> {
  const filterParams: Record<string, unknown> = {};
  const alarmType = alarmTypeOptions.value[filters.alarmTypeIndex].value;
  if (alarmType !== null) filterParams.alarmType = alarmType;
  const alarmLevel = alarmLevelOptions.value[filters.alarmLevelIndex].value;
  if (alarmLevel !== null) filterParams.alarmLevel = alarmLevel;
  const status = statusOptions.value[filters.statusIndex].value;
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
  const params = buildPageParams(page, appliedQuery.value);
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
    // 打开中的详情随列表刷新同步：只在列表仍包含该行时替换引用；
    // 列表更新本身会使旧详情请求失效（detailRequestId++），旧响应不会回写
    if (selectedRecord.value) {
      detailRequestId++;
      const refreshed = alarmList.value.find((item) => String(item.id) === selectedRecordKey.value);
      if (refreshed) {
        selectedRecord.value = refreshed;
      } else {
        // 详情所在行不在当前页/筛选结果中，关闭面板避免展示过期数据
        closeDetail();
      }
    }
  } catch {
    if (requestId !== fetchRequestId) return;
    if (opts.silent) {
      // 轮询静默失败：保留上次成功数据，标记失败态（不弹窗，45s 一次的弹窗是骚扰）
      pollFailed.value = true;
      return;
    }
    alarmList.value = [];
    pagination.total = 0;
    pagination.current = page;
    uni.showToast({ title: localeText("加载报警列表失败", "Failed to load alarms"), icon: "none" });
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

/* 设备压力快照：详情打开时按设备编号实时查（不缓存，避免快照过期），在途请求按序号丢弃 */
const devicePressure = ref<string | number | null | undefined>(undefined);
let devicePressureRequestId = 0;

const devicePressureText = computed(() => {
  if (devicePressure.value === undefined) return "…";
  const text = devicePressure.value === null ? "" : String(devicePressure.value).trim();
  return text ? `${text}MPa` : "-";
});

async function loadDevicePressure(deviceNumber?: string) {
  const requestId = ++devicePressureRequestId;
  if (!deviceNumber) {
    devicePressure.value = null;
    return;
  }
  devicePressure.value = undefined;
  try {
    const res = (await getDevicePressureByNumber(deviceNumber)) as { code?: number; data?: { records?: Array<{ pressure?: string | number | null }> } };
    if (requestId !== devicePressureRequestId) return;
    devicePressure.value = res.code === 200 ? res.data?.records?.[0]?.pressure ?? null : null;
  } catch {
    if (requestId === devicePressureRequestId) devicePressure.value = null;
  }
}

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
  void loadDevicePressure(item.deviceNumber);
  const requestId = detailRequestId;
  detailLoading.value = true;
  try {
    const res = (await getAlarmDetail(item.id as number)) as { code?: number; msg?: string; data?: AlarmRecord };
    if (requestId !== detailRequestId) return; // 期间切换过详情/关闭/列表刷新，丢弃
    if (res.code !== undefined && res.code !== 200) return; // 失败保留行数据
    // 仍选中同一条才回写；期间面板已换行/关闭则丢弃
    if (res.data && selectedRecordKey.value === key) {
      selectedRecord.value = res.data;
      if (res.data.deviceNumber && res.data.deviceNumber !== item.deviceNumber) {
        void loadDevicePressure(res.data.deviceNumber);
      }
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
    uni.showToast({ title: localeText("确认成功", "Acknowledged"), icon: "success" });
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
    uni.showToast({ title: localeText("已关闭", "Closed"), icon: "success" });
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
      uni.showToast({ title: localeText("检测到新报警，已自动刷新", "New alarms detected, list refreshed"), icon: "none" });
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
    // 后端趋势接口时间只认 yyyy-MM-dd 或 ISO-T；granularity 缺省按跨度自动选（7 天=DAY）
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
    // 概况加载失败静默：图表区保持为空，不弹窗打扰
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
${localeText("新增报警记录", "New alarm records")}: ${params[0].value}${localeText(" 条", " item(s)")}`,
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

let overviewResizeObserver: ResizeObserver | null = null;

/* ========================= 报警分布地图（stats/map，echarts 散点） ========================= */

/** 散点系列：按级别分桶着色（对齐后端文档建议 红/橙/蓝），未知级别归入灰色"其他" */
const MAP_LEVEL_SERIES = [
  { key: "CRITICAL", label: "严重", labelEn: "Critical", color: "#ef4444" },
  { key: "WARNING", label: "警告", labelEn: "Warning", color: "#f59e0b" },
  { key: "INFO", label: "提示", labelEn: "Info", color: "#3b82f6" },
  { key: "other", label: "其他", labelEn: "Other", color: "#94a3b8" },
] as const;

const mapStatusOptions = [
  { label: "全部状态", labelEn: "All Status", value: null as string | null },
  { label: "活跃", labelEn: "Active", value: "ACTIVE" },
  { label: "已确认", labelEn: "Confirmed", value: "CONFIRMED" },
  { label: "已关闭", labelEn: "Resolved", value: "RESOLVED" },
];
const mapStatusLabels = computed(() => mapStatusOptions.map((option) => localeText(option.label, option.labelEn)));
const mapLevelOptions = [
  { label: "全部级别", labelEn: "All Levels", value: null as string | null },
  { label: "提示", labelEn: "Info", value: "INFO" },
  { label: "警告", labelEn: "Warning", value: "WARNING" },
  { label: "严重", labelEn: "Critical", value: "CRITICAL" },
];
const mapLevelLabels = computed(() => mapLevelOptions.map((option) => localeText(option.label, option.labelEn)));

const mapChartEl = ref<HTMLElement | null>(null);
const mapLoading = ref(false);
const mapError = ref(false);
const mapPointCount = ref(0);
/** 当前已加载的点位（供图例按级别计数） */
const mapItems = ref<AlarmMapItem[]>([]);
/** 按坐标聚合后的点位组（同位置多条报警合成一个 marker，弹窗列明细） */
interface MapPointGroup {
  lng: number;
  lat: number;
  items: AlarmMapItem[];
}
const mapGroups = ref<MapPointGroup[]>([]);

/** 坐标有效性：真实 GPS 不会是整数经纬度，(120,30)/(0,0) 这类整数占位值视为无坐标 */
function isValidCoord(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Number.isInteger(value);
}

/** 同坐标报警聚合为一组（两台设备贴着装时 marker 会完全重叠） */
function groupMapItems(items: AlarmMapItem[]): MapPointGroup[] {
  const bucket = new Map<string, MapPointGroup>();
  for (const item of items) {
    const lng = item.longitude as number;
    const lat = item.latitude as number;
    const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    const group = bucket.get(key) || { lng, lat, items: [] };
    group.items.push(item);
    bucket.set(key, group);
  }
  return Array.from(bucket.values());
}

/** 组内最高级别决定 marker 颜色（有严重即标红） */
function groupLevel(items: AlarmMapItem[]): string {
  if (items.some((item) => item.alarmLevel === "CRITICAL")) return "CRITICAL";
  if (items.some((item) => item.alarmLevel === "WARNING")) return "WARNING";
  if (items.some((item) => item.alarmLevel === "INFO")) return "INFO";
  return "other";
}

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
let mapChart: echarts.ECharts | null = null;
let mapResizeObserver: ResizeObserver | null = null;
/** 最近一次成功加载的筛选串：展开时若筛选已变则重新拉取 */
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
    // 坐标非法的点位不下图：后端只滤 999 哨兵值，整数占位坐标（如 120,30）会把视野拉偏
    const items = ((res.data && res.data.items) || []).filter(
      (item) => isValidCoord(item.longitude) && isValidCoord(item.latitude),
    );
    mapPointCount.value = items.length;
    mapItems.value = items;
    mapGroups.value = groupMapItems(items);
    mapLoadedQuery = currentMapQuery();
    if (mapProvider.value === "tencent" && tMapInstance) {
      drawTencentMarkers();
    } else if (mapProvider.value === "google" && gMapInstance) {
      drawGoogleMarkers();
    } else {
      renderMapChart(mapChart, mapGroups.value);
    }
  } catch {
    mapError.value = true;
  } finally {
    mapLoading.value = false;
  }
}

/** 散点渲染（卡片与放大弹窗共用）：按坐标组画点，tooltip 列组内明细 */
function renderMapChart(target: echarts.ECharts | null, groups: MapPointGroup[]) {
  if (!target) return;
  // 轴标签小数位按数据跨度自适应：设备集中（跨度<0.01°）保留 4 位，跨度大时缩短，
  // 配合 splitNumber=3 + hideOverlap，避免窄栏里经度数字叠在一起
  const axisDecimals = (values: number[]) => {
    if (values.length < 2) return 4;
    const span = Math.max(...values) - Math.min(...values);
    if (span >= 0.1) return 2;
    if (span >= 0.01) return 3;
    return 4;
  };
  const lngDecimals = axisDecimals(groups.map((group) => group.lng));
  const latDecimals = axisDecimals(groups.map((group) => group.lat));
  const series = MAP_LEVEL_SERIES.map((seriesDef) => {
    const bucketGroups = groups.filter((group) => groupLevel(group.items) === seriesDef.key);
    return {
      name: localeText(seriesDef.label, seriesDef.labelEn),
      type: "scatter" as const,
      symbolSize: 16,
      itemStyle: { color: seriesDef.color, borderColor: "#ffffff", borderWidth: 1, opacity: 0.92 },
      data: bucketGroups.map((group) => ({ value: [group.lng, group.lat], group })),
    };
  });
  target.setOption(
    {
      // grid 底部留足 45° 斜排标签的空间（学爆管识别页 rotate 先例）
      grid: { left: 64, right: 26, top: 40, bottom: 56 },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(23, 32, 51, 0.92)",
        borderWidth: 0,
        textStyle: { color: "#ffffff", fontSize: 12 },
        formatter: (params: { data?: { group?: MapPointGroup } }) => {
          const group = params.data?.group;
          if (!group) return "";
          const lines = [`${localeText("该位置", "At this position")} ${group.items.length} ${localeText("条报警", "alarm(s)")}`];
          for (const item of group.items.slice(0, 5)) {
            lines.push(
              `· ${item.deviceNumber || "-"}${item.deviceAlias ? `（${item.deviceAlias}）` : ""} ${item.alarmTypeName || getRuleTypeText(item.alarmType)} · ${getLevelText(item.alarmLevel)} · ${fmtDateTime(item.firstTriggeredAt)}`,
            );
          }
          if (group.items.length > 5) {
            lines.push(`…${localeText("等共", "total")} ${group.items.length} ${localeText("条", "")}`);
          }
          return lines.join("\n");
        },
      },
      // 图例用面板底部的色点条（带计数说明），图表内不再重复绘制 legend
      xAxis: {
        // 单位进轴名（学爆管识别页"压力(MPa)"写法）；标签 45° 斜排显示完整数值
        name: localeText("经度(°E)", "Longitude(°E)"),
        nameTextStyle: { color: "#8191a2", fontSize: 11 },
        type: "value",
        scale: true,
        splitNumber: 3,
        axisLine: { lineStyle: { color: "#d8e5ef" } },
        axisLabel: { color: "#52677b", fontSize: 11, rotate: 45, hideOverlap: true, formatter: (value: number) => value.toFixed(lngDecimals) },
        splitLine: { lineStyle: { color: "#edf3f8", type: "dashed" } },
      },
      yAxis: {
        name: localeText("纬度(°N)", "Latitude(°N)"),
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

/* ========================= 腾讯地图底图（真实街道，可拖拽缩放） =========================
 * 复用 MapDialog/XTencentMap 同款懒加载方案与 Key；SDK 加载失败（如 Key 域名白名单未放行）
 * 自动回退 echarts 散点，保证任何环境都有可用地图。 */

type TencentLatLngLike = unknown;

interface TencentMapInstanceLike {
  destroy?: () => void;
  resize?: () => void;
  fitBounds?: (bounds: unknown, options?: unknown) => void;
  getZoom?: () => number;
  setZoom?: (zoom: number) => void;
}

interface TencentMarkerGeometryLike {
  id: string;
  position: TencentLatLngLike;
  styleId?: string;
  properties?: { lng: number; lat: number; items: AlarmMapItem[] };
}

interface TencentMultiMarkerLike {
  setMap?: (map: unknown) => void;
  on?: (event: string, handler: (evt: { geometry?: TencentMarkerGeometryLike }) => void) => void;
}

interface TencentInfoWindowLike {
  setContent?: (html: string) => void;
  setPosition?: (position: TencentLatLngLike) => void;
  open?: () => void;
  close?: () => void;
}

interface TencentMapApiLike {
  LatLng: { new (lat: number, lng: number): TencentLatLngLike };
  Map: { new (container: HTMLElement, options: { center: TencentLatLngLike; zoom: number; pitch: number; rotation: number }): TencentMapInstanceLike };
  MultiMarker: { new (options: { map: TencentMapInstanceLike; styles?: Record<string, unknown>; geometries: TencentMarkerGeometryLike[] }): TencentMultiMarkerLike };
  InfoWindow?: { new (options: { map: TencentMapInstanceLike; position?: TencentLatLngLike; content?: string; offset?: { x: number; y: number } }): TencentInfoWindowLike };
  MarkerStyle?: { new (options: { color: string }): unknown };
  LatLngBounds?: { new (): { extend(latLng: TencentLatLngLike): void } };
}

const TENCENT_MAP_SCRIPT_ID = "tencent-map-gl-sdk";
const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${MAP_CONFIG.tencentKey}`;

function getTMap(): TencentMapApiLike | null {
  return (window as unknown as { TMap?: TencentMapApiLike }).TMap || null;
}

/** 底图按语言自动选：中文=腾讯、外文=Google（与设备坐标图同规则）；SDK 加载失败回退 chart 散点 */
const mapProviderKind = computed(() => getMapProvider(locale.value));
const mapProvider = ref<"tencent" | "google" | "chart">(mapProviderKind.value === "google" ? "google" : "tencent");
const tMapContainer = ref<HTMLElement | null>(null);
let tMapInstance: TencentMapInstanceLike | null = null;
let tMapMarkers: TencentMultiMarkerLike | null = null;
let tMapResizeObserver: ResizeObserver | null = null;
let tencentSdkPromise: Promise<void> | null = null;

function loadTencentSdk(): Promise<void> {
  if (getTMap()) return Promise.resolve();
  if (tencentSdkPromise) return tencentSdkPromise;
  tencentSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    script.id = TENCENT_MAP_SCRIPT_ID;
    script.charset = "utf-8";
    script.src = TENCENT_MAP_SCRIPT_URL;
    script.onload = () => {
      if (getTMap()) resolve();
      else reject(new Error("TMap unavailable after script load"));
    };
    script.onerror = () => reject(new Error("TMap script failed to load"));
    if (!existing) document.body.appendChild(script);
  });
  return tencentSdkPromise;
}

function initTencentMap() {
  const TMap = getTMap();
  if (!TMap || !tMapContainer.value) {
    throw new Error("tencent map container unavailable");
  }
  const map = new TMap.Map(tMapContainer.value, {
    center: new TMap.LatLng(31.2304, 121.4737), // 初始中心（拿到点位后 fitBounds 自动适配）
    zoom: 12,
    pitch: 0,
    rotation: 0,
  });
  tMapInstance = map;
  tMapResizeObserver = new ResizeObserver(() => tMapInstance && tMapInstance.resize && tMapInstance.resize());
  tMapResizeObserver.observe(tMapContainer.value);
}

/** marker 按级别着色（散点/图例/腾讯底图/Google 底图同一套色） */
const MAP_LEVEL_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  WARNING: "#f59e0b",
  INFO: "#3b82f6",
  other: "#94a3b8",
};

/** 把点位组画到指定地图实例上（卡片与放大弹窗共用） */
function drawTencentMarkersTo(map: TencentMapInstanceLike, groups: MapPointGroup[]) {
  const TMap = getTMap();
  if (!TMap) return null;
  const styles: Record<string, unknown> = {};
  if (typeof TMap.MarkerStyle === "function") {
    for (const [key, color] of Object.entries(MAP_LEVEL_COLORS)) {
      styles[key] = new TMap.MarkerStyle({ color });
    }
  }
  const geometries = groups.map((group, index) => ({
    id: `map-group-${index}`,
    position: new TMap.LatLng(group.lat, group.lng),
    styleId: groupLevel(group.items),
    properties: group,
  }));
  const markers = new TMap.MultiMarker(
    Object.keys(styles).length ? { map, styles, geometries } : { map, geometries },
  );
  if (markers.on) {
    markers.on("click", (evt: { geometry?: { position?: unknown; properties?: MapPointGroup } }) => {
      const geometry = evt.geometry;
      const group = geometry && geometry.properties;
      if (!geometry || !group) return;
      let infoWindow = dialogInfoWindowOf(map);
      if (!infoWindow && typeof TMap.InfoWindow === "function") {
        infoWindow = new TMap.InfoWindow({ map, position: geometry.position, offset: { x: 0, y: -34 } });
        rememberDialogInfoWindow(map, infoWindow);
      }
      if (infoWindow) {
        infoWindow.setContent && infoWindow.setContent(buildGroupInfoHtml(group));
        infoWindow.setPosition && infoWindow.setPosition(geometry.position);
        infoWindow.open && infoWindow.open();
      }
    });
  }
  return markers;
}

/** 弹窗内信息窗句柄按地图实例分开记（卡片一张图、放大弹窗一张图） */
const tencentInfoWindows = new WeakMap<object, TencentInfoWindowLike>();
function rememberDialogInfoWindow(map: TencentMapInstanceLike, infoWindow: TencentInfoWindowLike) {
  tencentInfoWindows.set(map as object, infoWindow);
}
function dialogInfoWindowOf(map: TencentMapInstanceLike): TencentInfoWindowLike | null {
  return tencentInfoWindows.get(map as object) || null;
}

function drawTencentMarkers() {
  if (!tMapInstance) return;
  // 清掉上一批点位与信息窗
  if (tMapMarkers) {
    tMapMarkers.setMap && tMapMarkers.setMap(null);
    tMapMarkers = null;
  }
  const infoWindow = dialogInfoWindowOf(tMapInstance);
  if (infoWindow) {
    infoWindow.close && infoWindow.close();
  }
  const groups = mapGroups.value;
  if (!groups.length) return;
  tMapMarkers = drawTencentMarkersTo(tMapInstance, groups);

  // 视野适配到点位范围；点位过于集中时限一下最大缩放级别
  const TMap = getTMap();
  try {
    if (TMap && typeof TMap.LatLngBounds === "function" && tMapInstance.fitBounds) {
      const bounds = new TMap.LatLngBounds();
      for (const group of groups) {
        bounds.extend(new TMap.LatLng(group.lat, group.lng));
      }
      tMapInstance.fitBounds(bounds, { padding: 40 });
      window.setTimeout(() => {
        const zoom = tMapInstance && tMapInstance.getZoom ? tMapInstance.getZoom() : 0;
        if (zoom > 17 && tMapInstance && tMapInstance.setZoom) {
          tMapInstance.setZoom(17);
        }
      }, 300);
    }
  } catch {
    // 视野适配失败不影响打点
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}

/** 同位置多条报警合并展示：标题行 + 每条一行的明细（最多列 5 条，超出折叠计数），腾讯/Google 信息窗共用 */
function buildGroupInfoHtml(group: MapPointGroup): string {
  const shown = group.items.slice(0, 5);
  const rows = shown
    .map((item) => {
      const levelColor = MAP_LEVEL_COLORS[item.alarmLevel || ""] || MAP_LEVEL_COLORS.other;
      return [
        `<div style="display:flex;align-items:center;gap:6px;line-height:1.7">`,
        `<span style="flex:none;width:8px;height:8px;border-radius:50%;background:${levelColor}"></span>`,
        `<b>${escapeHtml(item.deviceNumber || "-")}</b>${item.deviceAlias ? `<span style="color:#64748b">（${escapeHtml(item.deviceAlias)}）</span>` : ""}`,
        `<span style="color:#64748b">${escapeHtml(item.alarmTypeName || getRuleTypeText(item.alarmType))} · ${escapeHtml(getLevelText(item.alarmLevel))} · ${escapeHtml(fmtDateTime(item.firstTriggeredAt))}</span>`,
        `</div>`,
      ].join("");
    })
    .join("");
  const more = group.items.length > shown.length ? `<div style="color:#94a3b8;padding-top:2px">…${localeText("等共", "total")} ${group.items.length} ${localeText("条报警", "alarm(s)")}</div>` : "";
  return [
    '<div style="font:12px/1.6 sans-serif;min-width:230px;max-width:300px">',
    `<div style="font-weight:800;margin-bottom:4px">${localeText("该位置", "At this position")} ${group.items.length} ${localeText("条报警", "alarm(s)")}</div>`,
    rows,
    more,
    "</div>",
  ].join("");
}

function destroyTencentMap() {
  if (tMapResizeObserver) {
    tMapResizeObserver.disconnect();
    tMapResizeObserver = null;
  }
  if (tMapInstance) {
    const infoWindow = dialogInfoWindowOf(tMapInstance);
    infoWindow && infoWindow.close && infoWindow.close();
  }
  if (tMapMarkers) {
    tMapMarkers.setMap && tMapMarkers.setMap(null);
    tMapMarkers = null;
  }
  if (tMapInstance) {
    tMapInstance.destroy && tMapInstance.destroy();
    tMapInstance = null;
  }
}

/* ========================= Google 地图底图（外文语言环境，与设备坐标图同源） =========================
 * 复用 @/utils/googleMapsLoader（Key、超时、错误提示齐全）。Map/InfoWindow 在 maps 库、
 * Marker 在 marker 库、LatLngBounds/event 属 core（bootstrap 后全局可用）；加载失败同样回退 echarts 散点。 */

const gMapContainer = ref<HTMLElement | null>(null);
let googleMapsLibrary: google.maps.MapsLibrary | null = null;
let googleMarkerLibrary: google.maps.MarkerLibrary | null = null;
let gMapInstance: google.maps.Map | null = null;
let gMapMarkers: google.maps.Marker[] = [];
let gMapResizeObserver: ResizeObserver | null = null;

function loadGoogleMapStack(): Promise<void> {
  return loadGoogleMaps().then(async (mapsLibrary) => {
    googleMapsLibrary = mapsLibrary;
    googleMarkerLibrary = await google.maps.importLibrary("marker");
  });
}

function initGoogleMap() {
  if (!googleMapsLibrary || !gMapContainer.value) {
    throw new Error("google map container unavailable");
  }
  gMapInstance = new googleMapsLibrary.Map(gMapContainer.value, {
    center: { lat: 31.2304, lng: 121.4737 }, // 初始中心（拿到点位后 fitBounds 自动适配）
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
  gMapResizeObserver = new ResizeObserver(() => {
    if (gMapInstance) {
      google.maps.event.trigger(gMapInstance, "resize");
    }
  });
  gMapResizeObserver.observe(gMapContainer.value);
}

/** 圆点图标直出 SVG data URL：白描边与散点视觉一致，也不依赖具体库导出 */
function googleLevelIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="${color}" stroke="#ffffff" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** 信息窗句柄按地图实例分开记（卡片一张图、放大弹窗一张图），与腾讯侧同套路 */
const googleInfoWindows = new WeakMap<object, google.maps.InfoWindow>();
function rememberGoogleInfoWindow(map: google.maps.Map, infoWindow: google.maps.InfoWindow) {
  googleInfoWindows.set(map as object, infoWindow);
}
function googleInfoWindowOf(map: google.maps.Map): google.maps.InfoWindow | null {
  return googleInfoWindows.get(map as object) || null;
}

/** 把点位组画到指定 Google 地图实例上（卡片与放大弹窗共用） */
function drawGoogleMarkersTo(map: google.maps.Map, groups: MapPointGroup[]): google.maps.Marker[] {
  if (!googleMarkerLibrary || !googleMapsLibrary) return [];
  const MarkerCtor = googleMarkerLibrary.Marker;
  const InfoWindowCtor = googleMapsLibrary.InfoWindow;
  return groups.map((group) => {
    const marker = new MarkerCtor({
      map,
      position: { lat: group.lat, lng: group.lng },
      icon: googleLevelIcon(MAP_LEVEL_COLORS[groupLevel(group.items)] || MAP_LEVEL_COLORS.other),
      title: `${localeText("该位置", "At this position")} ${group.items.length} ${localeText("条报警", "alarm(s)")}`,
    });
    marker.addListener("click", () => {
      let infoWindow = googleInfoWindowOf(map);
      if (!infoWindow) {
        infoWindow = new InfoWindowCtor();
        rememberGoogleInfoWindow(map, infoWindow);
      }
      infoWindow.setContent(buildGroupInfoHtml(group));
      infoWindow.open({ map, anchor: marker });
    });
    return marker;
  });
}

/** 视野适配到点位范围；点位过于集中时限一下最大缩放级别（与腾讯侧一致） */
function fitGoogleBounds(map: google.maps.Map, groups: MapPointGroup[], padding: number) {
  try {
    const bounds = new google.maps.LatLngBounds();
    for (const group of groups) {
      bounds.extend({ lat: group.lat, lng: group.lng });
    }
    map.fitBounds(bounds, padding);
    window.setTimeout(() => {
      // getZoom 类型是 number | undefined（加载初期可能取不到）
      if ((map.getZoom() ?? 0) > 17) {
        map.setZoom(17);
      }
    }, 300);
  } catch {
    // 视野适配失败不影响打点
  }
}

function drawGoogleMarkers() {
  if (!gMapInstance) return;
  for (const marker of gMapMarkers) {
    marker.setMap(null);
  }
  gMapMarkers = [];
  const infoWindow = googleInfoWindowOf(gMapInstance);
  infoWindow && infoWindow.close();
  const groups = mapGroups.value;
  if (!groups.length) return;
  gMapMarkers = drawGoogleMarkersTo(gMapInstance, groups);
  fitGoogleBounds(gMapInstance, groups, 40);
}

function destroyGoogleMap() {
  if (gMapResizeObserver) {
    gMapResizeObserver.disconnect();
    gMapResizeObserver = null;
  }
  if (gMapInstance) {
    const infoWindow = googleInfoWindowOf(gMapInstance);
    infoWindow && infoWindow.close();
    google.maps.event.clearInstanceListeners(gMapInstance);
  }
  for (const marker of gMapMarkers) {
    marker.setMap(null);
  }
  gMapMarkers = [];
  gMapInstance = null;
  // Google SDK 没有 destroy：清空容器避免下次重建时残留旧实例 DOM（与 LocaleCoordinateMap 同做法）
  if (gMapContainer.value) {
    gMapContainer.value.innerHTML = "";
  }
}

/** 真实底图 SDK 加载失败：回退 echarts 散点，保证任何环境都有可用地图 */
function fallbackToChart() {
  mapProvider.value = "chart";
  nextTick(() => {
    if (mapChartEl.value && !mapChart) {
      mapChart = echarts.init(mapChartEl.value);
      mapResizeObserver = new ResizeObserver(() => mapChart && mapChart.resize());
      mapResizeObserver.observe(mapChartEl.value);
    }
    loadAlarmMap();
  });
}

/** 按当前 provider 初始化底图并渲染：已有数据直接画，否则拉一次点位 */
function setupMapProvider() {
  const drawCurrent = () => {
    if (mapGroups.value.length) {
      if (mapProvider.value === "tencent") {
        drawTencentMarkers();
      } else if (mapProvider.value === "google") {
        drawGoogleMarkers();
      }
    } else {
      loadAlarmMap();
    }
  };
  if (mapProvider.value === "google") {
    loadGoogleMapStack()
      .then(() => {
        initGoogleMap();
        drawCurrent();
      })
      .catch(() => fallbackToChart());
  } else {
    loadTencentSdk()
      .then(() => {
        initTencentMap();
        drawCurrent();
      })
      .catch(() => fallbackToChart());
  }
}

// 语言切换时底图跟着换（腾讯↔Google）：销毁旧的、按新语言重建
watch(mapProviderKind, (kind) => {
  const target: "tencent" | "google" = kind === "google" ? "google" : "tencent";
  if (mapProvider.value === target) return;
  destroyTencentMap();
  destroyGoogleMap();
  mapProvider.value = target;
  setupMapProvider();
});

/* ========================= 地图放大弹窗（大尺寸重绘当前点位） ========================= */

const mapDialogVisible = ref(false);
const mapDialogTContainer = ref<HTMLElement | null>(null);
const mapDialogGContainer = ref<HTMLElement | null>(null);
const mapDialogChartEl = ref<HTMLElement | null>(null);
let mapDialogTMap: TencentMapInstanceLike | null = null;
let mapDialogGMap: google.maps.Map | null = null;
let mapDialogGMarkers: google.maps.Marker[] = [];
let mapDialogMarkers: TencentMultiMarkerLike | null = null;
let mapDialogChart: echarts.ECharts | null = null;
let mapDialogResizeObserver: ResizeObserver | null = null;

function openMapDialog() {
  mapDialogVisible.value = true;
  nextTick(initMapDialog);
}

function initMapDialog() {
  const groups = mapGroups.value;
  const first = groups[0];
  if (mapProvider.value === "tencent") {
    const TMap = getTMap();
    if (!TMap || !mapDialogTContainer.value) return;
    const map = new TMap.Map(mapDialogTContainer.value, {
      center: first ? new TMap.LatLng(first.lat, first.lng) : new TMap.LatLng(31.2304, 121.4737),
      zoom: 14,
      pitch: 0,
      rotation: 0,
    });
    mapDialogTMap = map;
    mapDialogResizeObserver = new ResizeObserver(() => mapDialogTMap && mapDialogTMap.resize && mapDialogTMap.resize());
    mapDialogResizeObserver.observe(mapDialogTContainer.value);
    mapDialogMarkers = drawTencentMarkersTo(map, groups);
    try {
      if (typeof TMap.LatLngBounds === "function" && groups.length && map.fitBounds) {
        const bounds = new TMap.LatLngBounds();
        for (const group of groups) {
          bounds.extend(new TMap.LatLng(group.lat, group.lng));
        }
        map.fitBounds(bounds, { padding: 60 });
      }
    } catch {
      // 视野适配失败不影响打点
    }
  } else if (mapProvider.value === "google") {
    if (!googleMapsLibrary || !mapDialogGContainer.value) return;
    mapDialogGMap = new googleMapsLibrary.Map(mapDialogGContainer.value, {
      center: first ? { lat: first.lat, lng: first.lng } : { lat: 31.2304, lng: 121.4737 },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapDialogResizeObserver = new ResizeObserver(() => {
      if (mapDialogGMap) {
        google.maps.event.trigger(mapDialogGMap, "resize");
      }
    });
    mapDialogResizeObserver.observe(mapDialogGContainer.value);
    mapDialogGMarkers = drawGoogleMarkersTo(mapDialogGMap, groups);
    fitGoogleBounds(mapDialogGMap, groups, 60);
  } else if (mapDialogChartEl.value) {
    mapDialogChart = echarts.init(mapDialogChartEl.value);
    renderMapChart(mapDialogChart, groups);
  }
}

function closeMapDialog() {
  if (mapDialogResizeObserver) {
    mapDialogResizeObserver.disconnect();
    mapDialogResizeObserver = null;
  }
  if (mapDialogTMap) {
    const infoWindow = dialogInfoWindowOf(mapDialogTMap);
    infoWindow && infoWindow.close && infoWindow.close();
  }
  if (mapDialogMarkers) {
    mapDialogMarkers.setMap && mapDialogMarkers.setMap(null);
    mapDialogMarkers = null;
  }
  if (mapDialogTMap) {
    mapDialogTMap.destroy && mapDialogTMap.destroy();
    mapDialogTMap = null;
  }
  if (mapDialogGMap) {
    const infoWindow = googleInfoWindowOf(mapDialogGMap);
    infoWindow && infoWindow.close();
    google.maps.event.clearInstanceListeners(mapDialogGMap);
  }
  for (const marker of mapDialogGMarkers) {
    marker.setMap(null);
  }
  mapDialogGMarkers = [];
  mapDialogGMap = null;
  if (mapDialogGContainer.value) {
    mapDialogGContainer.value.innerHTML = "";
  }
  if (mapDialogChart) {
    mapDialogChart.dispose();
    mapDialogChart = null;
  }
  mapDialogVisible.value = false;
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
  loadOverview();
  setupMapProvider();
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
  destroyTencentMap();
  destroyGoogleMap();
  closeMapDialog();
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

/* 放大按钮：蓝色强调，与筛选下拉区分 */
.map-filter__select--action {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

/* 地图放大弹窗 */
.map-fullscreen-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 35, 55, 0.36);
}

.map-fullscreen {
  display: flex;
  flex-direction: column;
  width: min(1100px, 94vw);
  height: min(660px, 86vh);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.24);
}

.map-fullscreen__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding: 12px 16px;
  border-bottom: 1px solid #edf3f8;
}

.map-fullscreen__title {
  color: #172033;
  font-size: 15px;
  font-weight: 900;
}

.map-fullscreen__meta {
  flex: 1;
  min-width: 0;
  color: #7f92a6;
  font-size: 12px;
  font-weight: 700;
}

.map-fullscreen__body {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #edf5ff;
}

.map-fullscreen__canvas {
  display: block;
  width: 100%;
  height: 100%;
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

/* 表格 + 右侧详情双栏布局（同漏点页 main-layout 模式） */
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

/* 地图卡：占剩余空间，图表自适应填充；筛选菜单要向上弹出卡片外，故不裁溢出 */

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
