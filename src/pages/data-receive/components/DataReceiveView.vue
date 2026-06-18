<template>
  <view class="data-receive-view">
    <view class="data-receive-tabs">
      <view
        v-for="section in modeSections"
        :key="section.key"
        class="data-receive-tab"
        :class="{ 'data-receive-tab--active': activeSectionKey === section.key }"
        @click="switchSection(section.key)"
      >
        <text>{{ section.title }}</text>
      </view>
    </view>

    <AdminMetricRow :items="metricItems" />

    <view class="data-toolbar">
      <view class="data-toolbar__filters">
        <view v-for="field in activeConfig.filters" :key="field.key" class="filter-field">
          <text class="filter-label">{{ field.label }}</text>
          <AdminDateTimePicker
            v-if="field.type === 'datetime'"
            v-model="filterModel[field.key]"
            :default-time="getDateTimeDefaultTime(field.key)"
          />
          <picker v-else-if="field.options?.length" :range="field.options" range-key="label" @change="handleFilterSelectChange(field.key, field.options || [], $event)">
            <view class="filter-select">{{ getFilterOptionLabel(field) }}</view>
          </picker>
          <input
            v-else
            v-model="filterModel[field.key]"
            class="filter-input"
            :type="field.type === 'number' ? 'number' : 'text'"
            :placeholder="field.placeholder || '请输入'"
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <view class="data-toolbar__actions">
        <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchRecords">查询</button>
        <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
        <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchRecords">
          <text class="icon-refresh"></text>
        </button>
        <button v-if="activeConfig.formFields?.length" class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="startCreate">
          新增
        </button>
        <button v-if="activeConfig.key === 'field'" class="toolbar-button" hover-class="toolbar-button--hover" @click="saveCurrentFieldList">
          批量保存
        </button>
      </view>
    </view>

    <view class="data-layout">
      <view class="table-panel">
        <view class="table-head">
          <view>
            <text class="table-title">{{ activeConfig.title }}</text>
            <text class="table-subtitle">{{ activeConfig.description }}</text>
          </view>
          <text class="table-count">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table" :style="{ minWidth: activeTableMinWidth }">
            <view class="data-row data-row--header" :style="{ gridTemplateColumns: activeTableColumns }">
              <text v-for="column in activeConfig.columns" :key="column.key" class="data-cell">{{ column.label }}</text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无数据</view>

            <view
              v-for="(item, index) in records"
              v-else
              :key="getRowKey(item, index)"
              class="data-row"
              :class="{ 'data-row--active': getRowKey(item, index) === selectedKey }"
              :style="{ gridTemplateColumns: activeTableColumns }"
              @click="selectRecord(item, index)"
            >
              <text v-for="column in activeConfig.columns" :key="column.key" class="data-cell">
                <text v-if="column.type === 'status'" class="status-pill" :class="getStatusClass(item, column)">{{ getColumnText(item, column) }}</text>
                <text v-else>{{ getColumnText(item, column) }}</text>
              </text>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <button class="page-button" :disabled="pagination.pageNum <= 1" hover-class="page-button--hover" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" :disabled="pagination.pageNum >= totalPages" hover-class="page-button--hover" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <view class="detail-panel">
        <view class="detail-head">
          <text class="detail-title">{{ activeConfig.formFields?.length ? "编辑信息" : "详情信息" }}</text>
          <text class="detail-subtitle">{{ selectedRecord ? getSelectedSummary() : "请选择左侧记录" }}</text>
        </view>

        <scroll-view class="detail-body" scroll-y>
          <view v-if="activeConfig.formFields?.length" class="form-grid">
            <view v-for="field in activeConfig.formFields" :key="field.key" class="form-field" :class="{ 'form-field--wide': field.type === 'textarea' }">
              <text class="form-label" :class="{ 'form-label--required': field.required }">{{ field.label }}</text>
              <textarea
                v-if="field.type === 'textarea'"
                :value="getFormInputValue(field.key)"
                class="form-textarea"
                :placeholder="field.placeholder || '请输入'"
                placeholder-class="input-placeholder"
                @input="handleFormInput(field.key, $event)"
              />
              <picker v-else-if="field.type === 'boolean'" :range="booleanOptions" range-key="label" @change="handleBooleanChange(field.key, $event)">
                <view class="form-select">
                  <text>{{ getBooleanLabel(formModel[field.key]) }}</text>
                  <text class="select-arrow"></text>
                </view>
              </picker>
              <input
                v-else
                :value="getFormInputValue(field.key)"
                class="form-input"
                :type="field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.placeholder || '请输入'"
                placeholder-class="input-placeholder"
                @input="handleFormInput(field.key, $event)"
              />
            </view>
          </view>

          <view v-else-if="selectedRecord" class="detail-grid">
            <view v-for="field in activeConfig.detailFields" :key="field.key" class="detail-item">
              <text class="detail-item__label">{{ field.label }}</text>
              <text class="detail-item__value">{{ getColumnText(selectedRecord, field) }}</text>
            </view>
          </view>

          <view v-else class="detail-empty">暂无选中数据</view>
        </scroll-view>

        <view v-if="activeConfig.formFields?.length" class="detail-actions">
          <button class="secondary-button" hover-class="secondary-button--hover" @click="startCreate">清空</button>
          <button v-if="selectedRecord && activeConfig.deleteRecord" class="danger-button" hover-class="danger-button--hover" @click="deleteSelectedRecord">删除</button>
          <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="saveRecord">
            {{ submitting ? "保存中..." : "保存" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import AdminDateTimePicker from "@/components/admin/AdminDateTimePicker.vue";
import AdminMetricRow from "@/components/admin/AdminMetricRow.vue";
import {
  createDeviceProtocolRelation,
  createProtocolDefinition,
  deleteDeviceProtocolRelation,
  deleteProtocolDefinition,
  getDeviceProtocolRelationByDevice,
  getDeviceProtocolRelationByProtocol,
  getDeviceProtocolRelationDetail,
  getDeviceProtocolRelationPage,
  getProtocolDefinitionDetail,
  getProtocolDefinitionPage,
  updateDeviceProtocolRelation,
  updateProtocolDefinition,
} from "@/services/data-receive/access";
import {
  batchSaveProtocolFields,
  createProtocolField,
  deleteProtocolField,
  getFieldsByProtocol,
  getProtocolFieldDetail,
  getProtocolFieldPage,
  getProtocolParseRecordPage,
  updateProtocolField,
} from "@/services/data-receive/parse";
import {
  getSamplingCssDataDetail,
  getSamplingCssDataPage,
  getSamplingDailyDetail,
  getSamplingDailyPage,
  getSamplingDetailDetail,
  getSamplingDetailPage,
  getSamplingPressureDetail,
  getSamplingPressurePage,
  getSamplingRecordDetail,
  getSamplingRecordPage,
} from "@/services/data-receive/record";
import {
  assertSuccessResponse,
  formatDateTime,
  getId,
  getText,
  getValue,
  isObject,
  parseListResponse,
  parsePageResponse,
  removeEmptyFields,
  toastError,
  type ApiResponseLike,
  type RecordLike,
} from "@/utils/adminData";

type DataReceiveMode = "access" | "parse" | "record";
type FieldType = "text" | "number" | "textarea" | "boolean" | "datetime" | "status" | "json" | "select";
type SectionKey =
  | "protocol"
  | "relation"
  | "field"
  | "parseRecord"
  | "samplingRecord"
  | "samplingDetail"
  | "samplingDaily"
  | "samplingPressure"
  | "samplingCss";
type FormValue = string | number | boolean;
type SelectOption = {
  label: string;
  value: string;
};

interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  width?: number;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
}

interface SectionConfig {
  key: SectionKey;
  title: string;
  description: string;
  mode: DataReceiveMode;
  columns: FieldConfig[];
  detailFields: FieldConfig[];
  filters: FieldConfig[];
  formFields?: FieldConfig[];
  loadRecords: (query: RecordLike, filters: Record<string, string>) => Promise<ApiResponseLike>;
  listResponse?: boolean;
  getDetail?: (id: string | number) => Promise<ApiResponseLike>;
  createRecord?: (data: RecordLike) => Promise<ApiResponseLike>;
  updateRecord?: (id: string | number, data: RecordLike) => Promise<ApiResponseLike>;
  deleteRecord?: (id: string | number) => Promise<ApiResponseLike>;
}

const props = defineProps<{
  mode: DataReceiveMode;
}>();

const booleanOptions = [
  { label: "启用", value: true },
  { label: "停用", value: false },
];
const parseStatusOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
];
const leakStatusOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "正常", value: "0" },
  { label: "异常", value: "1" },
];

