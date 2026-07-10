<template>
  <view class="suspect-view">
    <!-- ========== 筛选栏 ========== -->
    <view class="suspect-toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">检出类型</text>
          <picker :range="detectTypeFilterOptions" range-key="label" :value="currentDetectTypeIndex" @change="handleDetectTypeChange">
            <view class="filter-select">
              <text>{{ currentDetectTypeLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">处理状态</text>
          <picker :range="processStatusFilterOptions" range-key="label" :value="currentProcessStatusIndex" @change="handleProcessStatusChange">
            <view class="filter-select">
              <text>{{ currentProcessStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">是否漏点</text>
          <picker :range="isLeakPointFilterOptions" range-key="label" :value="currentIsLeakPointIndex" @change="handleIsLeakPointChange">
            <view class="filter-select">
              <text>{{ currentIsLeakPointLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">上报人员</text>
          <input v-model="filters.reporter" class="filter-input" placeholder="请输入上报人员" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group filter-group--date">
          <text class="filter-label">检出时间</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions toolbar-actions--left">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchSuspects">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchSuspects">
            <text class="icon-refresh"></text>
          </button>
        </view>
        <view class="toolbar-spacer"></view>
        <view v-if="mode === 'management'" class="toolbar-actions toolbar-actions--right">
          <button
            class="toolbar-button toolbar-button--primary toolbar-button--create"
            hover-class="toolbar-button--hover"
            @click="emit('create')"
          >
            新增疑点
          </button>
          <button
            class="toolbar-button"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="selectedSuspect && emit('edit', selectedSuspect)"
          >
            编辑疑点
          </button>
          <button
            class="toolbar-button toolbar-button--danger"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="removeSuspect"
          >
            删除疑点
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 左侧表格 + 右侧详情面板 ========== -->
    <view ref="suspectLayoutRef" class="suspect-layout">
      <!-- 左侧表格 -->
      <view class="suspect-table-panel" :style="{ width: splitRatio * 100 + '%', flexShrink: 0 }">
        <view class="table-head">
          <text>{{ pageTitle }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index data-cell--sortable" @click="toggleSort('index')">序号<text class="sort-indicator" :class="getSortClass('index')"></text></text>
              <text class="data-cell data-cell--detect-type data-cell--sortable" @click="toggleSort('detectType')">检出类型<text class="sort-indicator" :class="getSortClass('detectType')"></text></text>
              <text class="data-cell data-cell--process-status data-cell--sortable" @click="toggleSort('processStatus')">处理状态<text class="sort-indicator" :class="getSortClass('processStatus')"></text></text>
              <text class="data-cell data-cell--is-leak data-cell--sortable" @click="toggleSort('isLeakPoint')">是否漏点<text class="sort-indicator" :class="getSortClass('isLeakPoint')"></text></text>
              <text class="data-cell data-cell--position data-cell--sortable" @click="toggleSort('leakPointPosition')">漏点位置<text class="sort-indicator" :class="getSortClass('leakPointPosition')"></text></text>
              <text class="data-cell data-cell--time data-cell--sortable" @click="toggleSort('reportTime')">上报时间<text class="sort-indicator" :class="getSortClass('reportTime')"></text></text>
              <text class="data-cell data-cell--reporter data-cell--sortable" @click="toggleSort('reporter')">上报人员<text class="sort-indicator" :class="getSortClass('reporter')"></text></text>
              <text class="data-cell data-cell--worksheet data-cell--sortable" @click="toggleSort('workOrderNo')">关联工单<text class="sort-indicator" :class="getSortClass('workOrderNo')"></text></text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="suspects.length === 0" class="table-state">暂无疑点数据</view>

            <view v-else class="data-table-body" :class="{ 'data-table-body--loading': loading }">
              <view
                v-for="(item, index) in suspects"
                :key="getRowKey(item, index)"
                class="data-row"
                :class="{ 'data-row--active': selectedKey === getRowKey(item, index) }"
                @click="selectSuspect(item, index)"
              >
                <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
                <text class="data-cell data-cell--detect-type">{{ getTextValue(item, ["detectType"], "-") }}</text>
                <text class="data-cell data-cell--process-status">
                  <text class="status-tag" :class="getProcessStatusClass(item)">{{ getProcessStatusLabel(item) }}</text>
                </text>
                <text class="data-cell data-cell--is-leak">
                  <text class="status-tag" :class="getIsLeakPointClass(item)">{{ getIsLeakPointLabel(item) }}</text>
                </text>
                <text class="data-cell data-cell--position">{{ getTextValue(item, ["leakPointPosition"], "-") }}</text>
                <text class="data-cell data-cell--time">{{ formatDateTime(getTextValue(item, ["reportTime"], "-")) }}</text>
                <text class="data-cell data-cell--reporter">{{ getTextValue(item, ["reporter"], "-") }}</text>
                <text class="data-cell data-cell--worksheet">{{ getTextValue(item, ["workOrderNo"], "-") }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum >= totalPages" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <view
        ref="splitDividerRef"
        class="split-divider"
        :class="{ 'split-divider--active': isDragging }"
        @mousedown="onDividerMouseDown"
        @touchstart.prevent="onDividerTouchStart"
      >
        <view class="split-divider__line"></view>
        <view class="split-divider__grip">
          <view class="split-divider__dot"></view>
          <view class="split-divider__dot"></view>
          <view class="split-divider__dot"></view>
        </view>
      </view>

      <!-- 右侧详情面板 — flex:1 自动占满剩余宽度 -->
      <view class="suspect-detail-panel" style="flex: 1; min-width: 0;">
        <view class="detail-tabs">
          <view
            v-for="tab in detailTabs"
            :key="tab.value"
            class="detail-tab"
            :class="{ 'detail-tab--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </view>
        </view>

        <view v-if="!selectedSuspect" class="detail-empty">请选择左侧疑点查看详情</view>
        <view v-else class="detail-body">
          <!-- 疑点详情 Tab -->
          <view v-if="activeTab === 'base'" class="detail-base-panel">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">疑点编号</text>
                <text class="detail-summary__number">{{ getId(selectedSuspect) }}</text>
              </view>
            </view>

            <view class="detail-grid detail-grid--base">
              <view v-for="item in baseDetailFields" :key="item.label" class="detail-item detail-item--base">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <!-- 管道信息 Tab -->
          <view v-if="activeTab === 'pipe'" class="detail-grid detail-grid--content">
            <view v-for="item in pipeDetailFields" :key="item.label" class="detail-item detail-item--note">
              <text class="detail-item__label">{{ item.label }}</text>
              <text class="detail-item__value">{{ item.value }}</text>
            </view>
          </view>

          <!-- 关联信息 Tab -->
          <view v-if="activeTab === 'related'" class="detail-grid detail-grid--content">
            <view v-for="item in relatedDetailFields" :key="item.label" class="detail-item detail-item--note">
              <text class="detail-item__label">{{ item.label }}</text>
              <text class="detail-item__value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <!-- 疑点处理区（仅处理模式） -->
        <view v-if="selectedSuspect && mode === 'processing'" class="process-box">
          <text class="process-box__title">疑点处理</text>
          <view class="process-actions">
            <!-- 状态 0-未处理：派单 -->
            <template v-if="getProcessStatus(selectedSuspect) === 0">
              <button class="toolbar-button process-action process-action--confirm-leak" :disabled="processing" hover-class="toolbar-button--hover" @click="openConfirmLeakDialog">确认疑点</button>
              <button class="toolbar-button process-action process-action--dispatch" :disabled="processing" hover-class="toolbar-button--hover" @click="openDispatchDialog">转工单</button>
              <button class="toolbar-button process-action process-action--exclude" :disabled="processing" hover-class="toolbar-button--hover" @click="openExcludeDialog">排除疑点</button>
            </template>
            <!-- 状态 1-已派单：确认疑点、排除疑点、查看工单 -->
            <template v-if="getProcessStatus(selectedSuspect) === 1">
              <button class="toolbar-button process-action process-action--confirm-leak" :disabled="processing" hover-class="toolbar-button--hover" @click="openConfirmLeakDialog">确认疑点</button>
              <button class="toolbar-button process-action process-action--exclude" :disabled="processing" hover-class="toolbar-button--hover" @click="openExcludeDialog">排除疑点</button>
              <button class="toolbar-button process-action process-action--view-worksheet" :disabled="!getWorkOrderId(selectedSuspect)" hover-class="toolbar-button--hover" @click="viewWorkOrder">查看工单</button>
            </template>
            <!-- 状态 2-处理中：确认疑点、排除疑点、查看工单 -->
            <template v-if="getProcessStatus(selectedSuspect) === 2">
              <button class="toolbar-button process-action process-action--confirm-leak" :disabled="processing" hover-class="toolbar-button--hover" @click="openConfirmLeakDialog">确认疑点</button>
              <button class="toolbar-button process-action process-action--exclude" :disabled="processing" hover-class="toolbar-button--hover" @click="openExcludeDialog">排除疑点</button>
              <button class="toolbar-button process-action process-action--view-worksheet" :disabled="!getWorkOrderId(selectedSuspect)" hover-class="toolbar-button--hover" @click="viewWorkOrder">查看工单</button>
            </template>
            <!-- 状态 3-已完成：查看工单 -->
            <template v-if="getProcessStatus(selectedSuspect) === 3">
              <button class="toolbar-button process-action process-action--view-worksheet" :disabled="!getWorkOrderId(selectedSuspect)" hover-class="toolbar-button--hover" @click="viewWorkOrder">查看工单</button>
            </template>
            <!-- 状态 4-已排除：仅查看 -->
            <template v-if="getProcessStatus(selectedSuspect) === 4">
              <text class="process-action--excluded">已排除</text>
            </template>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 转工单对话框 ========== -->
    <view v-if="dispatchDialogVisible" class="dialog-mask" @click.self="closeDispatchDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">转工单</text>
            <text class="dialog-subtitle">填写工单信息，将疑点转为工单处理</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeDispatchDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">疑点编号</text>
            <view class="form-readonly">{{ dispatchSuspectId || "-" }}</view>
          </view>
          <view class="form-field">
            <text class="form-label">工单编号</text>
            <input v-model="dispatchForm.workOrderNo" class="form-input" placeholder="不填则自动生成" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">预期时间</text>
            <WorkOrderDatetimePicker v-model="dispatchForm.expectedTime" class="form-datetime" title="选择预期时间" placeholder="请选择预期时间" />
          </view>
          <view class="form-field">
            <text class="form-label">紧急程度</text>
            <view class="select-field">
              <view
                class="form-select form-select--dropdown"
                :class="{ 'form-select--open': dispatchUrgencySelectOpen, 'form-control--error': dispatchUrgencyError }"
                @click.stop="dispatchUrgencySelectOpen = !dispatchUrgencySelectOpen"
              >
                <text :class="{ 'select-placeholder': !dispatchForm.urgencyLevel }">{{ dispatchUrgencyLabel }}</text>
                <text class="select-arrow"></text>
              </view>
              <view v-if="dispatchUrgencySelectOpen" class="select-menu">
                <view
                  v-for="item in urgencyOptions"
                  :key="item.value"
                  class="select-option"
                  :class="{ 'select-option--active': dispatchForm.urgencyLevel === item.value }"
                  @click.stop="selectDispatchUrgency(item.value)"
                >
                  {{ item.label }}
                </view>
              </view>
            </view>
            <text v-if="dispatchUrgencyError" class="form-error">{{ dispatchUrgencyError }}</text>
          </view>
          <view class="form-field">
            <text class="form-label">处理流程</text>
            <input v-model="dispatchForm.processFlow" class="form-input" placeholder="请输入处理流程" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">处理人员</text>
            <input v-model="dispatchForm.handler" class="form-input" placeholder="请输入处理人员" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">备注</text>
            <textarea v-model="dispatchForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">设备编号</text>
            <input v-model="dispatchForm.deviceNo" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">渗漏状态</text>
            <input v-model="dispatchForm.leakageStatus" class="form-input" placeholder="请输入渗漏状态" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">安装图片</text>
            <input v-model="dispatchForm.installImage" class="form-input" placeholder="请输入安装图片地址" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">安装地址</text>
            <input v-model="dispatchForm.installAddress" class="form-input" placeholder="请输入安装地址" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeDispatchDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitDispatch">
            {{ processing ? "处理中..." : "确认转工单" }}
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 确认疑点对话框 ========== -->
    <view v-if="confirmLeakDialogVisible" class="dialog-mask" @click.self="closeConfirmLeakDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">确认疑点</text>
            <text class="dialog-subtitle">确认后该疑点将转为漏点记录，同步到漏点界面</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeConfirmLeakDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">疑点编号</text>
            <view class="form-readonly">{{ confirmLeakSuspectId || "-" }}</view>
          </view>
          <view class="form-field">
            <text class="form-label">漏点类型</text>
            <input v-model="confirmLeakForm.leakPointType" class="form-input" placeholder="请输入漏点类型" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">漏点位置</text>
            <input v-model="confirmLeakForm.leakPointPosition" class="form-input" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">坐标位置</text>
            <input v-model="confirmLeakForm.coordinatePosition" class="form-input" placeholder="请输入坐标位置" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">初判级别</text>
            <input v-model="confirmLeakForm.initialLevel" class="form-input" placeholder="请输入初判级别" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">漏点大小</text>
            <input v-model="confirmLeakForm.leakPointSize" class="form-input" placeholder="请输入漏点大小" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">漏点路面</text>
            <input v-model="confirmLeakForm.leakRoadSurface" class="form-input" placeholder="请输入漏点路面" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">备注</text>
            <textarea v-model="confirmLeakForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeConfirmLeakDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitConfirmLeak">
            {{ processing ? "处理中..." : "确认" }}
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 排除疑点对话框 ========== -->
    <view v-if="excludeDialogVisible" class="dialog-mask" @click.self="closeExcludeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">排除疑点</text>
            <text class="dialog-subtitle">确认排除后将标记该疑点为已排除，并记录排除原因</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeExcludeDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">疑点编号</text>
            <view class="form-readonly">{{ excludeSuspectId || "-" }}</view>
          </view>
          <view class="form-field">
            <text class="form-label form-label--required">排除原因</text>
            <textarea v-model="excludeForm.reason" class="form-textarea" placeholder="请输入排除原因" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">操作人</text>
            <input v-model="excludeForm.operator" class="form-input" placeholder="请输入操作人" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeExcludeDialog">取消</button>
          <button class="dialog-button dialog-button--danger" :disabled="processing" hover-class="dialog-button--hover" @click="submitExclude">
            {{ processing ? "处理中..." : "确认排除" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { getSuspectPage, getSuspectDetail, deleteSuspect } from "@/services/leak-report/suspected-leak";
import { dispatchSuspect, confirmLeakPoint, excludeSuspect } from "@/services/leak-report/suspected-leak";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

// ========== 类型定义 ==========
type SuspectMode = "management" | "processing";
type DetailTab = "base" | "pipe" | "related";
type SuspectRecord = Record<string, unknown>;
type OptionValue = number | string;
type SelectOption = {
  label: string;
  value: OptionValue;
};

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

// ========== Props / Emits ==========
const props = defineProps<{
  mode: SuspectMode;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "edit", suspect: SuspectRecord): void;
}>();

// ========== 常量 ==========
const pageTitleMap: Record<SuspectMode, string> = {
  management: "疑点管理列表",
  processing: "疑点处理列表",
};

const processStatusFilterOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "未处理", value: 0 },
  { label: "已派单", value: 1 },
  { label: "处理中", value: 2 },
  { label: "已完成", value: 3 },
  { label: "已取消", value: 4 },
];

const isLeakPointFilterOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "否", value: 0 },
  { label: "是", value: 1 },
  { label: "待确认", value: 2 },
];

const detectTypeFilterOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "人工检出", value: "人工检出" },
  { label: "设备检出", value: "设备检出" },
];

const processStatusLabelMap: Record<number, string> = {
  0: "未处理",
  1: "已派单",
  2: "处理中",
  3: "已完成",
  4: "已排除",
};

const isLeakPointLabelMap: Record<number, string> = {
  0: "否",
  1: "是",
  2: "待确认",
};

const urgencyOptions: SelectOption[] = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
];

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "疑点详情", value: "base" },
  { label: "管道信息", value: "pipe" },
  { label: "关联信息", value: "related" },
];

