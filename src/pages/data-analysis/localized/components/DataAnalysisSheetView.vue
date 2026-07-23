<template>
  <view class="sheet-view">
    <view class="sheet-toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">所属分区</text>
          <picker :range="partitionOptions" range-key="label" :value="currentDeptIndex" @change="onDeptChange">
            <view class="filter-select">
              <text>{{ currentDeptLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">设备编号</text>
          <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入" placeholder-class="input-placeholder" />
        </view>

        <view v-if="props.mode === 'leakage'" class="filter-group">
          <text class="filter-label">状态</text>
          <picker :range="leakageStatusOptions" range-key="label" :value="currentLeakageStatusIndex" @change="onLeakageStatusChange">
            <view class="filter-select">
              <text>{{ currentLeakageStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group filter-group--date">
          <text class="filter-label">时间</text>
          <view class="date-range">
            <DatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <DatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="search">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="reset">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="refresh">
            <text class="icon-refresh"></text>
          </button>
        </view>
      </view>
    </view>

    <view class="sheet-layout">
      <view class="sheet-table-panel">
        <view class="table-head">
          <text>{{ pageTitle }}</text>
          <text class="table-head__meta">{{ t('pagination.total', { count: props.mode === 'audio' ? audioTotal : leakTotal }) }}</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table" :style="gridColumnsStyle" :class="{ 'data-table--leakage': props.mode === 'leakage' }">
            <view class="data-row data-row--header" :class="{ 'data-row--leakage': props.mode === 'leakage' }">
              <view
                v-for="column in tableColumns"
                :key="column.key"
                class="data-cell data-header-cell"
                :class="[column.className, { 'data-header-cell--sortable': column.sortable, 'data-header-cell--active': sortState.field === column.key }]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <text>{{ column.label }}</text>
                <text v-if="column.sortable" class="sort-indicator" :class="getSortIndicatorClass(column.key)"></text>
              </view>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="filteredData.length === 0" class="table-state">暂无数据</view>

            <view
              v-for="(item, index) in filteredData"
              v-else
              :key="item.id"
              class="data-row"
              :class="{ 'data-row--active': selectedId === item.id, 'data-row--leakage': props.mode === 'leakage' }"
              @click="selectRow(item)"
            >
              <template v-if="props.mode === 'audio'">
                <text class="data-cell data-cell--index">{{ index + 1 }}</text>
                <text class="data-cell data-cell--device">{{ (item as AudioDataItem).deviceId }}</text>
                <text class="data-cell data-cell--time">{{ ((item as AudioDataItem).audioTime || '').replace('T', ' ') }}</text>
                <text class="data-cell data-cell--dept">{{ (item as AudioDataItem).deptName }}</text>
                <text class="data-cell data-cell--spectrum">
                  <text class="data-link" @click.stop="openSpectrumDialog(item as AudioDataItem)"><text class="spectrum-icon"></text>{{ t('ui.analysis') }}</text>
                </text>
                <text class="data-cell data-cell--download">
                  <text class="data-link" @click.stop="onDownload(item as AudioDataItem)"><text class="download-icon"></text>{{ t('ui.audio') }}</text>
                </text>
                <text class="data-cell data-cell--status">
                  <text class="status-pill" :class="getInstallStatusClass((item as AudioDataItem).status)">{{ translateStatus((item as AudioDataItem).status) }}</text>
                </text>
                <text class="data-cell data-cell--location">
                  <text class="data-link" @click.stop="onLocation(item as AudioDataItem)">{{ formatCoordinate((item as AudioDataItem).location) }}</text>
                </text>
              </template>
              <template v-else-if="props.mode === 'leakage'">
                <text class="data-cell data-cell--index">{{ index + 1 }}</text>
                <text class="data-cell data-cell--device">{{ (item as LeakItem).deviceId }}</text>
                <text class="data-cell data-cell--time">{{ ((item as LeakItem).detectedTime || '').replace(/\.\d+/, '').replace('T', ' ') }}</text>
                <text class="data-cell data-cell--dept">{{ (item as LeakItem).deptName }}</text>
                <text class="data-cell data-cell--status">
                  <text class="status-pill" :class="getLeakageStatusClass(item as LeakItem)">{{ translateLeakageStatus((item as LeakItem).leakageStatus) }}</text>
                </text>
                <text class="data-cell data-cell--install">
                  <text class="status-pill" :class="getInstallStatusClass((item as LeakItem).installStatus)">{{ translateStatus((item as LeakItem).installStatus) }}</text>
                </text>
                <text class="data-cell data-cell--bluewhale">{{ (item as LeakItem).blueWhaleAnalysis }}</text>
                <text class="data-cell data-cell--manualanalysis">{{ (item as LeakItem).manualAnalysis }}</text>
                <text class="data-cell data-cell--location">
                  <text class="data-link" @click.stop="onLocationLeak(item as LeakItem)">{{ formatCoordinate((item as LeakItem).location) }}</text>
                </text>
              </template>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar" data-i18n-ui>
          <view class="page-size">
            每页
            <view class="page-size-value" @click.stop="showPageSize = !showPageSize">
              {{ pageSize }}
            </view>
            <view v-if="showPageSize" class="page-size-popup">
              <view
                v-for="item in pageSizeOptions"
                :key="item"
                class="page-size-item"
                @click="selectPageSize(item)"
              >
                {{ item }}
              </view>
            </view>
            条
          </view>

          <button class="page-button" :disabled="currentPage <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">{{ t('pagination.pageInfo', { current: currentPage, total: totalPages }) }}</text>
          <button class="page-button" :disabled="currentPage >= totalPages" @click="changePage(1)">下一页</button>

          <view class="jump-box">
            到第
            <input class="page-input" type="number" v-model.number="jumpPage" />
            页
            <button class="page-button jump-btn" @click="jumpToPage">确定</button>
          </view>
        </view>
      </view>

      <view class="sheet-detail-panel">
        <view class="detail-tabs">
          <template v-if="props.mode === 'audio'">
            <view class="detail-tab" :class="{ 'detail-tab--active': activeAudioTab === 'base' }" @click="activeAudioTab = 'base'">基本信息</view>
            <view class="detail-tab" :class="{ 'detail-tab--active': activeAudioTab === 'audio-info' }" @click="activeAudioTab = 'audio-info'">音频信息</view>
            <view class="detail-tab" :class="{ 'detail-tab--active': activeAudioTab === 'audio-file' }" @click="activeAudioTab = 'audio-file'">音频文件</view>
          </template>
          <template v-else>
            <view
              v-for="tab in leakageDetailTabs"
              :key="tab.value"
              class="detail-tab"
              :class="{ 'detail-tab--active': leakageDetailTab === tab.value }"
              @click="leakageDetailTab = tab.value"
            >
              {{ tab.label }}
            </view>
          </template>
        </view>

        <view v-if="!selectedItem" class="detail-empty">请选择左侧数据查看详情</view>
        <view v-else class="detail-body">
          <template v-if="props.mode === 'audio'">
            <view v-if="activeAudioTab === 'base'" class="detail-base-panel leak-tab-body">
              <view class="detail-summary">
                <view class="detail-summary__main">
                  <text class="detail-summary__label">设备编号</text>
                  <text class="detail-summary__number">{{ (selectedItem as AudioDataItem).deviceId }}</text>
                </view>
                <view class="detail-summary__meta">
                  <view class="detail-summary__meta-item">
                    <text class="detail-summary__meta-label">安装人员</text>
                    <text class="detail-summary__meta-value">{{ (selectedItem as AudioDataItem).installer }}</text>
                  </view>
                  <view class="detail-summary__meta-item">
                    <text class="detail-summary__meta-label">所属分区</text>
                    <text class="detail-summary__meta-value">{{ (selectedItem as AudioDataItem).deptName }}</text>
                  </view>
                </view>
              </view>

              <view class="detail-grid detail-grid--base">
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">天气</text>
                  <text class="detail-item__value">{{ translateWeather((selectedItem as AudioDataItem).weather) }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">拆/装</text>
                  <text class="detail-item__value">{{ translateStatus((selectedItem as AudioDataItem).status) }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">阀门编号</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).valveNumber }}</text>
                </view>
              </view>

              <view class="time-section">
                <text class="detail-section-title">时间信息</text>
                <view class="time-list">
                  <view class="time-row">
                    <view class="time-row__marker"></view>
                    <view class="time-row__content">
                      <text class="time-row__label">采样开始时间</text>
                      <text class="time-row__value">{{ ((selectedItem as AudioDataItem).samplingTime || '--').replace('T', ' ') }}</text>
                    </view>
                  </view>
                  <view class="time-row">
                    <view class="time-row__marker"></view>
                    <view class="time-row__content">
                      <text class="time-row__label">数据发射时间</text>
                      <text class="time-row__value">{{ ((selectedItem as AudioDataItem).lastSamplingTime || '--').replace('T', ' ') }}</text>
                    </view>
                  </view>
									<view class="time-row">
									  <view class="time-row__marker"></view>
									  <view class="time-row__content">
									    <text class="time-row__label">创建时间</text>
									    <text class="time-row__value">{{ ((selectedItem as AudioDataItem).audioTime || '').replace('T', ' ') }}</text>
									  </view>
									</view>
									<view class="time-row">
									  <view class="time-row__marker"></view>
									  <view class="time-row__content">
									    <text class="time-row__label">修复时间</text>
									    <text class="time-row__value">{{ ((selectedItem as AudioDataItem).repairTime || '').replace('T', ' ') }}</text>
									  </view>
									</view>
                </view>
              </view>

              <view class="detail-location-card">
                <text class="detail-section-title">地址信息</text>
                <view class="location-row">
                  <text class="location-row__label">地址</text>
                  <text class="location-row__value">{{ (selectedItem as AudioDataItem).address }}</text>
                </view>
                <view class="location-row">
                  <text class="location-row__label">坐标</text>
                  <text class="location-row__value">{{ formatCoordinate((selectedItem as AudioDataItem).location) }}</text>
                </view>
              </view>
            </view>

            <view v-else-if="activeAudioTab === 'audio-info'" class="detail-base-panel leak-tab-body">
              <view class="detail-grid detail-grid--content">
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">采样率</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).samplingRate }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">单次测量时长</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).onceMeasureLength }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">滤波器低频点</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).filterLowFrequency }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">滤波器高频点</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).filterHighFrequency }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">滤波方式</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).filterMethod }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">增益原始值</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).gain }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">信号挡位</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).signalLevel }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">基准值</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).benchmarkValue }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">噪声基准值</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).noiseBenchmarkValue }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">信号采集通道</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).signalChannel }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">同步采样时间</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).syncSamplingTime }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">同步采样次数</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).syncSamplingNumber }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">音频上报规则</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).audioRule }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">每天测量组数</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).samplingCount }}</text>
                </view>
                <view class="detail-item detail-item--note">
                  <text class="detail-item__label">泄漏门限</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).leakThreshold }}</text>
                </view>
              </view>
            </view>

            <view v-else-if="activeAudioTab === 'audio-file'" class="detail-base-panel leak-tab-body">
              <view class="audio-file-cards">
                <view class="audio-file-card" @click="onSpectrumCardClick(selectedItem as AudioDataItem)">
                  <text class="audio-file-card__title">频谱分析</text>
                  <view class="audio-file-card__icon audio-file-card__icon--play">
                    <view class="play-circle"></view>
                  </view>
                  <text class="audio-file-card__desc">点击进行频谱分析和音频播放</text>
                </view>
                <view class="audio-file-card" @click="onDownload(selectedItem as AudioDataItem)">
                  <text class="audio-file-card__title">文件下载</text>
                  <view class="audio-file-card__icon audio-file-card__icon--download">
                    <text class="audio-download-icon"></text>
                  </view>
                  <text class="audio-file-card__desc">点击下载</text>
                </view>
              </view>
            </view>
          </template>
          <template v-else-if="props.mode === 'leakage'">
            <view class="detail-base-panel">
              <view v-if="leakageDetailTab === 'base'" class="leak-tab-body">
                <view class="detail-summary">
                  <view class="detail-summary__main">
                    <text class="detail-summary__label">设备编号</text>
                    <text class="detail-summary__number">{{ (selectedItem as LeakItem).deviceId }}</text>
                  </view>
                  <view class="detail-summary__meta">
                    <view class="detail-summary__meta-item">
                      <text class="detail-summary__meta-label">安装人员</text>
                      <text class="detail-summary__meta-value">{{ (selectedItem as LeakItem).installer }}</text>
                    </view>
                    <view class="detail-summary__meta-item">
                      <text class="detail-summary__meta-label">所属分区</text>
                      <text class="detail-summary__meta-value">{{ (selectedItem as LeakItem).deptName }}</text>
                    </view>
                  </view>
                </view>

              <view class="detail-grid detail-grid--base">
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">天气</text>
                  <text class="detail-item__value">{{ translateWeather((selectedItem as LeakItem).weather) }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">拆/装</text>
                  <text class="detail-item__value">{{ translateStatus((selectedItem as LeakItem).installStatus) }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">阀门编号</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).valveNumber }}</text>
                </view>
              </view>

              <view class="time-section">
                <text class="detail-section-title">时间信息</text>
                <view class="time-list">
                  <view class="time-row">
                    <view class="time-row__marker"></view>
                    <view class="time-row__content">
                      <text class="time-row__label">采样开始时间</text>
                      <text class="time-row__value">{{ ((selectedItem as LeakItem).samplingTime || '--').replace('T', ' ') }}</text>
                    </view>
                  </view>
                  <view class="time-row">
                    <view class="time-row__marker"></view>
                    <view class="time-row__content">
                      <text class="time-row__label">数据上报时间</text>
                      <text class="time-row__value">{{ ((selectedItem as LeakItem).lastSamplingTime || '--').replace('T', ' ') }}</text>
                    </view>
                  </view>
									<view class="time-row">
									  <view class="time-row__marker"></view>
									  <view class="time-row__content">
									    <text class="time-row__label">创建时间</text>
									    <text class="time-row__value">{{ ((selectedItem as LeakItem).detectedTime || '').replace(/\.\d+/, '').replace('T', ' ') }}</text>
									  </view>
									</view>
                </view>
              </view>

              <view class="detail-location-card">
                <text class="detail-section-title">地址信息</text>
                <view class="location-row">
                  <text class="location-row__label">地址</text>
                  <text class="location-row__value">{{ (selectedItem as LeakItem).address }}</text>
                </view>
                <view class="location-row">
                  <text class="location-row__label">坐标</text>
                  <text class="location-row__value">{{ formatCoordinate((selectedItem as LeakItem).location) }}</text>
                </view>
              </view>
              </view>

              <view v-else-if="leakageDetailTab === 'analysis'">
                <view class="detail-grid detail-grid--content">
                  <view class="detail-item detail-item--note" :class="'detail-item--status-' + getLeakageStatusColor(selectedItem as LeakItem)">
                    <text class="detail-item__label">泄露状态</text>
                    <text class="detail-item__value">{{ translateLeakageStatus((selectedItem as LeakItem).leakageStatus) }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">增益</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).gain }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露特征值</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).eigenvalue }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露强度</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakIntensity }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露门限</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakThreshold }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露带宽</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakBandwidth }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露能量</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakEnergy }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">泄露频率</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakFrequency }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">状态标志位</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).statusRemark }}</text>
                  </view>
                </view>
              </view>

              <view v-else-if="leakageDetailTab === 'leak-analysis'">
                <view class="detail-grid detail-grid--content">
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">蓝鲸分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).blueWhaleAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">人工分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).manualAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">原因分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).reasonAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">排查反馈</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).investigationFeedback }}</text>
                  </view>
                  <view class="detail-item detail-item--note">
                    <text class="detail-item__label">算法类型</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).algorithmType }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>

    <SpectrumDialog :visible="spectrumVisible" :item="spectrumItem" @close="closeSpectrumDialog" />

    <MapDialog v-model="mapVisible" :location="mapLocation" />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import DatetimePicker from "@/pages/data-analysis/localized/components/DatetimePicker.vue";
