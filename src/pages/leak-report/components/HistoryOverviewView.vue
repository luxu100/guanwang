<template>
  <view class="history-overview-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">时间范围</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <!-- 渗漏记录tab：渗漏状态 + 巡检人员 -->
        <template v-if="activeDataTab === 'leakage'">
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">巡检人员</text>
            <input v-model="filters.inspector" class="filter-input" placeholder="请输入巡检人员" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 设备上报tab：渗漏状态 + 设备编号 -->
        <template v-else-if="activeDataTab === 'deviceUpload'">
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 算法分析tab：设备编号 + 算法状态 + 算法名称 -->
        <template v-else-if="activeDataTab === 'algorithm'">
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="filter-group">
            <text class="filter-label">执行状态</text>
            <picker :range="algorithmStatusOptions" range-key="label" @change="handleAlgorithmStatusChange">
              <view class="filter-select">
                <text>{{ currentAlgorithmStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">算法名称</text>
            <input v-model="filters.algorithmName" class="filter-input" placeholder="请输入算法名称" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 采样记录tab：渗漏状态 + 设备编号 + 管组编号 -->
        <template v-else-if="activeDataTab === 'sampling'">
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="filter-group">
            <text class="filter-label">管组编号</text>
            <input v-model="filters.tubeGroup" class="filter-input" placeholder="请输入管组编号" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 采样明细tab：采样记录ID + 设备编号 -->
        <template v-else-if="activeDataTab === 'samplingDetail'">
          <view class="filter-group">
            <text class="filter-label">采样记录ID</text>
            <input v-model="filters.samplingId" class="filter-input" placeholder="请输入采样记录ID" placeholder-class="input-placeholder" />
          </view>
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 采样日报tab：渗漏状态 + 设备编号 -->
        <template v-else>
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
        </template>

        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchHistory">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchHistoryData">
            <text class="icon-refresh"></text>
          </button>
          <view class="export-dropdown">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="exportMenuVisible = !exportMenuVisible">导出</button>
            <view v-if="exportMenuVisible" class="export-menu">
              <view class="export-menu__item" @click="handleExport('current')">导出当前页</view>
              <view class="export-menu__item" @click="handleExport('all')">导出全部</view>
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

    <!-- 主内容区 -->
    <LeakTableView
      :title="`${activeTabLabel}历史`"
      :total="total"
      :page-num="pagination.pageNum"
      :page-size="pagination.pageSize"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      detail-empty-text="请选择左侧记录查看详情"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
      @jump-page="jumpToPage"
      @page-size-change="handlePageSizeChange"
    >
      <view class="data-table">
        <!-- 渗漏记录列头 -->
        <view v-if="activeDataTab === 'leakage'" class="data-row data-row--header data-row--leakage">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectTime')">检出时间<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakStatus')">渗漏状态<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakStatus'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--type">漏点类型</text>
          <text class="data-cell data-cell--address">漏点位置</text>
          <text class="data-cell data-cell--account">巡检人员</text>
          <text class="data-cell data-cell--material">管道材质</text>
          <text class="data-cell data-cell--remark">描述</text>
        </view>

        <!-- 设备上报列头 -->
        <view v-else-if="activeDataTab === 'deviceUpload'" class="data-row data-row--header data-row--deviceUpload">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">上报时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">渗漏标志位</text>
          <text class="data-cell data-cell--esa">特征值</text>
          <text class="data-cell data-cell--intensity">强度</text>
          <text class="data-cell data-cell--frequency">频率</text>
          <text class="data-cell data-cell--firmware">固件版本</text>
        </view>

        <!-- 算法分析列头 -->
        <view v-else-if="activeDataTab === 'algorithm'" class="data-row data-row--header data-row--algorithm">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">创建时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--signal">算法名称</text>
          <text class="data-cell data-cell--status">执行状态</text>
          <text class="data-cell data-cell--signal">输出值</text>
          <text class="data-cell data-cell--esa">耗时(ms)</text>
        </view>

        <!-- 采样记录列头 -->
        <view v-else-if="activeDataTab === 'sampling'" class="data-row data-row--header data-row--sample">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">采样时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">渗漏标志位</text>
          <text class="data-cell data-cell--esa">特征值</text>
          <text class="data-cell data-cell--intensity">强度</text>
          <text class="data-cell data-cell--frequency">频率</text>
          <text class="data-cell data-cell--address">采样地址</text>
        </view>

        <!-- 采样明细列头 -->
        <view v-else-if="activeDataTab === 'samplingDetail'" class="data-row data-row--header data-row--samplingDetail">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">创建时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--esa">特征值</text>
          <text class="data-cell data-cell--intensity">强度</text>
          <text class="data-cell data-cell--frequency">频率</text>
          <text class="data-cell data-cell--order">排序序号</text>
        </view>

        <!-- 采样日报列头 -->
        <view v-else class="data-row data-row--header data-row--samplingDaily">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">采样时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">渗漏状态</text>
          <text class="data-cell data-cell--property">渗漏值</text>
          <text class="data-cell data-cell--address">采样地址</text>
        </view>

        <view v-if="loading" class="table-state table-state--loading"><view class="state-spinner"></view><text class="state-text">加载中...</text></view>
        <view v-else-if="records.length === 0" class="table-state table-state--empty"><view class="state-icon-empty"></view><text class="state-text">暂无历史数据</text></view>

        <!-- 渗漏记录行 -->
        <view v-else-if="activeDataTab === 'leakage'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--leakage"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectTime")) }}</text>
            <text class="data-cell data-cell--level"><text class="status-tag" :class="getLeakageStatusTagClass(item)">{{ getFieldValue(item, "leakStatus") || "-" }}</text></text>
            <text class="data-cell data-cell--type">{{ getFieldValue(item, "leakPointType") || "-" }}</text>
            <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakPointPosition") || "-" }}</text>
            <text class="data-cell data-cell--account">{{ getFieldValue(item, "inspector") || "-" }}</text>
            <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
            <text class="data-cell data-cell--remark">{{ getFieldValue(item, "description") || "-" }}</text>
          </view>
        </view>

        <!-- 设备上报行 -->
        <view v-else-if="activeDataTab === 'deviceUpload'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--deviceUpload"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "uploadTime")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text class="status-tag" :class="getLeakStatusTagClass(item)">{{ getLeakStatusLabel(item) }}</text>
            </text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "leakEsa") ?? "-" }}</text>
            <text class="data-cell data-cell--intensity">{{ getFieldValue(item, "leakIntensity") ?? "-" }}</text>
            <text class="data-cell data-cell--frequency">{{ getFieldValue(item, "leakFrequency") ?? "-" }}</text>
            <text class="data-cell data-cell--firmware">{{ getFieldValue(item, "firmwareVersion") || "-" }}</text>
          </view>
        </view>

        <!-- 算法分析行 -->
        <view v-else-if="activeDataTab === 'algorithm'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--algorithm"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "createdAt")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--signal">{{ getFieldValue(item, "algorithmName") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text v-if="getFieldValue(item, 'status')" class="status-tag" :class="getAlgorithmStatusTagClass(item)">{{ getAlgorithmStatusLabel(item) }}</text>
              <text v-else>-</text>
            </text>
            <text class="data-cell data-cell--signal" :title="String(getFieldValue(item, 'outputValue') || '')">{{ getFieldValue(item, "outputValue") || "-" }}</text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "costMs") ?? "-" }}</text>
          </view>
        </view>

        <!-- 采样记录行 -->
        <view v-else-if="activeDataTab === 'sampling'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--sample"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "samplingTime")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text class="status-tag" :class="getLeakStatusTagClass(item)">{{ getLeakStatusLabel(item) }}</text>
            </text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "leakEsa") ?? "-" }}</text>
            <text class="data-cell data-cell--intensity">{{ getFieldValue(item, "leakIntensity") ?? "-" }}</text>
            <text class="data-cell data-cell--frequency">{{ getFieldValue(item, "leakFrequency") ?? "-" }}</text>
            <text class="data-cell data-cell--address">{{ getFieldValue(item, "samplingAddress") || "-" }}</text>
          </view>
        </view>

        <!-- 采样明细行 -->
        <view v-else-if="activeDataTab === 'samplingDetail'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--samplingDetail"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "createdAt")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "leakEsa") ?? "-" }}</text>
            <text class="data-cell data-cell--intensity">{{ getFieldValue(item, "leakIntensity") ?? "-" }}</text>
            <text class="data-cell data-cell--frequency">{{ getFieldValue(item, "leakFrequency") ?? "-" }}</text>
            <text class="data-cell data-cell--order">{{ getFieldValue(item, "orderNumber") ?? "-" }}</text>
          </view>
        </view>

        <!-- 采样日报行 -->
        <view v-else>
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--samplingDaily"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "samplingTime")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text class="status-tag" :class="getLeakStatusTagClass(item)">{{ getLeakStatusLabel(item) }}</text>
            </text>
            <text class="data-cell data-cell--property">{{ getFieldValue(item, "leakProperty") ?? "-" }}</text>
            <text class="data-cell data-cell--address">{{ getFieldValue(item, "samplingAddress") || "-" }}</text>
          </view>
        </view>
      </view>

      <!-- 右侧详情 -->
      <template #detail>
        <view class="detail-body">
          <view class="detail-section">
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
              <text class="detail-section-title">时间信息</text>
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
              <text class="detail-section-title">地点信息</text>
              <view v-for="item in locationFields" :key="item.label" class="location-row">
                <text class="location-row__label">{{ item.label }}</text>
                <text class="location-row__value">{{ item.value }}</text>
              </view>
            </view>

            <!-- 其他字段（卡片网格） -->
            <view v-if="cardFields.length > 0" class="detail-fields-grid">
              <view v-for="item in cardFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value" :title="item.value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </LeakTableView>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import {
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadDetail,
  getAlgorithmResultHistoryPage,
  getAlgorithmResultHistoryDetail,
  getSamplingRecordHistoryPage,
  getSamplingRecordHistoryDetail,
  getSamplingDetailHistoryPage,
  getSamplingDetailHistoryDetail,
  getSamplingDailyHistoryPage,
  getSamplingDailyHistoryDetail,
} from "@/services/leak-report/history-overview";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/components/LeakTableView.vue";