// ========== 响应式数据 ==========
const filters = reactive({
  detectType: "",
  processStatus: "" as number | "",
  isLeakPoint: "" as number | "",
  reporter: "",
  startTime: "",
  endTime: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const suspects = ref<SuspectRecord[]>([]);
const selectedSuspect = ref<SuspectRecord | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const activeTab = ref<DetailTab>("base");

const sortField = ref<string>("");
const sortOrder = ref<"asc" | "desc" | "">("");

const splitRatio = ref(0.7);
const isDragging = ref(false);

// 对话框状态
const processing = ref(false);
const dispatchDialogVisible = ref(false);
const dispatchUrgencySelectOpen = ref(false);
const dispatchUrgencyError = ref("");
const dispatchForm = reactive({
  workOrderNo: "",
  expectedTime: "",
  urgencyLevel: "",
  processFlow: "",
  handler: "",
  remark: "",
  deviceNo: "",
  leakageStatus: "",
  installImage: "",
  installAddress: "",
});

const confirmLeakDialogVisible = ref(false);
const confirmLeakForm = reactive({
  leakPointType: "",
  leakPointPosition: "",
  coordinatePosition: "",
  initialLevel: "",
  leakPointSize: "",
  leakRoadSurface: "",
  remark: "",
});

// ========== 计算属性 ==========
const pageTitle = computed(() => pageTitleMap[props.mode]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const currentProcessStatusIndex = computed(() => {
  const idx = processStatusFilterOptions.findIndex((item) => item.value === filters.processStatus);
  return idx >= 0 ? idx : 0;
});
const currentProcessStatusLabel = computed(() => {
  return processStatusFilterOptions[currentProcessStatusIndex.value]?.label || "不限";
});

const currentIsLeakPointIndex = computed(() => {
  const idx = isLeakPointFilterOptions.findIndex((item) => item.value === filters.isLeakPoint);
  return idx >= 0 ? idx : 0;
});
const currentIsLeakPointLabel = computed(() => {
  return isLeakPointFilterOptions[currentIsLeakPointIndex.value]?.label || "不限";
});

const currentDetectTypeIndex = computed(() => {
  const idx = detectTypeFilterOptions.findIndex((item) => item.value === filters.detectType);
  return idx >= 0 ? idx : 0;
});
const currentDetectTypeLabel = computed(() => {
  return detectTypeFilterOptions[currentDetectTypeIndex.value]?.label || "全部";
});

const dispatchUrgencyLabel = computed(() => {
  if (!dispatchForm.urgencyLevel) return "请选择紧急程度";
  return urgencyOptions.find((item) => item.value === dispatchForm.urgencyLevel)?.label || "请选择紧急程度";
});

const dispatchSuspectId = computed(() => (selectedSuspect.value ? getRowId(selectedSuspect.value) : ""));
const confirmLeakSuspectId = computed(() => (selectedSuspect.value ? getRowId(selectedSuspect.value) : ""));

// 疑点详情字段
const baseDetailFields = computed(() => {
  const item = selectedSuspect.value || {};
  return [
    { label: "处理状态", value: getProcessStatusLabel(item) },
    { label: "检漏类型", value: getTextValue(item, ["detectType"], "-") },
    { label: "是否漏点", value: getIsLeakPointLabel(item) },
    { label: "漏点类型", value: getTextValue(item, ["leakPointType"], "-") },
    { label: "初判级别", value: getTextValue(item, ["initialLevel"], "-") },
    { label: "漏点大小", value: getTextValue(item, ["leakPointSize"], "-") },
    { label: "漏点路面", value: getTextValue(item, ["leakRoadSurface"], "-") },
    { label: "坐标位置", value: getTextValue(item, ["coordinatePosition"], "-") },
    { label: "漏点位置", value: getTextValue(item, ["leakPointPosition"], "-") },
    { label: "上报人员", value: getTextValue(item, ["reporter"], "-") },
    { label: "上报时间", value: formatDateTime(getTextValue(item, ["reportTime"], "-")) },
    { label: "备注信息", value: getTextValue(item, ["remark"], "-") },
    { label: "巡查编号", value: getTextValue(item, ["patrolNo"], "-") },
  ];
});

// 管道信息字段
const pipeDetailFields = computed(() => {
  const item = selectedSuspect.value || {};
  return [
    { label: "管道管径", value: getTextValue(item, ["tubeBore"], "-") },
    { label: "管道材质", value: getTextValue(item, ["tubeMaterial"], "-") },
    { label: "设备编号", value: getTextValue(item, ["deviceNumber"], "-") },
    { label: "噪声时间", value: formatDateTime(getTextValue(item, ["noiseTime"], "-")) },
    { label: "渗漏状态", value: getTextValue(item, ["leakStatus"], "-") },
    { label: "特征值", value: getTextValue(item, ["featureValue"], "-") },
    { label: "音频文件", value: getTextValue(item, ["audioFile"], "-") },
    { label: "修复状态", value: getTextValue(item, ["repairStatus"], "-") },
    { label: "修复时间", value: formatDateTime(getTextValue(item, ["repairTime"], "-")) },
    { label: "修复人", value: getTextValue(item, ["repairPerson"], "-") },
    { label: "下漏单位", value: getTextValue(item, ["leakUnit"], "-") },
    { label: "维修单位", value: getTextValue(item, ["maintenanceUnit"], "-") },
    { label: "所属分区", value: getTextValue(item, ["deptId"], "-") },
  ];
});

// 关联信息字段
const relatedDetailFields = computed(() => {
  const item = selectedSuspect.value || {};
  return [
    { label: "关联工单编号", value: getTextValue(item, ["workOrderNo"], "-") },
    { label: "关联工单ID", value: getTextValue(item, ["workOrderId"], "-") },
    { label: "关联漏点记录ID", value: getTextValue(item, ["leakPointRecordId"], "-") },
    { label: "创建时间", value: formatDateTime(getTextValue(item, ["createdAt"], "-")) },
    { label: "更新时间", value: formatDateTime(getTextValue(item, ["updatedAt"], "-")) },
  ];
});

// ========== 生命周期 ==========
onMounted(() => {
  void fetchSuspects();

  // window 级鼠标/触摸事件统一在 mounted 注册，确保 mousemove/mouseup 全程捕获
  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onDragEnd);
  window.addEventListener("touchmove", onWindowTouchMove, { passive: false });
  window.addEventListener("touchend", onDragEnd);
});

onUnmounted(() => {
  isDragging.value = false;
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onDragEnd);
  window.removeEventListener("touchmove", onWindowTouchMove);
  window.removeEventListener("touchend", onDragEnd);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});

// ========== 筛选器事件处理 ==========
function handleProcessStatusChange(event: { detail: { value: number } }) {
  filters.processStatus = (processStatusFilterOptions[event.detail.value]?.value ?? "") as number | "";
}

function handleIsLeakPointChange(event: { detail: { value: number } }) {
  filters.isLeakPoint = (isLeakPointFilterOptions[event.detail.value]?.value ?? "") as number | "";
}

function handleDetectTypeChange(event: { detail: { value: number } }) {
  filters.detectType = (detectTypeFilterOptions[event.detail.value]?.value ?? "") as string;
}

// ========== 拖动分隔条 ==========
const MIN_RATIO = 0.25;
const MAX_RATIO = 0.78;

const splitDividerRef = ref<HTMLElement | null>(null);
const suspectLayoutRef = ref<HTMLElement | null>(null);

// 拖拽内部状态（非响应式，避免频繁刷新）
let _dragStartX = 0;
let _dragStartRatio = 0.7;
let _containerWidth = 0;

// 每次挂载都从默认值 0.7 开始，切换页面时自动回到默认大小

/** 通过 Vue 模板事件触发拖拽开始（兼容 uni-app 事件系统） */
function onDividerMouseDown(e: MouseEvent) {
  e.preventDefault();
  beginDrag(e.clientX);
}

function onDividerTouchStart(e: TouchEvent) {
  beginDrag(e.touches[0].clientX);
}

function beginDrag(clientX: number) {
  isDragging.value = true;
  // uni-app 的 <view> ref 指向组件实例，需通过 $el 获取根 DOM 元素
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = ((suspectLayoutRef.value as any)?.$el || document.querySelector(".suspect-layout")) as HTMLElement | null;
  if (!layout || typeof layout.getBoundingClientRect !== "function") {
    isDragging.value = false;
    return;
  }
  _containerWidth = layout.getBoundingClientRect().width;
  if (_containerWidth <= 0) _containerWidth = layout.clientWidth;
  if (_containerWidth <= 0) {
    isDragging.value = false;
    return;
  }
  _dragStartRatio = splitRatio.value;
  _dragStartX = clientX;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  moveDrag(e.clientX);
}

function onWindowTouchMove(e: TouchEvent) {
  if (!isDragging.value) return;
  e.preventDefault();
  moveDrag(e.touches[0].clientX);
}

function moveDrag(clientX: number) {
  const delta = _containerWidth > 0 ? (clientX - _dragStartX) / _containerWidth : 0;
  const newRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, _dragStartRatio + delta));
  splitRatio.value = newRatio;
}