const baseTimeFilters: FieldConfig[] = [
  { key: "startTime", label: "开始时间", type: "datetime" },
  { key: "endTime", label: "结束时间", type: "datetime" },
];

const sectionConfigs: Record<SectionKey, SectionConfig> = {
  protocol: {
    key: "protocol",
    mode: "access",
    title: "协议定义",
    description: "维护动态协议编码、版本、优先级和启用状态",
    columns: [
      { key: "protocolCode", label: "协议编码", width: 150 },
      { key: "protocolName", label: "协议名称", width: 150 },
      { key: "protocolVersion", label: "版本", width: 100 },
      { key: "priority", label: "优先级", width: 90 },
      { key: "enabled", label: "状态", type: "status", width: 90 },
      { key: "description", label: "说明", width: 220 },
      { key: "updatedAt", label: "更新时间", type: "datetime", width: 170 },
    ],
    detailFields: [],
    filters: baseTimeFilters,
    formFields: [
      { key: "protocolCode", label: "协议编码", required: true },
      { key: "protocolName", label: "协议名称", required: true },
      { key: "protocolVersion", label: "协议版本" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "enabled", label: "启用状态", type: "boolean" },
      { key: "description", label: "协议说明", type: "textarea" },
    ],
    loadRecords: (query) => getProtocolDefinitionPage(query),
    getDetail: (id) => getProtocolDefinitionDetail(id),
    createRecord: (data) => createProtocolDefinition(data),
    updateRecord: (id, data) => updateProtocolDefinition(id, data),
    deleteRecord: (id) => deleteProtocolDefinition(id),
  },
  relation: {
    key: "relation",
    mode: "access",
    title: "设备协议绑定",
    description: "按设备、协议、AFN 和任务类型维护协议适配关系",
    columns: [
      { key: "deviceId", label: "设备ID", width: 100 },
      { key: "protocolId", label: "协议ID", width: 100 },
      { key: "afn", label: "AFN", width: 100 },
      { key: "taskType", label: "任务类型", width: 120 },
      { key: "contentPrefix", label: "内容前缀", width: 140 },
      { key: "priority", label: "优先级", width: 90 },
      { key: "enabled", label: "状态", type: "status", width: 90 },
      { key: "updatedAt", label: "更新时间", type: "datetime", width: 170 },
    ],
    detailFields: [],
    filters: [
      { key: "deviceId", label: "设备ID", type: "number" },
      { key: "protocolId", label: "协议ID", type: "number" },
      ...baseTimeFilters,
    ],
    formFields: [
      { key: "deviceId", label: "设备ID", type: "number", required: true },
      { key: "protocolId", label: "协议ID", type: "number", required: true },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "contentPrefix", label: "内容前缀" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "enabled", label: "启用状态", type: "boolean" },
    ],
    loadRecords: (query, filters) => {
      if (filters.deviceId) {
        return getDeviceProtocolRelationByDevice(filters.deviceId);
      }
      if (filters.protocolId) {
        return getDeviceProtocolRelationByProtocol(filters.protocolId);
      }
      return getDeviceProtocolRelationPage(query);
    },
    getDetail: (id) => getDeviceProtocolRelationDetail(id),
    createRecord: (data) => createDeviceProtocolRelation(data),
    updateRecord: (id, data) => updateDeviceProtocolRelation(id, data),
    deleteRecord: (id) => deleteDeviceProtocolRelation(id),
  },
  field: {
    key: "field",
    mode: "parse",
    title: "协议字段定义",
    description: "维护协议字段位置、长度、格式、单位和输出类型",
    columns: [
      { key: "protocolId", label: "协议ID", width: 90 },
      { key: "afn", label: "AFN", width: 90 },
      { key: "taskType", label: "任务类型", width: 110 },
      { key: "fieldName", label: "字段名", width: 140 },
      { key: "fieldCnName", label: "中文名", width: 140 },
      { key: "startPosition", label: "起始", width: 80 },
      { key: "fieldLength", label: "长度", width: 80 },
      { key: "format", label: "格式", width: 100 },
      { key: "outputType", label: "输出类型", width: 110 },
      { key: "unit", label: "单位", width: 90 },
      { key: "required", label: "必填", type: "status", width: 80 },
      { key: "enabled", label: "状态", type: "status", width: 80 },
    ],
    detailFields: [],
    filters: [
      { key: "protocolId", label: "协议ID", type: "number" },
      ...baseTimeFilters,
    ],
    formFields: [
      { key: "protocolId", label: "协议ID", type: "number", required: true },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "taskTypeName", label: "任务名称" },
      { key: "contentPrefix", label: "内容前缀" },
      { key: "fieldName", label: "字段名", required: true },
      { key: "fieldCnName", label: "中文名" },
      { key: "startPosition", label: "起始位置", type: "number" },
      { key: "fieldLength", label: "字段长度", type: "number" },
      { key: "positionUnit", label: "位置单位" },
      { key: "format", label: "格式" },
      { key: "scale", label: "比例" },
      { key: "outputType", label: "输出类型" },
      { key: "unit", label: "单位" },
      { key: "required", label: "是否必填", type: "boolean" },
      { key: "enabled", label: "启用状态", type: "boolean" },
      { key: "defaultValue", label: "默认值" },
      { key: "invalidValues", label: "无效值" },
      { key: "enumMapping", label: "枚举映射", type: "textarea" },
      { key: "description", label: "字段说明", type: "textarea" },
      { key: "sortOrder", label: "排序", type: "number" },
    ],
    loadRecords: (query, filters) => (filters.protocolId ? getFieldsByProtocol(filters.protocolId) : getProtocolFieldPage(query)),
    getDetail: (id) => getProtocolFieldDetail(id),
    createRecord: (data) => createProtocolField(data),
    updateRecord: (id, data) => updateProtocolField(id, data),
    deleteRecord: (id) => deleteProtocolField(id),
  },
  parseRecord: {
    key: "parseRecord",
    mode: "parse",
    title: "解析记录",
    description: "查询动态协议解析链路、状态、帧数量和解析值",
    columns: [
      { key: "traceId", label: "追踪ID", width: 150 },
      { key: "deviceNumber", label: "设备编号", width: 130 },
      { key: "protocolName", label: "协议名称", width: 140 },
      { key: "afn", label: "AFN", width: 90 },
      { key: "taskTypeName", label: "任务名称", width: 130 },
      { key: "frameCount", label: "帧数", width: 80 },
      { key: "fieldCount", label: "字段数", width: 90 },
      { key: "parseStatus", label: "状态", type: "status", width: 100 },
      { key: "parseTime", label: "解析时间", type: "datetime", width: 170 },
    ],
    detailFields: [
      { key: "traceId", label: "追踪ID" },
      { key: "channel", label: "通道" },
      { key: "deviceNumber", label: "设备编号" },
      { key: "protocolCode", label: "协议编码" },
      { key: "protocolName", label: "协议名称" },
      { key: "protocolVersion", label: "协议版本" },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "commandGroup", label: "指令组" },
      { key: "contentBytes", label: "内容字节" },
      { key: "errorMessage", label: "错误信息" },
      { key: "values", label: "解析值", type: "json" },
    ],
    filters: [
      { key: "deviceNumber", label: "设备编号" },
      { key: "protocolId", label: "协议ID", type: "number" },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "contentPrefix", label: "内容前缀" },
      { key: "parseStatus", label: "解析状态", type: "select", options: parseStatusOptions },
      ...baseTimeFilters,
    ],
    loadRecords: (query) => getProtocolParseRecordPage(query),
  },
  samplingRecord: createRecordSection("samplingRecord", "record", "采样记录", "查询设备采样主记录和渗漏判断结果", getSamplingRecordPage, getSamplingRecordDetail, [
    { key: "deviceNumber", label: "设备编号", width: 130 },
    { key: "tubeGroup", label: "管组", width: 100 },
    { key: "samplingTime", label: "采样时间", type: "datetime", width: 170 },
    { key: "samplingAddress", label: "采样地址", width: 220 },
    { key: "leakEsa", label: "ESA", width: 90 },
    { key: "leakIntensity", label: "强度", width: 90 },
    { key: "leakFrequency", label: "频率", width: 90 },
    { key: "leakStatus", label: "渗漏状态", type: "status", width: 100 },
    { key: "pressure", label: "压力", width: 100 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
    { key: "deviceId", label: "设备ID", type: "number" },
    { key: "tubeGroup", label: "管组" },
    { key: "leakStatus", label: "渗漏状态", type: "select", options: leakStatusOptions },
  ]),
  samplingDetail: createRecordSection("samplingDetail", "record", "采样明细", "查询采样子序号和各项渗漏指标", getSamplingDetailPage, getSamplingDetailDetail, [
    { key: "samplingId", label: "采样ID", width: 100 },
    { key: "deviceNumber", label: "设备编号", width: 130 },
    { key: "orderNumber", label: "序号", width: 80 },
    { key: "leakEsa", label: "ESA", width: 100 },
    { key: "leakIntensity", label: "强度", width: 100 },
    { key: "leakFrequency", label: "频率", width: 100 },
    { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
  ], [
    { key: "samplingId", label: "采样ID", type: "number" },
    { key: "deviceNumber", label: "设备编号" },
  ]),
  samplingDaily: createRecordSection("samplingDaily", "record", "采样日报", "查询日维度渗漏属性、状态和采样位置", getSamplingDailyPage, getSamplingDailyDetail, [
    { key: "deviceNumber", label: "设备编号", width: 130 },
    { key: "deviceId", label: "设备ID", width: 100 },
    { key: "leakProperty", label: "渗漏属性", width: 100 },
    { key: "leakStatus", label: "渗漏状态", type: "status", width: 100 },
    { key: "samplingTime", label: "采样时间", type: "datetime", width: 170 },
    { key: "samplingAddress", label: "采样地址", width: 240 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
    { key: "deviceId", label: "设备ID", type: "number" },
    { key: "leakStatus", label: "渗漏状态", type: "select", options: leakStatusOptions },
  ]),
  samplingPressure: createRecordSection("samplingPressure", "record", "采样压力", "查询压力文件、压力时间和采集位置", getSamplingPressurePage, getSamplingPressureDetail, [
    { key: "deviceNumber", label: "设备编号", width: 130 },
    { key: "deviceId", label: "设备ID", width: 100 },
    { key: "pressureFileId", label: "压力文件ID", width: 130 },
    { key: "pressureTime", label: "压力时间", type: "datetime", width: 170 },
    { key: "pressureAddress", label: "压力地址", width: 240 },
    { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
    { key: "deviceId", label: "设备ID", type: "number" },
  ]),
  samplingCss: createRecordSection("samplingCss", "record", "CSS采样数据", "查询井内温压、电池和分析结论", getSamplingCssDataPage, getSamplingCssDataDetail, [
    { key: "deviceId", label: "设备ID", width: 100 },
    { key: "samplingTime", label: "采样时间", type: "datetime", width: 170 },
    { key: "liquidDepth", label: "液位", width: 90 },
    { key: "wellTemperature", label: "井温", width: 90 },
    { key: "wellPressure", label: "井压", width: 90 },
    { key: "cavityTemperature", label: "腔温", width: 90 },
    { key: "cavityPressure", label: "腔压", width: 90 },
    { key: "batteryVoltage", label: "电压", width: 90 },
    { key: "batteryLevel", label: "电量", width: 90 },
    { key: "analysisConclusion", label: "分析结论", width: 180 },
  ], [
    { key: "deviceId", label: "设备ID", type: "number" },
  ]),
};

const modeSectionKeys: Record<DataReceiveMode, SectionKey[]> = {
  access: ["protocol", "relation"],
  parse: ["field", "parseRecord"],
  record: ["samplingRecord", "samplingDetail", "samplingDaily", "samplingPressure", "samplingCss"],
};

const activeSectionKey = ref<SectionKey>(modeSectionKeys[props.mode][0]);
const records = ref<RecordLike[]>([]);
const selectedRecord = ref<RecordLike | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});
const filterState = reactive<Record<SectionKey, Record<string, string>>>(createInitialFilterState());
const formModel = reactive<Record<string, FormValue>>({});

const modeSections = computed(() => modeSectionKeys[props.mode].map((key) => sectionConfigs[key]));
const activeConfig = computed(() => sectionConfigs[activeSectionKey.value]);
const filterModel = computed(() => filterState[activeSectionKey.value]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));
const activeTableColumns = computed(() => activeConfig.value.columns.map((column) => `${column.width || 120}px`).join(" "));
const activeTableMinWidth = computed(() => `${activeConfig.value.columns.reduce((sum, column) => sum + (column.width || 120), 0)}px`);
const metricItems = computed(() => {
  const enabledCount = records.value.filter((item) => getValue(item, ["enabled"]) === true).length;
  const statusCount = records.value.filter((item) => getValue(item, ["parseStatus", "leakStatus"]) !== undefined).length;

  return [
    { label: "当前数据集", value: activeConfig.value.title },
    { label: "记录总数", value: String(total.value) },
    { label: "当前页", value: String(records.value.length) },
    { label: "启用/状态项", value: String(enabledCount || statusCount) },
  ];
});

