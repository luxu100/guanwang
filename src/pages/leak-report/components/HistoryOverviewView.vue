<template>
  <view class="history-overview-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">{{ t("filter.timeRange") }}</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" :title="t('time.pleaseSelectStartTime')" :placeholder="t('time.pleaseSelectStartTime')" />
            <text class="filter-separator">{{ t("time.to") }}</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" :title="t('time.pleaseSelectEndTime')" :placeholder="t('time.pleaseSelectEndTime')" />
          </view>
        </view>

        <!-- 渗漏记录tab：渗漏状态 + 巡检人员 -->
        <template v-if="activeDataTab === 'leakage'">
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.leakStatus") }}</text>
            <picker :range="activeLeakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.inspector") }}</text>
            <input v-model="filters.inspector" class="filter-input" :placeholder="t('filter.pleaseInputInspector')" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 设备上报tab：渗漏状态 + 设备编号 -->
        <template v-else-if="activeDataTab === 'deviceUpload'">
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.leakStatus") }}</text>
            <picker :range="activeLeakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.deviceNumber") }}</text>
            <input v-model="filters.deviceNumber" class="filter-input" :placeholder="t('filter.pleaseInputDeviceNumber')" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 算法分析tab：设备编号 + 算法状态 + 算法名称 -->
        <template v-else-if="activeDataTab === 'algorithm'">
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.deviceNumber") }}</text>
            <input v-model="filters.deviceNumber" class="filter-input" :placeholder="t('filter.pleaseInputDeviceNumber')" placeholder-class="input-placeholder" />
          </view>
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.executeStatus") }}</text>
            <picker :range="algorithmStatusOptions" range-key="label" @change="handleAlgorithmStatusChange">
              <view class="filter-select">
                <text>{{ currentAlgorithmStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">{{ t("filter.algorithmName") }}</text>
            <input v-model="filters.algorithmName" class="filter-input" :placeholder="t('filter.pleaseInputAlgorithmName')" placeholder-class="input-placeholder" />
          </view>
        </template>

        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchHistory">{{ t("common.search") }}</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">{{ t("common.reset") }}</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" :aria-label="t('common.refresh')" @click="fetchHistoryData">
            <text class="icon-refresh"></text>
          </button>
          <view class="export-dropdown">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="exportMenuVisible = !exportMenuVisible">{{ t("common.export") }}</button>
            <view v-if="exportMenuVisible" class="export-menu">
              <view class="export-menu__item" @click="handleExport('current')">{{ t("common.exportCurrentPage") }}</view>
              <view class="export-menu__item" @click="handleExport('all')">{{ t("common.exportAll") }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs-bar">
      <view
        v-for="tab in historyTabs"
        :key="tab.value"
        class="tabs-bar__item"
        :class="{ 'tabs-bar__item--active': activeDataTab === tab.value }"
        @click="switchDataTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- KPI 概览条 -->
    <view class="kpi-strip">
      <view
        v-for="kpi in currentKpis"
        :key="kpi.label"
        class="kpi-card"
        :class="kpi.tone ? `kpi-card--${kpi.tone}` : ''"
      >
        <text class="kpi-card__label">{{ kpi.label }}</text>
        <view class="kpi-card__value-row">
          <text class="kpi-card__value">{{ kpi.value }}</text>
          <text v-if="kpi.hint" class="kpi-card__hint">{{ kpi.hint }}</text>
        </view>
      </view>
    </view>

    <!-- 趋势图区（可折叠） -->
    <view class="chart-zone" :class="{ 'chart-zone--collapsed': chartCollapsed }">
      <view class="chart-zone__header">
        <view class="chart-zone__title-wrap" @click="toggleChartCollapse">
          <view class="chart-zone__title-row">
            <text class="chart-zone__title">{{ t("historyOverview.chart.dataTrend") }} · {{ activeTabLabel }}</text>
            <text class="chart-zone__toggle">{{ chartCollapsed ? t("historyOverview.chart.expand") : t("historyOverview.chart.collapse") }}</text>
          </view>
          <text v-if="!chartCollapsed" class="chart-zone__hint">{{ currentChartConfig.hint }}</text>
        </view>
        <view v-if="!chartCollapsed" class="chart-zone__actions">
          <!-- 粒度切换：天/月/年（仅折线图显示，其他图保留占位避免按钮跳动） -->
          <view class="chart-zone__grain" :class="{ 'chart-zone__grain--hidden': currentChartConfig.type !== 'line' }">
            <view
              v-for="g in trendGrainOptions"
              :key="g.value"
              class="chart-zone__grain-btn"
              :class="{ 'chart-zone__grain-btn--active': trendGrainSize === g.value }"
              @click="trendGrainSize = g.value"
            >
              {{ g.label }}
            </view>
          </view>
          <view class="chart-zone__modes">
            <view
              v-for="opt in currentChartModes"
              :key="opt.value"
              class="chart-zone__mode"
              :class="{ 'chart-zone__mode--active': activeChartModeValue === opt.value }"
              @click="switchChartMode(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>
          <view class="chart-zone__scope">
            <view
              class="chart-zone__scope-btn"
              :class="{ 'chart-zone__scope-btn--active': chartDataScope === 'page' }"
              @click="chartDataScope !== 'page' && toggleChartDataScope()"
            >{{ t("historyOverview.chart.page") }}</view>
            <view
              class="chart-zone__scope-btn"
              :class="{ 'chart-zone__scope-btn--active': chartDataScope === 'all' }"
              @click="chartDataScope !== 'all' && toggleChartDataScope()"
            >{{ chartAllLoading ? t("historyOverview.chart.loading") : t("historyOverview.chart.all") }}</view>
          </view>
        </view>
      </view>
      <view v-show="!chartCollapsed" class="chart-zone__body">
        <!-- #ifdef H5 -->
        <div ref="chartEl" class="chart-zone__canvas"></div>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="chart-zone__fallback">{{ t("historyOverview.chart.h5Only") }}</view>
        <!-- #endif -->
      </view>
    </view>

    <!-- 主内容区 -->
    <LeakTableView
      :title="`${activeTabLabel} ${t('historyOverview.historyTitle')}`"
      :total="total"
      :page-num="pagination.pageNum"
      :page-size="pagination.pageSize"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      :detail-empty-text="t('historyOverview.detailEmpty')"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
      @jump-page="jumpToPage"
      @page-size-change="handlePageSizeChange"
    >
      <LeakDataTable
        :columns="activeColumnDefs"
        :data="records"
        :loading="loading"
        :grid-template-columns="tableGridTemplateColumns"
        :min-width="tableMinWidth"
        :selected-key="selectedRecordKey"
        :sort-field="sortField"
        :sort-order="sortOrder"
        :empty-text="t('historyOverview.noHistoryData')"
        :loading-text="t('common.loading')"
        :page-num="pagination.pageNum"
        :page-size="pagination.pageSize"
        :get-row-key="getRowKey"
        :get-field-value="getFieldValue"
        :format-date-time="formatDateTime"
        :label-fn="t"
        :header-row-class="`data-row--${activeDataTab}`"
        :body-row-class="`data-row--${activeDataTab}`"
        @sort="toggleSort"
        @row-click="selectRecord"
      >
        <!-- 状态标签（3种变体） -->
        <template #cell-statusTag="{ row, col }">
          <text v-if="col.statusVariant === 'leakage'" class="status-tag" :class="getLeakageStatusTagClass(row)">{{ getLeakageStatusDisplay(row) }}</text>
          <text v-else-if="col.statusVariant === 'deviceUpload'" class="status-tag" :class="getLeakStatusTagClass(row)">{{ getLeakStatusLabel(row) }}</text>
          <text v-else-if="col.statusVariant === 'algorithm' && getFieldValue(row, col.key)" class="status-tag" :class="getAlgorithmStatusTagClass(row)">{{ getAlgorithmStatusLabel(row) }}</text>
          <text v-else>-</text>
        </template>
        <!-- 算法名称翻译 -->
        <template #cell-algorithmName="{ row, col }">
          {{ translateAlgorithmName(getFieldValue(row, col.key)) }}
        </template>
      </LeakDataTable>

      <!-- 右侧详情 -->
      <template #detail>
        <view class="detail-body">
          <view class="detail-tabs">
            <view
              v-for="tab in detailTabs"
              :key="tab.value"
              class="detail-tab"
              :class="{ 'detail-tab--active': activeDetailTab === tab.value }"
              @click="activeDetailTab = tab.value"
            >{{ tab.label }}</view>
          </view>

          <!-- 基本信息 tab：摘要 + 时间信息 + 地点信息 + 音视频 -->
          <view v-if="activeDetailTab === 'basic'" class="detail-section">
            <!-- 摘要 -->
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">{{ summaryLabel }}</text>
                <text class="detail-summary__value">{{ summaryValue }}</text>
              </view>
              <view v-if="summaryMetaFields.length > 0" class="detail-summary__meta">
                <view v-for="item in summaryMetaFields" :key="item.label" class="detail-summary__meta-item">
                  <text class="detail-summary__meta-label">{{ item.label }}</text>
                  <text class="detail-summary__meta-value" :title="item.value">{{ item.value }}</text>
                </view>
              </view>
            </view>

            <!-- 时间信息（时间线） -->
            <view v-if="timeDetailFields.length > 0" class="time-section">
              <text class="detail-section-title">{{ t("leakManagement.timeInfo") }}</text>
              <view class="time-list">
                <view v-for="item in timeDetailFields" :key="item.label" class="time-row">
                  <view class="time-row__marker"></view>
                  <view class="time-row__content">
                    <text class="time-row__label">{{ item.label }}</text>
                    <text class="time-row__value">{{ item.value }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 地点信息 -->
            <view v-if="locationFields.length > 0" class="time-section time-section--location">
              <text class="detail-section-title">{{ t("leakManagement.locationInfo") }}</text>
              <view v-for="item in locationFields" :key="item.label" class="location-row">
                <text class="location-row__label">{{ item.label }}</text>
                <text class="location-row__value">{{ item.value }}</text>
              </view>
            </view>

            <!-- 音视频播放区（仅 leakage tab 显示） -->
            <view v-if="activeDataTab === 'leakage' && selectedRecord" class="time-section time-section--attach">
              <text class="detail-section-title">{{ t("historyOverview.relatedAudio") }}</text>
              <view class="attach-media">
                <view class="attach-media__item">
                  <view v-if="getFieldValue(selectedRecord, 'audioFile')" class="attach-media__player">
                    <button class="attach-play-btn" hover-class="attach-play-btn--hover" @click="openAudioDialog(selectedRecord)"><text class="play-icon icon-play"></text></button>
                    <text class="attach-media__hint">{{ t("common.clickToPlay") }}</text>
                  </view>
                  <text v-else class="attach-media__empty">{{ t("historyOverview.noAudioUploaded") }}</text>
                </view>
              </view>
              <text class="detail-section-title detail-section-title--video">{{ t("historyOverview.relatedVideo") }}</text>
              <view class="attach-media">
                <view class="attach-media__item">
                  <view v-if="getFieldValue(selectedRecord, 'sceneVideo')" class="attach-media__player">
                    <button class="attach-play-btn" hover-class="attach-play-btn--hover" @click="openVideoDialog(selectedRecord)"><text class="play-icon icon-play"></text></button>
                    <text class="attach-media__hint">{{ t("common.clickToPlay") }}</text>
                  </view>
                  <text v-else class="attach-media__empty">{{ t("historyOverview.noVideoUploaded") }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 详细信息 tab：其他字段（卡片网格） -->
          <view v-if="activeDetailTab === 'detail'" class="detail-section">
            <view v-if="cardFields.length > 0" class="detail-fields-grid">
              <view v-for="item in cardFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value" :title="item.value">{{ item.value }}</text>
              </view>
            </view>
            <view v-else class="attach-media__empty">{{ t("historyOverview.noHistoryData") }}</view>
          </view>
        </view>
      </template>
    </LeakTableView>

    <!-- ========== 视频播放浮层 ========== -->
    <view v-if="videoDialogVisible" class="video-dialog-mask" @click="onVideoMaskClick">
      <view class="video-dialog">
        <view class="video-dialog__head">
          <text class="video-dialog__title">{{ t("historyOverview.videoPlay") }}</text>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="t('common.close')" @click="closeVideoDialog"><text class="close-icon"></text></button>
        </view>
        <view class="video-dialog__body">
          <video
            v-if="currentVideoUrl"
            ref="videoPlayerRef"
            :src="currentVideoUrl"
            class="video-player"
            controls
            playsinline
            webkit-playsinline
            @loadedmetadata="onVideoLoadedMeta"
            @durationchange="onVideoDurationChange"
            @canplay="onVideoCanPlay"
            @timeupdate="onVideoTimeUpdate"
            @waiting="onVideoWaiting"
            @playing="onVideoPlaying"
          ></video>
          <view v-else class="video-empty">{{ t("historyOverview.videoLoadFailed") }}</view>
          <view v-if="videoLoading && currentVideoUrl" class="video-loading">{{ t("historyOverview.buffering") }}</view>
        </view>
        <view v-if="currentVideoUrl" class="video-dialog__info">
          <view class="video-info-row">
            <text class="video-info-label">{{ t("historyOverview.duration") }}</text>
            <text class="video-info-value">{{ formatMediaTime(videoDuration) }}</text>
          </view>
          <view class="video-info-row">
            <text class="video-info-label">{{ t("historyOverview.progress") }}</text>
            <text class="video-info-value">{{ formatMediaTime(videoCurrentTime) }} / {{ formatMediaTime(videoDuration) }}</text>
          </view>
          <view class="video-seek-bar">
            <view class="video-seek-filled" :style="{ width: videoProgress + '%' }"></view>
            <view class="video-seek-thumb" :style="{ left: videoProgress + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 音频播放浮层 ========== -->
    <view v-if="audioDialogVisible" class="audio-dialog-mask" @click="onAudioMaskClick">
      <view class="audio-dialog">
        <view class="audio-dialog__head">
          <text class="audio-dialog__title">{{ currentAudioTitle || t("historyOverview.audioPlay") }}</text>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="t('common.close')" @click="closeAudioDialog"><text class="close-icon"></text></button>
        </view>
        <view class="audio-dialog__body">
          <view v-if="!currentAudioUrl" class="audio-empty">{{ t("historyOverview.audioLoadFailed") }}</view>
          <view v-else class="audio-player">
            <view class="audio-player__icon">
              <view class="audio-cover">
                <view class="audio-cover__ring"></view>
                <view class="audio-cover__dot"></view>
              </view>
            </view>
            <view class="audio-player__info">
              <text class="audio-player__title">{{ currentAudioTitle }}</text>
              <view v-if="audioLoading" class="audio-player__loading">{{ t("historyOverview.buffering") }}</view>
              <view class="audio-player__progress">
                <text class="audio-time">{{ formatMediaTime(audioCurrentTime) }}</text>
                <view class="audio-seek-bar">
                  <view class="audio-seek-filled" :style="{ width: audioProgress + '%' }"></view>
                  <view class="audio-seek-thumb" :style="{ left: audioProgress + '%' }"></view>
                </view>
                <text class="audio-time">{{ formatMediaTime(audioDuration) }}</text>
              </view>
              <button class="audio-play-btn" hover-class="audio-play-btn--hover" @click="toggleAudioPlayState">
                <text class="play-icon-large" :class="audioPlaying ? 'icon-pause-large' : 'icon-play-large'"></text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount, onUnmounted, nextTick, watch } from "vue";
import * as echarts from "echarts";
import {
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadDetail,
  getAlgorithmResultHistoryPage,
  getAlgorithmResultHistoryDetail,
} from "@/services/leak-report/history-overview";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/components/LeakTableView.vue";
import LeakDataTable from "@/pages/leak-report/components/LeakDataTable.vue";
import { createScopedT, useI18n } from "@/i18n";
import {
  LEAK_STATUS,
  ALGORITHM_STATUS,
  isRepairedStatus,
  isUnrepairedStatus,
  isLeakStatus,
  isNormalStatus,
  isSuspectedStatus,
  isNoDataStatus,
  isAlgorithmSuccess,
  isAlgorithmFailed,
  isAlgorithmTimeout,
  isAlgorithmSkipped,
  normalizeLeakStatusCode,
} from "@/pages/leak-report/constants/status";
import type { ColumnDef } from "@/pages/leak-report/constants/columnTypes";

const t = createScopedT("leakReport");
const { locale } = useI18n();

type HistoryRecord = Record<string, unknown>;
type DataTab = "leakage" | "deviceUpload" | "algorithm";

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

interface DetailField {
  label: string;
  value: string;
}

type KpiTone = "default" | "success" | "warning" | "danger";

interface KpiItem {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
}

const historyTabs = computed<Array<{ label: string; value: DataTab }>>(() => [
  { label: t("historyOverview.tabs.leakage"), value: "leakage" },
  { label: t("historyOverview.tabs.deviceUpload"), value: "deviceUpload" },
  { label: t("historyOverview.tabs.algorithm"), value: "algorithm" },
]);

const leakStatusOptions = computed<Array<{ label: string; value: number | "" }>>(() => [
  { label: t("status.statusUnlimited"), value: "" },
  { label: t("status.leak"), value: 0 },
  { label: t("status.normal"), value: 1 },
  { label: t("status.suspected"), value: 2 },
  { label: t("status.unknown"), value: 3 },
]);

// 渗漏记录 tab 专属：漏点记录的 leakStatus 是字符串（已修复/未修复），后端不支持该字段筛选，需本地过滤
const leakageStatusOptions = computed<Array<{ label: string; value: number | string | "" }>>(() => [
  { label: t("status.statusUnlimited"), value: "" },
  { label: t("status.repaired"), value: LEAK_STATUS.REPAIRED },
  { label: t("status.unrepaired"), value: LEAK_STATUS.UNREPAIRED },
]);

// 根据当前 tab 动态选择渗漏状态选项（统一类型，避免联合类型不可调用）
const activeLeakStatusOptions = computed<Array<{ label: string; value: number | string | "" }>>(() =>
  activeDataTab.value === "leakage" ? leakageStatusOptions.value : leakStatusOptions.value,
);

const algorithmStatusOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t("status.statusUnlimited"), value: "" },
  { label: t("status.executeSuccess"), value: ALGORITHM_STATUS.SUCCESS },
  { label: t("status.executeFailed"), value: ALGORITHM_STATUS.FAILED },
  { label: t("status.timeout"), value: ALGORITHM_STATUS.TIMEOUT },
  { label: t("status.skipped"), value: ALGORITHM_STATUS.SKIPPED },
]);

const tabLabelMap = computed<Record<DataTab, string>>(() => ({
  leakage: t("historyOverview.tabs.leakage"),
  deviceUpload: t("historyOverview.tabs.deviceUpload"),
  algorithm: t("historyOverview.tabs.algorithm"),
}));

/**
 * 表格列配置（3 套，按 activeDataTab 切换）
 *
 * 列定义驱动渲染：列头、数据行、列宽、导出全部从此配置派生。
 * 后端加字段时只需在对应 tab 的数组中新增一项，无需改模板代码。
 *
 * 三套表格列定义：
 * - leakage（8 列）：序号/检出时间/渗漏状态/漏点类型/漏点位置/巡检人员/管道材质/描述
 * - deviceUpload（8 列）：序号/上报时间/设备编号/渗漏标志位/特征值/强度/频率/固件版本
 * - algorithm（7 列）：序号/创建时间/设备编号/算法名称/执行状态/输出值/耗时(ms)
 */
const leakageColumnDefs: ColumnDef[] = [
  { key: "_index", labelKey: "table.index", renderType: "index", widthZh: "58px", widthEn: "58px", cellClass: "data-cell--index", exportable: false },
  {
    key: "detectTime",
    labelKey: "table.detectTime",
    renderType: "dateTime",
    widthZh: "minmax(140px, 1.5fr)",
    widthEn: "minmax(160px, 1.6fr)",
    cellClass: "data-cell--time data-cell--sortable",
    sortable: true,
  },
  {
    key: "leakStatus",
    labelKey: "table.leakStatus",
    renderType: "statusTag",
    statusVariant: "leakage",
    widthZh: "minmax(86px, 0.85fr)",
    widthEn: "minmax(100px, 1fr)",
    cellClass: "data-cell--level data-cell--sortable",
    sortable: true,
  },
  { key: "leakPointType", labelKey: "table.leakPointType", renderType: "text", widthZh: "minmax(96px, 0.95fr)", widthEn: "minmax(120px, 1.1fr)", cellClass: "data-cell--type" },
  { key: "leakPointPosition", labelKey: "table.leakPointPosition", renderType: "title", widthZh: "minmax(140px, 1.6fr)", widthEn: "minmax(170px, 1.7fr)", cellClass: "data-cell--address" },
  { key: "inspector", labelKey: "table.inspector", renderType: "text", widthZh: "minmax(86px, 0.85fr)", widthEn: "minmax(105px, 1fr)", cellClass: "data-cell--account" },
  { key: "tubeMaterial", labelKey: "table.tubeMaterial", renderType: "text", widthZh: "minmax(96px, 0.95fr)", widthEn: "minmax(110px, 1fr)", cellClass: "data-cell--material" },
  { key: "description", labelKey: "table.description", renderType: "title", widthZh: "minmax(120px, 1fr)", widthEn: "minmax(140px, 1.2fr)", cellClass: "data-cell--remark" },
];

const deviceUploadColumnDefs: ColumnDef[] = [
  { key: "_index", labelKey: "table.index", renderType: "index", widthZh: "58px", widthEn: "58px", cellClass: "data-cell--index", exportable: false },
  { key: "uploadTime", labelKey: "table.uploadTime", renderType: "dateTime", widthZh: "minmax(140px, 1.5fr)", widthEn: "minmax(160px, 1.6fr)", cellClass: "data-cell--time" },
  { key: "deviceNumber", labelKey: "table.deviceNumber", renderType: "text", widthZh: "minmax(120px, 1fr)", widthEn: "minmax(140px, 1.2fr)", cellClass: "data-cell--device" },
  {
    key: "leakStatus",
    labelKey: "table.leakFlag",
    renderType: "statusTag",
    statusVariant: "deviceUpload",
    widthZh: "minmax(100px, 1fr)",
    widthEn: "minmax(110px, 1fr)",
    cellClass: "data-cell--status",
  },
  { key: "leakEsa", labelKey: "table.leakEsa", renderType: "text", widthZh: "minmax(86px, 0.85fr)", widthEn: "minmax(110px, 1fr)", cellClass: "data-cell--esa" },
  { key: "leakIntensity", labelKey: "table.leakIntensity", renderType: "text", widthZh: "minmax(72px, 0.7fr)", widthEn: "minmax(90px, 0.85fr)", cellClass: "data-cell--intensity" },
  { key: "leakFrequency", labelKey: "table.leakFrequency", renderType: "text", widthZh: "minmax(72px, 0.7fr)", widthEn: "minmax(90px, 0.85fr)", cellClass: "data-cell--frequency" },
  { key: "firmwareVersion", labelKey: "table.firmwareVersion", renderType: "text", widthZh: "minmax(100px, 1fr)", widthEn: "minmax(130px, 1.1fr)", cellClass: "data-cell--firmware" },
];

const algorithmColumnDefs: ColumnDef[] = [
  { key: "_index", labelKey: "table.index", renderType: "index", widthZh: "58px", widthEn: "58px", cellClass: "data-cell--index", exportable: false },
  { key: "createdAt", labelKey: "table.createdAt", renderType: "dateTime", widthZh: "minmax(140px, 1.5fr)", widthEn: "minmax(160px, 1.6fr)", cellClass: "data-cell--time" },
  { key: "deviceNumber", labelKey: "table.deviceNumber", renderType: "text", widthZh: "minmax(120px, 1fr)", widthEn: "minmax(140px, 1.2fr)", cellClass: "data-cell--device" },
  { key: "algorithmName", labelKey: "table.algorithmName", renderType: "algorithmName", widthZh: "minmax(120px, 1.2fr)", widthEn: "minmax(140px, 1.3fr)", cellClass: "data-cell--signal" },
  {
    key: "status",
    labelKey: "table.executeStatus",
    renderType: "statusTag",
    statusVariant: "algorithm",
    widthZh: "minmax(100px, 1fr)",
    widthEn: "minmax(120px, 1.1fr)",
    cellClass: "data-cell--status",
  },
  { key: "outputValue", labelKey: "table.outputValue", renderType: "title", widthZh: "minmax(100px, 1fr)", widthEn: "minmax(110px, 1fr)", cellClass: "data-cell--signal" },
  { key: "costMs", labelKey: "table.duration", renderType: "text", widthZh: "minmax(86px, 0.85fr)", widthEn: "minmax(110px, 1fr)", cellClass: "data-cell--esa" },
];

const columnDefsMap: Record<DataTab, ColumnDef[]> = {
  leakage: leakageColumnDefs,
  deviceUpload: deviceUploadColumnDefs,
  algorithm: algorithmColumnDefs,
};

const activeColumnDefs = computed<ColumnDef[]>(() => columnDefsMap[activeDataTab.value]);

/**
 * 表格列宽动态配置
 *
 * 从 activeColumnDefs 配置派生，根据当前 locale 返回对应列宽。
 */
const tableGridTemplateColumns = computed<string>(() => {
  const isEn = locale.value === "en-US";
  return activeColumnDefs.value.map((c) => (isEn ? c.widthEn : c.widthZh)).join(" ");
});

const tableMinWidth = computed<string>(() => {
  if (locale.value === "en-US") {
    return activeDataTab.value === "algorithm" ? "940px" : "1080px";
  }
  return activeDataTab.value === "algorithm" ? "820px" : "980px";
});

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  leakStatus: "" as number | string | "",
  deviceNumber: "",
  inspector: "",
  algorithmStatus: "" as string,
  algorithmName: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const records = ref<HistoryRecord[]>([]);
const selectedRecord = ref<HistoryRecord | null>(null);
const selectedRecordKey = ref("");
const total = ref(0);
const loading = ref(false);
let fetchRequestId = 0;
let detailRequestId = 0;
const activeDataTab = ref<DataTab>("leakage");
const exportMenuVisible = ref(false);
type HistoryDetailTab = "basic" | "detail";
const activeDetailTab = ref<HistoryDetailTab>("basic");
const detailTabs = computed<Array<{ label: string; value: HistoryDetailTab }>>(() => [
  { label: t("historyOverview.detailTabs.basic"), value: "basic" },
  { label: t("historyOverview.detailTabs.detail"), value: "detail" },
]);

// 音视频播放弹窗状态
const videoDialogVisible = ref(false);
const currentVideoUrl = ref("");
const videoDuration = ref(0);
const videoCurrentTime = ref(0);
const videoLoading = ref(false);
const videoPlayerRef = ref<HTMLVideoElement | null>(null);

const audioDialogVisible = ref(false);
const currentAudioUrl = ref("");
const currentAudioTitle = ref("");
const audioDuration = ref(0);
const audioCurrentTime = ref(0);
const audioPlaying = ref(false);
const audioLoading = ref(false);
let audioDialogElement: HTMLAudioElement | null = null;

const currentLeakStatusLabel = computed(() =>
  activeLeakStatusOptions.value.find((o) => o.value === filters.leakStatus)?.label || t("status.statusUnlimited"),
);
const currentAlgorithmStatusLabel = computed(() =>
  algorithmStatusOptions.value.find((o) => o.value === filters.algorithmStatus)?.label || t("status.statusUnlimited"),
);
const activeTabLabel = computed(() => tabLabelMap.value[activeDataTab.value]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

// 顶部 KPI 概览条（基于当前页数据 + 后端 total 本地计算）
const currentKpis = computed<KpiItem[]>(() => {
  const list = chartRecords.value;
  const totalNum = total.value;
  const page = list.length;
  const isAll = chartDataScope.value === "all";
  const scopeLabel = isAll ? t("historyOverview.kpi.scopeAllRecords") : t("historyOverview.kpi.scopeCurrentPage");
  const pageText = isAll
    ? t("historyOverview.kpi.scopeAllDataText", { total: totalNum })
    : t("historyOverview.kpi.scopePageText", { current: pagination.pageNum, total: totalPages.value });
  const prefix = isAll ? t("historyOverview.kpi.scopeAllPrefix") : t("historyOverview.kpi.scopePagePrefix");
  const tone = (ok: boolean): KpiTone => (ok ? "success" : "warning");

  if (activeDataTab.value === "leakage") {
    const repaired = list.filter((r) => isRepairedStatus(normalizeLeakStatusCode(getFieldValue(r, "leakStatus"), "leakage"))).length;
    const unrepaired = list.filter((r) => isUnrepairedStatus(normalizeLeakStatusCode(getFieldValue(r, "leakStatus"), "leakage"))).length;
    const rate = page > 0 ? Math.round((repaired / page) * 100) : 0;
    return [
      { label: t("historyOverview.kpi.totalRecords"), value: String(totalNum) },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}${t("historyOverview.kpi.repaired")}`, value: String(repaired), tone: "success" },
      { label: `${prefix}${t("historyOverview.kpi.unrepaired")}`, value: String(unrepaired), tone: "danger" },
      { label: `${prefix}${t("historyOverview.kpi.repairRate")}`, value: `${rate}%`, tone: rate >= 50 ? "success" : "warning" },
    ];
  }

  if (activeDataTab.value === "deviceUpload") {
    const leak = list.filter((r) => isLeakStatus(normalizeLeakStatusCode(getFieldValue(r, "leakStatus"), "deviceUpload"))).length;
    const normal = list.filter((r) => isNormalStatus(normalizeLeakStatusCode(getFieldValue(r, "leakStatus"), "deviceUpload"))).length;
    const devices = new Set(list.map((r) => String(getFieldValue(r, "deviceNumber") || "")).filter(Boolean)).size;
    const abnormalRate = page > 0 ? Math.round((leak / page) * 100) : 0;
    return [
      { label: t("historyOverview.kpi.uploadTotal"), value: String(totalNum) },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}${t("historyOverview.kpi.leakCount")}`, value: String(leak), tone: "danger" },
      { label: `${prefix}${t("historyOverview.kpi.normalCount")}`, value: String(normal), tone: "success" },
      { label: t("historyOverview.kpi.involvedDevices"), value: String(devices) },
      { label: t("historyOverview.kpi.anomalyRate"), value: `${abnormalRate}%`, tone: abnormalRate >= 30 ? "danger" : "warning" },
    ];
  }

  if (activeDataTab.value === "algorithm") {
    const success = list.filter((r) => isAlgorithmSuccess(getFieldValue(r, "status"))).length;
    const failed = list.filter((r) => isAlgorithmFailed(getFieldValue(r, "status")) || isAlgorithmTimeout(getFieldValue(r, "status"))).length;
    const successRate = page > 0 ? Math.round((success / page) * 100) : 0;
    return [
      { label: t("historyOverview.kpi.executeTotal"), value: String(totalNum) },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}${t("historyOverview.kpi.successCount")}`, value: String(success), tone: "success" },
      { label: `${prefix}${t("historyOverview.kpi.failedCount")}`, value: String(failed), tone: "danger" },
      { label: t("historyOverview.kpi.successRate"), value: `${successRate}%`, tone: tone(successRate >= 80) },
    ];
  }

  return [];
});

// ==================== 趋势图区（每个 Tab 专属图表配置） ====================
type ChartType = "line" | "bar" | "pie" | "stackedBar" | "histogram";
type ChartGroupBy = "time" | "device" | "leakType" | "leakStatus" | "algorithmStatus" | "featureValue";

interface ChartModeConfig {
  label: string;        // 切换按钮显示文本
  value: string;        // 模式唯一标识
  type: ChartType;      // echarts 图表类型
  groupBy: ChartGroupBy; // 分组维度
  hint: string;         // 图表区副标题（说明当前模式的维度含义）
}

// 每个 Tab 的专属图表模式列表
const chartModeConfigs = computed<Record<DataTab, ChartModeConfig[]>>(() => ({
  leakage: [
    { label: t("historyOverview.chart.dataTrend"), value: "trend", type: "line", groupBy: "time", hint: t("historyOverview.chart.trendHintLeakage") },
    { label: t("historyOverview.chart.leakType"), value: "leakType", type: "pie", groupBy: "leakType", hint: t("historyOverview.chart.leakTypeHintText") },
    { label: t("historyOverview.chart.leakStatus"), value: "leakStatus", type: "pie", groupBy: "leakStatus", hint: t("historyOverview.chart.leakStatusHintLeakage") },
  ],
  deviceUpload: [
    { label: t("historyOverview.chart.dataTrend"), value: "trend", type: "line", groupBy: "time", hint: t("historyOverview.chart.trendHintDevice") },
    { label: t("historyOverview.chart.leakStatus"), value: "leakStatus", type: "pie", groupBy: "leakStatus", hint: t("historyOverview.chart.leakStatusHintDevice") },
    { label: t("historyOverview.chart.deviceTop10"), value: "device", type: "bar", groupBy: "device", hint: t("historyOverview.chart.deviceTopHintText") },
  ],
  algorithm: [
    { label: t("historyOverview.chart.dataTrend"), value: "trend", type: "line", groupBy: "time", hint: t("historyOverview.chart.trendHintAlgorithm") },
    { label: t("historyOverview.chart.executeResult"), value: "algoStatus", type: "pie", groupBy: "algorithmStatus", hint: t("historyOverview.chart.algoStatusHint") },
    { label: t("historyOverview.chart.successFailHint"), value: "successFail", type: "stackedBar", groupBy: "time", hint: t("historyOverview.chart.successFailHint") },
  ],
}));

const chartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 当前 tab 可用的图表模式列表
const currentChartModes = computed(() => chartModeConfigs.value[activeDataTab.value]);
// 当前选中的图表模式 value（每个 tab 默认 "trend"）
const activeChartModeValue = ref<string>("trend");
// 当前选中的图表模式配置
const currentChartConfig = computed<ChartModeConfig>(() =>
  currentChartModes.value.find((m) => m.value === activeChartModeValue.value) || currentChartModes.value[0],
);

// 图表数据范围：「本页」或「全部」
const chartDataScope = ref<"page" | "all">("page");
const allRecords = ref<HistoryRecord[]>([]);
const chartAllLoading = ref(false);
// 趋势图粒度：天 / 月 / 全部（年）
type TrendGrainSize = "day" | "month" | "all";
const trendGrainSize = ref<TrendGrainSize>("day");
const trendGrainOptions = computed<Array<{ label: string; value: TrendGrainSize }>>(() => [
  { label: t("historyOverview.chart.day"), value: "day" },
  { label: t("historyOverview.chart.month"), value: "month" },
  { label: t("historyOverview.chart.year"), value: "all" },
]);
// 图表实际使用的数据源
const chartRecords = computed<HistoryRecord[]>(() =>
  chartDataScope.value === "all" ? applyLocalFilters(allRecords.value) : records.value,
);

// 解析记录的时间字段，返回 YYYY-MM-DD
function parseRecordDate(r: HistoryRecord): string {
  const fields = ["detectTime", "uploadTime", "createdAt", "createTime", "samplingTime", "dailyDate", "reportDate"];
  for (const f of fields) {
    const v = getFieldValue(r, f);
    if (v) {
      const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
      if (m) return m[0];
    }
  }
  return t("status.unknown");
}

// 解析记录的时间字段，返回时间戳（毫秒）；解析失败返回 0
function parseRecordTimestamp(r: HistoryRecord): number {
  const fields = ["detectTime", "uploadTime", "createdAt", "createTime", "samplingTime", "dailyDate", "reportDate"];
  for (const f of fields) {
    const v = getFieldValue(r, f);
    if (v) {
      const m = String(v).match(/\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/);
      if (m) {
        const t = new Date(m[0].replace(" ", "T")).getTime();
        if (!Number.isNaN(t)) return t;
      }
    }
  }
  return 0;
}

// 按小时分组（每 4 小时一个单位），用于数据跨度 <= 2 天的场景
function groupByHour(list: HistoryRecord[], minT: number, maxT: number): Array<{ name: string; value: number }> {
  const HOUR_BUCKET = 4;
  const map = new Map<string, number>();
  const start = new Date(minT);
  start.setHours(0, 0, 0, 0);
  const end = new Date(maxT);
  end.setHours(23, 59, 59, 999);
  // 生成完整时间桶（保证空桶也显示，横轴连续）
  for (let t = start.getTime(); t <= end.getTime(); t += HOUR_BUCKET * 60 * 60 * 1000) {
    const d = new Date(t);
    const name = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
    map.set(name, 0);
  }
  // 填充数据
  for (const r of list) {
    const ts = parseRecordTimestamp(r);
    if (ts <= 0) continue;
    const d = new Date(ts);
    const bucketHour = Math.floor(d.getHours() / HOUR_BUCKET) * HOUR_BUCKET;
    const name = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(bucketHour).padStart(2, "0")}:00`;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
}

// 按月分组统计（补齐连续月份，无数据的月份为 0）
function groupByMonth(list: HistoryRecord[], minT?: number, maxT?: number): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const v = getFieldValue(r, "detectTime") || getFieldValue(r, "uploadTime") || getFieldValue(r, "createdAt") || getFieldValue(r, "createTime") || getFieldValue(r, "samplingTime") || getFieldValue(r, "dailyDate") || getFieldValue(r, "reportDate");
    if (v) {
      const m = String(v).match(/\d{4}-\d{2}/);
      if (m) {
        map.set(m[0], (map.get(m[0]) || 0) + 1);
      }
    }
  }
  // 有时间范围时，补齐从最早月到最晚月的连续月份
  if (minT && maxT) {
    const result: Array<{ name: string; value: number }> = [];
    const start = new Date(minT);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxT);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    const cur = new Date(start);
    while (cur <= end) {
      const name = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      result.push({ name, value: map.get(name) || 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }
  // 无时间范围，只返回有数据的月份
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
}

// 按天分组统计（补齐连续日期，无数据的日期为 0）
function groupByDay(list: HistoryRecord[], minT: number, maxT: number): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const d = parseRecordDate(r);
    map.set(d, (map.get(d) || 0) + 1);
  }
  const result: Array<{ name: string; value: number }> = [];
  const start = new Date(minT);
  start.setHours(0, 0, 0, 0);
  const end = new Date(maxT);
  end.setHours(23, 59, 59, 999);
  const cur = new Date(start);
  while (cur <= end) {
    const name = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    result.push({ name, value: map.get(name) || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// 按年分组统计（补齐连续年份，至少 5 年范围）
function groupByYear(list: HistoryRecord[], minT: number, maxT: number): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const v = getFieldValue(r, "detectTime") || getFieldValue(r, "uploadTime") || getFieldValue(r, "createdAt") || getFieldValue(r, "createTime") || getFieldValue(r, "samplingTime") || getFieldValue(r, "dailyDate") || getFieldValue(r, "reportDate");
    if (v) {
      const m = String(v).match(/\d{4}/);
      if (m) {
        map.set(m[0], (map.get(m[0]) || 0) + 1);
      }
    }
  }
  // 范围：数据最早年~最晚年，若不足5年则前后扩展至5年
  let startYear = new Date(minT).getFullYear();
  let endYear = new Date(maxT).getFullYear();
  if (endYear - startYear + 1 < 5) {
    const shortage = 5 - (endYear - startYear + 1);
    startYear -= Math.ceil(shortage / 2);
    endYear += Math.floor(shortage / 2);
  }
  const result: Array<{ name: string; value: number }> = [];
  for (let y = startYear; y <= endYear; y++) {
    const name = String(y);
    result.push({ name, value: map.get(name) || 0 });
  }
  return result;
}

// 按粒度筛选数据范围（饼图等使用）：day=当天，month=当月，all=全部
function filterByGrainSize(list: HistoryRecord[], grainSize: TrendGrainSize): HistoryRecord[] {
  if (grainSize === "all") return list;
  const timestamps = list.map((r) => parseRecordTimestamp(r)).filter((t) => t > 0);
  if (timestamps.length === 0) return list;
  const minT = Math.min(...timestamps);
  if (grainSize === "day") {
    const dayStart = new Date(minT);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(minT);
    dayEnd.setHours(23, 59, 59, 999);
    return list.filter((r) => {
      const t = parseRecordTimestamp(r);
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });
  }
  if (grainSize === "month") {
    const monthStart = new Date(minT);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);
    return list.filter((r) => {
      const t = parseRecordTimestamp(r);
      return t >= monthStart.getTime() && t <= monthEnd.getTime();
    });
  }
  return list;
}

// 按时间分组统计：根据粒度参数选择按天/月/年分组
function groupByTime(list: HistoryRecord[], grainSize: TrendGrainSize = "day"): Array<{ name: string; value: number }> {
  const timestamps = list.map((r) => parseRecordTimestamp(r)).filter((t) => t > 0);
  // 按年分组（全部）：至少5年范围
  if (grainSize === "all") {
    if (timestamps.length === 0) {
      // 回退：从数据中提取年份
      const map = new Map<string, number>();
      for (const r of list) {
        const v = getFieldValue(r, "detectTime") || getFieldValue(r, "uploadTime") || getFieldValue(r, "createdAt") || getFieldValue(r, "createTime") || getFieldValue(r, "samplingTime") || getFieldValue(r, "dailyDate") || getFieldValue(r, "reportDate");
        if (v) {
          const m = String(v).match(/\d{4}/);
          if (m) map.set(m[0], (map.get(m[0]) || 0) + 1);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => ({ name, value }));
    }
    const minT = Math.min(...timestamps);
    const maxT = Math.max(...timestamps);
    return groupByYear(list, minT, maxT);
  }
  // 按月分组：显示数据所在年的 1月~12月（共12个月）
  if (grainSize === "month") {
    if (timestamps.length === 0) return groupByMonth(list);
    const minT = Math.min(...timestamps);
    const yearStart = new Date(minT);
    yearStart.setMonth(0, 1);
    yearStart.setHours(0, 0, 0, 0);
    const yearEnd = new Date(minT);
    yearEnd.setMonth(11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    return groupByMonth(list, yearStart.getTime(), yearEnd.getTime());
  }
  // 按天分组（默认）：显示数据所在月的 1日~月末（当月总天数）
  if (timestamps.length > 0) {
    const minT = Math.min(...timestamps);
    const monthStart = new Date(minT);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);
    return groupByDay(list, monthStart.getTime(), monthEnd.getTime());
  }
  // 时间戳解析失败的最终回退：只统计有数据的日期
  const map = new Map<string, number>();
  for (const r of list) {
    const d = parseRecordDate(r);
    map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
}

// 按设备分组统计（取 Top 10）
function groupByDevice(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const d = String(getFieldValue(r, "deviceNumber") || t("status.unknown"));
    map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
}

// 按漏点类型分组统计（leakPointType 为空时回退到 leakPart 漏点部位）
function groupByLeakType(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const v = getFieldValue(r, "leakPointType") || getFieldValue(r, "leakPart");
    const s = v ? String(v) : t("status.unknown");
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

// 归一化 leakStatus：使用 status code 常量（兼容字符串文本和数字编码）
function normalizeLeakStatus(raw: unknown, tab: DataTab): string {
  // algorithm tab 无 leakStatus 概念，返回 UNKNOWN
  if (tab === "algorithm") return LEAK_STATUS.UNKNOWN;
  return normalizeLeakStatusCode(raw, tab);
}

// 将 leakStatus code 翻译为当前语言的展示文本（用于图表标签、CSV 导出等）
function translateLeakStatusCode(code: string): string {
  if (isRepairedStatus(code)) return t("status.repaired");
  if (isUnrepairedStatus(code)) return t("status.unrepaired");
  if (isLeakStatus(code)) return t("status.leak");
  if (isNormalStatus(code)) return t("status.normal");
  if (isSuspectedStatus(code)) return t("status.suspected");
  if (isNoDataStatus(code)) return t("status.noData");
  return t("status.unknown");
}

// 将 algorithmStatus code 翻译为当前语言的展示文本
function translateAlgorithmStatusCode(code: string): string {
  if (isAlgorithmSuccess(code)) return t("status.executeSuccess");
  if (isAlgorithmFailed(code)) return t("status.executeFailed");
  if (isAlgorithmTimeout(code)) return t("status.timeout");
  if (isAlgorithmSkipped(code)) return t("status.skipped");
  // groupByAlgorithmStatus 在状态未知时 fallback 为 LEAK_STATUS.UNKNOWN（"未知"），需显式翻译
  if (code === LEAK_STATUS.UNKNOWN) return t("status.unknown");
  return code || t("status.unknown");
}

/**
 * 动态翻译算法名称（algorithmName 字段）
 *
 * - 后端返回中文算法名（"噪音计算法"/"水听器主算法"/"水听器预处理"）
 * - 用后端原值作为 key 动态查找翻译：t("algorithmName.{后端原值}")
 * - 翻译不存在时（后端新增算法），fallback 显示后端原值，避免显示翻译失败
 * - 后端加新算法时，只需在 zh-CN.json/en-US.json 的 leakReport.algorithmName 下
 *   添加同名 key 即可，无需改任何代码
 */
function translateAlgorithmName(name: unknown): string {
  if (name === null || name === undefined || name === "") return "-";
  const raw = String(name).trim();
  if (!raw) return "-";
  return t(`algorithmName.${raw}`, {}, raw);
}

// 按渗漏状态分组（leakage tab 是已修复/未修复，其他 tab 是渗漏/正常）—— 返回 code 作为 name，展示时再翻译
function groupByLeakStatusForPie(list: HistoryRecord[], tab: DataTab): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const s = normalizeLeakStatus(getFieldValue(r, "leakStatus"), tab);
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// 按算法执行状态分组—— 返回 code 作为 name，展示时再翻译
function groupByAlgorithmStatus(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const su = String(getFieldValue(r, "status") || "").toUpperCase();
    const s = isAlgorithmSuccess(su) ? ALGORITHM_STATUS.SUCCESS
      : isAlgorithmFailed(su) ? ALGORITHM_STATUS.FAILED
      : isAlgorithmTimeout(su) ? ALGORITHM_STATUS.TIMEOUT
      : isAlgorithmSkipped(su) ? ALGORITHM_STATUS.SKIPPED
      : LEAK_STATUS.UNKNOWN;
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// 按特征值（leakEsa）分桶直方图
function groupByFeatureValue(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const values = list
    .map((r) => Number(getFieldValue(r, "leakEsa")))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  // 单一值时只返回一个桶
  if (min === max) return [{ name: `${min}`, value: values.length }];

  const binCount = 8;
  const binSize = Math.max(1, (max - min) / binCount);
  const bins: Array<{ name: string; value: number }> = [];
  for (let i = 0; i < binCount; i += 1) {
    const start = Math.round(min + i * binSize);
    const end = Math.round(min + (i + 1) * binSize);
    const isLast = i === binCount - 1;
    const count = values.filter((v) => (isLast ? v >= start && v <= end : v >= start && v < end)).length;
    bins.push({ name: `${start}-${end}`, value: count });
  }
  return bins;
}

// 堆叠柱状图：按日期 + 算法状态拆分
function buildStackedBarData(list: HistoryRecord[]): {
  times: string[];
  success: number[];
  failed: number[];
  timeout: number[];
} {
  const map = new Map<string, { success: number; failed: number; timeout: number }>();
  for (const r of list) {
    const dateStr = parseRecordDate(r);
    if (!map.has(dateStr)) map.set(dateStr, { success: 0, failed: 0, timeout: 0 });
    const stat = map.get(dateStr)!;
    const su = String(getFieldValue(r, "status") || "").toUpperCase();
    if (isAlgorithmSuccess(su)) stat.success += 1;
    else if (isAlgorithmFailed(su)) stat.failed += 1;
    else if (isAlgorithmTimeout(su)) stat.timeout += 1;
  }
  const times = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  return {
    times,
    success: times.map((t) => map.get(t)!.success),
    failed: times.map((t) => map.get(t)!.failed),
    timeout: times.map((t) => map.get(t)!.timeout),
  };
}

function buildChartOption(): echarts.EChartsOption {
  const list = chartRecords.value;
  const cfg = currentChartConfig.value;

  // 全量数据加载中：优先显示加载提示
  if (chartAllLoading.value) {
    return {
      title: {
        text: t("historyOverview.chart.allDataLoading"),
        left: "center",
        top: "center",
        textStyle: { color: "#3b82f6", fontSize: 13, fontWeight: 600 },
      },
    };
  }

  if (list.length === 0) {
    return {
      title: {
        text: t("historyOverview.chart.noData"),
        left: "center",
        top: "center",
        textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
      },
    };
  }

  // 通用网格与坐标轴样式
  const grid = { left: 64, right: 24, top: 24, bottom: 48 };
  const axisLineColor = { lineStyle: { color: "#cbd5e1" } };
  const splitLineStyle = { lineStyle: { color: "#eef2f7" } };
  const axisLabelStyle = { fontSize: 11, color: "#64748b" };
  const axisNameStyle = { fontSize: 11, color: "#475569", fontWeight: 600 as const };

  // 根据图表类型与当前 Tab 生成 X 轴名称
  function getXAxisName(): string {
    if (cfg.type === "histogram") return t("historyOverview.chart.axisName.leakEsaRange");
    if (cfg.type === "bar" && cfg.groupBy === "device") return t("historyOverview.chart.axisName.deviceNumber");
    if (cfg.type === "line" || cfg.type === "stackedBar") return t("historyOverview.chart.axisName.date");
    return "";
  }

  // 根据图表类型与当前 Tab 生成 Y 轴名称（含单位）
  function getYAxisName(): string {
    if (cfg.type === "pie") return "";
    if (cfg.type === "histogram") return t("historyOverview.chart.axisName.recordCount");
    if (cfg.type === "stackedBar") return t("historyOverview.chart.axisName.executeCount");
    if (cfg.type === "bar" && cfg.groupBy === "device") return t("historyOverview.chart.axisName.uploadCount");
    // line：按 tab 区分语义
    switch (activeDataTab.value) {
      case "leakage": return t("historyOverview.chart.axisName.recordCount");
      case "deviceUpload": return t("historyOverview.chart.axisName.uploadCount");
      case "algorithm": return t("historyOverview.chart.axisName.executeCount");
      default: return t("historyOverview.chart.axisName.recordCount");
    }
  }

  const xAxisName = getXAxisName();
  const yAxisName = getYAxisName();

  // 折线图：按时间趋势
  if (cfg.type === "line") {
    const data = groupByTime(list, trendGrainSize.value);
    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          if (!p) return "";
          return `${p.name}<br/>${yAxisName}: ${p.value}`;
        },
      },
      grid: { left: 64, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: {
          ...axisLabelStyle,
          interval: 0,
          rotate: data.length > 6 ? 30 : 0,
        },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: data.map((d) => d.value),
        lineStyle: { width: 2, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
              { offset: 1, color: "rgba(59, 130, 246, 0)" },
            ],
          },
        },
      }],
    };
  }

  // 柱状图：按设备 Top10
  if (cfg.type === "bar" && cfg.groupBy === "device") {
    const data = groupByDevice(list);
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid,
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabelStyle, interval: 0, rotate: data.length > 6 ? 30 : 0 },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
      }],
    };
  }

  // 直方图：特征值分布
  if (cfg.type === "histogram") {
    const data = groupByFeatureValue(list);
    if (data.length === 0) {
      return {
        title: {
          text: t("historyOverview.chart.noFeatureValueData"),
          left: "center",
          top: "center",
          textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
        },
      };
    }
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid,
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabelStyle, rotate: data.length > 6 ? 30 : 0 },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: "#8b5cf6", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
      }],
    };
  }

  // 堆叠柱状图：每日成功失败对比（仅 algorithm tab）
  if (cfg.type === "stackedBar") {
    const { times, success, failed, timeout } = buildStackedBarData(list);
    const successLabel = t("historyOverview.chart.success");
    const failureLabel = t("historyOverview.chart.failure");
    const timeoutLabel = t("historyOverview.chart.timeout");
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { data: [successLabel, failureLabel, timeoutLabel], bottom: 0, textStyle: { fontSize: 11, color: "#64748b" } },
      grid: { left: 64, right: 24, top: 24, bottom: 56 },
      xAxis: {
        type: "category",
        data: times,
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: {
          ...axisLabelStyle,
          interval: 0,
          rotate: times.length > 6 ? 30 : 0,
        },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [
        { name: successLabel, type: "bar", stack: "total", data: success, itemStyle: { color: "#22c55e" }, barMaxWidth: 36 },
        { name: failureLabel, type: "bar", stack: "total", data: failed, itemStyle: { color: "#ef4444" }, barMaxWidth: 36 },
        { name: timeoutLabel, type: "bar", stack: "total", data: timeout, itemStyle: { color: "#f59e0b" }, barMaxWidth: 36 },
      ],
    };
  }

  // 饼图：按不同维度（leakType / leakStatus / algorithmStatus）
  if (cfg.type === "pie") {
    let data: Array<{ name: string; value: number }> = [];
    if (cfg.groupBy === "leakType") data = groupByLeakType(list);
    else if (cfg.groupBy === "algorithmStatus") data = groupByAlgorithmStatus(list);
    else if (cfg.groupBy === "leakStatus") data = groupByLeakStatusForPie(list, activeDataTab.value);

    // 按状态 code 语义匹配颜色（绿=正常/已修复/成功，红=渗漏/未修复/失败，橙=疑似/超时，灰=未知）
    function getSemanticColor(name: string): string {
      if (isRepairedStatus(name) || isNormalStatus(name) || isAlgorithmSuccess(name)) return "#22c55e";
      if (isUnrepairedStatus(name) || isLeakStatus(name) || isAlgorithmFailed(name)) return "#ef4444";
      if (isSuspectedStatus(name) || isAlgorithmTimeout(name)) return "#f59e0b";
      return "#94a3b8";
    }

    // 漏点类型无语义颜色，用多色调按顺序分配
    const multiColorPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#94a3b8"];
    // 根据 groupBy 类型决定是否翻译 name（leakType 的 name 是原始值，不翻译；状态类的 name 是 code，需要翻译为当前语言）
    const shouldTranslateName = cfg.groupBy === "leakStatus" || cfg.groupBy === "algorithmStatus";
    const finalData =
      cfg.groupBy === "leakType"
        ? data.map((d, i) => ({ ...d, itemStyle: { color: multiColorPalette[i % multiColorPalette.length] } }))
        : data.map((d) => ({
            name: shouldTranslateName
              ? (cfg.groupBy === "algorithmStatus"
                ? translateAlgorithmStatusCode(d.name)
                : translateLeakStatusCode(d.name))
              : d.name,
            value: d.value,
            itemStyle: { color: getSemanticColor(d.name) },
          }));

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: "#64748b" } },
      series: [{
        type: "pie",
        radius: ["38%", "62%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
        label: { show: true, formatter: "{b}\n{c} ({d}%)", fontSize: 11, color: "#475569" },
        data: finalData,
      }],
      graphic: {
        type: "text",
        left: "center",
        top: "middle",
        style: {
          text: `{a|${total}}\n{b|${t("historyOverview.chart.totalLabel")}}`,
          rich: {
            a: { fontSize: 22, fontWeight: 900, fill: "#0f172a", align: "center", lineHeight: 28 },
            b: { fontSize: 11, fontWeight: 600, fill: "#64748b", align: "center" },
          },
          textAlign: "center",
          textVerticalAlign: "middle",
        },
      } as unknown as echarts.GraphicComponentOption,
    };
  }

  // 兜底：暂无数据
  return {
    title: { text: t("historyOverview.chart.noData"), left: "center", top: "center", textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 } },
  };
}