function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

// ========== 查询参数构建 ==========
function buildQueryParams() {
  const params: Record<string, unknown> = {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || "createdAt",
  };

  if (filters.processStatus !== "" && filters.processStatus !== undefined) {
    params.processStatus = filters.processStatus;
  }
  if (filters.isLeakPoint !== "" && filters.isLeakPoint !== undefined) {
    params.isLeakPoint = filters.isLeakPoint;
  }
  if (filters.detectType.trim()) {
    params.detectType = filters.detectType.trim();
  }
  if (filters.reporter.trim()) {
    params.reporter = filters.reporter.trim();
  }

  return params;
}

// ========== 数据获取 ==========
async function fetchSuspects() {
  loading.value = true;

  try {
    const response = (await getSuspectPage(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    suspects.value = parsed.records;
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    suspects.value = [];
    total.value = 0;
    selectedSuspect.value = null;
    selectedKey.value = "";
    uni.showToast({
      title: (error as { msg?: string })?.msg || "疑点数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function searchSuspects() {
  pagination.pageNum = 1;
  void fetchSuspects();
}

function resetFilters() {
  clearFilters();
  searchSuspects();
}

function clearFilters() {
  filters.detectType = "";
  filters.processStatus = "";
  filters.isLeakPoint = "";
  filters.reporter = "";
  filters.startTime = "";
  filters.endTime = "";
}

function resetFiltersAndFetch() {
  clearFilters();
  pagination.pageNum = 1;
  return fetchSuspects();
}

// ========== 排序 ==========
function toggleSort(field: string) {
  if (sortField.value === field && sortOrder.value === "asc") {
    sortOrder.value = "desc";
  } else {
    sortField.value = field;
    sortOrder.value = sortField.value === field && sortOrder.value === "desc" ? "" : "asc";
  }
  if (!sortOrder.value) sortField.value = "";
  searchSuspects();
}

function getSortClass(field: string) {
  if (sortField.value !== field) return "sort-indicator--default";
  return sortOrder.value === "asc" ? "sort-indicator--asc" : "sort-indicator--desc";
}

// ========== 分页 ==========
function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchSuspects();
}

// ========== 行选择 ==========
function selectFirstRow() {
  if (suspects.value.length === 0) {
    selectedSuspect.value = null;
    selectedKey.value = "";
    return;
  }

  const currentId = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  const matched = currentId ? suspects.value.find((item) => getRowId(item) === currentId) : null;
  const next = matched || suspects.value[0];

  selectedSuspect.value = next;
  selectedKey.value = getRowKey(next, suspects.value.indexOf(next));
  activeTab.value = "base";
}

async function selectSuspect(item: SuspectRecord, index: number) {
  selectedSuspect.value = item;
  selectedKey.value = getRowKey(item, index);
  activeTab.value = "base";

  const id = getRowId(item);
  if (!id) {
    return;
  }

  try {
    const response = (await getSuspectDetail(id)) as ApiResponseLike;
    assertSuccessResponse(response);
    if (isObject(response?.data)) {
      selectedSuspect.value = {
        ...item,
        ...(response.data as SuspectRecord),
      };
    }
  } catch {
    // 详情失败时保留列表数据，避免影响主表格展示。
  }
}

// ========== 删除 ==========
async function removeSuspect() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认删除",
    content: "确定要删除该疑点吗？删除后不可恢复。",
    success: (modalRes) => {
      if (!modalRes.confirm) return;
      void doDelete(id, false);
    },
  });
}

async function doDelete(id: string | number, force: boolean) {
  try {
    const response = (await deleteSuspect(id, force)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: force ? "疑点已强制删除" : "疑点已删除", icon: "success", duration: 2000 });
    await fetchSuspects();
  } catch (error) {
    const errMsg = (error as { msg?: string })?.msg || "";
    if (!force && errMsg && (errMsg.includes("关联") || errMsg.includes("工单") || errMsg.includes("强制"))) {
      uni.showModal({
        title: "强制删除",
        content: "该疑点已关联工单，强制删除将同时解除关联，是否继续？",
        success: (res) => res.confirm && void doDelete(id, true),
      });
    } else {
      uni.showToast({ title: errMsg || "删除失败", icon: "none" });
    }
  }
}