type HistoryRecord = Record<string, unknown>;
type DataTab = "leakage" | "deviceUpload" | "algorithm" | "sampling" | "samplingDetail" | "samplingDaily";

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

const historyTabs: Array<{ label: string; value: DataTab }> = [
  { label: "渗漏记录", value: "leakage" },
  { label: "设备上报", value: "deviceUpload" },
  { label: "算法日志", value: "algorithm" },
  { label: "采样记录", value: "sampling" },
  { label: "采样明细", value: "samplingDetail" },
  { label: "采样日报", value: "samplingDaily" },
];

const leakStatusOptions: Array<{ label: string; value: number | "" }> = [
  { label: "不限", value: "" },
  { label: "渗漏", value: 0 },
  { label: "正常", value: 1 },
  { label: "疑似", value: 2 },
  { label: "未知", value: 3 },
];

const algorithmStatusOptions: Array<{ label: string; value: string }> = [
  { label: "不限", value: "" },
  { label: "执行成功", value: "SUCCESS" },
  { label: "执行失败", value: "FAILED" },
  { label: "超时", value: "TIMEOUT" },
  { label: "跳过", value: "SKIPPED" },
];

const tabLabelMap: Record<DataTab, string> = {
  leakage: "渗漏记录",
  deviceUpload: "设备上报",
  algorithm: "算法日志",
  sampling: "采样记录",
  samplingDetail: "采样明细",
  samplingDaily: "采样日报",
};

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  leakStatus: "" as number | "",
  deviceNumber: "",
  inspector: "",
  tubeGroup: "",
  algorithmStatus: "" as string,
  algorithmName: "",
  samplingId: "",
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
const activeDataTab = ref<DataTab>("leakage");
const exportMenuVisible = ref(false);