import MapDialog from "@/pages/data-analysis/localized/components/MapDialog.vue";
import SpectrumDialog from "@/pages/data-analysis/localized/components/SpectrumDialog.vue";
import { getAudioDataPage, getDataQueryAudioPage, getDataQueryAudioDetail, getAudioWav } from "@/services/data-analysis/audio";
import { getLeakageDataPage, getDataQueryLeakagePage, getDataQueryLeakageDetail } from "@/services/data-analysis/leakage";
import { getDeptList } from "@/services/partition/partition";
import { getLocale } from "@/i18n";
import "@/i18n/moduleLocales";
import daZhCN from "@/pages/data-analysis/localized/locales/zh-CN.json";
import daEnUS from "@/pages/data-analysis/localized/locales/en-US.json";

function getByPath(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

const daMessages: Record<string, unknown> = {
  "zh-CN": (daZhCN as Record<string, unknown>).dataAnalysis,
  "en-US": (daEnUS as Record<string, unknown>).dataAnalysis,
};

function t(key: string, params?: Record<string, unknown>): string {
  const localeValue = getByPath(daMessages[getLocale()], key);
  const defaultValue = getByPath(daMessages["zh-CN"], key);
  const message = localeValue ?? defaultValue ?? key;
  if (!params) return String(message);
  return String(message).replace(/\{(\w+)\}/g, (_, k) => params[k] != null ? String(params[k]) : `{${k}}`);
}

type DataAnalysisMode = "audio" | "leakage";

const props = defineProps<{
  mode: DataAnalysisMode;
}>();

const emit = defineEmits<{
  (event: "search", filters: DataAnalysisFilters): void;
  (event: "reset"): void;
  (event: "refresh"): void;
}>();

interface DataAnalysisFilters {
  deviceNumber: string;
  status: string;
  repairStartTime: string;
  repairEndTime: string;
  area: string;
  leakLevel: string;
  leakageStatus: string;
  startTime: string;
  endTime: string;
}

interface AudioDataItem {
  id: number;
  deviceId: string;
  audioTime: string;
  audioId: number;
  weather: string;
  status: string;
  installer: string;
  deptName: string;
  address: string;
  location: string;
  repairTime: string;
  valveNumber: string;
  samplingTime: string;
  lastSamplingTime: string;
  samplingRate: string;
  onceMeasureLength: string;
  filterLowFrequency: string;
  filterHighFrequency: string;
  filterMethod: string;
  gain: string;
  signalLevel: string;
  benchmarkValue: string;
  noiseBenchmarkValue: string;
  signalChannel: string;
  syncSamplingTime: string;
  syncSamplingNumber: string;
  audioRule: string;
  samplingCount: string;
  leakThreshold: string;
}

interface LeakItem {
  id: number;
  deviceId: string;
  detectedTime: string;
  weather: string;
  leakageStatus: string;
  gain: string;
  eigenvalue: string;
  installStatus: string;
  blueWhaleAnalysis: string;
  manualAnalysis: string;
  reasonAnalysis: string;
  investigationFeedback: string;
  algorithmType: string;
  leakBandwidth: string;
  leakEnergy: string;
  leakFrequency: string;
  valveNumber: string;
  deptName: string;
  installer: string;
  address: string;
  location: string;
  samplingTime: string;
  lastSamplingTime: string;
  leakIntensity: string;
  leakThreshold: string;
  statusRemark: string;
}

type DataItem = AudioDataItem | LeakItem;

interface TableColumn {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
}

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const pageSize = ref(10);
const pageSizeOptions = [10, 20, 50, 100];
const showPageSize = ref(false);
const jumpPage = ref<number | null>(null);

const filters = reactive<DataAnalysisFilters>({
  deviceNumber: "",
  status: "",
  repairStartTime: "",
  repairEndTime: "",
  area: "",
  leakLevel: "",
  leakageStatus: "",
  startTime: "",
  endTime: "",
});

const selectedId = ref<number>(0);
const selectedKey = ref("");
const currentPage = ref(1);
const spectrumVisible = ref(false);
const spectrumItem = ref<AudioDataItem | null>(null);

const mapVisible = ref(false);
const mapLocation = ref("");

const audioDataList = ref<AudioDataItem[]>([]);
const audioTotal = ref<number>(0);
const leakDataList = ref<LeakItem[]>([]);
const leakTotal = ref<number>(0);
const loading = ref<boolean>(false);

const gridColumns = ref("");
const gridColumnsStyle = computed(() => gridColumns.value ? { "--data-col-grid": gridColumns.value } as Record<string, string> : {});

const leakageDetailTab = ref<"base" | "analysis" | "leak-analysis">("base");
const activeAudioTab = ref<"base" | "audio-info" | "audio-file">("base");

const partitionOptions = ref<Array<{ label: string; value: number }>>([]);
const selectedDeptId = ref<number | undefined>(undefined);

const sortState = reactive({
  field: "createdAt",
  order: "desc",
});

const deviceStatusOptions = [
  { label: "全部", value: "" },
  { label: "已安装", value: "1" },
  { label: "未安装", value: "0" },
  { label: "报废", value: "2" },
];

const leakLevelOptions = [
  { label: "全部", value: "" },
  { label: "轻度", value: "1" },
  { label: "中度", value: "2" },
  { label: "重度", value: "3" },
  { label: "疑点", value: "4" },
];

const leakageStatusOptions = [
  { label: "全部", value: "" },
  { label: "渗漏", value: "0" },
  { label: "正常", value: "1" },
  { label: "疑似", value: "2" },
  { label: "未知", value: "3" },
];

const leakageDetailTabs = [
  { label: "基本信息", value: "base" as const },
  { label: "渗漏信息", value: "analysis" as const },
  { label: "渗漏分析", value: "leak-analysis" as const },
];

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    audio: "音频数据",
    leakage: "渗漏数据",
  };
  return titles[props.mode] || "数据列表";
});