watch(
  () => props.mode,
  (mode) => {
    activeSectionKey.value = modeSectionKeys[mode][0];
    resetRuntimeState();
    void fetchRecords();
  },
);

watch(activeSectionKey, () => {
  resetRuntimeState();
  void fetchRecords();
});

onMounted(() => {
  void fetchRecords();
});

function createRecordSection(
  key: SectionKey,
  mode: DataReceiveMode,
  title: string,
  description: string,
  loadRecords: (query: RecordLike) => Promise<ApiResponseLike>,
  getDetail: (id: string | number) => Promise<ApiResponseLike>,
  columns: FieldConfig[],
  extraFilters: FieldConfig[],
): SectionConfig {
  return {
    key,
    mode,
    title,
    description,
    columns,
    detailFields: columns,
    filters: [...extraFilters, ...baseTimeFilters],
    loadRecords,
    getDetail,
  };
}

function createInitialFilterState() {
  return Object.fromEntries(
    Object.values(sectionConfigs).map((section) => [
      section.key,
      Object.fromEntries(section.filters.map((field) => [field.key, ""])),
    ]),
  ) as Record<SectionKey, Record<string, string>>;
}

function switchSection(key: SectionKey) {
  if (activeSectionKey.value !== key) {
    activeSectionKey.value = key;
  }
}

