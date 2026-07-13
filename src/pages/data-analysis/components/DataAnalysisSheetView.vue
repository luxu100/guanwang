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
          <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入编号" placeholder-class="input-placeholder" />
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
          <text class="filter-label">发起时间</text>
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
          <text class="table-head__meta">共 {{ props.mode === 'audio' ? audioTotal : leakTotal }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table" :class="{ 'data-table--leakage': props.mode === 'leakage' }">
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
                <text class="data-cell data-cell--spectrum">
                  <text class="data-link" @click.stop="openSpectrumDialog(item as AudioDataItem)">分析</text>
                </text>
                <text class="data-cell data-cell--download">
                  <text class="data-link" @click.stop="onDownload(item as AudioDataItem)">音频</text>
                </text>
                <text class="data-cell data-cell--status">{{ (item as AudioDataItem).status }}</text>
                <text class="data-cell data-cell--location">
                  <text class="data-link" @click.stop="onLocation(item as AudioDataItem)">{{ (item as AudioDataItem).location }}</text>
                </text>
                <text class="data-cell data-cell--repair">{{ ((item as AudioDataItem).repairTime || '').replace('T', ' ') }}</text>
              </template>
              <template v-else-if="props.mode === 'leakage'">
                <text class="data-cell data-cell--index">{{ index + 1 }}</text>
                <text class="data-cell data-cell--device">{{ (item as LeakItem).deviceId }}</text>
                <text class="data-cell data-cell--time">{{ ((item as LeakItem).detectedTime || '').replace(/\.\d+/, '').replace('T', ' ') }}</text>
                <text class="data-cell data-cell--status">
                  <text class="status-pill" :class="getLeakageStatusClass(item as LeakItem)">{{ (item as LeakItem).leakageStatus }}</text>
                </text>
                <text class="data-cell data-cell--install">{{ (item as LeakItem).installStatus }}</text>
                <text class="data-cell data-cell--bluewhale">{{ (item as LeakItem).blueWhaleAnalysis }}</text>
                <text class="data-cell data-cell--manualanalysis">{{ (item as LeakItem).manualAnalysis }}</text>
                <text class="data-cell data-cell--location">
                  <text class="data-link" @click.stop="onLocationLeak(item as LeakItem)">{{ (item as LeakItem).location }}</text>
                </text>
              </template>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
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
          <text class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</text>
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
        <view class="table-head">
          <text>{{ detailTitle }}</text>
        </view>

        <view v-if="!selectedItem" class="detail-empty">请选择左侧数据查看详情</view>
        <view v-else class="detail-body">
          <template v-if="props.mode === 'audio'">
            <view class="detail-base-panel">
              <view class="detail-summary">
                <view class="detail-summary__main">
                  <text class="detail-summary__label">设备编号</text>
                  <text class="detail-summary__number">{{ (selectedItem as AudioDataItem).deviceId }}</text>
                </view>
              </view>

              <view class="detail-grid detail-grid--base">
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">时间</text>
                  <text class="detail-item__value">{{ ((selectedItem as AudioDataItem).audioTime || '').replace('T', ' ') }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">天气</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).weather }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">拆/装</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).status }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">阀门编号</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).valveNumber }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">所属片区</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).deptName }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">安装人员</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).installer }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">安装地址</text>
                  <text class="detail-item__value">{{ (selectedItem as AudioDataItem).address }}</text>
                </view>
              </view>
            </view>
          </template>
          <template v-else-if="props.mode === 'leakage'">
            <view class="detail-base-panel">
              <view class="detail-summary">
                <view class="detail-summary__main">
                  <text class="detail-summary__label">设备编号</text>
                  <text class="detail-summary__number">{{ (selectedItem as LeakItem).deviceId }}</text>
                </view>
              </view>

              <view class="leak-tabs">
                <view
                  v-for="tab in leakageDetailTabs"
                  :key="tab.value"
                  class="leak-tab"
                  :class="{ 'leak-tab--active': leakageDetailTab === tab.value }"
                  @click="leakageDetailTab = tab.value"
                >
                  {{ tab.label }}
                </view>
              </view>

              <view v-if="leakageDetailTab === 'base'" class="detail-grid detail-grid--base">
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">时间</text>
                  <text class="detail-item__value">{{ ((selectedItem as LeakItem).detectedTime || '').replace(/\.\d+/, '').replace('T', ' ') }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">天气</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).weather }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">拆/装</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).installStatus }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">阀门编号</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).valveNumber }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">所属片区</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).deptName }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">安装人员</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).installer }}</text>
                </view>
                <view class="detail-item detail-item--base">
                  <text class="detail-item__label">安装地址</text>
                  <text class="detail-item__value">{{ (selectedItem as LeakItem).address }}</text>
                </view>
              </view>

              <view v-else-if="leakageDetailTab === 'analysis'">
                <view class="leak-sub-card">
                  <text class="leak-sub-card__header">渗漏分析</text>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">状态</text>
                    <text class="detail-item__value">
                      <text class="status-pill" :class="getLeakageStatusClass(selectedItem as LeakItem)">{{ (selectedItem as LeakItem).leakageStatus }}</text>
                    </text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">增益</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).gain }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">特征值</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).eigenvalue }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">蓝鲸分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).blueWhaleAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">人工分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).manualAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">原因分析</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).reasonAnalysis }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">排查反馈</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).investigationFeedback }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">算法类型</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).algorithmType }}</text>
                  </view>
                </view>

                <view class="leak-sub-card">
                  <text class="leak-sub-card__header">渗漏详情</text>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">渗漏带宽</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakBandwidth }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">渗漏能量</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakEnergy }}</text>
                  </view>
                  <view class="detail-item detail-item--base">
                    <text class="detail-item__label">渗漏频率</text>
                    <text class="detail-item__value">{{ (selectedItem as LeakItem).leakFrequency }}</text>
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import DatetimePicker from "@/pages/data-analysis/components/DatetimePicker.vue";
import MapDialog from "@/pages/data-analysis/components/MapDialog.vue";
import SpectrumDialog from "@/pages/data-analysis/components/SpectrumDialog.vue";
import { getAudioDataPage, getDataQueryAudioPage, getDataQueryAudioDetail, getAudioWav } from "@/services/data-analysis/audio";
import { getLeakageDataPage, getDataQueryLeakagePage, getDataQueryLeakageDetail } from "@/services/data-analysis/leakage";
import { getDeptList } from "@/services/partition/partition";

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