function renderChart() {
  if (!chartEl.value) return;
  if (!chart) {
    chart = echarts.init(chartEl.value);
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartEl.value);
  }
  // 折叠后展开时，canvas 尺寸可能为 0，需要强制 resize 恢复正确尺寸
  chart.resize();
  chart.setOption(buildChartOption(), true);
}

function switchChartMode(mode: string) {
  activeChartModeValue.value = mode;
  nextTick(renderChart);
}

// 拉取全量数据：分页并发拉取（每页 200 条，最多 5 个并发）
async function ensureAllRecords() {
  if (allRecords.value.length > 0 || chartAllLoading.value) return;
  chartAllLoading.value = true;
  try {
    const api = getApiFunction();
    const pageSize = 200;
    // 先请求第一页，获取 total
    const firstParams = { ...buildQueryParams(), pageNum: 1, pageSize };
    const firstResponse = (await api.page(firstParams)) as ApiResponseLike;
    assertSuccessResponse(firstResponse);
    const firstParsed = parsePageResponse(firstResponse);
    const totalCount = firstParsed.total;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) {
      allRecords.value = firstParsed.records;
    } else {
      // 并发请求剩余页（每批最多 5 个并发）
      const restPages: number[] = [];
      for (let p = 2; p <= totalPages; p++) restPages.push(p);
      const allData: HistoryRecord[] = [...firstParsed.records];
      for (let i = 0; i < restPages.length; i += 5) {
        const batch = restPages.slice(i, i + 5);
        const results = await Promise.all(
          batch.map((p) =>
            (api.page({ ...buildQueryParams(), pageNum: p, pageSize })) as PromiseLike<ApiResponseLike>,
          ),
        );
        for (const res of results) {
          assertSuccessResponse(res);
          allData.push(...parsePageResponse(res).records);
        }
      }
      allRecords.value = allData;
    }
  } catch {
    allRecords.value = [];
    uni.showToast({ title: t("historyOverview.fetchAllFailed"), icon: "none" });
  } finally {
    chartAllLoading.value = false;
  }
}