async function fetchRecords() {
  loading.value = true;

  try {
    const query = buildQuery();
    const response = await activeConfig.value.loadRecords(query, filterModel.value);
    assertSuccessResponse(response);
    const parsed = parseResponseRecords(response);

    records.value = parsed.records;
    total.value = parsed.total;
    selectRecord(records.value[0] || null, 0);
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectRecord(null, 0);
    toastError(error, "数据加载失败");
  } finally {
    loading.value = false;
  }
}

function parseResponseRecords(response: ApiResponseLike) {
  const data = response?.data;
  if (Array.isArray(data)) {
    const parsedRecords = parseListResponse(response);
    return {
      records: parsedRecords,
      total: parsedRecords.length,
    };
  }

  return parsePageResponse(response);
}

function buildQuery() {
  return removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    sortOrder: "desc",
    sortField: "createdAt",
    ...filterModel.value,
  });
}

function searchRecords() {
  pagination.pageNum = 1;
  void fetchRecords();
}

function resetFilters() {
  Object.keys(filterModel.value).forEach((key) => {
    filterModel.value[key] = "";
  });
  searchRecords();
}

function handleFilterSelectChange(key: string, options: SelectOption[], event: { detail: { value: number } }) {
  filterModel.value[key] = options[event.detail.value]?.value || "";
}