const currentStatusIndex = computed(() => {
  const index = deviceStatusOptions.findIndex((item) => item.value === filters.status);
  return index >= 0 ? index : 0;
});

const currentStatusLabel = computed(() => {
  return deviceStatusOptions[currentStatusIndex.value]?.label || "全部";
});

const currentLeakLevelIndex = computed(() => {
  const index = leakLevelOptions.findIndex((item) => item.value === filters.leakLevel);
  return index >= 0 ? index : 0;
});

const currentLeakLevelLabel = computed(() => {
  return leakLevelOptions[currentLeakLevelIndex.value]?.label || "全部";
});

const currentLeakageStatusIndex = computed(() => {
  const index = leakageStatusOptions.findIndex((item) => item.value === filters.leakageStatus);
  return index >= 0 ? index : 0;
});

const currentLeakageStatusLabel = computed(() => {
  return leakageStatusOptions[currentLeakageStatusIndex.value]?.label || "全部";
});

const currentLeakageInstallIndex = computed(() => {
  const index = deviceStatusOptions.findIndex((item) => item.value === filters.status);
  return index >= 0 ? index : 0;
});

const currentLeakageInstallLabel = computed(() => {
  return deviceStatusOptions[currentLeakageInstallIndex.value]?.label || "全部";
});