const currentLeakStatusLabel = computed(() =>
  leakStatusOptions.find((o) => o.value === filters.leakStatus)?.label || "不限",
);
const currentAlgorithmStatusLabel = computed(() =>
  algorithmStatusOptions.find((o) => o.value === filters.algorithmStatus)?.label || "不限",
);
const activeTabLabel = computed(() => tabLabelMap[activeDataTab.value]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

// 详情字段分组
const summaryLabel = computed(() => {
  const map: Record<DataTab, string> = {
    leakage: "漏点位置",
    deviceUpload: "设备编号",
    algorithm: "设备编号",
    sampling: "设备编号",
    samplingDetail: "设备编号",
    samplingDaily: "设备编号",
  };
  return map[activeDataTab.value];
});

const summaryValue = computed(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") return String(getFieldValue(r, "leakPointPosition") || "-");
  return String(getFieldValue(r, "deviceNumber") || "-");
});

const summaryMetaFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "渗漏状态", value: String(getFieldValue(r, "leakStatus") || "-") },
      { label: "漏点类型", value: String(getFieldValue(r, "leakPointType") || "-") },
      { label: "巡检人员", value: String(getFieldValue(r, "inspector") || "-") },
      { label: "检出类型", value: String(getFieldValue(r, "detectType") || "-") },
      { label: "检出难度", value: String(getFieldValue(r, "detectDifficulty") || "-") },
      { label: "定漏人员", value: String(getFieldValue(r, "locator") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "渗漏标志位", value: getLeakStatusLabel(r) },
      { label: "固件版本", value: String(getFieldValue(r, "firmwareVersion") || "-") },
      { label: "硬件版本", value: String(getFieldValue(r, "hardwareVersion") || "-") },
      { label: "工作模式", value: String(getFieldValue(r, "workMode") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "执行状态", value: getAlgorithmStatusLabel(r) },
      { label: "失败原因", value: String(getFieldValue(r, "errorMessage") || "-") },
    ];
  }
  if (activeDataTab.value === "sampling") {
    return [
      { label: "渗漏标志位", value: getLeakStatusLabel(r) },
      { label: "管组编号", value: String(getFieldValue(r, "tubeGroup") || "-") },
      { label: "压力", value: String(getFieldValue(r, "pressure") ?? "-") },
    ];
  }
  if (activeDataTab.value === "samplingDetail") {
    return [
      { label: "排序序号", value: String(getFieldValue(r, "orderNumber") ?? "-") },
    ];
  }
  if (activeDataTab.value === "samplingDaily") {
    return [
      { label: "渗漏状态", value: getLeakStatusLabel(r) },
      { label: "渗漏值", value: String(getFieldValue(r, "leakProperty") ?? "-") },
    ];
  }
  return [];
});

const timeDetailFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "检出时间", value: formatDateTime(getFieldValue(r, "detectTime")) },
      { label: "噪音时间", value: formatDateTime(getFieldValue(r, "noiseTime")) },
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
      { label: "修复时间", value: formatDateTime(getFieldValue(r, "repairTime")) },
      { label: "更新时间", value: formatDateTime(getFieldValue(r, "updatedAt")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "上报时间", value: formatDateTime(getFieldValue(r, "uploadTime")) },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
    ];
  }
  if (activeDataTab.value === "sampling") {
    return [
      { label: "采样时间", value: formatDateTime(getFieldValue(r, "samplingTime")) },
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
    ];
  }
  if (activeDataTab.value === "samplingDetail") {
    return [
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
    ];
  }
  if (activeDataTab.value === "samplingDaily") {
    return [
      { label: "采样时间", value: formatDateTime(getFieldValue(r, "samplingTime")) },
    ];
  }
  return [];
});

const locationFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "坐标位置", value: String(getFieldValue(r, "coordinatePosition") || "-") },
      { label: "漏点区域", value: String(getFieldValue(r, "leakArea") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "经纬度", value: String(getFieldValue(r, "coordinateLocation") || "-") },
    ];
  }
  if (activeDataTab.value === "sampling") {
    return [
      { label: "采样地址", value: String(getFieldValue(r, "samplingAddress") || "-") },
    ];
  }
  if (activeDataTab.value === "samplingDaily") {
    return [
      { label: "采样地址", value: String(getFieldValue(r, "samplingAddress") || "-") },
    ];
  }
  return [];
});

const cardFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") ?? "-") },
      { label: "疑点ID", value: String(getFieldValue(r, "suspectedLeakId") ?? "-") },
      { label: "渗漏部位", value: String(getFieldValue(r, "leakPart") || "-") },
      { label: "漏点距离", value: String(getFieldValue(r, "leakDistance") ?? "-") },
      { label: "漏水量", value: String(getFieldValue(r, "leakVolume") ?? "-") },
      { label: "漏点原因", value: String(getFieldValue(r, "leakReason") || "-") },
      { label: "特征值", value: String(getFieldValue(r, "featureValue") ?? "-") },
      { label: "费用", value: String(getFieldValue(r, "cost") || "-") },
      { label: "人工复核次数", value: String(getFieldValue(r, "manualReviewCount") ?? "-") },
      { label: "维修方式", value: String(getFieldValue(r, "repairMethod") || "-") },
      { label: "管道材质", value: String(getFieldValue(r, "tubeMaterial") || "-") },
      { label: "管道口径", value: String(getFieldValue(r, "tubeBore") ?? "-") },
      { label: "管道埋深", value: String(getFieldValue(r, "tubeBuriedDepth") ?? "-") },
      { label: "管龄", value: String(getFieldValue(r, "tubeAge") ?? "-") },
      { label: "关联设备", value: String(getFieldValue(r, "deviceNumber") || "-") },
      { label: "关联工单ID", value: String(getFieldValue(r, "workOrderId") ?? "-") },
      { label: "音频文件", value: String(getFieldValue(r, "audioFile") || "-") },
      { label: "现场视频", value: String(getFieldValue(r, "sceneVideo") || "-") },
      { label: "噪音样本", value: String(getFieldValue(r, "noiseSample") || "-") },
      { label: "描述", value: String(getFieldValue(r, "description") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") || "-") },
      { label: "电池电压", value: String(getFieldValue(r, "batteryVoltage") ?? "-") },
      { label: "终端温度", value: String(getFieldValue(r, "deviceTemperature") ?? "-") },
      { label: "信号强度", value: String(getFieldValue(r, "signalIntensity") ?? "-") },
      { label: "信号质量", value: String(getFieldValue(r, "signalQuality") ?? "-") },
      { label: "特征值", value: String(getFieldValue(r, "leakEsa") ?? "-") },
      { label: "强度", value: String(getFieldValue(r, "leakIntensity") ?? "-") },
      { label: "频率", value: String(getFieldValue(r, "leakFrequency") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") ?? "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") ?? "-") },
      { label: "关联音频ID", value: String(getFieldValue(r, "audioId") ?? "-") },
      { label: "算法名称", value: String(getFieldValue(r, "algorithmName") || "-") },
      { label: "算法输出值", value: String(getFieldValue(r, "outputValue") || "-") },
      { label: "耗时(ms)", value: String(getFieldValue(r, "costMs") ?? "-") },
      { label: "MATLAB实例", value: String(getFieldValue(r, "matlabInstance") || "-") },
      { label: "失败原因", value: String(getFieldValue(r, "errorMessage") || "-") },
    ];
  }
  if (activeDataTab.value === "sampling") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") || "-") },
      { label: "特征值", value: String(getFieldValue(r, "leakEsa") ?? "-") },
      { label: "强度", value: String(getFieldValue(r, "leakIntensity") ?? "-") },
      { label: "频率", value: String(getFieldValue(r, "leakFrequency") ?? "-") },
    ];
  }
  if (activeDataTab.value === "samplingDetail") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "采样记录ID", value: String(getFieldValue(r, "samplingId") || "-") },
      { label: "特征值", value: String(getFieldValue(r, "leakEsa") ?? "-") },
      { label: "强度", value: String(getFieldValue(r, "leakIntensity") ?? "-") },
      { label: "频率", value: String(getFieldValue(r, "leakFrequency") ?? "-") },
    ];
  }
  if (activeDataTab.value === "samplingDaily") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") || "-") },
    ];
  }
  return [];
});