function getFilterOptionLabel(field: FieldConfig) {
  return field.options?.find((item) => item.value === filterModel.value[field.key])?.label || "全部";
}

function getDateTimeDefaultTime(key: string) {
  return key === "endTime" ? "23:59:59" : "00:00:00";
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchRecords();
}

async function selectRecord(item: RecordLike | null, index: number) {
  selectedRecord.value = item;
  selectedKey.value = item ? getRowKey(item, index) : "";
  fillForm(item);

  const id = getId(item);
  if (!id || !activeConfig.value.getDetail) {
    return;
  }

  try {
    const response = await activeConfig.value.getDetail(id);
    assertSuccessResponse(response);
    if (isObject(response.data)) {
      selectedRecord.value = response.data;
      fillForm(response.data);
    }
  } catch {
    // 详情接口失败时保留列表行，避免影响主表查看。
  }
}

function fillForm(item: RecordLike | null) {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key];
  });

  for (const field of activeConfig.value.formFields || []) {
    const value = item ? getValue(item, [field.key]) : undefined;
    if (field.type === "boolean") {
      formModel[field.key] = value === undefined ? true : Boolean(value);
    } else {
      formModel[field.key] = value === undefined || value === null ? "" : String(value);
    }
  }
}

function startCreate() {
  selectedRecord.value = null;
  selectedKey.value = "";
  fillForm(null);
}