const currentDeptIndex = computed(() => {
  const index = partitionOptions.value.findIndex((item) => item.value === selectedDeptId.value);
  return index >= 0 ? index : 0;
});

const currentDeptLabel = computed(() => {
  return partitionOptions.value[currentDeptIndex.value]?.label || "";
});

const filteredData = computed<DataItem[]>(() => {
  if (props.mode === "audio") return audioDataList.value;
  if (props.mode === "leakage") return leakDataList.value;
  return [];
});

const selectedItem = computed<DataItem | null>(() => {
  if (props.mode === "audio") return audioDataList.value.find((item) => item.id === selectedId.value) || null;
  if (props.mode === "leakage") return leakDataList.value.find((item) => item.id === selectedId.value) || null;
  return null;
});


const tableColumns = computed<TableColumn[]>(() => {
  if (props.mode === "audio") {
    return [
      { key: "index", label: "序号", className: "data-header-cell--index" },
      { key: "deviceNumber", label: "设备编号", className: "data-header-cell--device", sortable: true },
      { key: "audioTime", label: "时间", className: "data-header-cell--time", sortable: true },
      { key: "deptName", label: "所属分区", className: "data-header-cell--dept" },
      { key: "spectrum", label: "频谱", className: "data-header-cell--spectrum" },
      { key: "download", label: "下载", className: "data-header-cell--download" },
      { key: "status", label: "拆/装", className: "data-header-cell--status", sortable: true },
      { key: "location", label: "位置坐标", className: "data-header-cell--location" },
    ];
  }
  if (props.mode === "leakage") {
    return [
      { key: "index", label: "序号", className: "data-header-cell--index" },
      { key: "deviceNumber", label: "设备编号", className: "data-header-cell--device", sortable: true },
      { key: "detectedTime", label: "时间", className: "data-header-cell--time", sortable: true },
      { key: "deptName", label: "所属分区", className: "data-header-cell--dept" },
      { key: "leakageStatus", label: "状态", className: "data-header-cell--status", sortable: true },
      { key: "installStatus", label: "拆/装", className: "data-header-cell--install", sortable: true },
      { key: "blueWhaleAnalysis", label: "蓝鲸分析", className: "data-header-cell--bluewhale", sortable: true },
      { key: "manualAnalysis", label: "人工分析", className: "data-header-cell--manualanalysis", sortable: true },
      { key: "location", label: "坐标位置", className: "data-header-cell--location" },
    ];
  }
  return [];
});

const totalPages = computed(() => {
  if (props.mode === "audio") return Math.max(1, Math.ceil(audioTotal.value / pageSize.value));
  if (props.mode === "leakage") return Math.max(1, Math.ceil(leakTotal.value / pageSize.value));
  return Math.max(1, Math.ceil(filteredData.value.length / pageSize.value));
});

const sortFieldMap: Record<string, Record<string, string>> = {
  audio: {
    status: "maintenance",
  },
  leakage: {
    leakageStatus: "status",
    installStatus: "maintenance",
  },
};

function resolveSortField(): string {
  const modeMap = sortFieldMap[props.mode];
  if (modeMap && modeMap[sortState.field]) {
    return modeMap[sortState.field];
  }
  return sortState.field;
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFirstArray(source: Record<string, unknown> | undefined, keys: string[]): unknown[] {
  if (!source) return [];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function getFirstNumber(source: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value !== "") {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
  }
  return undefined;
}

function findPageContainer(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!isObject(value)) return null;
  const hasRecords = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal = getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecords || hasTotal) return value;
  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer(value[key] as Record<string, unknown>);
    if (matched) return matched;
  }
  return null;
}