onMounted(() => {
  fetchHistoryData();
});

function handleLeakStatusChange(event: { detail: { value: number } }) {
  filters.leakStatus = leakStatusOptions[event.detail.value]?.value ?? "";
  searchHistory();
}

function handleAlgorithmStatusChange(event: { detail: { value: number } }) {
  filters.algorithmStatus = algorithmStatusOptions[event.detail.value]?.value ?? "";
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
    else if (sortOrder.value === "desc") { sortField.value = ""; sortOrder.value = ""; return; }
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  pagination.pageNum = 1;
  fetchHistoryData();
}

function buildQueryParams() {
  const defaultSortField = activeDataTab.value === "leakage" ? "detectTime" : activeDataTab.value === "algorithm" ? "createdAt" : activeDataTab.value === "deviceUpload" ? "uploadTime" : activeDataTab.value === "sampling" ? "samplingTime" : activeDataTab.value === "samplingDaily" ? "samplingTime" : "createdAt";
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
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.inspector.trim()) (baseParams as Record<string, unknown>).inspector = filters.inspector.trim();
  } else if (activeDataTab.value === "deviceUpload") {
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  } else if (activeDataTab.value === "algorithm") {
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
    if (filters.algorithmStatus !== "") (baseParams as Record<string, unknown>).status = filters.algorithmStatus;
    if (filters.algorithmName.trim()) (baseParams as Record<string, unknown>).algorithmName = filters.algorithmName.trim();
  } else if (activeDataTab.value === "sampling") {
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
    if (filters.tubeGroup.trim()) (baseParams as Record<string, unknown>).tubeGroup = filters.tubeGroup.trim();
  } else if (activeDataTab.value === "samplingDetail") {
    if (filters.samplingId.trim()) (baseParams as Record<string, unknown>).samplingId = Number(filters.samplingId.trim());
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  } else if (activeDataTab.value === "samplingDaily") {
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  }

  return baseParams;
}

function getApiFunction() {
  const apiMap: Record<DataTab, { page: typeof getLeakageHistoryPage; detail: typeof getLeakageHistoryDetail }> = {
    leakage: { page: getLeakageHistoryPage, detail: getLeakageHistoryDetail },
    deviceUpload: { page: getDeviceStatusUploadPage, detail: getDeviceStatusUploadDetail },
    algorithm: { page: getAlgorithmResultHistoryPage, detail: getAlgorithmResultHistoryDetail },
    sampling: { page: getSamplingRecordHistoryPage, detail: getSamplingRecordHistoryDetail },
    samplingDetail: { page: getSamplingDetailHistoryPage, detail: getSamplingDetailHistoryDetail },
    samplingDaily: { page: getSamplingDailyHistoryPage, detail: getSamplingDailyHistoryDetail },
  };
  return apiMap[activeDataTab.value];
}