// 切换图表数据范围
async function toggleChartDataScope() {
  chartDataScope.value = chartDataScope.value === "page" ? "all" : "page";
  if (chartDataScope.value === "all") {
    await ensureAllRecords();
  }
  nextTick(renderChart);
}

// 图表区折叠/展开
const chartCollapsed = ref(false);
function toggleChartCollapse() {
  chartCollapsed.value = !chartCollapsed.value;
  if (!chartCollapsed.value) {
    // 展开时需要重新渲染（canvas 尺寸从 0 恢复）
    nextTick(renderChart);
  }
}

watch(() => chartRecords.value, () => {
  if (!chartCollapsed.value) nextTick(renderChart);
});
// 加载状态变化时重新渲染（显示「加载中…」或数据）
watch(() => chartAllLoading.value, () => {
  if (!chartCollapsed.value) nextTick(renderChart);
});
// 粒度切换时重新渲染趋势图
watch(() => trendGrainSize.value, () => {
  if (!chartCollapsed.value) nextTick(renderChart);
});
watch(() => activeDataTab.value, () => {
  // 切换 tab 时重置为「数据趋势」模式，并重新渲染
  activeChartModeValue.value = "trend";
  if (!chartCollapsed.value) nextTick(renderChart);
});

// 详情字段分组
const summaryLabel = computed(() => {
  const map: Record<DataTab, string> = {
    leakage: t("detail.fields.leakPointPosition"),
    deviceUpload: t("detail.fields.deviceNumber"),
    algorithm: t("detail.fields.deviceNumber"),
  };
  return map[activeDataTab.value];
});