function getSortIndicatorClass(field: string) {
  if (sortState.field !== field) return "sort-indicator--idle";
  return sortState.order === "asc" ? "sort-indicator--asc" : "sort-indicator--desc";
}

function toggleSort(field: string) {
  if (field === "index") return;
  if (sortState.field === field) {
    sortState.order = sortState.order === "asc" ? "desc" : "asc";
  } else {
    sortState.field = field;
    sortState.order = "desc";
  }
  currentPage.value = 1;
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
}

async function fetchAudioData() {
  if (props.mode !== "audio") return;
  loading.value = true;
  try {
    const params = buildAudioQueryParams();
    const response = await getDataQueryAudioPage(params) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    audioDataList.value = parsed.records.map((record: any, index: number) => ({
      id: record.id ?? (index + 1),
      deviceId: record.deviceNumber ?? "",
      audioTime: record.time ?? "--",
      audioId: record.audioId ?? 0,
      weather: record.weather ?? "--",
      status: record.maintenance ?? "--",
      installer: record.installer ?? "--",
      deptName: record.deptNames ?? "--",
      address: record.installAddress ?? "--",
      location: record.coordinate ?? "--",
      repairTime: record.repairTime ?? "--",
      valveNumber: record.valveNumber ?? "--",
			samplingTime: record.samplingTime ?? "--",
			lastSamplingTime: record.lastSamplingTime ?? "--",
			samplingRate: record.samplingRate + "HZ" ?? "--",
			onceMeasureLength: record.onceMeasureLength + "ms" ?? "--",
			filterLowFrequency: record.filterLowFrequency + "HZ" ?? "--",
			filterHighFrequency: record.filterHighFrequency + "HZ" ?? "--",
			filterMethod: record.filterMethod ?? "--",
			gain: record.gain?.raw ?? "--",
			signalLevel: record.signalLevel ?? "--",
			benchmarkValue: record.benchmarkValue ?? "--",
			noiseBenchmarkValue: record.noiseBenchmarkValue ?? "--",
			signalChannel: record.signalChannel ?? "--",
			syncSamplingTime: formatSyncSamplingTime(record.syncSamplingTime),
			syncSamplingNumber: record.syncSamplingNumber ?? "--",
			audioRule: record.audioRule ?? "--",
			samplingCount: record.samplingCount ?? "--",
			leakThreshold: record.leakThreshold ?? "--",
    }));
    audioTotal.value = parsed.total;
    selectedId.value = audioDataList.value.length > 0 ? audioDataList.value[0].id : 0;
    selectedKey.value = "";
  } catch (error) {
    console.error("获取音频数据失败:", error);
    audioDataList.value = [];
    audioTotal.value = 0;
    uni.showToast({
      title: (error as { msg?: string })?.msg || "音频数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function buildAudioQueryParams() {
  return removeEmptyFields({
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    sortOrder: sortState.order,
    sortField: resolveSortField(),
    deviceNumber: filters.deviceNumber.trim() || undefined,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    deptId: selectedDeptId.value,
  });
}

async function fetchLeakageData() {
  if (props.mode !== "leakage") return;
  loading.value = true;
  try {
    const params = buildLeakageQueryParams();
    const response = await getDataQueryLeakagePage(params) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    leakDataList.value = parsed.records.map((record: any, index: number) => ({
      id: record.id ?? (index + 1),
      deviceId: record.deviceNumber ?? "",
      detectedTime: record.time ?? "--",
      weather: record.weather ?? "--",
      leakageStatus: record.status ?? "--",
      gain: record.gain?.raw ?? "--",
      eigenvalue: record.leakEsa ?? "--",
      installStatus: record.maintenance ?? "--",
      blueWhaleAnalysis: record.blueWhaleAnalysis ?? "--",
      manualAnalysis: record.manualAnalysis ?? "--",
      reasonAnalysis: record.reasonAnalysis ?? "--",
      investigationFeedback: record.troubleshootingFeedback ?? "--",
      algorithmType: record.algorithmType ?? "--",
      leakBandwidth: record.leakBandwidth ?? "--",
      leakEnergy: record.leakEnergy ?? "--",
      leakFrequency: record.leakFrequency ?? "--",
      valveNumber: record.valveNumber ?? "--",
      deptName: record.deptNames ?? "--",
      installer: record.installer ?? "--",
      address: record.installAddress ?? "--",
      location: record.coordinate ?? "--",
      samplingTime: record.samplingTime ?? "--",
			lastSamplingTime: record.lastSamplingTime ?? "--",
			leakIntensity: record.leakIntensity ?? "--",
			leakThreshold: record.leakThreshold ?? "--",
			statusRemark: record.statusRemark ?? "--",
    }));
    leakTotal.value = parsed.total;
    selectedId.value = leakDataList.value.length > 0 ? leakDataList.value[0].id : 0;
    selectedKey.value = "";
  } catch (error) {
    console.error("获取渗漏数据失败:", error);
    leakDataList.value = [];
    leakTotal.value = 0;
    uni.showToast({
      title: (error as { msg?: string })?.msg || "渗漏数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function buildLeakageQueryParams() {
  return removeEmptyFields({
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    sortOrder: sortState.order,
    sortField: resolveSortField(),
    deviceNumber: filters.deviceNumber.trim() || undefined,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    leakStatus: filters.leakageStatus !== "" ? Number(filters.leakageStatus) : undefined,
    deptId: selectedDeptId.value,
  });
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

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }
  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data as Record<string, unknown>) || findPageContainer(response) || {};
  const records = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topLevelRecords = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = records.length > 0 ? records : topLevelRecords;
  const totalValue = getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"])
    ?? getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"])
    ?? 0;
  const minimumVisibleTotal = (currentPage.value - 1) * pageSize.value + finalRecords.length;
  const resolvedTotal = Math.max(totalValue, minimumVisibleTotal);

  return {
    records: finalRecords.map((item) => (isObject(item) ? item : { value: item })),
    total: resolvedTotal,
  };
}

function openSpectrumDialog(item: AudioDataItem) {
  spectrumItem.value = item;
  spectrumVisible.value = true;
}

function closeSpectrumDialog() {
  spectrumVisible.value = false;
}

function onSpectrumCardClick(item: AudioDataItem) {
  openSpectrumDialog(item);
}

async function onDownload(item: AudioDataItem) {
  if (!item.audioId) {
    uni.showToast({ title: "暂无音频文件", icon: "none" });
    return;
  }
  try {
    const res = await getAudioWav(item.audioId, true);
    if (res.statusCode === 200) {
      uni.showToast({ title: "下载成功", icon: "success" });
    } else {
      uni.showToast({ title: "下载失败", icon: "none" });
    }
  } catch (error) {
    uni.showToast({ title: "下载失败", icon: "none" });
  }
}

function formatCoordinate(location: string) {
  if (!location || location === "--") return location;
  const parts = location.split(",");
  if (parts.length !== 2) return location;
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return location;
  return `${lng.toFixed(4)},${lat.toFixed(4)}`;
}

function formatSyncSamplingTime(value: any): string {
  if (!value || value === "--") return "--";
  let arr: number[];
  if (Array.isArray(value)) {
    arr = value;
  } else if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
    try { arr = JSON.parse(value); } catch { return value; }
  } else {
    return value;
  }
  if (!Array.isArray(arr) || arr.length < 2) return "--";
  const h = Number(arr[0]);
  const m = Number(arr[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "--";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function onLocation(item: AudioDataItem) {
  if (!item.location || item.location === "--") {
    uni.showToast({ title: "暂无坐标数据", icon: "none" });
    return;
  }
  mapLocation.value = item.location;
  mapVisible.value = true;
}

function onLocationLeak(item: LeakItem) {
  if (!item.location || item.location === "--") {
    uni.showToast({ title: "暂无坐标数据", icon: "none" });
    return;
  }
  mapLocation.value = item.location;
  mapVisible.value = true;
}

function getLeakageStatusClass(item: LeakItem) {
  const status = item.leakageStatus;
  if (status === "渗漏" || status === "0") return "status-pill--leak";
  if (status === "正常" || status === "1") return "status-pill--normal";
  if (status === "疑似" || status === "2") return "status-pill--suspicious";
  return "status-pill--unknown";
}

function getLeakageStatusColor(item: LeakItem) {
  const status = item.leakageStatus;
  if (status === "渗漏" || status === "0") return "leak";
  if (status === "正常" || status === "1") return "normal";
  if (status === "疑似" || status === "2") return "suspicious";
  return "unknown";
}

function getInstallStatusClass(status: string) {
  if (status === "安装") return "status-pill--installed";
  if (status === "拆卸") return "status-pill--removed";
  return "status-pill--unknown";
}

function getStatusKey(status: string): string {
  if (status === "安装") return "installed";
  if (status === "拆卸") return "removed";
  return status;
}
function getLeakageStatusKey(status: string): string {
  if (status === "渗漏" || status === "0") return "leak";
  if (status === "正常" || status === "1") return "normal";
  if (status === "疑似" || status === "2") return "suspected";
  if (status === "未知" || status === "3") return "unknown";
  return status;
}
function getWeatherKey(weather: string): string {
  if (weather === "晴") return "sunny";
  if (weather === "雨") return "rain";
  if (weather === "多云") return "cloudy";
  if (weather === "阴") return "overcast";
  return weather;
}
function translateStatus(status: string) {
  if (status === "--") return "--";
  return t(`status.${getStatusKey(status)}`);
}
function translateLeakageStatus(status: string) {
  if (status === "--") return "--";
  return t(`status.${getLeakageStatusKey(status)}`);
}
function translateWeather(weather: string) {
  if (weather === "--") return "--";
  return t(`weather.${getWeatherKey(weather)}`);
}

function onStatusChange(e: { detail: { value: number } }) {
  filters.status = deviceStatusOptions[e.detail.value]?.value ?? "";
}

function onLeakLevelChange(e: { detail: { value: number } }) {
  filters.leakLevel = leakLevelOptions[e.detail.value]?.value ?? "";
}

function onLeakageStatusChange(e: { detail: { value: number } }) {
  filters.leakageStatus = leakageStatusOptions[e.detail.value]?.value ?? "";
}

function onLeakageInstallChange(e: { detail: { value: number } }) {
  filters.status = deviceStatusOptions[e.detail.value]?.value ?? "";
}

function onDeptChange(e: { detail: { value: number } }) {
  const dept = partitionOptions.value[e.detail.value];
  selectedDeptId.value = dept?.value;
}

function selectRow(item: DataItem) {
  selectedId.value = item.id;
}

function getCellValue(item: DataItem, key: string): string {
  return (item as Record<string, any>)[key] ?? "";
}

function search() {
  currentPage.value = 1;
  selectedId.value = 0;
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
  emit("search", { ...filters });
}

function reset() {
  filters.deviceNumber = "";
  filters.status = "";
  filters.repairStartTime = "";
  filters.repairEndTime = "";
  filters.area = "";
  filters.leakLevel = "";
  filters.leakageStatus = "";
  filters.startTime = "";
  filters.endTime = "";
  currentPage.value = 1;
  selectedId.value = 0;
  sortState.field = "createdAt";
  sortState.order = "desc";
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
  emit("reset");
}

function refresh() {
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
  emit("refresh");
}

function changePage(step: number) {
  currentPage.value = Math.max(1, Math.min(totalPages.value, currentPage.value + step));
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
}

function selectPageSize(size: number) {
  showPageSize.value = false;
  pageSize.value = size;
  currentPage.value = 1;
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
}

function jumpToPage() {
  const page = Number(jumpPage.value);
  if (!page || page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  jumpPage.value = null;
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
}

async function loadPartitions() {
  try {
    const response = await getDeptList() as { data: Array<{ id: number; deptName: string }> };
    const list = response?.data;
    if (Array.isArray(list)) {
      partitionOptions.value = list.map((item) => ({
        label: item.deptName,
        value: item.id,
      }));
      if (partitionOptions.value.length > 0 && selectedDeptId.value == null) {
        selectedDeptId.value = partitionOptions.value[0].value;
      }
    }
  } catch (e) {
    console.error("加载分区列表失败:", e);
  }
}

onMounted(async () => {
  await loadPartitions();
  if (props.mode === "audio") {
    fetchAudioData();
  } else if (props.mode === "leakage") {
    fetchLeakageData();
  }
});

watch(
  () => props.mode,
  (newMode) => {
    currentPage.value = 1;
    selectedId.value = 0;
    if (newMode === "audio") {
      fetchAudioData();
    } else if (newMode === "leakage") {
      fetchLeakageData();
    }
  }
);

function logColumnWidths() {
  const query = uni.createSelectorQuery();
  query.select(".data-row").boundingClientRect();
  query.selectAll(".data-row .data-cell").boundingClientRect();
  query.exec((results: any) => {
    const [row, cells] = results as [UniApp.NodeInfo, UniApp.NodeInfo[]];
    if (!row || !cells || cells.length === 0) return;

    const colCount = props.mode === "leakage" ? 8 : 7;
    const perRow = colCount + 1;
    const rowCount = Math.floor(cells.length / perRow);
    if (rowCount === 0) return;

    const indexWidth = Math.round(cells[0]?.width || 0);

    const maxWidths: number[] = new Array(colCount).fill(0);
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cell = cells[r * perRow + 1 + c];
        if (cell) {
          maxWidths[c] = Math.max(maxWidths[c], Math.round(cell.width || 0));
        }
      }
    }

    const totalDataWidth = maxWidths.reduce((a: number, b: number) => a + b, 0);
    const availableWidth = Math.round(row.width || 0) - indexWidth;
    const gap = availableWidth - totalDataWidth;

    const parts = maxWidths.map((w: number, i: number) => `col${i + 1} max=${w}px`);

    if (gap >= 0) {
      const share = Math.floor(gap / colCount);
      const finalWidths = maxWidths.map((w: number) => w + share);

      gridColumns.value = finalWidths.join("px ") + "px";

      console.log(
        `[ColumnWidth] ${props.mode} | row=${Math.round(row.width)}px index=${indexWidth}px available=${availableWidth}px share=${share}px rows=${rowCount} | ` +
        `formula: width=max_content+remaining/${colCount} | ` +
        parts.join(" | ") +
        ` → final: ${finalWidths.map((w: number) => w + "px").join(" | ")}`
      );
    } else {

      console.log(
        `[ColumnWidth] ${props.mode} | row=${Math.round(row.width)}px index=${indexWidth}px available=${availableWidth}px rows=${rowCount} | ` +
        `total=${totalDataWidth}px overflow=${gap}px (scrollbar) | ` +
        `formula: width=max_content | ` +
        parts.join(" | ")
      );
    }
  });
}

watch([filteredData, loading, () => getLocale()], ([_data, isLoading]) => {
  if (!isLoading) {
    gridColumns.value = "";
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          logColumnWidths();
        });
      });
    });
  }
});
</script>