async function saveRecord() {
  const config = activeConfig.value;
  if (!config.createRecord || !config.formFields?.length) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  submitting.value = true;

  try {
    const id = getId(selectedRecord.value);
    const payload = buildPayload(config.formFields);
    const response = id && config.updateRecord ? await config.updateRecord(id, payload) : await config.createRecord(payload);
    assertSuccessResponse(response);
    uni.showToast({ title: "保存成功", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "保存失败");
  } finally {
    submitting.value = false;
  }
}

async function deleteSelectedRecord() {
  const id = getId(selectedRecord.value);
  if (!id || !activeConfig.value.deleteRecord) {
    return;
  }

  submitting.value = true;

  try {
    const response = await activeConfig.value.deleteRecord(id);
    assertSuccessResponse(response);
    uni.showToast({ title: "删除成功", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "删除失败");
  } finally {
    submitting.value = false;
  }
}

async function saveCurrentFieldList() {
  if (activeConfig.value.key !== "field" || records.value.length === 0) {
    uni.showToast({ title: "暂无字段可保存", icon: "none" });
    return;
  }

  submitting.value = true;

  try {
    const response = await batchSaveProtocolFields(records.value);
    assertSuccessResponse(response);
    uni.showToast({ title: "批量保存成功", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "批量保存失败");
  } finally {
    submitting.value = false;
  }
}

function validateForm() {
  const missing = (activeConfig.value.formFields || []).find((field) => {
    return field.required && String(formModel[field.key] ?? "").trim() === "";
  });

  if (missing) {
    uni.showToast({ title: `请填写${missing.label}`, icon: "none" });
    return false;
  }

  return true;
}

function buildPayload(fields: FieldConfig[]) {
  const payload: RecordLike = {};

  for (const field of fields) {
    const value = formModel[field.key];
    if (value === "" || value === undefined || value === null) {
      continue;
    }

    if (field.type === "number") {
      payload[field.key] = Number(value);
    } else {
      payload[field.key] = value;
    }
  }

  const id = getId(selectedRecord.value);
  if (id) {
    payload.id = id;
  }

  return payload;
}

function getFormInputValue(key: string) {
  return String(formModel[key] ?? "");
}

function handleFormInput(key: string, event: Event | { detail?: { value?: string | number } }) {
  if ("detail" in event && event.detail?.value !== undefined) {
    formModel[key] = event.detail.value;
    return;
  }

  const nativeEvent = event as Event;
  formModel[key] = (nativeEvent.target as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";
}

function handleBooleanChange(key: string, event: { detail: { value: number } }) {
  formModel[key] = booleanOptions[event.detail.value]?.value ?? true;
}

function getBooleanLabel(value: unknown) {
  return value === false || value === "false" ? "停用" : "启用";
}

function getColumnText(item: RecordLike, field: FieldConfig) {
  const value = getValue(item, [field.key]);

  if (field.type === "datetime") {
    return formatDateTime(String(value || "-"));
  }

  if (field.type === "json") {
    return value === undefined || value === null ? "-" : safeJsonStringify(value);
  }

  if (field.type === "status") {
    return getStatusLabel(value, field.key);
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  return getText(item, [field.key], "-");
}

function getStatusLabel(value: unknown, key: string) {
  if (key === "enabled" || key === "required") {
    return value === false || value === 0 ? "否" : "是";
  }

  if (key === "leakStatus") {
    return Number(value) === 1 ? "异常" : "正常";
  }

  const text = String(value ?? "");
  if (!text) {
    return "-";
  }

  if (text === "success" || text === "SUCCESS") {
    return "成功";
  }

  if (text === "failed" || text === "FAIL" || text === "ERROR") {
    return "失败";
  }

  return text;
}

function getStatusClass(item: RecordLike, field: FieldConfig) {
  const value = getValue(item, [field.key]);

  if (field.key === "enabled" || field.key === "required") {
    return value === false || value === 0 ? "status-pill--muted" : "status-pill--ok";
  }

  if (field.key === "leakStatus") {
    return Number(value) === 1 ? "status-pill--danger" : "status-pill--ok";
  }

  const text = String(value ?? "").toLowerCase();
  if (text.includes("fail") || text.includes("error")) {
    return "status-pill--danger";
  }

  return "status-pill--ok";
}

function safeJsonStringify(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getSelectedSummary() {
  if (!selectedRecord.value) {
    return "";
  }

  return (
    getText(selectedRecord.value, ["protocolName"]) ||
    getText(selectedRecord.value, ["fieldCnName"]) ||
    getText(selectedRecord.value, ["deviceNumber"]) ||
    getText(selectedRecord.value, ["traceId"]) ||
    `ID ${getId(selectedRecord.value)}`
  );
}

function getRowKey(item: RecordLike, index: number) {
  return String(getId(item) || getText(item, ["protocolCode", "traceId", "deviceNumber"]) || index);
}

function resetRuntimeState() {
  pagination.pageNum = 1;
  records.value = [];
  total.value = 0;
  selectRecord(null, 0);
}
</script>

<style scoped lang="scss">
.data-receive-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: var(--admin-page-padding, 14px);
  overflow: hidden;
  background: var(--admin-page-bg, #eef4f8);
}

.data-receive-tabs,
.data-toolbar,
.table-panel,
.detail-panel {
  background: var(--admin-surface-bg, #ffffff);
  border: 1px solid var(--admin-border-color, #dbe6ee);
  border-radius: var(--admin-radius, 6px);
  box-shadow: var(--admin-panel-shadow, 0 8px 18px rgba(40, 74, 104, 0.08));
}

.data-receive-tabs {
  display: flex;
  align-items: center;
  flex: none;
  gap: 4px;
  padding: 6px;
  margin-bottom: 12px;
}

.data-receive-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 112px;
  height: 34px;
  padding: 0 14px;
  color: var(--admin-text-muted, #5d7188);
  font-size: 14px;
  font-weight: 800;
  border-radius: 4px;
  cursor: pointer;
}

.data-receive-tab--active {
  color: #ffffff;
  background: var(--admin-primary, #0d82ee);
}

.data-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex: none;
  gap: 14px;
  margin-top: 12px;
  padding: 12px;
}

.data-toolbar__filters,
.data-toolbar__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 7px;
}

.filter-label,
.form-label {
  color: var(--admin-text-main, #34495e);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.filter-input,
.filter-select,
.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: var(--admin-text-strong, #172033);
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input,
.filter-select {
  width: 150px;
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.filter-select {
  background: #ffffff;
}

.filter-field :deep(.admin-datetime-picker) {
  width: 210px;
}

.data-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  flex: 1;
  gap: 14px;
  min-height: 0;
  margin-top: 14px;
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-head,
.detail-head,
.pagination-bar,
.detail-actions {
  display: flex;
  align-items: center;
  flex: none;
}

.table-head,
.detail-head {
  justify-content: space-between;
  gap: 12px;
  min-height: 54px;
  padding: 0 14px;
  border-bottom: 1px solid var(--admin-subtle-border, #edf3f8);
}

.table-title,
.detail-title {
  display: block;
  color: var(--admin-title-color, #183755);
  font-size: 16px;
  font-weight: 900;
}

.table-subtitle,
.detail-subtitle,
.table-count {
  color: var(--admin-muted-color, #73859a);
  font-size: 12px;
  font-weight: 600;
}

.table-subtitle,
.detail-subtitle {
  display: block;
  margin-top: 4px;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
}

.data-table {
  min-height: 100%;
}

.data-row {
  display: grid;
  min-height: 38px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 40px;
  color: #1b344d;
  font-weight: 900;
  background: #f3f8fd;
  cursor: default;
}

.data-row--active,
.data-row:not(.data-row--header):hover {
  background: #f4faff;
}

.data-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.table-state {
  height: 180px;
  color: var(--admin-muted-color, #7c8da1);
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.pagination-bar {
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid var(--admin-subtle-border, #edf3f8);
}

.toolbar-button,
.toolbar-icon-button,
.page-button,
.primary-button,
.secondary-button,
.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 800;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after,
.primary-button::after,
.secondary-button::after,
.danger-button::after {
  border: 0;
}

.toolbar-button--primary,
.primary-button {
  color: #ffffff;
  background: var(--admin-primary, #0d82ee);
  border-color: var(--admin-primary, #0d82ee);
}

.danger-button {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--hover,
.toolbar-icon-button--hover,
.page-button--hover,
.secondary-button--hover {
  color: var(--admin-primary, #0d82ee);
  background: #edf7ff;
  border-color: #a9d7ff;
}

.primary-button--hover,
.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.danger-button--hover {
  color: #ffffff;
  background: #d92d20;
  border-color: #d92d20;
}

.toolbar-icon-button {
  width: 34px;
  padding: 0;
}

.icon-refresh {
  position: relative;
  width: 16px;
  height: 16px;
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

.page-button[disabled],
.primary-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.detail-body {
  flex: 1;
  min-height: 0;
  padding: 14px;
}

.form-grid,
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-field {
  min-width: 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
}

.form-label--required::after {
  margin-left: 4px;
  color: #ef4444;
  content: "*";
}

.form-input,
.form-select {
  height: 36px;
  padding: 0 10px;
  line-height: 36px;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-textarea {
  height: 76px;
  padding: 8px 10px;
  line-height: 1.45;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.detail-item {
  padding: 10px 12px;
  background: #f7fbff;
  border: 1px solid #e4eef7;
  border-radius: 6px;
}

.detail-item__label {
  display: block;
  color: #6a7d90;
  font-size: 12px;
  font-weight: 800;
}

.detail-item__value {
  display: block;
  margin-top: 6px;
  color: #172033;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-all;
}

.detail-empty {
  height: 240px;
  color: #8a9aab;
  font-size: 14px;
  line-height: 240px;
  text-align: center;
}

.detail-actions {
  justify-content: flex-end;
  gap: 10px;
  height: 52px;
  padding: 0 14px;
  border-top: 1px solid var(--admin-subtle-border, #edf3f8);
}

.status-pill {
  font-weight: 900;
}

.status-pill--ok {
  color: #22a447;
}

.status-pill--danger {
  color: #ef4444;
}

.status-pill--muted {
  color: #708196;
}

.input-placeholder {
  color: #9aa9b8;
}

@media (max-width: 1280px) {
  .data-layout {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    min-height: 420px;
  }
}
</style>