const leakageDetailTab = ref<"base" | "analysis" | "detail">("base");

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
];

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    audio: "音频数据",
    leakage: "渗漏数据",
  };
  return titles[props.mode] || "数据列表";
});

const detailTitle = computed(() => {
  const titles: Record<string, string> = {
    audio: "音频详情",
    leakage: "渗漏详情",
  };
  return titles[props.mode] || "详情";
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
      { key: "spectrum", label: "频谱", className: "data-header-cell--spectrum" },
      { key: "download", label: "下载", className: "data-header-cell--download" },
      { key: "status", label: "拆/装", className: "data-header-cell--status", sortable: true },
      { key: "location", label: "位置坐标", className: "data-header-cell--location" },
      { key: "repairTime", label: "修复时间", className: "data-header-cell--repair" },
    ];
  }
  if (props.mode === "leakage") {
    return [
      { key: "index", label: "序号", className: "data-header-cell--index" },
      { key: "deviceNumber", label: "设备编号", className: "data-header-cell--device", sortable: true },
      { key: "detectedTime", label: "时间", className: "data-header-cell--time", sortable: true },
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
    }));
    audioTotal.value = parsed.total;
    selectedId.value = 0;
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
      gain: record.gain?.modeCode ?? "--",
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

    }));
    leakTotal.value = parsed.total;
    selectedId.value = 0;
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
  background: #ffffff;
}

.data-table {
  width: 100%;
  min-width: 900px;
  background: #ffffff;
}

.data-table--leakage {
  width: 100%;
  min-width: 760px;
}

.data-row {
  display: grid;
  grid-template-columns: 58px minmax(130px, 1.3fr) minmax(140px, 1.4fr) minmax(70px, 0.7fr) minmax(70px, 0.7fr) minmax(90px, 0.9fr) minmax(180px, 1.6fr) minmax(140px, 1.2fr);
  min-height: 42px;
  width: 100%;
  min-width: 900px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
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

.data-row--leakage {
  grid-template-columns: 58px minmax(130px, 1.3fr) minmax(140px, 1.4fr) minmax(70px, 0.7fr) minmax(70px, 0.7fr) minmax(70px, 0.7fr) minmax(70px, 0.7fr) minmax(180px, 1.6fr);
  min-width: 760px;
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
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
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
}

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

.table-state {
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

.detail-base-panel {
  display: grid;
  gap: 12px;
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
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: anywhere;
}

.leak-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  padding: 8px;
  background: #f6fafe;
  border: 1px solid #dce9f4;
  border-radius: 6px;
}

.leak-sub-card {
  background: #ffffff;
  border: 1px solid #dfebf5;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.leak-sub-card + .leak-sub-card {
  margin-top: 10px;
}

.leak-sub-card__header {
  display: block;
  padding: 10px 14px;
  color: #183755;
  font-size: 14px;
  font-weight: 900;
  background: #f7fafc;
  border-bottom: 1px solid #e3edf6;
}

.leak-sub-card .detail-item--base {
  border-bottom: 1px solid #edf3f8;
}

.leak-sub-card .detail-item--base:last-child {
  border-bottom: 0;
}

.leak-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  color: #5d7188;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.leak-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
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
  grid-template-columns: 86px minmax(0, 1fr);
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
    min-width: 760px;
  }

  .data-row {
    grid-template-columns: 46px minmax(110px, 1.1fr) minmax(120px, 1.2fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(74px, 0.74fr) minmax(140px, 1.3fr) minmax(110px, 1fr);
  }

  .data-row--leakage {
    grid-template-columns: 46px minmax(110px, 1.1fr) minmax(120px, 1.2fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(140px, 1.3fr);
    min-width: 670px;
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
</style>