const summaryValue = computed(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") return displayValue(getFieldValue(r, "leakPointPosition"));
  return displayValue(getFieldValue(r, "deviceNumber"));
});

const summaryMetaFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: t("detail.fields.leakStatus"), value: getLeakageStatusDisplay(r) },
      { label: t("detail.fields.leakPointType"), value: displayValue(getFieldValue(r, "leakPointType")) },
      { label: t("detail.fields.inspector"), value: displayValue(getFieldValue(r, "inspector")) },
      { label: t("detail.fields.detectType"), value: displayValue(getFieldValue(r, "detectType")) },
      { label: t("detail.fields.detectDifficulty"), value: displayValue(getFieldValue(r, "detectDifficulty")) },
      { label: t("detail.fields.locator"), value: displayValue(getFieldValue(r, "locator")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: t("table.leakFlag"), value: getLeakStatusLabel(r) },
      { label: t("detail.fields.firmwareVersion"), value: displayValue(getFieldValue(r, "firmwareVersion")) },
      { label: t("detail.fields.hardwareVersion"), value: displayValue(getFieldValue(r, "hardwareVersion")) },
      { label: t("detail.fields.workMode"), value: String(getFieldValue(r, "workMode") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: t("table.executeStatus"), value: getAlgorithmStatusLabel(r) },
      { label: t("detail.fields.errorMessage"), value: displayValue(getFieldValue(r, "errorMessage")) },
    ];
  }
  return [];
});

const timeDetailFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: t("detail.fields.detectTime"), value: formatDateTime(getFieldValue(r, "detectTime")) },
      { label: t("detail.fields.noiseTime"), value: formatDateTime(getFieldValue(r, "noiseTime")) },
      { label: t("detail.fields.createdAt"), value: formatDateTime(getFieldValue(r, "createdAt")) },
      { label: t("detail.fields.repairTime"), value: formatDateTime(getFieldValue(r, "repairTime")) },
      { label: t("detail.fields.updatedAt"), value: formatDateTime(getFieldValue(r, "updatedAt")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: t("detail.fields.uploadTime"), value: formatDateTime(getFieldValue(r, "uploadTime")) },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: t("detail.fields.createdAt"), value: formatDateTime(getFieldValue(r, "createdAt")) },
    ];
  }
  return [];
});

const locationFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: t("detail.fields.coordinatePosition"), value: formatCoordinate(getFieldValue(r, "coordinatePosition")) },
      { label: t("detail.fields.leakArea"), value: displayValue(getFieldValue(r, "leakArea")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: t("detail.fields.coordinateLocation"), value: formatCoordinate(getFieldValue(r, "coordinateLocation")) },
    ];
  }
  return [];
});

const cardFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: t("detail.fields.id"), value: String(getFieldValue(r, "id") ?? "-") },
      { label: t("detail.fields.suspectedLeakId"), value: String(getFieldValue(r, "suspectedLeakId") ?? "-") },
      { label: t("detail.fields.leakPointPart"), value: displayValue(getFieldValue(r, "leakPart")) },
      { label: t("detail.fields.leakDistance"), value: String(getFieldValue(r, "leakDistance") ?? "-") },
      { label: t("detail.fields.leakVolume"), value: String(getFieldValue(r, "leakVolume") ?? "-") },
      { label: t("detail.fields.leakReason"), value: displayValue(getFieldValue(r, "leakReason")) },
      { label: t("detail.fields.leakEsa"), value: String(getFieldValue(r, "featureValue") ?? "-") },
      { label: t("detail.fields.cost"), value: displayValue(getFieldValue(r, "cost")) },
      { label: t("detail.fields.manualReviewCount"), value: String(getFieldValue(r, "manualReviewCount") ?? "-") },
      { label: t("detail.fields.repairMethod"), value: displayValue(getFieldValue(r, "repairMethod")) },
      { label: t("detail.fields.tubeMaterial"), value: displayValue(getFieldValue(r, "tubeMaterial")) },
      { label: t("detail.fields.tubeBore"), value: String(getFieldValue(r, "tubeBore") ?? "-") },
      { label: t("detail.fields.tubeBuriedDepth"), value: String(getFieldValue(r, "tubeBuriedDepth") ?? "-") },
      { label: t("detail.fields.tubeAge"), value: String(getFieldValue(r, "tubeAge") ?? "-") },
      { label: t("detail.fields.deviceNumber"), value: displayValue(getFieldValue(r, "deviceNumber")) },
      { label: t("detail.fields.workOrderId"), value: String(getFieldValue(r, "workOrderId") ?? "-") },
      { label: t("detail.fields.noiseSample"), value: displayValue(getFieldValue(r, "noiseSample")) },
      { label: t("detail.fields.description"), value: displayValue(getFieldValue(r, "description")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: t("detail.fields.id"), value: displayValue(getFieldValue(r, "id")) },
      { label: t("detail.fields.deviceId"), value: displayValue(getFieldValue(r, "deviceId")) },
      { label: t("detail.fields.batteryVoltage"), value: String(getFieldValue(r, "batteryVoltage") ?? "-") },
      { label: t("detail.fields.deviceTemperature"), value: String(getFieldValue(r, "deviceTemperature") ?? "-") },
      { label: t("detail.fields.signalIntensity"), value: String(getFieldValue(r, "signalIntensity") ?? "-") },
      { label: t("detail.fields.signalQuality"), value: String(getFieldValue(r, "signalQuality") ?? "-") },
      { label: t("detail.fields.leakEsa"), value: String(getFieldValue(r, "leakEsa") ?? "-") },
      { label: t("detail.fields.leakIntensity"), value: String(getFieldValue(r, "leakIntensity") ?? "-") },
      { label: t("detail.fields.leakFrequency"), value: String(getFieldValue(r, "leakFrequency") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: t("detail.fields.id"), value: String(getFieldValue(r, "id") ?? "-") },
      { label: t("detail.fields.deviceId"), value: String(getFieldValue(r, "deviceId") ?? "-") },
      { label: t("detail.fields.audioId"), value: String(getFieldValue(r, "audioId") ?? "-") },
      { label: t("detail.fields.algorithmName"), value: translateAlgorithmName(getFieldValue(r, "algorithmName")) },
      { label: t("detail.fields.outputValue"), value: displayValue(getFieldValue(r, "outputValue")) },
      { label: t("detail.fields.duration"), value: String(getFieldValue(r, "costMs") ?? "-") },
      { label: t("detail.fields.matlabInstance"), value: displayValue(getFieldValue(r, "matlabInstance")) },
      { label: t("detail.fields.errorMessage"), value: displayValue(getFieldValue(r, "errorMessage")) },
    ];
  }
  return [];
});