// ========== 转工单 ==========
function openDispatchDialog() {
  dispatchForm.workOrderNo = "";
  dispatchForm.expectedTime = "";
  dispatchForm.urgencyLevel = "";
  dispatchForm.processFlow = "";
  dispatchForm.handler = "";
  dispatchForm.remark = "";
  dispatchForm.deviceNo = "";
  dispatchForm.leakageStatus = "";
  dispatchForm.installImage = "";
  dispatchForm.installAddress = "";
  dispatchUrgencySelectOpen.value = false;
  dispatchUrgencyError.value = "";
  dispatchDialogVisible.value = true;
}

function closeDispatchDialog() {
  dispatchDialogVisible.value = false;
  dispatchUrgencySelectOpen.value = false;
  dispatchUrgencyError.value = "";
}

function selectDispatchUrgency(value: OptionValue) {
  dispatchForm.urgencyLevel = String(value);
  dispatchUrgencySelectOpen.value = false;
  dispatchUrgencyError.value = "";
}

async function submitDispatch() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    const payload: Record<string, unknown> = {};
    const woNo = dispatchForm.workOrderNo.trim();
    if (woNo) {
      payload.workOrderNo = woNo;
    } else {
      // 不填则自动生成，格式与工单创建一致：GD+年月日时分秒
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      payload.workOrderNo = `GD${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    }
    if (dispatchForm.expectedTime) payload.expectedTime = dispatchForm.expectedTime;
    if (dispatchForm.urgencyLevel) payload.urgencyLevel = dispatchForm.urgencyLevel;
    if (dispatchForm.processFlow.trim()) payload.processFlow = dispatchForm.processFlow.trim();
    if (dispatchForm.handler.trim()) payload.handler = dispatchForm.handler.trim();
    if (dispatchForm.remark.trim()) payload.remark = dispatchForm.remark.trim();
    if (dispatchForm.deviceNo.trim()) payload.deviceNo = dispatchForm.deviceNo.trim();
    if (dispatchForm.leakageStatus.trim()) payload.leakageStatus = dispatchForm.leakageStatus.trim();
    if (dispatchForm.installImage.trim()) payload.installImage = dispatchForm.installImage.trim();
    if (dispatchForm.installAddress.trim()) payload.installAddress = dispatchForm.installAddress.trim();

    const response = (await dispatchSuspect(id, payload)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "转工单成功", icon: "success", duration: 2000 });
    dispatchDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "转工单失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

// ========== 确认漏点 ==========
function openConfirmLeakDialog() {
  confirmLeakForm.leakPointType = "";
  confirmLeakForm.leakPointPosition = "";
  confirmLeakForm.coordinatePosition = "";
  confirmLeakForm.initialLevel = "";
  confirmLeakForm.leakPointSize = "";
  confirmLeakForm.leakRoadSurface = "";
  confirmLeakForm.remark = "";
  confirmLeakDialogVisible.value = true;
}

function closeConfirmLeakDialog() {
  confirmLeakDialogVisible.value = false;
}

async function submitConfirmLeak() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    const payload: Record<string, unknown> = {};
    if (confirmLeakForm.leakPointType.trim()) payload.leakPointType = confirmLeakForm.leakPointType.trim();
    if (confirmLeakForm.leakPointPosition.trim()) payload.leakPointPosition = confirmLeakForm.leakPointPosition.trim();
    if (confirmLeakForm.coordinatePosition.trim()) payload.coordinatePosition = confirmLeakForm.coordinatePosition.trim();
    if (confirmLeakForm.initialLevel.trim()) payload.initialLevel = confirmLeakForm.initialLevel.trim();
    if (confirmLeakForm.leakPointSize.trim()) payload.leakPointSize = confirmLeakForm.leakPointSize.trim();
    if (confirmLeakForm.leakRoadSurface.trim()) payload.leakRoadSurface = confirmLeakForm.leakRoadSurface.trim();
    if (confirmLeakForm.remark.trim()) payload.remark = confirmLeakForm.remark.trim();

    const response = (await confirmLeakPoint(id, payload)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已确认，同步至漏点界面", icon: "success", duration: 2000 });
    confirmLeakDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "确认疑点失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

// ========== 排除疑点 ==========
const excludeDialogVisible = ref(false);
const excludeSuspectId = ref<string | number | null>(null);
const excludeForm = reactive({
  reason: "",
  operator: "",
});

function openExcludeDialog() {
  const suspect = selectedSuspect.value;
  if (!suspect) return;
  excludeSuspectId.value = getId(suspect);
  excludeForm.reason = "";
  excludeForm.operator = "";
  excludeDialogVisible.value = true;
}

function closeExcludeDialog() {
  excludeDialogVisible.value = false;
}

async function submitExclude() {
  const id = excludeSuspectId.value;
  if (id === null || id === undefined) return;
  if (!excludeForm.reason.trim()) {
    uni.showToast({ title: "请输入排除原因", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    const payload: Record<string, unknown> = { reason: excludeForm.reason.trim() };
    if (excludeForm.operator.trim()) payload.operator = excludeForm.operator.trim();

    const response = (await excludeSuspect(String(id), payload)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已排除", icon: "success", duration: 2000 });
    excludeDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "排除失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

// ========== 查看工单 ==========
function viewWorkOrder() {
  const workOrderId = getWorkOrderId(selectedSuspect.value);
  if (!workOrderId) {
    uni.showToast({ title: "无关联工单", icon: "none" });
    return;
  }
  uni.navigateTo({
    url: `/pages/work-order/processing/processing?id=${workOrderId}`,
  });
}

// ========== 辅助函数：状态标签 ==========
function getProcessStatus(item: SuspectRecord | null): number {
  if (!item) return -1;
  const val = getStableValue(item, ["processStatus"]);
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim()) {
    const num = Number(val);
    return Number.isNaN(num) ? -1 : num;
  }
  return -1;
}

function getProcessStatusLabel(item: SuspectRecord): string {
  const status = getProcessStatus(item);
  return processStatusLabelMap[status] || "未知";
}

function getProcessStatusClass(item: SuspectRecord): string {
  const status = getProcessStatus(item);
  const classMap: Record<number, string> = {
    0: "status-tag--pending",
    1: "status-tag--dispatched",
    2: "status-tag--processing",
    3: "status-tag--completed",
    4: "status-tag--excluded",
  };
  return classMap[status] || "status-tag--default";
}

function getIsLeakPointLabel(item: SuspectRecord): string {
  const val = getStableValue(item, ["isLeakPoint"]);
  if (typeof val === "number") return isLeakPointLabelMap[val] || "未知";
  if (typeof val === "string" && val.trim()) {
    const num = Number(val);
    return Number.isNaN(num) ? "未知" : (isLeakPointLabelMap[num] || "未知");
  }
  return "未知";
}

function getIsLeakPointClass(item: SuspectRecord): string {
  const val = getStableValue(item, ["isLeakPoint"]);
  let num = -1;
  if (typeof val === "number") num = val;
  else if (typeof val === "string" && val.trim()) num = Number(val);
  const classMap: Record<number, string> = {
    0: "status-tag--no",
    1: "status-tag--yes",
    2: "status-tag--pending-confirm",
  };
  return classMap[num] || "status-tag--default";
}

function getWorkOrderId(item: SuspectRecord | null): string | number {
  if (!item) return "";
  const val = getStableValue(item, ["workOrderId"]);
  return typeof val === "string" || typeof val === "number" ? val : "";
}

// ========== 通用工具函数（保留自原有文件） ==========
function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data) || findPageContainer(response) || (isObject(data) ? data : {});
  const records = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topLevelRecords = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = records.length > 0 ? records : topLevelRecords;
  const totalValue =
    getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) ??
    getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const current = getFirstNumber(pageData, ["current", "pageNum", "page", "pageNo"]);
  const size = getFirstNumber(pageData, ["size", "pageSize", "limit"]);

  if (current) {
    pagination.pageNum = current;
  }

  if (size) {
    pagination.pageSize = size;
  }

  const minimumVisibleTotal = (pagination.pageNum - 1) * pagination.pageSize + finalRecords.length;
  const resolvedTotal = totalValue === undefined ? finalRecords.length : Math.max(totalValue, minimumVisibleTotal);

  return {
    records: finalRecords.map((item) => (isObject(item) ? item : { value: item })),
    total: resolvedTotal,
  };
}

function findPageContainer(value: unknown): SuspectRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const hasRecords = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal =
    getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecords || hasTotal) {
    return value;
  }

  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer(value[key]);
    if (matched) {
      return matched;
    }
  }

  return null;
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

function getRowId(item: SuspectRecord) {
  const value = getStableValue(item, ["id"]);
  return typeof value === "string" || typeof value === "number" ? value : "";
}

function getRowKey(item: SuspectRecord, index: number) {
  return String(getRowId(item) || index);
}

function getId(item: SuspectRecord) {
  return getTextValue(item, ["id"], "-");
}

function getTextValue(item: SuspectRecord, keys: string[], fallback = "") {
  const value = getStableValue(item, keys);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function getStableValue(item: SuspectRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      return item[key];
    }
  }

  return undefined;
}

function getFirstArray(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return [];
  }

  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getFirstNumber(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return undefined;
  }

  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function isObject(value: unknown): value is SuspectRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function formatDateTime(value: string) {
  if (!value || value === "-") {
    return value || "-";
  }

  return value
    .replace("T", " ")
    .replace(/\.\d+/, "")
    .replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

// ========== 暴露方法 ==========
defineExpose({
  fetchSuspects,
  resetFiltersAndFetch,
});
</script>

<style scoped lang="scss">
.suspect-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  overflow-x: hidden;
  background: #eef4f8;
}

.suspect-toolbar,
.suspect-table-panel,
.suspect-detail-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
  min-width: 0;
  overflow: hidden;
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.toolbar-row {
  min-width: 0;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  display: flex;
  align-items: end;
  gap: 12px;
  width: 100%;
}

.toolbar-spacer {
  flex: 1;
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
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input,
.filter-select {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.toolbar-row--filters .filter-input,
.toolbar-row--filters .filter-select {
  height: 28px;
  line-height: 28px;
}

.input-placeholder {
  color: #9aa9b8;
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

.filter-group--date {
  flex: 0 0 auto;
  min-width: 0;
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

.suspect-toolbar {
  flex: none;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-actions--right {
  margin-left: auto;
  justify-content: flex-end;
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
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--hover,
.toolbar-icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.toolbar-icon-button {
  width: 30px;
  padding: 0;
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

.suspect-layout {
  display: flex;
  flex: 1;
  margin-top: 14px;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}

.suspect-table-panel,
.suspect-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}

.split-divider {
  flex: none;
  width: 16px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.18s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  /* 鼠标靠近时切换为拉伸光标 */
}

.split-divider__line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: #d8e5ef;
  border-radius: 999px;
  transform: translateX(-50%);
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.split-divider:hover .split-divider__line,
.split-divider--active .split-divider__line {
  background: #0d82ee;
  box-shadow: 0 0 6px rgba(13, 130, 238, 0.3);
}

.split-divider__grip {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  opacity: 0.4;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.split-divider:hover .split-divider__grip,
.split-divider--active .split-divider__grip {
  opacity: 1;
  transform: scale(1.1);
}

.split-divider__dot {
  width: 4px;
  height: 4px;
  background: #809bb5;
  border-radius: 50%;
  transition: background 0.18s ease;
}

.split-divider:hover .split-divider__dot,
.split-divider--active .split-divider__dot {
  background: #0d82ee;
}

.split-divider::before {
  display: none;
}

.split-divider:hover {
  background: rgba(13, 130, 238, 0.06);
}

.split-divider--active {
  background: rgba(13, 130, 238, 0.1) !important;
}

/* 面板最小宽度约束 — 防止拖拽时过度挤压 */
.suspect-table-panel {
  min-width: 280px;
}

.suspect-detail-panel {
  min-width: 240px;
}

.table-head {
  flex: none;
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
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view),
.detail-body :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar),
.detail-body::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track),
.detail-body::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb),
.detail-body::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb:hover),
.detail-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.data-table {
  width: 100%;
  min-width: 0;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 48px 90px 80px 72px 1fr 1fr 80px 150px;
  min-height: 42px;
  width: 100%;
  min-width: 0;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.2s ease;
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

.data-table-body {
  transition: opacity 0.25s ease;
}

.data-table-body--loading {
  opacity: 0.5;
  pointer-events: none;
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
  transform: translateY(-1px);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
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
  padding: 0 8px;
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
  justify-content: center;
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
  text-align: center;
}

.data-cell--sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.18s ease;
}

.data-cell--sortable:hover {
  color: #0d82ee;
}

.sort-indicator {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 4px;
  vertical-align: middle;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.sort-indicator--default {
  border-top: 5px solid #c5d2e0;
  opacity: 0.4;
}

.sort-indicator--asc {
  border-bottom: 5px solid #0d82ee;
  border-top: 0;
}

.sort-indicator--desc {
  border-top: 5px solid #0d82ee;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--position {
  justify-content: flex-start;
  text-align: left;
}

.data-cell--time {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--worksheet {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--reporter {
  color: #24384d;
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
}

.status-tag--pending {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.status-tag--dispatched {
  color: #1e40af;
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.status-tag--processing {
  color: #6d28d9;
  background: #ede9fe;
  border: 1px solid #c4b5fd;
}

.status-tag--completed {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}

.status-tag--excluded {
  color: #7a5910;
  background: #fef3c7;
  border: 1px solid #f5d685;
}

.status-tag--no {
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.status-tag--yes {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}

.status-tag--pending-confirm {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.status-tag--default {
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
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
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
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

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

/* ========== 详情面板 ========== */
.detail-tabs {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  height: 54px;
  padding: 8px;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.detail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
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

.detail-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
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

.detail-grid {
  display: grid;
  gap: 12px;
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
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: anywhere;
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

.detail-grid--content {
  grid-template-columns: 1fr;
  gap: 8px;
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

.detail-item--base::before {
  display: none;
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
  word-break: break-all;
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
  box-shadow: none;
  white-space: pre-wrap;
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

.detail-item--note:nth-child(1) .detail-item__label {
  border-left-color: #7dd3fc;
}

.detail-item--note:nth-child(2) .detail-item__label {
  border-left-color: #86efac;
}

.detail-item--note:nth-child(3) .detail-item__label,
.detail-item--note:nth-child(4) .detail-item__label,
.detail-item--note:nth-child(5) .detail-item__label,
.detail-item--note:nth-child(6) .detail-item__label {
  border-left-color: #cbd5e1;
}

/* ========== 疑点处理区 ========== */
.process-box {
  flex: none;
  padding: 16px 18px 18px;
  background: #f8fbfe;
  border-top: 1px solid #e3edf6;
}

.process-box__title {
  display: block;
  margin-bottom: 14px;
  padding-left: 10px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
  border-left: 3px solid #0d82ee;
  border-radius: 2px;
}

.process-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.process-action {
  width: auto;
  min-width: 80px;
  height: 40px;
  margin: 0;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 800;
  line-height: 40px;
  border-radius: 6px;
}

.process-action--dispatch {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.process-action--confirm-leak {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.process-action--view-worksheet {
  color: #1e40af;
  background: #dbeafe;
  border-color: #93c5fd;
}

.process-action--edit {
  color: #31506d;
  background: #f6fbff;
  border-color: #cbdced;
}

.process-action--delete {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.process-action--exclude {
  color: #7a5910;
  background: #fff9e6;
  border-color: #f5d685;
}

.process-action--excluded {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 13px;
  color: #7a5910;
  background: #fff9e6;
  border-radius: 6px;
  border: 1px solid #f5d685;
}

/* ========== 对话框 ========== */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-header {
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

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  font-size: 18px;
  color: #5f7188;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 6px;
  cursor: pointer;
}

.dialog-close--hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 16px;
  background: #fff;
}

.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
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
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.form-input,
.form-select {
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-input:focus,
.form-textarea:focus {
  background: #fff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.form-select--dropdown {
  position: relative;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-field {
  position: relative;
}

.select-placeholder {
  color: #9aa9b8;
}

.select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(15, 35, 55, 0.12);
}

.select-option {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease;
}

.select-option:hover {
  background: #edf7ff;
}

.select-option--active {
  color: #0d82ee;
  background: #e8f4ff;
}

.form-control--error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

.form-textarea {
  min-height: 88px;
  padding: 9px 12px;
  line-height: 1.45;
}

.form-readonly {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #e3edf6;
  border-radius: 4px;
}

.form-datetime {
  width: 100%;
}

.form-datetime :deep(.datetime-picker__control) {
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  line-height: 38px;
}

.input-placeholder {
  color: #9aa9b8;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: none;
  padding: 12px 22px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #edf3f8;
  box-shadow: 0 -4px 16px rgba(24, 55, 85, 0.06);
}

.dialog-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 38px;
  margin: 0;
  padding: 0 22px;
  color: #34495e;
  font-size: 14px;
  font-weight: 700;
  line-height: 38px;
  background: #f1f5f9;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.16s ease;
}

.dialog-button::after {
  border: 0;
}

.dialog-button--hover {
  opacity: 0.85;
}

.dialog-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.dialog-button--danger {
  color: #ffffff;
  background: #dc2626;
  border-color: #dc2626;
}

.dialog-button[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ============================================
   响应式布局
   ============================================ */

/* 大屏（>= 1440px） */
@media (min-width: 1440px) {
  .data-row {
    grid-template-columns: 48px 100px 90px 80px 1fr 1fr 90px 160px;
  }
}

/* 中屏（<= 1280px） */
@media (max-width: 1280px) {
  .suspect-layout {
    flex-direction: column;
  }

  .split-divider {
    display: none;
  }

  .suspect-table-panel,
  .suspect-detail-panel {
    width: 100% !important;
  }

  .suspect-detail-panel {
    min-height: 320px;
  }
}

/* 小屏平板（<= 960px） */
@media (max-width: 960px) {
  .suspect-view {
    padding: 0 8px 10px;
  }

  .suspect-layout {
    margin-top: 10px;
  }

  .toolbar-row--filters {
    flex-direction: column;
    gap: 8px;
  }

  .filter-group {
    flex: 1 1 100%;
    min-width: 0;
  }

  .filter-group--date {
    flex: 1 1 100%;
  }

  .date-range {
    flex-wrap: wrap;
  }

  .filter-datetime {
    flex: 1 1 140px;
    width: auto;
  }

  .data-row {
    grid-template-columns: 42px 80px 72px 64px 1fr 1fr 72px 135px;
    min-height: 40px;
  }

  .data-cell {
    padding: 0 6px;
    font-size: 12px;
  }

  .detail-tabs {
    gap: 4px;
    height: 48px;
    padding: 6px;
  }

  .detail-tab {
    font-size: 12px;
  }

  .process-actions {
    gap: 8px;
  }
}

/* 手机（<= 640px） */
@media (max-width: 640px) {
  .suspect-view {
    padding: 0 4px 8px;
  }

  .suspect-toolbar {
    padding: 10px;
    gap: 8px;
  }

  .toolbar-row--filters {
    gap: 6px;
  }

  .toolbar-row--bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
  }

  .toolbar-actions .toolbar-button {
    min-width: 56px;
    padding: 0 10px;
    font-size: 12px;
    height: 34px;
  }

  .toolbar-actions .toolbar-icon-button {
    width: 34px;
    height: 34px;
  }

  .suspect-layout {
    margin-top: 8px;
    flex-direction: column;
  }

  .split-divider {
    display: none;
  }

  .suspect-table-panel,
  .suspect-detail-panel {
    width: 100% !important;
  }

  .suspect-detail-panel {
    min-height: 280px;
  }

  .table-head {
    height: 42px;
    padding: 0 10px;
    font-size: 14px;
  }

  .table-head__meta {
    font-size: 11px;
    padding: 2px 8px;
  }

  .data-row {
    grid-template-columns: 38px 70px 64px 56px 1fr 1fr 64px 125px;
    min-height: 38px;
  }

  .data-row--header {
    min-height: 38px;
  }

  .data-cell {
    padding: 0 4px;
    font-size: 11px;
  }

  .data-row--header .data-cell {
    font-size: 11px;
  }

  .detail-tabs {
    gap: 3px;
    height: 44px;
    padding: 4px;
  }

  .detail-tab {
    font-size: 11px;
  }

  .detail-body {
    padding: 10px;
  }

  .detail-item--base {
    grid-template-columns: 72px minmax(0, 1fr);
    min-height: 40px;
    padding: 6px 10px;
  }

  .detail-grid--content .detail-item {
    grid-template-columns: 1fr;
  }

  .detail-grid--content .detail-item__value {
    border-top: 1px solid #edf3f8;
    border-left: 0;
  }

  .detail-item--note .detail-item__label {
    min-height: 34px;
  }

  .pagination-bar {
    height: 40px;
    padding: 0 8px;
    gap: 6px;
  }

  .page-button {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 28px;
  }

  .page-info {
    font-size: 12px;
  }

  .process-actions {
    flex-direction: column;
    gap: 8px;
  }
}

/* 极小屏（<= 400px） */
@media (max-width: 400px) {
  .data-row {
    grid-template-columns: 34px 60px 56px 48px 1fr 1fr 56px 110px;
    min-height: 36px;
  }

  .data-cell {
    padding: 0 3px;
    font-size: 10px;
  }

  .data-row--header .data-cell {
    font-size: 10px;
  }

  .detail-tabs {
    gap: 2px;
    height: 40px;
    padding: 3px;
  }

  .detail-tab {
    font-size: 10px;
  }
}
</style>