<style scoped lang="scss">
.sheet-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
}

.sheet-toolbar {
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

.toolbar-row {
  min-width: 0;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 14px 20px;
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
  min-width: 0;
}

.toolbar-row--filters .filter-group:first-child {
  flex-basis: 236px;
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
  height: 30px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-row--filters .filter-input,
.toolbar-row--filters .filter-select {
  height: 28px;
  line-height: 28px;
}

.input-placeholder {
  color: #9aa9b8;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-datetime {
  flex: 0 0 200px;
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: auto;
  align-self: end;
}

.toolbar-button,
.toolbar-icon-button {
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

.toolbar-actions .toolbar-button,
.toolbar-actions .toolbar-icon-button {
  height: 38px;
  line-height: 1.2;
  border-radius: 5px;
}

.toolbar-actions .toolbar-button {
  min-width: 64px;
  padding: 0 15px;
}

.toolbar-actions .toolbar-icon-button {
  width: 38px;
}

.toolbar-button::after,
.toolbar-icon-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.icon-refresh {
  position: relative;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -3px;
  right: -2px;
  width: 0;
  height: 0;
  content: "";
  border: 4px solid transparent;
  border-left-color: currentColor;
  transform: rotate(-20deg);
}

.sheet-layout,
.sheet-table-panel,
.sheet-detail-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.sheet-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px);
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.sheet-table-panel,
.sheet-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
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
  overflow-x: auto;
  background: #ffffff;
}

.data-table {
  display: grid;
  grid-template-columns: 58px var(--data-col-grid, repeat(7, auto));
  width: 100%;
  min-width: max-content;
  background: #ffffff;
}

.data-table--leakage {
  grid-template-columns: 58px var(--data-col-grid, repeat(8, auto));
  width: 100%;
  min-width: max-content;
}

.data-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  min-height: 42px;
  min-width: 0;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.data-row--leakage {
  min-width: 0;
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
  padding: 0 12px;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;

  :deep(uni-text) {
    white-space: nowrap;
  }
}

.data-cell:last-child {
  border-right: 0;
}

.data-header-cell--sortable {
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}

.data-header-cell--sortable:hover {
  color: #0d82ee;
  background: #edf7ff;
}

.data-header-cell--active {
  color: #0d82ee !important;
  background: #eaf5ff;
}

.sort-indicator {
  position: relative;
  flex: none;
  width: 12px;
  height: 14px;
  color: #9cafc1;
}

.sort-indicator::before,
.sort-indicator::after {
  position: absolute;
  left: 3px;
  width: 0;
  height: 0;
  content: "";
  border-right: 3px solid transparent;
  border-left: 3px solid transparent;
}

.sort-indicator::before {
  top: 1px;
  border-bottom: 4px solid currentColor;
}

.sort-indicator::after {
  bottom: 1px;
  border-top: 4px solid currentColor;
}

.sort-indicator--asc::before,
.sort-indicator--desc::after {
  color: #0d82ee;
}

.sort-indicator--asc::after,
.sort-indicator--desc::before,
.sort-indicator--idle {
  opacity: 0.46;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--device {
  color: #0f4c81;
  font-weight: 800;
}

.data-cell--dept {
  justify-content: center;
}

.data-cell--address {
  justify-content: flex-start;
  text-align: left;
}

.data-cell--location {
  justify-content: center;
  text-align: center;
}

.data-link {
  color: #0d82ee;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.download-icon { position: relative; display: inline-block; width: 12px; height: 14px; margin-right: 4px; vertical-align: middle; background: linear-gradient(to right, transparent 5px, currentColor 5px, currentColor 7px, transparent 7px) no-repeat top center / 100% 8px; }
.download-icon::before { content: ""; position: absolute; top: 5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid currentColor; }
.download-icon::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 0; border-top: 2px solid currentColor; }

.spectrum-icon { display: inline-block; width: 16px; height: 16px; margin-right: 4px; vertical-align: middle; border: 2px solid currentColor; border-radius: 50%; position: relative; }
.spectrum-icon::after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-30%, -50%); width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid currentColor; }

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
  white-space: nowrap;
}