async function fetchHistoryData() {
  loading.value = true;
  try {
    const api = getApiFunction();
    const response = (await api.page(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    if (parsed.pageNum && parsed.pageNum !== pagination.pageNum) pagination.pageNum = parsed.pageNum;
    if (parsed.pageSize && parsed.pageSize !== pagination.pageSize) pagination.pageSize = parsed.pageSize;
    records.value = applyLocalSort(parsed.records);
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || "历史数据加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function searchHistory() {
  pagination.pageNum = 1;
  fetchHistoryData();
}

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
      exportRecords = parsed.records;
    } catch {
      uni.showToast({ title: "获取全部数据失败", icon: "none" });
      return;
    }
  }
  if (!exportRecords.length) {
    uni.showToast({ title: "暂无数据可导出", icon: "none" });
    return;
  }
  // #ifdef H5
  const tab = activeDataTab.value;
  let headers: string[] = [];
  let keys: string[] = [];
  if (tab === "leakage") {
    headers = ["序号", "检出时间", "渗漏状态", "漏点类型", "漏点位置", "巡检人员", "管道材质", "描述"];
    keys = ["detectTime", "leakStatus", "leakPointType", "leakPointPosition", "inspector", "tubeMaterial", "description"];
  } else if (tab === "deviceUpload") {
    headers = ["序号", "上报时间", "设备编号", "渗漏标志位", "特征值", "强度", "频率"];
    keys = ["uploadTime", "deviceNumber", "leakStatus", "leakEsa", "leakIntensity", "leakFrequency"];
  } else if (tab === "algorithm") {
    headers = ["序号", "创建时间", "设备编号", "算法名称", "执行状态", "输出值", "耗时(ms)"];
    keys = ["createdAt", "deviceNumber", "algorithmName", "status", "outputValue", "costMs"];
  } else if (tab === "sampling") {
    headers = ["序号", "采样时间", "设备编号", "渗漏标志位", "特征值", "强度", "频率"];
    keys = ["samplingTime", "deviceNumber", "leakStatus", "leakEsa", "leakIntensity", "leakFrequency"];
  } else if (tab === "samplingDetail") {
    headers = ["序号", "创建时间", "设备编号", "特征值", "强度", "频率", "排序序号"];
    keys = ["createdAt", "deviceNumber", "leakEsa", "leakIntensity", "leakFrequency", "orderNumber"];
  } else {
    headers = ["序号", "采样时间", "设备编号", "渗漏状态", "渗漏值", "采样地址"];
    keys = ["samplingTime", "deviceNumber", "leakStatus", "leakProperty", "samplingAddress"];
  }
  const rows = exportRecords.map((r, idx) => {
    const row = [String(idx + 1)];
    keys.forEach((k) => {
      if (k === "leakStatus") {
        if (tab === "leakage") {
          const v = getFieldValue(r, k);
          row.push(v === undefined || v === null ? "" : String(v).replace(/"/g, '""'));
        } else {
          row.push(getLeakStatusLabel(r));
        }
      } else if (k === "status") {
        row.push(getAlgorithmStatusLabel(r));
      } else if (k === "audioTime" || k === "detectTime" || k === "uploadTime" || k === "createdAt" || k === "samplingTime") {
        row.push(formatDateTime(getFieldValue(r, k)));
      } else {
        const v = getFieldValue(r, k);
        row.push(v === undefined || v === null ? "" : String(v).replace(/"/g, '""'));
      }
    });
    return row;
  });
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${tabLabelMap[tab]}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: "导出成功", icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: "导出功能仅支持 H5 端", icon: "none" });
  // #endif
}

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakStatus = "";
  filters.deviceNumber = "";
  filters.inspector = "";
  filters.tubeGroup = "";
  filters.algorithmStatus = "";
  filters.algorithmName = "";
  filters.samplingId = "";
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

  const id = getRowId(item);
  if (!id) return;

  getApiFunction().detail(id)
    .then((response: unknown) => {
      assertSuccessResponse(response as ApiResponseLike);
      const detailData = (response as ApiResponseLike)?.data;
      if (isObject(detailData)) {
        selectedRecord.value = { ...item, ...detailData };
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

function getLeakStatusLabel(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakStatus"));
  if (val === 0) return "渗漏";
  if (val === 1) return "正常";
  if (val === 2) return "疑似";
  if (val === 3) return "未知";
  if (val === 4) return "无数据";
  return "未知";
}

function getLeakageStatusTagClass(item: HistoryRecord) {
  const s = String(getFieldValue(item, "leakStatus") || "");
  if (s === "已修复") return "status-tag--normal";
  if (s === "未修复") return "status-tag--leak";
  return "status-tag--unknown";
}

function getLeakStatusTagClass(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakStatus"));
  if (val === 0) return "status-tag--leak";
  if (val === 1) return "status-tag--normal";
  if (val === 2) return "status-tag--suspect";
  return "status-tag--unknown";
}

function getAlgorithmStatusLabel(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  const map: Record<string, string> = {
    SUCCESS: "执行成功",
    FAILED: "执行失败",
    TIMEOUT: "超时",
    SKIPPED: "跳过",
  };
  return map[status] || status || "-";
}

function getAlgorithmStatusTagClass(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  if (status === "SUCCESS") return "status-tag--success";
  if (status === "FAILED") return "status-tag--failed";
  if (status === "TIMEOUT") return "status-tag--failed";
  if (status === "SKIPPED") return "status-tag--skipped";
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
  throw { code, msg: response?.msg || "请求失败", data: response?.data };
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

.data-table {
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px minmax(160px, 3.4fr) minmax(96px, 1.8fr) minmax(160px, 3.6fr) minmax(96px, 3fr) minmax(96px, 2.2fr) minmax(120px, 4.2fr);
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.data-row--leakage {
  grid-template-columns: 58px minmax(160px, 3fr) minmax(96px, 1.6fr) minmax(110px, 2fr) minmax(160px, 3fr) minmax(96px, 2fr) minmax(96px, 1.8fr) minmax(120px, 3fr);
}
.data-row--deviceUpload {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(96px, 1.2fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(110px, 1.6fr);
}
.data-row--algorithm {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(130px, 2fr) minmax(96px, 1.2fr) minmax(150px, 2.4fr) minmax(80px, 1fr);
}
.data-row--sample {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(96px, 1.2fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(120px, 2.4fr);
}
.data-row--samplingDetail {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(96px, 1.2fr);
}
.data-row--samplingDaily {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(96px, 1.2fr) minmax(96px, 1.2fr) minmax(160px, 3fr);
}
.data-row:not(.data-row--header):nth-child(odd) { background: #fff; }
.data-row:not(.data-row--header):nth-child(even) { background: #fbfdff; }
.data-row:not(.data-row--header):hover { background: #f1f8ff; box-shadow: inset 0 0 0 1px #d7ebfb; }

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
.data-cell--time { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--address { justify-content: center; text-align: center; }
.data-cell--remark { justify-content: center; text-align: center; }
.data-cell--device { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--error { color: #475569; text-align: center; justify-content: center; }

.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #3b82f6; }

.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #3b82f6; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
.status-tag--normal { color: #22c55e; background: #f0fdf4; border: 1px solid #bbf7d0; }
.status-tag--suspect { color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; }
.status-tag--unknown { color: #64748b; background: #f1f5f9; }
.status-tag--pending { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }
.status-tag--success { color: #16a34a; background: #f0fdf4; border: 1px solid #bbf7d0; }
.status-tag--failed { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }
.status-tag--skipped { color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; }

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
  animation: state-spin 0.7s linear infinite;
}

@keyframes state-spin {
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
</style>