onMounted(() => {
  fetchHistoryData();
  nextTick(renderChart);
  // #ifdef H5
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("touchmove", handleDocumentTouchMove, { passive: false });
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("touchmove", handleDocumentTouchMove);
  closeAudioDialog();
  closeVideoDialog();
  // #endif
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});

function handleLeakStatusChange(event: { detail: { value: number } }) {
  filters.leakStatus = activeLeakStatusOptions.value[event.detail.value]?.value ?? "";
  searchHistory();
}

function handleAlgorithmStatusChange(event: { detail: { value: number } }) {
  filters.algorithmStatus = algorithmStatusOptions.value[event.detail.value]?.value ?? "";
  searchHistory();
}

function switchDataTab(tab: DataTab) {
  activeDataTab.value = tab;
  pagination.pageNum = 1;
  selectedRecord.value = null;
  selectedRecordKey.value = "";
  fetchHistoryData();
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    if (sortOrder.value === "asc") { sortOrder.value = "desc"; }
    else if (sortOrder.value === "desc") { sortField.value = ""; sortOrder.value = ""; }
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  pagination.pageNum = 1;
  fetchHistoryData();
}

function buildQueryParams() {
  const defaultSortField = activeDataTab.value === "leakage" ? "detectTime" : activeDataTab.value === "algorithm" ? "createdAt" : activeDataTab.value === "deviceUpload" ? "uploadTime" : "createdAt";
  const baseParams = removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || defaultSortField,
  });

  // 按 tab 传递对应的业务筛选参数
  if (activeDataTab.value === "leakage") {
    // 后端 LeakPointRecordPageDTO 不支持 leakStatus 和 inspector，这两个走本地过滤
  } else if (activeDataTab.value === "deviceUpload") {
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  } else if (activeDataTab.value === "algorithm") {
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
    if (filters.algorithmStatus !== "") (baseParams as Record<string, unknown>).status = filters.algorithmStatus;
    if (filters.algorithmName.trim()) (baseParams as Record<string, unknown>).algorithmName = filters.algorithmName.trim();
  }

  return baseParams;
}

function getApiFunction() {
  const apiMap: Record<DataTab, { page: typeof getLeakageHistoryPage; detail: typeof getLeakageHistoryDetail }> = {
    leakage: { page: getLeakageHistoryPage, detail: getLeakageHistoryDetail },
    deviceUpload: { page: getDeviceStatusUploadPage, detail: getDeviceStatusUploadDetail },
    algorithm: { page: getAlgorithmResultHistoryPage, detail: getAlgorithmResultHistoryDetail },
  };
  return apiMap[activeDataTab.value];
}

async function fetchHistoryData() {
  const reqId = ++fetchRequestId;
  loading.value = true;
  try {
    const api = getApiFunction();
    const response = (await api.page(buildQueryParams())) as ApiResponseLike;
    if (reqId !== fetchRequestId) return; // 竞态保护：丢弃过期请求
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    if (parsed.pageNum && parsed.pageNum !== pagination.pageNum) pagination.pageNum = parsed.pageNum;
    if (parsed.pageSize && parsed.pageSize !== pagination.pageSize) pagination.pageSize = parsed.pageSize;
    const filteredRecords = applyLocalFilters(parsed.records);
    records.value = applyLocalSort(filteredRecords);
    total.value = filteredRecords.length !== parsed.records.length ? filteredRecords.length : parsed.total;
    // 筛选/分页条件变化时清空全量数据缓存，强制重新拉取
    allRecords.value = [];
    // 如果当前是「全部」模式，清空后需要重新拉取全量数据
    if (chartDataScope.value === "all") {
      ensureAllRecords().then(() => nextTick(renderChart));
    }
    selectFirstRow();
  } catch (error) {
    if (reqId !== fetchRequestId) return;
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || t("historyOverview.dataLoadFailed"), icon: "none" });
  } finally {
    if (reqId === fetchRequestId) loading.value = false;
  }
}

function searchHistory() {
  pagination.pageNum = 1;
  fetchHistoryData();
}

function escapeCsvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const text = String(value).replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

// 已知技术债：导出全部使用 pageSize:99999 一次性拉取，后端限制最大 pageSize 或数据量超过 10 万时导出会静默不全。后续应改为循环分页拉取。
async function handleExport(scope: "current" | "all") {
  exportMenuVisible.value = false;
  let exportRecords = records.value;
  if (scope === "all") {
    try {
      const api = getApiFunction();
      const params = { ...buildQueryParams(), pageNum: 1, pageSize: 99999 };
      const response = (await api.page(params)) as ApiResponseLike;
      assertSuccessResponse(response);
      const parsed = parsePageResponse(response);
      exportRecords = applyLocalFilters(parsed.records);
    } catch {
      uni.showToast({ title: t("historyOverview.fetchAllFailed"), icon: "none" });
      return;
    }
  }
  if (!exportRecords.length) {
    uni.showToast({ title: t("historyOverview.noDataToExport"), icon: "none" });
    return;
  }
  // #ifdef H5
  const tab = activeDataTab.value;
  // 导出列从 activeColumnDefs 派生：列头、字段顺序与表格保持一致，新增字段自动纳入导出。
  const exportColumns = activeColumnDefs.value.filter((c) => c.exportable !== false);
  const headers = exportColumns.map((c) => t(c.exportLabelKey || c.labelKey));
  const rows = exportRecords.map((r, idx) =>
    exportColumns.map((c) => {
      if (c.renderType === "index") return escapeCsvCell(String(idx + 1));
      if (c.renderType === "dateTime") return escapeCsvCell(formatDateTime(getFieldValue(r, c.key)));
      if (c.renderType === "statusTag") {
        if (c.statusVariant === "leakage") return escapeCsvCell(getLeakageStatusDisplay(r));
        if (c.statusVariant === "deviceUpload") return escapeCsvCell(getLeakStatusLabel(r));
        if (c.statusVariant === "algorithm") return escapeCsvCell(getAlgorithmStatusLabel(r));
      }
      if (c.renderType === "algorithmName") return escapeCsvCell(translateAlgorithmName(getFieldValue(r, c.key)));
      return escapeCsvCell(getFieldValue(r, c.key));
    })
  );
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${tabLabelMap.value[tab]}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: t("historyOverview.exportSuccess"), icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("historyOverview.exportH5Only"), icon: "none" });
  // #endif
}

function getBaseUrl(): string {
  return (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || "";
}

function getPreviewUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/")) return `${getBaseUrl()}${filePath}`;
  return `${getBaseUrl()}/${filePath}`;
}

function formatMediaTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const videoProgress = computed(() => {
  if (!videoDuration.value) return 0;
  return Math.min(100, (videoCurrentTime.value / videoDuration.value) * 100);
});

const audioProgress = computed(() => {
  if (!audioDuration.value) return 0;
  return Math.min(100, (audioCurrentTime.value / audioDuration.value) * 100);
});

// 兼容 uni-app video 组件事件（e.detail = { currentTime, duration }）和原生 video 事件（e.target）
function readVideoDuration(e: Event): number {
  const detail = (e as { detail?: { duration?: unknown } }).detail;
  if (detail && typeof detail.duration === "number" && isFinite(detail.duration) && detail.duration > 0) {
    return detail.duration;
  }
  const v = (e.target as HTMLVideoElement) || videoPlayerRef.value;
  if (v && isFinite(v.duration) && v.duration > 0) return v.duration;
  return 0;
}

function readVideoCurrentTime(e: Event): number {
  const detail = (e as { detail?: { currentTime?: unknown } }).detail;
  if (detail && typeof detail.currentTime === "number") return detail.currentTime;
  const v = (e.target as HTMLVideoElement) || videoPlayerRef.value;
  return v ? v.currentTime || 0 : 0;
}

function onVideoLoadedMeta(e: Event) {
  const d = readVideoDuration(e);
  if (d > 0) videoDuration.value = d;
  videoLoading.value = false;
}
function onVideoDurationChange(e: Event) {
  const d = readVideoDuration(e);
  if (d > 0) videoDuration.value = d;
}
function onVideoCanPlay(e: Event) {
  const d = readVideoDuration(e);
  if (d > 0) videoDuration.value = d;
  videoLoading.value = false;
}
function onVideoTimeUpdate(e: Event) {
  videoCurrentTime.value = readVideoCurrentTime(e);
  if (!videoDuration.value) {
    const d = readVideoDuration(e);
    if (d > 0) videoDuration.value = d;
  }
}
function onVideoWaiting() { videoLoading.value = true; }
function onVideoPlaying() { videoLoading.value = false; }

// ===== 进度条拖动：使用 document 原生事件委托，绕过 uni-app 事件系统 =====
function doSeekVideo(clientX: number, bar: HTMLElement) {
  const videoEl = document.querySelector(".video-player") as HTMLVideoElement | null;
  let duration = 0;
  if (videoEl && isFinite(videoEl.duration) && videoEl.duration > 0) {
    duration = videoEl.duration;
  } else if (isFinite(videoDuration.value) && videoDuration.value > 0) {
    duration = videoDuration.value;
  }
  if (!duration || !isFinite(duration)) return;
  const rect = bar.getBoundingClientRect();
  if (!rect.width) return;
  const x = clientX - rect.left;
  const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const time = (percent / 100) * duration;
  if (!isFinite(time) || time < 0) return;
  if (videoEl) { try { videoEl.currentTime = time; } catch (_) { /* ignore */ } }
  videoCurrentTime.value = time;
  videoDuration.value = duration;
}