.status-pill--leak {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.status-pill--normal {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--suspicious {
  color: #b54708;
  background: #fff6ed;
  border-color: #fddcab;
}

.status-pill--unknown {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.status-pill--installed {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--removed {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.table-state {
  grid-column: 1 / -1;
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.pagination-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.page-size-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 30px;
  padding: 0 10px;
  color: #31506d;
  font-size: 13px;
  font-weight: 600;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-size-value:hover {
  background: #eef7ff;
  border-color: #a9d2ff;
}

.page-size-popup {
  position: absolute;
  bottom: 42px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 70px;
  padding: 6px 0;
  background: #fff;
  border: 1px solid #d9e7f3;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 35, 55, 0.18);
  z-index: 9999;
}

.page-size-popup::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-right: 1px solid #d9e7f3;
  border-bottom: 1px solid #d9e7f3;
  transform: translateX(-50%) rotate(45deg);
}

.page-size-item {
  height: 32px;
  line-height: 32px;
  padding: 0 18px;
  color: #31506d;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
}

.page-size-item:hover {
  background: #eef7ff;
}

.jump-box {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-input {
  width: 50px;
  height: 30px;
  color: #64748b;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
}

.page-button {
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

.page-info {
  color: #64748b;
  font-size: 13px;
}

.detail-body {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background:
    linear-gradient(180deg, #f5faff 0, #ffffff 142px),
    #ffffff;
}

.detail-empty {
  height: 260px;
  color: #8a9aab;
  font-size: 14px;
  line-height: 260px;
  text-align: center;
}

.detail-tabs {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px 14px;
  background: #f6fafe;
  border-bottom: 1px solid #dce9f4;
}

.detail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  color: #5d7188;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px 8px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.detail-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
}

.detail-base-panel {
  display: grid;
  gap: 12px;
}

.leak-tab-body {
  display: grid;
  gap: 14px;
}

.leak-tab-body .detail-location-card {
  margin-top: 0;
}

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #dce9f4;
  border-left: 4px solid #0d82ee;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-summary__main {
  min-width: 0;
}

.detail-summary__label {
  display: block;
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary__number {
  display: block;
  margin-top: 7px;
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: anywhere;
}

.detail-summary__badges {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-summary__badge {
  min-width: 64px;
  height: 26px;
  line-height: 26px;
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
}

.detail-summary__meta-label {
  display: block;
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}

.detail-summary__meta-value {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.urgent-pill--normal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-grid--base {
  grid-template-columns: 1fr;
  gap: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 74px;
  padding: 12px 13px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.detail-item--base {
  position: relative;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  min-height: 48px;
  padding: 8px 14px;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #edf3f8;
  border-radius: 0;
  box-shadow: none;
}

.detail-grid--base .detail-item--base:last-child {
  border-bottom: 0;
}

.detail-item--base .detail-item__label {
  color: #71869b;
}

.detail-item--base .detail-item__value {
  margin-top: 0;
  text-align: right;
  word-break: break-all;
}

.detail-item__label {
  display: flex;
  align-items: center;
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.detail-item__value {
  display: block;
  margin-top: 8px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.detail-grid--content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-grid--content .detail-item {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  border-color: #dfebf5;
  box-shadow: none;
}

.detail-item--note .detail-item__label {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #5f7891;
  font-size: 12px;
  background: #f7fafc;
  border-left: 3px solid #b9dcff;
}

.detail-item--status-leak .detail-item__label { border-left-color: #f5b7ae; }
.detail-item--status-normal .detail-item__label { border-left-color: #b7dfc7; }
.detail-item--status-suspicious .detail-item__label { border-left-color: #fbd5b0; }
.detail-item--status-unknown .detail-item__label { border-left-color: #d3dce3; }

.detail-grid--content .detail-item__value {
  min-height: 52px;
  margin-top: 0;
  padding: 14px 14px;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  background: #fbfdff;
  border-left: 1px solid #edf3f8;
  border-radius: 0;
  white-space: pre-wrap;
}

/* ===== 地点信息 / 备注卡片 ===== */
.time-section {
  min-width: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.time-section--location {
  background:
    linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%),
    rgba(255, 255, 255, 0.96);
}

.detail-section-title {
  display: block;
  margin-bottom: 12px;
  color: #183755;
  font-size: 14px;
  font-weight: 900;
}

.remark-content {
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-all;
}

.detail-location-card {
  margin-top: 12px;
  padding: 14px;
  background: linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%), rgba(255, 255, 255, 0.96);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.time-section {
  min-width: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.detail-section-title { display: block; margin-bottom: 10px; color: #183755; font-size: 14px; font-weight: 900; }

.time-list {
  position: relative;
  display: grid;
  gap: 0;
}

.time-list::before {
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 6px;
  width: 2px;
  content: "";
  background: #d7e8f6;
}

.time-row {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  padding: 9px 0;
}

.time-row__marker {
  position: relative;
  z-index: 1;
  width: 10px;
  height: 10px;
  margin-top: 4px;
  background: #0d82ee;
  border: 3px solid #e8f4ff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #b9dcff;
}

.time-row__content {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.time-row__label {
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.time-row__value {
  min-width: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-all;
}

.location-row { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 10px 0; border-top: 1px solid #edf3f8; }
.location-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.location-row__value { color: #172033; font-size: 13px; font-weight: 700; line-height: 1.5; word-break: break-all; }

@media (max-width: 1280px) {
  .toolbar-row--filters {
    gap: 10px;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 980px) {
  .sheet-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .sheet-detail-panel {
    min-height: 360px;
  }

  .data-table,
  .data-row {
  min-width: 0;
  }

  .data-table {
    grid-template-columns: 46px var(--data-col-grid, repeat(7, auto));
  }

  .data-table--leakage {
    grid-template-columns: 46px var(--data-col-grid, repeat(8, auto));
  }
}

@media (max-width: 760px) {
  .sheet-toolbar {
    padding: 12px;
  }

  .toolbar-row--filters {
    display: grid;
    grid-template-columns: 1fr;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    margin-left: 0;
  }

  .filter-group,
  .toolbar-row--filters .filter-group:first-child {
    flex-basis: auto;
  }

  .date-range {
    display: grid;
    grid-template-columns: 1fr;
  }

  .filter-datetime {
    flex-basis: auto;
    width: 100%;
  }

  .filter-separator {
    display: none;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .sheet-toolbar {
    gap: 8px;
    padding: 10px 12px;
  }

  .toolbar-row--filters {
    gap: 8px 10px;
  }

  .filter-group {
    gap: 4px;
  }

  .filter-label {
    font-size: 11px;
  }

  .filter-input,
  .filter-select,
  .toolbar-row--filters .filter-input,
  .toolbar-row--filters .filter-select {
    height: 27px;
    font-size: 12px;
    line-height: 27px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}

.audio-file-section {
  min-width: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
  margin-top: 12px;
}

.audio-file-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  cursor: pointer;
  background: #f6fafe;
  border: 1px solid #dce9f4;
  border-radius: 6px;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.audio-file-card:active {
  background: #e8f4ff;
  border-color: #b9dcff;
}

.audio-file-card__title {
  color: #183755;
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 12px;
}

.audio-file-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 10px;
}

.play-circle {
  width: 44px;
  height: 44px;
  border: 3px solid #0d82ee;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-circle::after {
  content: "";
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid #0d82ee;
  transform: translateX(2px);
}

.audio-download-icon {
  position: relative;
  display: inline-block;
  width: 22px;
  height: 26px;
  background: linear-gradient(to right, transparent 9px, #0d82ee 9px, #0d82ee 13px, transparent 13px) no-repeat top center / 100% 14px;
}

.audio-download-icon::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #0d82ee;
}

.audio-download-icon::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;
  border-top: 3px solid #0d82ee;
}

.audio-file-card__desc {
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}

.audio-file-card__desc {
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}
</style>