function doSeekAudio(clientX: number, bar: HTMLElement) {
  if (!audioDialogElement) return;
  let duration = 0;
  if (isFinite(audioDialogElement.duration) && audioDialogElement.duration > 0) {
    duration = audioDialogElement.duration;
  } else if (isFinite(audioDuration.value) && audioDuration.value > 0) {
    duration = audioDuration.value;
  }
  if (!duration || !isFinite(duration)) return;
  const rect = bar.getBoundingClientRect();
  if (!rect.width) return;
  const x = clientX - rect.left;
  const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const time = (percent / 100) * duration;
  if (!isFinite(time) || time < 0) return;
  try { audioDialogElement.currentTime = time; } catch (_) { /* ignore */ }
  audioCurrentTime.value = time;
  audioDuration.value = duration;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const videoBar = target.closest(".video-seek-bar") as HTMLElement | null;
  if (videoBar) { doSeekVideo(e.clientX, videoBar); return; }
  const audioBar = target.closest(".audio-seek-bar") as HTMLElement | null;
  if (audioBar) { doSeekAudio(e.clientX, audioBar); return; }
}

function handleDocumentTouchMove(e: TouchEvent) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const videoBar = target.closest(".video-seek-bar") as HTMLElement | null;
  if (videoBar && e.touches.length > 0) {
    doSeekVideo(e.touches[0].clientX, videoBar);
    e.preventDefault();
    return;
  }
  const audioBar = target.closest(".audio-seek-bar") as HTMLElement | null;
  if (audioBar && e.touches.length > 0) {
    doSeekAudio(e.touches[0].clientX, audioBar);
    e.preventDefault();
  }
}

function openVideoDialog(item: HistoryRecord) {
  const vid = getFieldValue(item, "sceneVideo");
  if (!vid) return;
  videoDuration.value = 0;
  videoCurrentTime.value = 0;
  videoLoading.value = true;
  currentVideoUrl.value = getPreviewUrl(String(vid));
  videoDialogVisible.value = true;
}
function closeVideoDialog() {
  videoDialogVisible.value = false;
  currentVideoUrl.value = "";
  videoDuration.value = 0;
  videoCurrentTime.value = 0;
  videoLoading.value = false;
}

/** 只有点击 mask 本身才关闭对话框，点击内部内容（含进度条）不关闭 */
function onVideoMaskClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeVideoDialog();
}

function onAudioLoadedMeta() {
  if (!audioDialogElement) return;
  if (isFinite(audioDialogElement.duration) && audioDialogElement.duration > 0) {
    audioDuration.value = audioDialogElement.duration;
  }
  audioLoading.value = false;
}
function onAudioTimeUpdate() {
  if (!audioDialogElement) return;
  audioCurrentTime.value = audioDialogElement.currentTime || 0;
  if (isFinite(audioDialogElement.duration) && audioDialogElement.duration > 0 && !audioDuration.value) {
    audioDuration.value = audioDialogElement.duration;
  }
}
function onAudioEnded() { audioPlaying.value = false; audioCurrentTime.value = 0; }
function toggleAudioPlayState() {
  if (!audioDialogElement) return;
  if (audioDialogElement.paused) audioDialogElement.play();
  else audioDialogElement.pause();
}
function seekAudioByEvent(e: Event) {
  // 已由 document 事件委托处理，此函数保留为空以兼容模板中可能的引用
}
function openAudioDialog(item: HistoryRecord) {
  if (audioDialogElement) { audioDialogElement.pause(); audioDialogElement = null; }
  const aid = getFieldValue(item, "audioFile");
  if (!aid) return;
  currentAudioUrl.value = getPreviewUrl(String(aid));
  currentAudioTitle.value = t("historyOverview.audioPlay");
  audioDuration.value = 0;
  audioCurrentTime.value = 0;
  audioPlaying.value = false;
  audioLoading.value = true;
  audioDialogVisible.value = true;
  audioDialogElement = new Audio(currentAudioUrl.value);
  audioDialogElement.addEventListener("loadedmetadata", onAudioLoadedMeta);
  audioDialogElement.addEventListener("durationchange", onAudioLoadedMeta);
  audioDialogElement.addEventListener("timeupdate", onAudioTimeUpdate);
  audioDialogElement.addEventListener("ended", onAudioEnded);
  audioDialogElement.addEventListener("waiting", () => { audioLoading.value = true; });
  audioDialogElement.addEventListener("playing", () => { audioLoading.value = false; audioPlaying.value = true; });
  audioDialogElement.addEventListener("play", () => { audioPlaying.value = true; });
  audioDialogElement.addEventListener("pause", () => { audioPlaying.value = false; });
  audioDialogElement.addEventListener("canplay", () => { audioLoading.value = false; });
  audioDialogElement.play().catch(() => { audioLoading.value = false; });
}
function closeAudioDialog() {
  if (audioDialogElement) {
    audioDialogElement.pause();
    audioDialogElement.src = "";
    audioDialogElement = null;
  }
  audioDialogVisible.value = false;
  currentAudioUrl.value = "";
  audioDuration.value = 0;
  audioCurrentTime.value = 0;
  audioPlaying.value = false;
  audioLoading.value = false;
}

/** 只有点击 mask 本身才关闭对话框，点击内部内容（含进度条）不关闭 */
function onAudioMaskClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeAudioDialog();
}

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakStatus = "";
  filters.deviceNumber = "";
  filters.inspector = "";
  filters.algorithmStatus = "";
  filters.algorithmName = "";
  searchHistory();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
  fetchHistoryData();
}

function jumpToPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  pagination.pageNum = p;
  fetchHistoryData();
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchHistoryData();
}

function selectFirstRow() {
  detailRequestId++; // 使之前未完成的详情请求失效
  if (records.value.length === 0) {
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    return;
  }
  const first = records.value[0];
  selectedRecord.value = first;
  selectedRecordKey.value = getRowKey(first, 0);
}

function selectRecord(item: HistoryRecord, index: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, index);

  const reqId = ++detailRequestId;
  const id = getRowId(item);
  if (!id) return;

  getApiFunction().detail(id)
    .then((response: unknown) => {
      if (reqId !== detailRequestId) return; // 竞态保护：丢弃过期请求
      assertSuccessResponse(response as ApiResponseLike);
      const detailData = (response as ApiResponseLike)?.data;
      if (isObject(detailData)) {
        const cleanDetail = Object.fromEntries(Object.entries(detailData as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined));
        selectedRecord.value = { ...item, ...cleanDetail };
      }
    })
    .catch(() => {});
}

// --- helpers ---

function getRowId(item: HistoryRecord) {
  const v = getFieldValue(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: HistoryRecord, index: number) {
  return getRowId(item) || String(index);
}

function getFieldValue(item: HistoryRecord, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
}

/** 显示值：只把 null/undefined/空字符串显示为 '-'，保留合法的 0/false */
function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

// 格式化经纬度字符串，保留 4 位小数（支持 "经度,纬度" 或 "经度 纬度" 格式）
function formatCoordinate(value: unknown): string {
  if (value == null || value === "") return "-";
  const s = String(value).trim();
  const parts = s.split(/[,，\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
      return `${lng.toFixed(4)},${lat.toFixed(4)}`;
    }
  }
  return s;
}

function getLeakStatusLabel(item: HistoryRecord) {
  const raw = getFieldValue(item, "leakStatus");
  if (raw === null || raw === undefined || raw === "") return "-";
  const code = normalizeLeakStatusCode(raw, "deviceUpload");
  return translateLeakStatusCode(code);
}

// leakage tab 的 leakStatus 是字符串（已修复/未修复），需要翻译为当前语言展示
function getLeakageStatusDisplay(item: HistoryRecord): string {
  const raw = getFieldValue(item, "leakStatus");
  if (raw === null || raw === undefined || raw === "") return "-";
  const code = normalizeLeakStatusCode(raw, "leakage");
  return translateLeakStatusCode(code);
}

function getLeakageStatusTagClass(item: HistoryRecord) {
  const raw = getFieldValue(item, "leakStatus");
  if (isRepairedStatus(raw)) return "status-tag--normal";
  if (isUnrepairedStatus(raw)) return "status-tag--leak";
  return "status-tag--unknown";
}

function getLeakStatusTagClass(item: HistoryRecord) {
  const raw = getFieldValue(item, "leakStatus");
  if (isLeakStatus(raw)) return "status-tag--leak";
  if (isNormalStatus(raw)) return "status-tag--normal";
  if (isSuspectedStatus(raw)) return "status-tag--suspect";
  return "status-tag--unknown";
}

function getAlgorithmStatusLabel(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  if (!status) return "-";
  return translateAlgorithmStatusCode(status);
}

function getAlgorithmStatusTagClass(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  if (isAlgorithmSuccess(status)) return "status-tag--success";
  if (isAlgorithmFailed(status)) return "status-tag--failed";
  if (isAlgorithmTimeout(status)) return "status-tag--failed";
  if (isAlgorithmSkipped(status)) return "status-tag--skipped";
  return "status-tag--unknown";
}

function formatDateTime(value: unknown) {
  if (!value || value === "-") return String(value || "-");
  return String(value).replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) return undefined;
  const nv = value.trim().replace(/\s+/, "T");
  if (nv.includes("T")) return nv.length === 16 ? `${nv}:00` : nv;
  return `${nv}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data) || findPageContainer(response) || (isObject(data) ? data : {});
  const recs = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topRecs = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = recs.length > 0 ? recs : topRecs;
  const totalVal =
    getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) ??
    getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const cur = getFirstNumber(pageData, ["current", "pageNum", "page", "pageNo"]);
  const sz = getFirstNumber(pageData, ["size", "pageSize", "limit"]);
  const pageNum = cur || pagination.pageNum;
  const pageSize = sz || pagination.pageSize;
  const minVisibleTotal = (pageNum - 1) * pageSize + finalRecords.length;
  const resolved = totalVal === undefined ? finalRecords.length : Math.max(totalVal, minVisibleTotal);
  return { records: finalRecords.map((r) => (isObject(r) ? r : { value: r })), total: resolved, pageNum, pageSize };
}

function findPageContainer(value: unknown): HistoryRecord | null {
  if (!isObject(value)) return null;
  const hasRecs = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal = getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecs || hasTotal) return value;
  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer((value as Record<string, unknown>)[key]);
    if (matched) return matched;
  }
  return null;
}

function getFirstArray(item: unknown, keys: string[]): unknown[] {
  if (!isObject(item)) return [];
  for (const key of keys) {
    const v = (item as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function getFirstNumber(item: unknown, keys: string[]): number | undefined {
  if (!isObject(item)) return undefined;
  for (const key of keys) {
    const v = (item as Record<string, unknown>)[key];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null));
}

// 本地过滤兜底：仅对后端不支持的字段生效（当前仅 leakage tab 的 leakStatus 和 inspector）
// 已知限制：本地过滤只能过滤当前页数据，跨页数据不可见。total 会改为当前页过滤后的数量。
// 彻底解决需后端 LeakPointRecordPageDTO 增加 leakStatus 和 inspector 字段支持。
function applyLocalFilters(list: HistoryRecord[]): HistoryRecord[] {
  if (activeDataTab.value !== "leakage") return list;
  const inspectorKey = filters.inspector.trim().toLowerCase();
  const statusKey = filters.leakStatus !== "" ? String(filters.leakStatus) : "";
  if (!inspectorKey && !statusKey) return list;
  return list.filter((item) => {
    if (inspectorKey) {
      const inspector = String(getFieldValue(item, "inspector") || "").toLowerCase();
      if (!inspector.includes(inspectorKey)) return false;
    }
    if (statusKey) {
      const normalized = normalizeLeakStatus(getFieldValue(item, "leakStatus"), "leakage");
      if (normalized !== statusKey) return false;
    }
    return true;
  });
}

function applyLocalSort(list: HistoryRecord[]): HistoryRecord[] {
  if (!sortField.value || !sortOrder.value) return list;
  const field = sortField.value;
  const order = sortOrder.value;
  return [...list].sort((a, b) => {
    let va: unknown = a[field];
    let vb: unknown = b[field];
    if (field === "leakStatus") {
      va = Number(va); vb = Number(vb);
    } else {
      va = String(va ?? ""); vb = String(vb ?? "");
    }
    if (va === undefined || va === null) return 1;
    if (vb === undefined || vb === null) return -1;
    if (va < vb) return order === "asc" ? -1 : 1;
    if (va > vb) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) return;
  throw { code, msg: response?.msg || t("common.requestFailed"), data: response?.data };
}
</script>

<style scoped lang="scss">
.history-overview-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
}

.toolbar,
.table-panel,
.detail-panel,
.tabs-bar {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.toolbar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  justify-content: space-between;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input {
  box-sizing: border-box;
  width: 140px;
  height: 28px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  line-height: 28px;
}

.filter-input:focus, .filter-select:hover { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.filter-input::placeholder,
.input-placeholder {
  color: #9aa9b8;
  font-size: 13px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-width: 100px;
  height: 28px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  cursor: pointer;
  line-height: 28px;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  margin-left: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-datetime {
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}

.filter-separator {
  flex: none;
  color: #8191a2;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.toolbar-actions--right {
  margin-left: auto;
}

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 20;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(15, 35, 55, 0.12);
  overflow: hidden;
}

.export-menu__item {
  padding: 10px 18px;
  color: #24384d;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.export-menu__item:hover {
  background: #eff6ff;
  color: #3b82f6;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 64px;
  height: 38px;
  margin: 0;
  padding: 0 15px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 5px;
  cursor: pointer;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.toolbar-button--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
.toolbar-button--primary.toolbar-button--hover { color: #ffffff; background: #2563eb; border-color: #2563eb; }
.toolbar-button:disabled { color: #9aa9b8; background: #eff6ff; border-color: #d7e0e8; cursor: not-allowed; }

.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin: 0;
  padding: 0;
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 5px;
  cursor: pointer;
}

.toolbar-icon-button--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }

.icon-refresh {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid #7f8fa3;
  border-top-color: transparent;
  border-radius: 50%;
}

.tabs-bar {
  display: flex;
  flex: none;
  margin-bottom: 12px;
  padding: 0;
  overflow: hidden;
}

.tabs-bar__item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tabs-bar__item--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #f7faff;
}

/* KPI 概览条 */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(33, 72, 108, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.1);
}

.kpi-card--success {
  border-left-color: #22c55e;
}

.kpi-card--warning {
  border-left-color: #f59e0b;
}

.kpi-card--danger {
  border-left-color: #ef4444;
}

.kpi-card__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.kpi-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-card__value {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  font-family: "DIN Alternate", "Arial", sans-serif;
  line-height: 1.2;
}

.kpi-card__hint {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* 趋势图区 */
.chart-zone {
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  overflow: hidden;
  flex: 0 0 auto;
  min-height: 0;
}

.chart-zone--collapsed {
  margin-bottom: 12px;
}

.chart-zone--collapsed .chart-zone__header {
  border-bottom: none;
}

.chart-zone__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f7;
}

.chart-zone__body {
  position: relative;
}

.chart-zone__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.chart-zone__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-zone__title {
  color: #26384d;
  font-size: 13px;
  font-weight: 800;
}

.chart-zone__toggle {
  padding: 4px 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  background: #3b82f6;
  border-radius: 4px;
  transition: background 0.18s ease;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.chart-zone__title-wrap:hover .chart-zone__toggle {
  background: #2563eb;
}

.chart-zone__hint {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.chart-zone__modes {
  display: flex;
  gap: 4px;
  min-width: 220px;
}

.chart-zone__mode {
  padding: 4px 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.18s ease;
}

.chart-zone__mode:hover {
  background: #f1f5fb;
  color: #3b82f6;
}

.chart-zone__mode--active {
  background: #3b82f6;
  color: #ffffff;
}

.chart-zone__mode--active:hover {
  background: #2563eb;
  color: #ffffff;
}

.chart-zone__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chart-zone__scope {
  display: flex;
  border: 1px solid #d8e5ef;
  border-radius: 4px;
  overflow: hidden;
}

/* 趋势图粒度切换按钮组 */
.chart-zone__grain {
  display: flex;
  border: 1px solid #d8e5ef;
  border-radius: 4px;
  overflow: hidden;
}

.chart-zone__grain--hidden {
  visibility: hidden;
}

.chart-zone__grain-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #ffffff;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s ease;
  min-width: 48px;
  text-align: center;
}

.chart-zone__grain-btn:hover {
  background: #f1f5f9;
}

.chart-zone__grain-btn--active {
  color: #ffffff;
  background: #3b82f6;
}

.chart-zone__scope-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #ffffff;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s ease;
  min-width: 44px;
  text-align: center;
}

.chart-zone__scope-btn:hover {
  background: #f1f5f9;
}

.chart-zone__scope-btn--active {
  color: #ffffff;
  background: #3b82f6;
}

.chart-zone__scope-btn--active:hover {
  background: #2563eb;
}

.chart-zone__canvas {
  width: 100%;
  height: 260px;
}

.chart-zone__fallback {
  color: #64748b;
  font-size: 13px;
  line-height: 240px;
  text-align: center;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8da1;
  font-size: 14px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.detail-section { flex: 1; min-height: 0; padding: 16px; overflow-y: auto; background: linear-gradient(180deg, #f8fafc 0, #ffffff 142px), #ffffff; }

.detail-summary { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; margin-bottom: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }
.detail-summary__main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.detail-summary__label { color: #475569; font-size: 12px; font-weight: 800; }
.detail-summary__value { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-size: 17px; font-weight: 900; line-height: 1.25; word-break: normal; overflow-wrap: anywhere; }
.detail-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid #edf3f8; }
.detail-summary__meta-item { min-width: 0; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e8eef5; }
.detail-summary__meta-label { display: block; color: #475569; font-size: 11px; font-weight: 800; }
.detail-summary__meta-value { display: block; margin-top: 4px; color: #0f172a; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.detail-fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
.detail-field-card { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 12px 14px; background: #ffffff; border: 1px solid #c4d3e3; border-radius: 8px; box-shadow: 0 2px 8px rgba(33, 72, 108, 0.08); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
.detail-field-card:hover { border-color: #4a90d9; box-shadow: 0 4px 12px rgba(33, 72, 108, 0.12); }
.detail-field-card__label { display: flex; align-items: center; gap: 6px; color: #4a5e73; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; }
.detail-field-card__label::before { content: ""; width: 3px; height: 12px; background: #4a90d9; border-radius: 999px; flex-shrink: 0; }
.detail-field-card__value { color: #0f172a; font-size: 14px; font-weight: 700; line-height: 1.45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 9px; }

.time-section { min-width: 0; margin-top: 14px; padding: 14px; background: rgba(255, 255, 255, 0.96); border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055); }
.detail-section-title { display: block; margin-bottom: 12px; color: #183755; font-size: 14px; font-weight: 900; }
.time-list { position: relative; display: grid; gap: 0; }
.time-list::before { position: absolute; top: 16px; bottom: 16px; left: 6px; width: 2px; content: ""; background: #d7e8f6; }
.time-row { position: relative; display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 9px 0; }
.time-row__marker { position: relative; z-index: 1; width: 10px; height: 10px; margin-top: 4px; background: #0d82ee; border: 3px solid #e8f4ff; border-radius: 50%; box-shadow: 0 0 0 1px #b9dcff; }
.time-row__content { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; }
.time-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.time-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; line-height: 1.45; word-break: break-all; }
.time-section--location { background: linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%), rgba(255, 255, 255, 0.96); margin-top: 10px; }
.location-row { display: grid; grid-template-columns: 60px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 11px 0; border-bottom: 1px solid #edf3f8; &:last-child { border-bottom: 0; } }
.location-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.location-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; word-break: break-all; }

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
    max-height: 340px;
  }
}

/* 保证表格区域有足够最小高度，避免被趋势图挤压 */
:deep(.leak-table-view) {
  flex: 1 1 auto;
  min-height: 260px;
}

/* ========== 详情面板 Tab 切换 ========== */
.detail-tabs { display: flex; flex: none; border-bottom: 1px solid #edf3f8; }
.detail-tab { flex: 1; display: flex; align-items: center; justify-content: center; height: 42px; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; }
.detail-tab--active { color: #3b82f6; border-bottom-color: #3b82f6; }

/* ========== 通用按钮 / 图标 ========== */
.icon-button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #f6fbff; border: 1px solid #d9e7f3; border-radius: 6px; cursor: pointer; }
.icon-button--hover { background: #eff6ff; border-color: #3b82f6; }
.close-icon { position: relative; width: 14px; height: 14px; }
.close-icon::before, .close-icon::after { position: absolute; top: 6px; left: 0; width: 14px; height: 2px; content: ""; background: #64748b; border-radius: 2px; }
.close-icon::before { transform: rotate(45deg); }
.close-icon::after { transform: rotate(-45deg); }
.play-icon { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-play { width: 0; height: 0; border-style: solid; border-width: 6px 0 6px 10px; border-color: transparent transparent transparent #3b82f6; }

/* ========== 视频弹窗 ========== */
.video-dialog-mask { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: center; justify-content: center; background: rgba(15, 35, 55, 0.55); }
.video-dialog { width: min(900px, 92vw); background: #fff; border-radius: 10px; box-shadow: 0 12px 36px rgba(15, 35, 55, 0.25); overflow: hidden; }
.video-dialog__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #edf1f5; }
.video-dialog__title { color: #0f172a; font-size: 15px; font-weight: 700; }
.video-dialog__body { position: relative; padding: 16px; background: #000; }
.video-player { display: block; width: 100%; max-height: 60vh; background: #000; }
.video-empty { padding: 40px; color: #94a3b8; font-size: 14px; text-align: center; background: #fff; }
.video-loading { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); padding: 6px 16px; color: #fff; font-size: 12px; background: rgba(0, 0, 0, 0.6); border-radius: 4px; }
.video-dialog__info { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 12px 18px; border-top: 1px solid #edf1f5; background: #f8fafc; }
.video-info-row { display: flex; align-items: center; gap: 6px; }
.video-info-label { color: #64748b; font-size: 12px; font-weight: 700; }
.video-info-value { color: #0f172a; font-size: 13px; font-weight: 700; font-family: monospace; }
.video-seek-bar { position: relative; flex: 1; min-width: 120px; height: 6px; background: #e2e8f0; border-radius: 3px; cursor: pointer; }
.video-seek-filled { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px; }
.video-seek-thumb { position: absolute; top: 50%; width: 12px; height: 12px; background: #fff; border: 2px solid #3b82f6; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

/* ========== 音频弹窗 ========== */
.audio-dialog-mask { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: center; justify-content: center; background: rgba(15, 35, 55, 0.55); }
.audio-dialog { width: min(520px, 92vw); background: #fff; border-radius: 10px; box-shadow: 0 12px 36px rgba(15, 35, 55, 0.25); overflow: hidden; }
.audio-dialog__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #edf1f5; }
.audio-dialog__title { color: #0f172a; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
.audio-dialog__body { padding: 24px; background: linear-gradient(135deg, #f0f7ff 0%, #faf5ff 100%); }
.audio-empty { padding: 40px; color: #94a3b8; font-size: 14px; text-align: center; }
.audio-player { display: flex; align-items: center; gap: 20px; }
.audio-player__icon { flex-shrink: 0; }
.audio-cover { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
.audio-cover__ring { position: absolute; inset: 0; border: 3px solid #bfdbfe; border-top-color: #3b82f6; border-radius: 50%; animation: history-audio-spin 2s linear infinite; }
.audio-cover__dot { width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
.audio-player__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.audio-player__title { color: #0f172a; font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audio-player__loading { color: #f59e0b; font-size: 12px; font-weight: 600; }
.audio-player__progress { display: flex; align-items: center; gap: 8px; }
.audio-time { color: #64748b; font-size: 12px; font-weight: 700; font-family: monospace; min-width: 40px; text-align: center; flex-shrink: 0; }
.audio-seek-bar { position: relative; flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; cursor: pointer; }
.audio-seek-filled { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px; }
.audio-seek-thumb { position: absolute; top: 50%; width: 12px; height: 12px; background: #fff; border: 2px solid #3b82f6; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.audio-play-btn { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; margin: 0; background: #3b82f6; border: 0; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
.audio-play-btn--hover { background: #2563eb; }
.play-icon-large { display: inline-flex; align-items: center; justify-content: center; }
.icon-play-large { width: 0; height: 0; border-style: solid; border-width: 8px 0 8px 14px; border-color: transparent transparent transparent #fff; margin-left: 3px; }
.icon-pause-large { width: 14px; height: 16px; position: relative; }
.icon-pause-large::before, .icon-pause-large::after { content: ""; position: absolute; top: 0; width: 4px; height: 100%; background: #fff; border-radius: 1px; }
.icon-pause-large::before { left: 0; }
.icon-pause-large::after { right: 0; }
@keyframes history-audio-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ========== 附件播放区 ========== */
.time-section--attach { margin-top: 10px; }
.detail-section-title--video { margin-top: 16px; }
.attach-media { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.attach-media__item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 12px; background: #f8fafc; border: 1px solid #dfebf5; border-radius: 6px; }
.attach-media__player { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.attach-media__hint { color: #64748b; font-size: 12px; }
.attach-media__empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 8px 0; }
.attach-play-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 50%; cursor: pointer; }
.attach-play-btn--hover { background: #dbeafe; }
</style>
