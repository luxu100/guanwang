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

    <view v-if="!isProtocolFieldEditor" class="data-toolbar">
      <view class="data-toolbar__filters">
        <view v-for="field in activeConfig.filters" :key="field.key" class="filter-field">
          <text class="filter-label">{{ field.label }}</text>
          <WorkOrderDatetimePicker
            v-if="field.type === 'datetime'"
            v-model="filterModel[field.key]"
            class="filter-datetime"
            :placeholder="field.key === 'endTime' ? '请选择结束时间' : '请选择开始时间'"
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
        <button class="toolbar-icon-button" :disabled="refreshing" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="handleRefresh">
          <svg class="icon-refresh" :class="{ 'icon-refresh--spinning': refreshing }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
        <button v-if="activeConfig.formFields?.length" class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="startCreate">
          {{ createActionText }}
        </button>
        <button v-if="activeConfig.key === 'field' && !isProtocolFieldEditor" class="toolbar-button" hover-class="toolbar-button--hover" @click="saveCurrentFieldList">
          批量保存
        </button>
      </view>
    </view>

    <view v-if="isProtocolFieldEditor" class="protocol-editor-card protocol-editor-card--standalone">
      <view class="protocol-editor-head">
        <view>
          <text class="protocol-editor-title">当前协议信息</text>
          <text class="protocol-editor-subtitle">保存时会同步更新协议信息和字段列表</text>
        </view>
        <view class="protocol-editor-actions">
          <button class="primary-button" hover-class="primary-button--hover" @click="addInlineFieldRecord">新增字段</button>
          <button class="secondary-button" hover-class="secondary-button--hover" @click="openProtocolTemplateImportDialog">导入模板</button>
          <button class="secondary-button" @click="openSaveProtocolTemplateDialog">保存模板</button>
          <button class="secondary-button" :disabled="importingProtocolJson" hover-class="secondary-button--hover" @click="openProtocolJsonDialog">
            {{ importingProtocolJson ? "导入中..." : "上传JSON" }}
          </button>
          <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="saveProtocolAndFields">
            {{ submitting ? "保存中..." : "保存全部" }}
          </button>
        </view>
      </view>
      <view class="protocol-editor-grid">
        <view class="form-field">
          <text class="form-label form-label--required">ID</text>
          <input v-model="fieldCommonForm.protocolId" class="form-input" type="number" />
        </view>

        <view class="form-field">
          <text class="form-label form-label--required">AFN</text>
          <input v-model="fieldCommonForm.afn" class="form-input" placeholder="请输入AFN" />
        </view>

        <view class="form-field">
          <text class="form-label form-label--required">任务类型</text>
          <picker :range="taskTypeOptions" range-key="label" @change="handleTaskTypeChange">
            <view class="form-select">
              <text>{{ getTaskTypeLabel(fieldCommonForm.taskType) }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>
        <view class="form-field">
          <text class="form-label form-label--required">协议编码</text>
          <input v-model="fieldProtocolForm.protocolCode" class="form-input" placeholder="请输入协议编码" placeholder-class="input-placeholder" />
        </view>
        <view class="form-field">
          <text class="form-label form-label--required">协议名称</text>
          <input v-model="fieldProtocolForm.protocolName" class="form-input" placeholder="请输入协议名称" placeholder-class="input-placeholder" />
        </view>
        <view class="form-field">
          <text class="form-label">协议版本</text>
          <input v-model="fieldProtocolForm.protocolVersion" class="form-input" placeholder="请输入协议版本" placeholder-class="input-placeholder" />
        </view>
        <view class="form-field">
          <text class="form-label">优先级</text>
          <input v-model="fieldProtocolForm.priority" class="form-input" type="number" placeholder="请输入优先级" placeholder-class="input-placeholder" />
        </view>
        <view class="form-field">
          <text class="form-label">启用状态</text>
          <picker :range="booleanOptions" range-key="label" @change="handleFieldProtocolEnabledChange">
            <view class="form-select">
              <text>{{ getBooleanLabel(fieldProtocolForm.enabled) }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>
        <view class="form-field form-field--wide">
          <text class="form-label">协议说明</text>
          <textarea
            v-model="fieldProtocolForm.description"
            class="form-textarea form-textarea--compact"
            placeholder="请输入协议说明"
            placeholder-class="input-placeholder"
          />
        </view>

        
      </view>
      </view>


        


    <view
      class="data-layout"
      :class="{
        'data-layout--field-editor': isProtocolFieldEditor,
        'data-layout--table-only': isTableOnly,
        'data-layout--parse': props.mode === 'parse' && !isProtocolFieldEditor,
      }"
    >
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
            <view class="data-row data-row--header">
              <view
                v-for="column in activeConfig.columns"
                :key="column.key"
                class="data-cell"
                :class="{ 'data-cell--actions': column.type === 'actions' }"
                :style="{ minWidth: getColumnMinWidth(column) }"
              >
                {{ column.label }}
              </view>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无数据</view>

            <view
              v-for="(item, index) in records"
              v-else
              :key="getRowKey(item, index)"
              class="data-row"
              :class="{ 'data-row--active': getRowKey(item, index) === selectedKey, 'data-row--dragging': draggingFieldIndex === index, 'data-row--drop-target': dropTargetFieldIndex === index }"
              :draggable="isProtocolFieldEditor && ENABLE_PROTOCOL_FIELD_REORDER"
              @dragstart="handleFieldDragStart(index)"
              @dragover.prevent="handleFieldDragOver(index)"
              @drop="handleFieldDrop(index)"
              @dragend="handleFieldDragEnd"
              @click="selectRecord(item, index)"
            >
              <view
                v-for="column in activeConfig.columns"
                :key="column.key"
                class="data-cell"
                :class="{ 'data-cell--actions': column.type === 'actions' }"
                :style="{ minWidth: getColumnMinWidth(column) }"
              >
                <view v-if="column.type === 'actions'" class="row-actions">
                  <template v-if="isProtocolFieldEditor">
                    <!-- <text class="row-action-link" @click.stop="moveFieldRecord(index, -1)">上移</text>
                    <text class="row-action-link" @click.stop="moveFieldRecord(index, 1)">下移</text> -->
                    <text class="row-action-link row-action-link--danger" @click.stop="deleteInlineFieldRecord(index)">删除</text>
                  </template>
                  <text v-else-if="activeConfig.key === 'protocol'" class="row-action-link" @click.stop="openProtocolFieldEditor(item, index)">编辑字段</text>
                  <text v-else class="row-action-link" @click.stop="editTableRecord(item, index)">编辑</text>
                  <text v-if="!isProtocolFieldEditor && activeConfig.deleteRecord" class="row-action-link row-action-link--danger" @click.stop="deleteTableRecord(item)">删除</text>
                </view>
                <template v-else-if="isProtocolFieldEditor">
                  <picker v-if="isInlineBooleanField(column)" :range="booleanOptions" range-key="label" @change="handleInlineFieldBooleanChange(item, column.key, $event)">
                    <view class="table-select">{{ getBooleanLabel(getValue(item, [column.key])) }}</view>
                  </picker>
                  <input
                    v-else
                    class="table-input"
                    :type="isInlineNumberField(column) ? 'number' : 'text'"
                    :value="getInlineFieldValue(item, column.key)"
                    placeholder="-"
                    placeholder-class="input-placeholder"
                    :disabled="isLockedProtocolField(item)"
                    @input="!isLockedProtocolField(item) && handleInlineFieldInput(item, column.key, $event)"
                  />
                </template>
                <text v-else-if="column.type === 'status'" class="status-pill" :class="getStatusClass(item, column)">{{ getColumnText(item, column) }}</text>
                <text v-else>{{ getColumnText(item, column) }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <view class="page-size">
            <text class="page-info">每页</text>
            <input
              v-model="pageSizeInputValue"
              class="page-size-input"
              type="number"
              confirm-type="done"
              @blur="commitPageSizeInput"
              @confirm="commitPageSizeInput"
            />
            <text class="page-info">条</text>
          </view>
          <button class="page-button" :disabled="pagination.pageNum <= 1" hover-class="page-button--hover" @click="changePage(-1)">上一页</button>
          <view class="page-jump">
            <text class="page-info">第</text>
            <input
              v-model="pageInputValue"
              class="page-input"
              type="number"
              @blur="commitPageInput"
              @confirm="commitPageInput"
            />
            <text class="page-info">/ {{ totalPages }} 页</text>
          </view>
          <button class="page-button" :disabled="pagination.pageNum >= totalPages" hover-class="page-button--hover" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <view v-if="!isProtocolFieldEditor && !isTableOnly" class="detail-panel">
        <view class="detail-head">
          <text class="detail-title">{{ activeConfig.formFields?.length ? "编辑信息" : "详情信息" }}</text>
          <text class="detail-subtitle">{{ selectedRecord ? getSelectedSummary() : "请选择左侧记录" }}</text>
        </view>

        <scroll-view class="detail-body" scroll-y>
          <view
            v-if="activeConfig.formFields?.length"
            class="form-grid"
            :class="{ 'form-grid--two-column': activeConfig.key === 'protocol' || props.mode === 'parse' }"
          >
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
              <picker v-else-if="field.type === 'select'" :range="field.options || []" range-key="label" @change="handleFormSelectChange(field, $event)">
                <view class="form-select">
                  <text>{{ getFieldOptionLabel(field, formModel[field.key]) }}</text>
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
            <view
              v-for="field in activeConfig.detailFields"
              :key="field.key"
              class="detail-item"
              :class="{ 'detail-item--wide': field.type === 'json' }"
            >
              <text class="detail-item__label">{{ field.label }}</text>
              <text class="detail-item__value">{{ getColumnText(selectedRecord, field) }}</text>
            </view>
          </view>

          <view v-else class="detail-empty">暂无选中数据</view>
        </scroll-view>

        <view v-if="activeConfig.formFields?.length" class="detail-actions">
          <button class="secondary-button" hover-class="secondary-button--hover" @click="startCreate">清空</button>
          <button v-if="activeConfig.key === 'protocol' && !selectedRecord" class="secondary-button" hover-class="secondary-button--hover" @click="openProtocolTemplateImportDialog">导入模板</button>
          <button v-if="selectedRecord && activeConfig.deleteRecord" class="danger-button" hover-class="danger-button--hover" @click="deleteSelectedRecord">删除</button>
          <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="saveRecord">
            {{ submitting ? "保存中..." : "保存" }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="showProtocolJsonDialog" class="modal-mask" @click.self="closeProtocolJsonDialog">
      <view class="modal-panel">
        <view class="modal-head">
          <text>上传协议JSON</text>
          <text class="modal-close" @click="closeProtocolJsonDialog">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-tip">JSON 可包含协议基础信息和 fields 字段数组，导入后会保存到当前协议。</text>
          <input
            ref="protocolJsonDialogInputRef"
            class="json-upload-input"
            type="file"
            accept=".json,application/json"
            @change="handleProtocolJsonDialogFileChange"
          />
          <button class="primary-button modal-upload-button" :disabled="importingProtocolJson" hover-class="primary-button--hover" @click="triggerProtocolJsonDialogUpload">
            {{ importingProtocolJson ? "导入中..." : "选择JSON文件" }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="showProtocolTemplateSaveDialog" class="modal-mask" @click.self="closeSaveProtocolTemplateDialog">
      <view class="modal-panel">
        <view class="modal-head">
          <text>保存字段模板</text>
          <text class="modal-close" @click="closeSaveProtocolTemplateDialog">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-tip">模板只保存字段定义，后续新增协议时可以重新指定协议ID、AFN和任务类型。</text>
          <view class="form-field">
            <text class="form-label form-label--required">模板名称</text>
            <input v-model="protocolTemplateNameInput" class="form-input" placeholder="请输入模板名称" placeholder-class="input-placeholder" />
          </view>
          <view class="modal-actions">
            <button class="secondary-button" hover-class="secondary-button--hover" @click="closeSaveProtocolTemplateDialog">取消</button>
            <button class="primary-button" hover-class="primary-button--hover" @click="saveProtocolFieldTemplate">保存模板</button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showProtocolTemplateImportDialog" class="modal-mask" @click.self="closeProtocolTemplateImportDialog">
      <view class="modal-panel modal-panel--wide">
        <view class="modal-head">
          <text>导入字段模板到新协议</text>
          <text class="modal-close" @click="closeProtocolTemplateImportDialog">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-tip">请先在新增协议表单中填写协议编码和协议名称，再在这里指定新协议的字段绑定信息。</text>
          <view class="modal-form-grid">
            <view class="form-field">
              <text class="form-label form-label--required">新协议ID</text>
              <input v-model="protocolTemplateImportForm.protocolId" class="form-input" type="number" placeholder="如 9001" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label form-label--required">AFN</text>
              <input v-model="protocolTemplateImportForm.afn" class="form-input" placeholder="请输入AFN" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label form-label--required">任务类型</text>
              <picker :range="taskTypeOptions" range-key="label" @change="handleTemplateImportTaskTypeChange">
                <view class="form-select">
                  <text>{{ getTaskTypeLabel(protocolTemplateImportForm.taskType) }}</text>
                  <text class="select-arrow"></text>
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="form-label form-label--required">字段模板</text>
              <view class="template-select-row">
                <picker class="template-select-row__picker" :range="protocolFieldTemplates" range-key="name" @change="handleProtocolTemplateSelectChange">
                  <view class="form-select">
                    <text>{{ selectedProtocolTemplateName }}</text>
                    <text class="select-arrow"></text>
                  </view>
                </picker>
                <button class="danger-button template-delete-button" hover-class="danger-button--hover" @click="deleteSelectedProtocolTemplate">删除</button>
              </view>
            </view>
          </view>
          <view class="modal-actions">
            <button class="secondary-button" hover-class="secondary-button--hover" @click="closeProtocolTemplateImportDialog">取消</button>
            <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="importProtocolFieldTemplateToNewProtocol">
              {{ submitting ? "导入中..." : "导入模板" }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import {
  createDeviceProtocolRelation,
  createProtocolDefinition,
  deleteDeviceProtocolRelation,
  deleteProtocolDefinition,
  getDeviceProtocolRelationDetail,
  getDeviceProtocolRelationPage,
  getProtocolDefinitionDetail,
  getProtocolDefinitionList,
  getProtocolDefinitionPage,
  updateDeviceProtocolRelation,
  updateProtocolDefinition,
} from "@/services/data-receive/access";
import { getDeviceList } from "@/services/device/info";
import {
  batchSaveProtocolFields,
  createProtocolField,
  deleteProtocolField,
  getProtocolFieldFormats,
  getProtocolFieldDetail,
  getProtocolFieldPage,
  getProtocolParseRecordPage,
  type ProtocolFieldDefinition,
  updateProtocolField,
} from "@/services/data-receive/parse";
import {
  getAlgorithmResultDetail,
  getAlgorithmResultPage,
} from "@/services/data-receive/algorithm";
import {
  getSamplingCssDataPage,
  getSamplingDailyPage,
  getSamplingDetailPage,
  getSamplingPressurePage,
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
import { confirmAction, confirmDangerAction } from "@/utils/confirmAction";

type DataReceiveMode = "access" | "parse" | "record";
type FieldType = "text" | "number" | "textarea" | "boolean" | "datetime" | "status" | "json" | "select" | "actions";
type SectionKey =
  | "protocol"
  | "relation"
  | "field"
  | "parseRecord"
  | "algorithmResult"
  | "samplingRecord"
  | "samplingDetail"
  | "samplingDaily"
  | "samplingPressure"
  | "samplingCss";
type FormValue = string | number | boolean;
type ProtocolImportResult = {
  protocols: RecordLike[];
  fields: RecordLike[];
};
type SelectOption = {
  label: string;
  value: string;
};
type FieldFormatOption = SelectOption & {
  outputType?: string;
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
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
];
const leakStatusOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "正常", value: "0" },
  { label: "异常", value: "1" },
];
const inlineNumberFieldKeys = new Set(["protocolId", "startPosition", "fieldLength", "sortOrder"]);
const inlineBooleanFieldKeys = new Set(["required", "enabled"]);

const baseTimeFilters: FieldConfig[] = [
  { key: "startTime", label: "开始时间", type: "datetime" },
  { key: "endTime", label: "结束时间", type: "datetime" },
];

const sectionConfigs: Record<SectionKey, SectionConfig> = {
  protocol: {
    key: "protocol",
    mode: "access",
    title: "协议管理",
    description: "维护动态协议、端口标识、字段配置和启用状态",
    columns: [
      { key: "protocolName", label: "协议名称", width: 180 },
      { key: "id", label: "ID", width: 100 },
      { key: "enabled", label: "状态", type: "status", width: 100 },
      { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
      { key: "actions", label: "操作", type: "actions", width: 170 },
    ],
    detailFields: [],
    filters: baseTimeFilters,
    formFields: [
      { key: "protocolCode", label: "协议编码", required: true },
      { key: "protocolName", label: "协议名称", required: true },
      { key: "id", label: "ID", type: "number", placeholder: "如 9001" },
      { key: "protocolVersion", label: "协议版本" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "enabled", label: "状态", type: "boolean" },
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
      { key: "deviceNumber", label: "设备编号", width: 140 },
      { key: "protocolName", label: "协议名称", width: 160 },
      { key: "afn", label: "AFN", width: 100 },
      { key: "taskType", label: "任务类型", width: 120 },
      { key: "contentPrefix", label: "内容前缀", width: 140 },
      { key: "priority", label: "优先级", width: 90 },
      { key: "enabled", label: "状态", type: "status", width: 90 },
      { key: "updatedAt", label: "更新时间", type: "datetime", width: 170 },
    ],
    detailFields: [],
    filters: [
      { key: "deviceNumber", label: "设备编号" },
      ...baseTimeFilters,
    ],
    formFields: [
      { key: "deviceNumber", label: "设备编号", required: true },
      { key: "protocolId", label: "协议ID", type: "number", required: true },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "contentPrefix", label: "内容前缀" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "enabled", label: "启用状态", type: "boolean" },
    ],
    loadRecords: (query) => getDeviceProtocolRelationPage(query),
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
      { key: "fieldName", label: "字段名", width: 140 },
      { key: "fieldCnName", label: "中文名", width: 140 },
      // { key: "startPosition", label: "起始", width: 80 },
      { key: "fieldLength", label: "长度", width: 80 },
      { key: "format", label: "格式", width: 100 },
      { key: "outputType", label: "输出类型", width: 110 },
      { key: "unit", label: "单位", width: 90 },
      { key: "required", label: "必填", type: "status", width: 80 },
      { key: "enabled", label: "状态", type: "status", width: 80 },
      { key: "actions", label: "操作", type: "actions", width: 170 },
    ],
    detailFields: [],
    filters: [
      { key: "protocolName", label: "协议名称" },
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
    loadRecords: (query, filters) => getProtocolFieldPage({
      ...query,
      protocolId: filters.protocolId || undefined,
    }),
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
      { key: "deviceNumber", label: "设备编号", width: 130 },
      { key: "parseStatus", label: "状态", type: "status", width: 100 },
      { key: "parseTime", label: "解析时间", type: "datetime", width: 170 },
      { key: "protocolName", label: "协议名称", width: 140 },
      { key: "taskTypeName", label: "任务名称", width: 130 },
    ],
    detailFields: [
      { key: "traceId", label: "追踪ID" },
      { key: "channel", label: "通道" },
      { key: "protocolCode", label: "协议编码" },
      { key: "protocolVersion", label: "协议版本" },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "commandGroup", label: "指令组" },
      { key: "frameCount", label: "帧数" },
      { key: "fieldCount", label: "字段数" },
      { key: "contentBytes", label: "内容字节" },
      { key: "errorMessage", label: "错误信息" },
      { key: "values", label: "解析值", type: "json" },
    ],
    filters: [
      { key: "deviceNumber", label: "设备编号" },
      { key: "protocolName", label: "协议名称" },
      { key: "afn", label: "AFN" },
      { key: "taskType", label: "任务类型" },
      { key: "contentPrefix", label: "内容前缀" },
      { key: "parseStatus", label: "解析状态", type: "select", options: parseStatusOptions },
      ...baseTimeFilters,
    ],
    loadRecords: (query) => getProtocolParseRecordPage(query),
  },
  algorithmResult: {
    key: "algorithmResult",
    mode: "parse",
    title: "算法分析",
    description: "查询算法输出结果、音频关联信息和多组信号处理结论",
    columns: [
      { key: "deviceName", label: "设备名称", width: 150 },
      { key: "samplingName", label: "采样名称", width: 150 },
      { key: "audioTime", label: "音频时间", type: "datetime", width: 170 },
      { key: "signalprocessingResult", label: "算法结果", width: 180 },
      { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
    ],
    detailFields: [
      { key: "id", label: "记录ID" },
      { key: "deviceId", label: "设备ID" },
      { key: "deviceNumber", label: "设备编号" },
      { key: "samplingId", label: "采样ID" },
      { key: "audioFileId", label: "音频文件ID" },
      { key: "signalprocessingResult1", label: "结果1" },
      { key: "signalprocessingResult2", label: "结果2" },
      { key: "signalprocessingResult3", label: "结果3" },
    ],
    filters: [
      { key: "deviceNumber", label: "设备编号" },
      ...baseTimeFilters,
    ],
    loadRecords: (query) => getAlgorithmResultPage(query),
    getDetail: (id) => getAlgorithmResultDetail(id),
  },
  samplingRecord: createRecordSection("samplingRecord", "record", "采样记录", "查询设备采样主记录和渗漏判断结果", getSamplingRecordPage, [
    { key: "deviceName", label: "设备名称", width: 150 },
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
    { key: "tubeGroup", label: "管组" },
    { key: "leakStatus", label: "渗漏状态", type: "select", options: leakStatusOptions },
  ]),
  samplingDetail: createRecordSection("samplingDetail", "record", "采样明细", "查询采样子序号和各项渗漏指标", getSamplingDetailPage, [
    { key: "samplingName", label: "采样名称", width: 150 },
    { key: "deviceName", label: "设备名称", width: 150 },
    { key: "orderNumber", label: "序号", width: 80 },
    { key: "leakEsa", label: "ESA", width: 100 },
    { key: "leakIntensity", label: "强度", width: 100 },
    { key: "leakFrequency", label: "频率", width: 100 },
    { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
    { key: "samplingName", label: "采样名称" },
  ]),
  samplingDaily: createRecordSection("samplingDaily", "record", "采样日报", "查询日维度渗漏属性、状态和采样位置", getSamplingDailyPage, [
    { key: "deviceName", label: "设备名称", width: 150 },
    { key: "leakProperty", label: "渗漏属性", width: 100 },
    { key: "leakStatus", label: "渗漏状态", type: "status", width: 100 },
    { key: "samplingTime", label: "采样时间", type: "datetime", width: 170 },
    { key: "samplingAddress", label: "采样地址", width: 240 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
    { key: "leakStatus", label: "渗漏状态", type: "select", options: leakStatusOptions },
  ]),
  samplingPressure: createRecordSection("samplingPressure", "record", "采样压力", "查询压力文件、压力时间和采集位置", getSamplingPressurePage, [
    { key: "deviceName", label: "设备名称", width: 150 },
    { key: "pressureFileId", label: "压力文件ID", width: 130 },
    { key: "pressureTime", label: "压力时间", type: "datetime", width: 170 },
    { key: "pressureAddress", label: "压力地址", width: 240 },
    { key: "createdAt", label: "创建时间", type: "datetime", width: 170 },
  ], [
    { key: "deviceNumber", label: "设备编号" },
  ]),
  samplingCss: createRecordSection("samplingCss", "record", "CSS采样数据", "查询井内温压、电池和分析结论", getSamplingCssDataPage, [
    { key: "deviceName", label: "设备名称", width: 150 },
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
    { key: "deviceNumber", label: "设备编号" },
  ]),
};

const modeSectionKeys: Record<DataReceiveMode, SectionKey[]> = {
  access: ["protocol", "relation"],
  parse: ["parseRecord", "algorithmResult"],
  record: ["samplingRecord", "samplingDetail", "samplingDaily", "samplingPressure", "samplingCss"],
};


const activeSectionKey = ref<SectionKey>(modeSectionKeys[props.mode][0]);
const records = ref<RecordLike[]>([]);
const selectedRecord = ref<RecordLike | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const submitting = ref(false);
const importingProtocolJson = ref(false);
const ENABLE_PROTOCOL_FIELD_REORDER = false;
const protocolJsonDialogInputRef = ref<HTMLInputElement | null>(null);
const showProtocolJsonDialog = ref(false);
const showProtocolTemplateSaveDialog = ref(false);
const showProtocolTemplateImportDialog = ref(false);
const activeFieldProtocol = ref<RecordLike | null>(null);
const draggingFieldIndex = ref<number | null>(null);
const dropTargetFieldIndex = ref<number | null>(null);
const fieldRecordBaselines = ref(new Map<string, string>());
const PROTOCOL_FIELD_TEMPLATE_STORAGE_KEY = "protocolFieldTemplates";
const taskTypeOptions = [
  { label: "TASK_1", value: "TASK_1" },
  { label: "TASK_2", value: "TASK_2" },
  { label: "TASK_3", value: "TASK_3" },
  { label: "TASK_4", value: "TASK_4" },
  { label: "TASK_5", value: "TASK_5" },
];
type ProtocolFieldTemplate = {
  id: string;
  name: string;
  createdAt: string;
  common?: RecordLike;
  fields?: RecordLike[];
};
const protocolFieldTemplates = ref<ProtocolFieldTemplate[]>([]);
const protocolTemplateNameInput = ref("");
const protocolTemplateImportForm = reactive({
  protocolId: "",
  afn: "",
  taskType: "TASK_1",
  templateId: "",
});
const fieldCommonForm = reactive({
  protocolId: "",
  afn: "",
  taskType: "TASK_1",
});
const fieldProtocolForm = reactive({
  id: "",
  protocolCode: "",
  protocolName: "",
  protocolVersion: "",
  priority: "",
  enabled: true,
  description: "",
});
const protocolFieldFormatOptions = ref<FieldFormatOption[]>([]);
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});
const pageInputValue = ref("1");
const pageSizeInputValue = ref("10");
const filterState = reactive<Record<SectionKey, Record<string, string>>>(createInitialFilterState());
const formModel = reactive<Record<string, FormValue>>({});
const deviceNameById = ref(new Map<string, string>());
const protocolNameById = ref(new Map<string, string>());

const modeSections = computed(() => modeSectionKeys[props.mode].map((key) => sectionConfigs[key]));
const activeConfig = computed(() => sectionConfigs[activeSectionKey.value]);
const filterModel = computed(() => filterState[activeSectionKey.value]);
const formatFieldConfig = computed(() => sectionConfigs.field.formFields?.find((field) => field.key === "format"));
const isProtocolFieldEditor = computed(() => activeConfig.value.key === "field" && Boolean(activeFieldProtocol.value));
const isTableOnly = computed(() => props.mode === "record");
const createActionText = computed(() => {
  if (isProtocolFieldEditor.value) {
    return "新增字段";
  }
  return activeConfig.value.key === "protocol" ? "新增协议" : "新增";
});
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));
const activeTableMinWidth = computed(() => `${activeConfig.value.columns.reduce((sum, column) => sum + (column.width || 120), 0)}px`);
const selectedProtocolTemplateName = computed(() => {
  const template = protocolFieldTemplates.value.find((item) => item.id === protocolTemplateImportForm.templateId);
  return template?.name || "请选择模板";
});
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

watch(
  () => pagination.pageNum,
  (pageNum) => {
    pageInputValue.value = String(pageNum);
  },
);

watch(
  () => pagination.pageSize,
  (pageSize) => {
    pageSizeInputValue.value = String(pageSize);
  },
);

onMounted(() => {
  loadProtocolFieldTemplates();
  void loadProtocolFieldFormats();
  void fetchRecords();
});

async function loadProtocolFieldFormats() {
  try {
    const response = await getProtocolFieldFormats() as ApiResponseLike;
    assertSuccessResponse(response);
    protocolFieldFormatOptions.value = parseListResponse(response)
      .reduce<FieldFormatOption[]>((options, item) => {
        const value = getText(item, ["code"], "");
        const name = getText(item, ["name"], value);
        const outputType = getText(item, ["outputType"], "");
        if (value) {
          options.push({ label: name && name !== value ? `${name}（${value}）` : value, value, outputType });
        }
        return options;
      }, []);

    if (formatFieldConfig.value) {
      formatFieldConfig.value.type = protocolFieldFormatOptions.value.length ? "select" : "text";
      formatFieldConfig.value.options = protocolFieldFormatOptions.value;
    }
  } catch {
    protocolFieldFormatOptions.value = [];
    if (formatFieldConfig.value) {
      formatFieldConfig.value.type = "text";
      formatFieldConfig.value.options = [];
    }
  }
}

function createRecordSection(
  key: SectionKey,
  mode: DataReceiveMode,
  title: string,
  description: string,
  loadRecords: (query: RecordLike) => Promise<ApiResponseLike>,
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
  if (key !== "field") {
    activeFieldProtocol.value = null;
    closeProtocolJsonDialog();
  }
}

async function fetchRecords() {
  loading.value = true;

  try {
    const query = buildQuery();
    const response = await activeConfig.value.loadRecords(query, filterModel.value);
    assertSuccessResponse(response);
    const parsed = parseResponseRecords(response);
    if (props.mode === "record" || activeConfig.value.key === "algorithmResult") {
      await ensureDeviceNameMap();
    }
    if (activeConfig.value.key === "relation") {
      await ensureProtocolNameMap();
    }

    records.value = isProtocolFieldEditor.value
      ? sortProtocolFieldRecords(parsed.records)
      : activeConfig.value.key === "relation"
        ? normalizeDeviceProtocolRelations(parsed.records)
        : props.mode === "record" || activeConfig.value.key === "algorithmResult"
          ? normalizeDeviceNameRecords(parsed.records)
          : parsed.records;
    total.value = parsed.total;
    if (isProtocolFieldEditor.value) {
      syncFieldCommonFormFromRecords(records.value);
      captureFieldRecordBaselines(records.value);
    } else {
      fieldRecordBaselines.value = new Map();
    }
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

function normalizeDeviceProtocolRelations(items: RecordLike[]) {
  return items.map((item) => ({
    ...item,
    deviceNumber: getText(item, ["deviceNumber", "device_number"], "-"),
    protocolName:
      getValue(item, ["protocolName"]) ??
      getValue(item, ["protocol", "protocolName"]) ??
      getValue(item, ["protocolDefinition", "protocolName"]) ??
      protocolNameById.value.get(String(getValue(item, ["protocolId"]) ?? "")) ??
      "-",
  }));
}

async function ensureDeviceNameMap() {
  if (deviceNameById.value.size > 0) {
    return;
  }

  try {
    const response = await getDeviceList();
    const devices = parseListResponse(response as ApiResponseLike);
    deviceNameById.value = new Map(
      devices
        .map((item) => {
          const id = getValue(item, ["id", "deviceId"]);
          const name = getText(item, ["deviceName", "deviceAlias", "deviceNumber"], "");
          return id !== undefined && id !== null && name ? [String(id), name] as const : null;
        })
        .filter((item): item is readonly [string, string] => Boolean(item)),
    );
  } catch {
    deviceNameById.value = new Map();
  }
}

async function ensureProtocolNameMap() {
  if (protocolNameById.value.size > 0) {
    return;
  }

  try {
    const response = await getProtocolDefinitionList();
    const protocols = parseListResponse(response as ApiResponseLike);
    protocolNameById.value = new Map(
      protocols
        .map((item) => {
          const id = getValue(item, ["id", "protocolId"]);
          const name = getText(item, ["protocolName", "protocolCode"], "");
          return id !== undefined && id !== null && name ? [String(id), name] as const : null;
        })
        .filter((item): item is readonly [string, string] => Boolean(item)),
    );
  } catch {
    protocolNameById.value = new Map();
  }
}

function normalizeDeviceNameRecords(items: RecordLike[]) {
  return items.map((item) => {
    const deviceId = String(getValue(item, ["deviceId"]) ?? "");
    const samplingId = getValue(item, ["samplingId"]);
    return {
      ...item,
      deviceName:
        getValue(item, ["deviceName", "deviceAlias"]) ??
        getValue(item, ["device", "deviceName"]) ??
        getValue(item, ["device", "deviceAlias"]) ??
        deviceNameById.value.get(deviceId) ??
        getValue(item, ["deviceNumber"]) ??
        getValue(item, ["deviceId"]),
      samplingName:
        getValue(item, ["samplingName", "samplingRecordName"]) ??
        getValue(item, ["samplingRecord", "samplingName"]) ??
        (samplingId === undefined || samplingId === null || samplingId === "" ? undefined : `采样 ${samplingId}`),
    };
  });
}

function buildQuery() {
  const query: RecordLike = {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    sortOrder: "desc",
    sortField: "createdAt",
    ...filterModel.value,
  };

  for (const field of activeConfig.value.filters) {
    if (field.type === "datetime" && query[field.key]) {
      query[field.key] = normalizeDateTimeForApi(String(query[field.key]));
    }
  }

  return removeEmptyFields(query);
}

function normalizeDateTimeForApi(value: string) {
  const text = value.trim();
  if (!text) {
    return "";
  }

  const normalized = text.replace(/\s+/, "T");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
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

function changePage(step: number) {
  jumpToPage(pagination.pageNum + step);
}

function commitPageInput() {
  const inputPage = Number(pageInputValue.value);
  if (!Number.isFinite(inputPage)) {
    pageInputValue.value = String(pagination.pageNum);
    return;
  }

  jumpToPage(inputPage);
}

function commitPageSizeInput() {
  const nextPageSize = normalizePageSize(pageSizeInputValue.value, pagination.pageSize);
  pageSizeInputValue.value = String(nextPageSize);
  if (nextPageSize === pagination.pageSize) {
    return;
  }

  pagination.pageSize = nextPageSize;
  pagination.pageNum = 1;
  pageInputValue.value = "1";
  void fetchRecords();
}

function normalizePageSize(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numberValue), 1), 500);
}

function jumpToPage(page: number) {
  const nextPage = Math.min(Math.max(Math.trunc(page), 1), totalPages.value);
  pageInputValue.value = String(nextPage);

  if (nextPage === pagination.pageNum) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchRecords();
}

async function selectRecord(item: RecordLike | null, index: number) {
  selectedRecord.value = item;
  const rowKey = item ? getRowKey(item, index) : "";
  selectedKey.value = rowKey;
  fillForm(item);

  if (isProtocolFieldEditor.value) {
    return;
  }

  if (isTableOnly.value) {
    return;
  }

  const id = getId(item);
  if (!id || !activeConfig.value.getDetail) {
    return;
  }

  try {
    const response = await activeConfig.value.getDetail(id);
    assertSuccessResponse(response);
    if (isObject(response.data) && selectedKey.value === rowKey) {
      const detailRecord = mergeSelectedRecord(item, response.data);
      selectedRecord.value = detailRecord;
      fillForm(detailRecord);
    }
  } catch {
    // 详情接口失败时保留列表行，避免影响主表查看。
  }
}

function mergeSelectedRecord(listRecord: RecordLike | null, detailRecord: RecordLike) {
  const merged = {
    ...(listRecord || {}),
    ...detailRecord,
  };

  if (activeConfig.value.key === "relation") {
    const deviceNumber =
      getValue(detailRecord, ["deviceNumber", "device_number"]) ??
      getValue(listRecord || {}, ["deviceNumber", "device_number"]);

    if (deviceNumber !== undefined && deviceNumber !== null && deviceNumber !== "") {
      merged.deviceNumber = deviceNumber;
    }
  }

  return merged;
}

function fillForm(item: RecordLike | null) {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key];
  });

  for (const field of activeConfig.value.formFields || []) {
    let value = item ? getValue(item, [field.key]) : undefined;
    if (activeConfig.value.key === "relation" && field.key === "deviceNumber" && (value === undefined || value === null || value === "")) {
      value = item ? getValue(item, ["device_number"]) : undefined;
    }
    if (activeConfig.value.key === "protocol" && field.key === "id" && (value === undefined || value === null || value === "")) {
      value = item ? getValue(item, ["port"]) : undefined;
    }
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

  const confirmed = await confirmDangerAction({
    title: "删除确认",
    content: "确定删除当前选中的记录吗？删除后数据可能无法恢复。",
  });
  if (!confirmed) {
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

function editTableRecord(item: RecordLike, index: number) {
  void selectRecord(item, index);
}

async function openProtocolFieldEditor(item: RecordLike, index: number) {
  const protocolId = getId(item);
  if (!protocolId) {
    uni.showToast({ title: "当前协议缺少端口号，无法编辑字段", icon: "none" });
    return;
  }

  await selectRecord(item, index);
  activeFieldProtocol.value = isObject(selectedRecord.value) ? selectedRecord.value : item;
  fillFieldProtocolForm(activeFieldProtocol.value);
  fillFieldCommonFormFromProtocol(activeFieldProtocol.value);
  activeSectionKey.value = "field";
  filterState.field.protocolId = String(protocolId);
  pagination.pageNum = 1;
  void fetchRecords();
}

function fillFieldProtocolForm(item: RecordLike | null) {
  const source = item || {};
  fieldProtocolForm.id = String(getValue(source, ["id"]) ?? getValue(source, ["port"]) ?? "");
  fieldProtocolForm.protocolCode = String(getValue(source, ["protocolCode"]) ?? "");
  fieldProtocolForm.protocolName = String(getValue(source, ["protocolName"]) ?? "");
  fieldProtocolForm.protocolVersion = String(getValue(source, ["protocolVersion"]) ?? "");
  fieldProtocolForm.priority = String(getValue(source, ["priority"]) ?? "");
  fieldProtocolForm.enabled = getValue(source, ["enabled"]) === false ? false : true;
  fieldProtocolForm.description = String(getValue(source, ["description"]) ?? "");
}

function fillFieldCommonFormFromProtocol(item: RecordLike | null) {
  const source = item || {};
  const protocolId = getValue(source, ["id"]) ?? getValue(source, ["port"]) ?? getId(source);
  fieldCommonForm.protocolId = protocolId === undefined || protocolId === null ? "" : String(protocolId);
  fieldCommonForm.afn = String(getValue(source, ["afn", "AFN"]) ?? fieldCommonForm.afn ?? "");
  fieldCommonForm.taskType = String(getValue(source, ["taskType", "typeCode"]) ?? fieldCommonForm.taskType ?? "TASK_1");
}

const LOCKED_PROTOCOL_FIELD_NAMES = new Set(["esaIntensityFrequency"]);

function isLockedProtocolField(item: RecordLike) {
  return LOCKED_PROTOCOL_FIELD_NAMES.has(String(getValue(item, ["fieldName"]) || ""));
}

function syncFieldCommonFormFromRecords(items: RecordLike[]) {
  const protocolId = getActiveFieldProtocolId();
  fieldCommonForm.protocolId = protocolId ? String(protocolId) : fieldCommonForm.protocolId;

  const firstField = items.find((item) => getValue(item, ["afn", "AFN"]) || getValue(item, ["taskType", "typeCode"]));
  if (!firstField) {
    return;
  }

  const afn = getValue(firstField, ["afn", "AFN"]);
  const taskType = getValue(firstField, ["taskType", "typeCode"]);
  if (afn !== undefined && afn !== null && afn !== "") {
    fieldCommonForm.afn = String(afn);
  }
  if (taskType !== undefined && taskType !== null && taskType !== "") {
    fieldCommonForm.taskType = String(taskType);
  }
}

function handleFieldProtocolEnabledChange(event: { detail: { value: number } }) {
  fieldProtocolForm.enabled = Boolean(booleanOptions[event.detail.value]?.value ?? true);
}

function getActiveFieldProtocolId() {
  return fieldCommonForm.protocolId || fieldProtocolForm.id || getId(activeFieldProtocol.value);
}

function buildActiveFieldProtocolPayload() {
  return removeEmptyFields({
    id: normalizeImportNumber(fieldCommonForm.protocolId || fieldProtocolForm.id),
    protocolCode: fieldProtocolForm.protocolCode.trim(),
    protocolName: fieldProtocolForm.protocolName.trim(),
    protocolVersion: fieldProtocolForm.protocolVersion.trim(),
    priority: normalizeImportNumber(fieldProtocolForm.priority),
    enabled: fieldProtocolForm.enabled,
    description: fieldProtocolForm.description.trim(),
  });
}

async function saveProtocolAndFields() {
  const originalId = getId(activeFieldProtocol.value);
  const formId = getActiveFieldProtocolId();

  if (!formId) {
    uni.showToast({ title: "请填写ID", icon: "none" });
    return;
  }

  if (!fieldProtocolForm.protocolCode.trim() || !fieldProtocolForm.protocolName.trim()) {
    uni.showToast({ title: "请填写协议编码和协议名称", icon: "none" });
    return;
  }

  const confirmed = await confirmAction({
    title: "保存协议和字段",
    content: "保存后会同步更新当前协议信息和已修改字段，确定继续吗？",
    confirmText: "保存",
  });
  if (!confirmed) {
    return;
  }

  submitting.value = true;

  try {
    const protocolPayload = buildActiveFieldProtocolPayload();
    const targetId = originalId || formId;
    const protocolResponse = await updateProtocolDefinition(targetId, protocolPayload);
    assertSuccessResponse(protocolResponse);

    const payloadProtocolId = protocolPayload.id;
    const nextProtocolId = typeof payloadProtocolId === "string" || typeof payloadProtocolId === "number" ? payloadProtocolId : targetId;
    const fieldPayload = buildChangedFieldRecordsPayload(nextProtocolId);
    if (fieldPayload.length > 0) {
      await saveProtocolFieldRecordsIndividually(fieldPayload);
    }

    activeFieldProtocol.value = { ...(activeFieldProtocol.value || {}), ...protocolPayload };
    fillFieldProtocolForm(activeFieldProtocol.value);
    filterState.field.protocolId = String(nextProtocolId);
    uni.showToast({ title: "协议和字段保存成功", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "保存全部失败");
  } finally {
    submitting.value = false;
  }
}

async function deleteTableRecord(item: RecordLike) {
  const id = getId(item);
  if (!id || !activeConfig.value.deleteRecord) {
    return;
  }

  const confirmed = await confirmDangerAction({
    title: "删除确认",
    content: "确定删除这条记录吗？删除后数据可能无法恢复。",
  });
  if (!confirmed) {
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

  const confirmed = await confirmAction({
    title: "批量保存字段",
    content: "确定保存当前字段列表的变更吗？",
    confirmText: "保存",
  });
  if (!confirmed) {
    return;
  }

  submitting.value = true;

  try {
    const payload = buildChangedFieldRecordsPayload(getActiveFieldProtocolId());
    if (payload.length === 0) {
      uni.showToast({ title: "暂无字段变更可保存", icon: "none" });
      return;
    }

    await saveProtocolFieldRecordsIndividually(payload);
    uni.showToast({ title: "批量保存成功", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "批量保存失败");
  } finally {
    submitting.value = false;
  }
}

function getInlineFieldValue(item: RecordLike, key: string) {
  return String(getValue(item, [key]) ?? "");
}

function isInlineNumberField(field: FieldConfig) {
  return field.type === "number" || inlineNumberFieldKeys.has(field.key);
}

function isInlineBooleanField(field: FieldConfig) {
  return inlineBooleanFieldKeys.has(field.key);
}

function handleInlineFieldInput(item: RecordLike, key: string, event: Event | { detail?: { value?: string | number } }) {
  let value: string | number = "";
  if ("detail" in event && event.detail?.value !== undefined) {
    value = event.detail.value;
  } else {
    const target = (event as Event).target;
    value = target instanceof HTMLInputElement ? target.value : "";
  }
  item[key] = inlineNumberFieldKeys.has(key) && value !== "" ? Number(value) : value;
}

function handleInlineFieldBooleanChange(item: RecordLike, key: string, event: { detail: { value: number } }) {
  item[key] = Boolean(booleanOptions[event.detail.value]?.value ?? true);
}

function addInlineFieldRecord() {
  const protocolId = getActiveFieldProtocolId();
  if (!protocolId) {
    uni.showToast({ title: "请先填写端口号", icon: "none" });
    return;
  }

  const item: RecordLike = {
    protocolId: Number(protocolId),
    fieldName: "",
    fieldCnName: "",
    startPosition: 0,
    fieldLength: 1,
    format: "",
    outputType: "",
    unit: "",
    required: false,
    enabled: true,
    sortOrder: getNextFieldSortOrder(),
  };
  records.value.push(item);
  selectRecord(item, records.value.length - 1);
}

async function deleteInlineFieldRecord(index: number) {
  const confirmed = await confirmDangerAction({
    title: "删除字段",
    content: "确定删除当前字段行吗？未保存的字段会直接丢失。",
  });
  if (!confirmed) {
    return;
  }

  records.value.splice(index, 1);
  syncFieldSortOrder();
  selectRecord(records.value[Math.min(index, records.value.length - 1)] || null, Math.min(index, records.value.length - 1));
}

function moveFieldRecord(index: number, step: number) {
  const targetIndex = index + step;
  if (targetIndex < 0 || targetIndex >= records.value.length) {
    return;
  }

  const nextRecords = [...records.value];
  const [item] = nextRecords.splice(index, 1);
  nextRecords.splice(targetIndex, 0, item);
  records.value = nextRecords;
  syncFieldSortOrder();
  selectRecord(item, targetIndex);
}

function handleFieldDragStart(index: number) {
  if (!isProtocolFieldEditor.value) {
    return;
  }
  draggingFieldIndex.value = index;
}

function handleFieldDragOver(index: number) {
  if (draggingFieldIndex.value === null || draggingFieldIndex.value === index) {
    return;
  }
  dropTargetFieldIndex.value = index;
}

function handleFieldDrop(index: number) {
  const fromIndex = draggingFieldIndex.value;
  if (fromIndex === null || fromIndex === index) {
    handleFieldDragEnd();
    return;
  }

  const nextRecords = [...records.value];
  const [item] = nextRecords.splice(fromIndex, 1);
  nextRecords.splice(index, 0, item);
  records.value = nextRecords;
  syncFieldSortOrder();
  selectRecord(item, index);
  handleFieldDragEnd();
}

function handleFieldDragEnd() {
  draggingFieldIndex.value = null;
  dropTargetFieldIndex.value = null;
}

function syncFieldSortOrder() {
  records.value.forEach((item, index) => {
    item.sortOrder = (index + 1) * 10;
  });
}

function getNextFieldSortOrder() {
  const maxSortOrder = records.value.reduce((max, item) => {
    const sortOrder = normalizeInlineNumberValue(getValue(item, ["sortOrder"]));
    return sortOrder === undefined ? max : Math.max(max, sortOrder);
  }, 0);
  return maxSortOrder + 10;
}

function sortProtocolFieldRecords(items: RecordLike[]) {
  return [...items].sort((left, right) => {
    const leftSortOrder = normalizeInlineNumberValue(getValue(left, ["sortOrder"])) ?? Number.MAX_SAFE_INTEGER;
    const rightSortOrder = normalizeInlineNumberValue(getValue(right, ["sortOrder"])) ?? Number.MAX_SAFE_INTEGER;
    return leftSortOrder - rightSortOrder;
  });
}

function normalizeInlineNumberValue(value: unknown) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeFieldRecordForSave(item: RecordLike, protocolId: string | number | null | undefined) {
  const payload: RecordLike = { ...item };
  if (protocolId) {
    payload.protocolId = Number(protocolId);
  }
  
  payload.protocolId = Number(fieldCommonForm.protocolId || protocolId);
  payload.afn = fieldCommonForm.afn.trim();
  payload.taskType = fieldCommonForm.taskType;
  
  for (const key of inlineNumberFieldKeys) {
    payload[key] = normalizeInlineNumberValue(payload[key]);
  }
  payload.sortOrder = normalizeInlineNumberValue(getValue(item, ["sortOrder"]));
  return removeEmptyFields(payload);
}

function captureFieldRecordBaselines(items: RecordLike[]) {
  const protocolId = getActiveFieldProtocolId();
  fieldRecordBaselines.value = new Map(
    items
      .map((item) => {
        const id = getId(item);
        return id ? [String(id), JSON.stringify(normalizeFieldRecordForSave(item, protocolId))] : null;
      })
      .filter((item): item is [string, string] => Boolean(item)),
  );
}

function buildChangedFieldRecordsPayload(protocolId: string | number | null | undefined) {
  return records.value
    .map((item) => buildChangedFieldRecordPayload(item, protocolId))
    .filter((item): item is RecordLike => Boolean(item && (getValue(item, ["fieldName"]) || getValue(item, ["fieldCnName"]) || getValue(item, ["id"]))));
}

function buildChangedFieldRecordPayload(item: RecordLike, protocolId: string | number | null | undefined) {
  if (isLockedProtocolField(item)) {
    return null;
  }
  const normalized = normalizeFieldRecordForSave(item, protocolId);
  const id = getId(item);
  if (!id) {
    return normalized;
  }

  const baselineText = fieldRecordBaselines.value.get(String(id));
  if (!baselineText) {
    return normalized;
  }

  const baseline = JSON.parse(baselineText) as RecordLike;
  const changedKeys = Array.from(new Set([...Object.keys(normalized), ...Object.keys(baseline)]))
    .filter((key) => JSON.stringify(normalized[key]) !== JSON.stringify(baseline[key]));

  if (changedKeys.length === 0) {
    return null;
  }

  if (changedKeys.length === 1 && changedKeys[0] === "sortOrder") {
    return removeEmptyFields({
      id,
      protocolId: normalizeInlineNumberValue(getValue(normalized, ["protocolId"])),
      afn: getValue(normalized, ["afn"]),
      taskType: getValue(normalized, ["taskType"]),
      fieldName: getValue(normalized, ["fieldName"]),
      fieldCnName: getValue(normalized, ["fieldCnName"]),
      startPosition: normalizeInlineNumberValue(getValue(normalized, ["startPosition"])),
      fieldLength: normalizeInlineNumberValue(getValue(normalized, ["fieldLength"])),
      format: getValue(normalized, ["format"]),
      sortOrder: normalizeInlineNumberValue(getValue(item, ["sortOrder"])),
    });
  }

  return normalized;
}

function handleTaskTypeChange(event: { detail: { value: number } }) {
  const option = taskTypeOptions[event.detail.value];
  fieldCommonForm.taskType = option?.value || "TASK_1";
}

function getTaskTypeLabel(value: string) {
  const option = taskTypeOptions.find((item) => item.value === value);
  return option?.label || value || "TASK_1";
}

function getProtocolFieldTemplates() {
  const value = uni.getStorageSync(PROTOCOL_FIELD_TEMPLATE_STORAGE_KEY);
  return Array.isArray(value) ? value.filter(isObject) as ProtocolFieldTemplate[] : [];
}

function loadProtocolFieldTemplates() {
  protocolFieldTemplates.value = getProtocolFieldTemplates();
}

function buildTemplateFieldRecord(item: RecordLike) {
  return removeEmptyFields({
    taskTypeName: getValue(item, ["taskTypeName"]),
    contentPrefix: getValue(item, ["contentPrefix"]),
    fieldName: getValue(item, ["fieldName"]),
    fieldCnName: getValue(item, ["fieldCnName"]),
    startPosition: normalizeInlineNumberValue(getValue(item, ["startPosition"])),
    fieldLength: normalizeInlineNumberValue(getValue(item, ["fieldLength"])),
    positionUnit: getValue(item, ["positionUnit"]),
    format: getValue(item, ["format"]),
    scale: getValue(item, ["scale"]),
    outputType: getValue(item, ["outputType"]),
    unit: getValue(item, ["unit"]),
    required: getValue(item, ["required"]),
    enabled: getValue(item, ["enabled"]),
    defaultValue: getValue(item, ["defaultValue"]),
    invalidValues: getValue(item, ["invalidValues"]),
    enumMapping: getValue(item, ["enumMapping"]),
    description: getValue(item, ["description"]),
    sortOrder: normalizeInlineNumberValue(getValue(item, ["sortOrder"])),
  });
}

function openSaveProtocolTemplateDialog() {
  if (!records.value.length) {
    uni.showToast({ title: "暂无字段可保存为模板", icon: "none" });
    return;
  }

  protocolTemplateNameInput.value = fieldProtocolForm.protocolName ? `${fieldProtocolForm.protocolName}字段模板` : "";
  showProtocolTemplateSaveDialog.value = true;
}

function closeSaveProtocolTemplateDialog() {
  showProtocolTemplateSaveDialog.value = false;
  protocolTemplateNameInput.value = "";
}

function saveProtocolFieldTemplate() {
  const templateName = protocolTemplateNameInput.value.trim();
  if (!templateName) {
    uni.showToast({ title: "请输入模板名称", icon: "none" });
    return;
  }

  if (!records.value.length) {
    uni.showToast({ title: "暂无字段可保存为模板", icon: "none" });
    return;
  }

  const templates = getProtocolFieldTemplates();
  const template: ProtocolFieldTemplate = {
    id: `template_${Date.now()}`,
    name: templateName,
    createdAt: new Date().toISOString(),
    common: {
      afn: fieldCommonForm.afn,
      taskType: fieldCommonForm.taskType,
    },
    fields: records.value.map(buildTemplateFieldRecord),
  };

  uni.setStorageSync(PROTOCOL_FIELD_TEMPLATE_STORAGE_KEY, [...templates, template]);
  loadProtocolFieldTemplates();
  closeSaveProtocolTemplateDialog();
  uni.showToast({ title: "模板已保存", icon: "success" });
}

function openProtocolTemplateImportDialog() {
  loadProtocolFieldTemplates();
  if (!protocolFieldTemplates.value.length) {
    uni.showToast({ title: "暂无可导入模板", icon: "none" });
    return;
  }

  protocolTemplateImportForm.protocolId = String(formModel.id || "");
  protocolTemplateImportForm.afn = "";
  protocolTemplateImportForm.taskType = "TASK_1";
  protocolTemplateImportForm.templateId = protocolFieldTemplates.value[0]?.id || "";
  showProtocolTemplateImportDialog.value = true;
}

function closeProtocolTemplateImportDialog() {
  showProtocolTemplateImportDialog.value = false;
}

function handleTemplateImportTaskTypeChange(event: { detail: { value: number } }) {
  const option = taskTypeOptions[event.detail.value];
  protocolTemplateImportForm.taskType = option?.value || "TASK_1";
}

function handleProtocolTemplateSelectChange(event: { detail: { value: number } }) {
  protocolTemplateImportForm.templateId = protocolFieldTemplates.value[event.detail.value]?.id || "";
}

async function deleteSelectedProtocolTemplate() {
  const templateId = protocolTemplateImportForm.templateId;
  if (!templateId) {
    uni.showToast({ title: "请先选择模板", icon: "none" });
    return;
  }

  const confirmed = await confirmDangerAction({
    title: "删除字段模板",
    content: "确定删除当前字段模板吗？删除后只能重新保存生成。",
  });
  if (!confirmed) {
    return;
  }

  const nextTemplates = getProtocolFieldTemplates().filter((item) => item.id !== templateId);
  uni.setStorageSync(PROTOCOL_FIELD_TEMPLATE_STORAGE_KEY, nextTemplates);
  protocolFieldTemplates.value = nextTemplates;
  protocolTemplateImportForm.templateId = nextTemplates[0]?.id || "";
  uni.showToast({ title: "模板已删除", icon: "success" });

  if (!nextTemplates.length) {
    closeProtocolTemplateImportDialog();
  }
}

function buildProtocolFieldPayloadFromTemplate(
  field: RecordLike,
  options: {
    protocolId: string | number;
    afn: string;
    taskType: string;
    sortOrder: number;
  },
) {
  return removeEmptyFields({
    protocolId: options.protocolId,
    afn: options.afn,
    taskType: options.taskType,
    taskTypeName: getValue(field, ["taskTypeName"]),
    contentPrefix: getValue(field, ["contentPrefix"]),
    fieldName: getValue(field, ["fieldName"]),
    fieldCnName: getValue(field, ["fieldCnName"]),
    startPosition: normalizeInlineNumberValue(getValue(field, ["startPosition"])),
    fieldLength: normalizeInlineNumberValue(getValue(field, ["fieldLength"])),
    positionUnit: getValue(field, ["positionUnit"]),
    format: getValue(field, ["format"]),
    scale: getValue(field, ["scale"]),
    outputType: getValue(field, ["outputType"]),
    unit: getValue(field, ["unit"]),
    required: getValue(field, ["required"]),
    enabled: getValue(field, ["enabled"]),
    defaultValue: getValue(field, ["defaultValue"]),
    invalidValues: getValue(field, ["invalidValues"]),
    enumMapping: getValue(field, ["enumMapping"]),
    description: getValue(field, ["description"]),
    sortOrder: normalizeInlineNumberValue(getValue(field, ["sortOrder"])) ?? options.sortOrder,
  });
}

function getResponseDataId(response: ApiResponseLike) {
  return isObject(response.data) ? getId(response.data) : "";
}

async function importProtocolFieldTemplateToNewProtocol() {
  if (activeConfig.value.key !== "protocol") {
    return;
  }

  const protocolId = protocolTemplateImportForm.protocolId.trim();
  const afn = protocolTemplateImportForm.afn.trim();
  const taskType = protocolTemplateImportForm.taskType || "TASK_1";
  const template = protocolFieldTemplates.value.find((item) => item.id === protocolTemplateImportForm.templateId);

  if (!protocolId || !afn || !taskType || !template) {
    uni.showToast({ title: "请填写协议ID、AFN、任务类型并选择模板", icon: "none" });
    return;
  }

  formModel.id = protocolId;
  if (!validateForm()) {
    return;
  }

  const templateFields = Array.isArray(template.fields) ? template.fields.filter(isObject) : [];
  if (!templateFields.length) {
    uni.showToast({ title: "当前模板没有字段定义", icon: "none" });
    return;
  }

  const confirmed = await confirmAction({
    title: "导入字段模板",
    content: "导入会先创建新协议，再批量创建模板字段，确定继续吗？",
    confirmText: "导入",
  });
  if (!confirmed) {
    return;
  }

  submitting.value = true;
  try {
    const protocolPayload = buildPayload(sectionConfigs.protocol.formFields || []);
    const normalizedProtocolId = normalizeImportNumber(protocolId);
    protocolPayload.id = normalizedProtocolId ?? protocolId;
    protocolPayload.enabled = true;
    const protocolResponse = await createProtocolDefinition(protocolPayload);
    assertSuccessResponse(protocolResponse);
    const createdProtocolId = getResponseDataId(protocolResponse) || (isValidProtocolId(protocolPayload.id) ? protocolPayload.id : protocolId);

    const fieldPayloads = templateFields.map((field, index) =>
      buildProtocolFieldPayloadFromTemplate(field, {
        protocolId: createdProtocolId,
        afn,
        taskType,
        sortOrder: (index + 1) * 10,
      }),
    );
    const fieldResponse = await batchSaveProtocolFields(fieldPayloads as ProtocolFieldDefinition[]);
    assertSuccessResponse(fieldResponse);

    closeProtocolTemplateImportDialog();
    uni.showToast({ title: "模板已导入到新协议", icon: "success" });
    await fetchRecords();
  } catch (error) {
    toastError(error, "模板导入失败");
  } finally {
    submitting.value = false;
  }
}

async function saveProtocolFieldRecordsIndividually(payloads: RecordLike[]) {
  for (const payload of payloads) {
    const id = getId(payload);
    const response = id
      ? await updateProtocolField(id, payload as ProtocolFieldDefinition)
      : await createProtocolField(payload as ProtocolFieldDefinition);
    assertSuccessResponse(response);
  }
}

function openProtocolJsonDialog() {
  if (!activeFieldProtocol.value) {
    uni.showToast({ title: "请先从协议管理进入编辑字段", icon: "none" });
    return;
  }
  showProtocolJsonDialog.value = true;
}

function closeProtocolJsonDialog() {
  showProtocolJsonDialog.value = false;
}

async function triggerProtocolJsonDialogUpload() {
  if (importingProtocolJson.value) {
    return;
  }

  const confirmed = await confirmAction({
    title: "上传协议JSON",
    content: "JSON 内容会写入当前协议或创建字段，确定选择文件并继续吗？",
    confirmText: "选择文件",
  });
  if (!confirmed) {
    return;
  }

  protocolJsonDialogInputRef.value?.click();
}

function handleProtocolJsonDialogFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];

  if (!file) {
    return;
  }

  void importProtocolJsonFile(file, { targetProtocolId: getActiveFieldProtocolId() }).finally(() => {
    if (input) {
      input.value = "";
    }
  });
}

async function importProtocolJsonFile(file: File, options: { targetProtocolId?: string | number | null } = {}) {
  if (importingProtocolJson.value) {
    return;
  }

  importingProtocolJson.value = true;

  try {
    const text = await readTextFile(file);
    const parsed = JSON.parse(text) as unknown;
    const importResult = normalizeProtocolImportResult(parsed);
    const targetProtocolId = options.targetProtocolId;

    if (importResult.protocols.length === 0 && importResult.fields.length === 0) {
      uni.showToast({ title: "JSON中没有可导入的协议内容", icon: "none" });
      return;
    }

    let importedProtocols = 0;
    const collectedFields: RecordLike[] = [...importResult.fields];

    if (targetProtocolId) {
      const protocolSource = importResult.protocols[0] || (isObject(parsed) ? parsed : null);
      const nestedFields = protocolSource ? collectProtocolFields(protocolSource) : [];
      collectedFields.push(...nestedFields);

      if (protocolSource) {
        const payload = buildProtocolImportPayload(protocolSource);
        if (Object.keys(payload).length > 0) {
          const response = await updateProtocolDefinition(targetProtocolId, payload);
          assertSuccessResponse(response);
          importedProtocols = 1;
          activeFieldProtocol.value = { ...(activeFieldProtocol.value || {}), ...payload };
          fillFieldProtocolForm(activeFieldProtocol.value);
        }
      }
    } else {
      for (const protocol of importResult.protocols) {
        const nestedFields = collectProtocolFields(protocol);
        const payload = buildProtocolImportPayload(protocol);

        if (!payload.protocolCode && !payload.protocolName) {
          collectedFields.push(...nestedFields);
          continue;
        }

        const response = await createProtocolDefinition(payload);
        assertSuccessResponse(response);
        importedProtocols += 1;

        const createdId = getId(response.data as RecordLike) || getId(protocol);
        if (createdId) {
          collectedFields.push(...nestedFields.map((field) => ({ ...field, protocolId: getValue(field, ["protocolId"]) || createdId })));
        } else {
          collectedFields.push(...nestedFields);
        }
      }
    }

    const targetFieldProtocolId = getActiveFieldProtocolId();
    const normalizedFields = collectedFields
      .map(normalizeProtocolFieldImportPayload)
      .map((field) => (targetProtocolId ? { ...field, protocolId: field.protocolId || targetFieldProtocolId } : field))
      .filter((field) => Boolean(getFirstImportValue(field, ["fieldName", "name"])));

    if (normalizedFields.length > 0) {
      await saveProtocolFieldRecordsIndividually(normalizedFields);
    }

    uni.showToast({
      title: `导入成功：${importedProtocols}个协议${normalizedFields.length ? `，${normalizedFields.length}个字段` : ""}`,
      icon: "success",
    });
    closeProtocolJsonDialog();
    await fetchRecords();
  } catch (error) {
    toastError(error, "JSON导入失败");
  } finally {
    importingProtocolJson.value = false;
  }
}

function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("文件读取失败"));
    reader.readAsText(file, "utf-8");
  });
}

function normalizeProtocolImportResult(value: unknown): ProtocolImportResult {
  if (Array.isArray(value)) {
    return { protocols: value.filter(isObject), fields: [] };
  }

  if (!isObject(value)) {
    return { protocols: [], fields: [] };
  }

  const protocols = getFirstArray(value, ["protocols", "protocolDefinitions", "definitions", "items", "records"]);
  const fields = getFirstArray(value, ["fields", "protocolFields", "fieldDefinitions"]);

  if (protocols.length || fields.length) {
    return { protocols, fields };
  }

  return { protocols: [value], fields: [] };
}

function getFirstArray(source: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = getValue(source, [key]);
    if (Array.isArray(value)) {
      return value.filter(isObject);
    }
  }

  return [];
}

function collectProtocolFields(protocol: RecordLike) {
  return getFirstArray(protocol, ["fields", "protocolFields", "fieldDefinitions"]);
}

function buildProtocolImportPayload(protocol: RecordLike) {
  const protocolName = getFirstImportValue(protocol, ["protocolName", "name", "title"]);

  return removeEmptyFields({
    id: normalizeImportNumber(getFirstImportValue(protocol, ["id", "port", "portNumber", "listenPort"])),
    protocolCode: getFirstImportValue(protocol, ["protocolCode", "code", "protocolNo"]) || protocolName,
    protocolName,
    protocolVersion: getFirstImportValue(protocol, ["protocolVersion", "version"]),
    description: getFirstImportValue(protocol, ["description", "remark", "memo"]),
    enabled: normalizeImportBoolean(getFirstImportValue(protocol, ["enabled", "status", "enable", "isPortOpen", "openPortOnAdd"])),
    priority: normalizeImportNumber(getFirstImportValue(protocol, ["priority", "sortOrder", "sort"])),
  });
}

function normalizeProtocolFieldImportPayload(field: RecordLike) {
  const displayEnabled = normalizeImportBoolean(getFirstImportValue(field, ["enabled", "isDisplay", "display", "visible"]));
  const alertEnabled = normalizeImportBoolean(getFirstImportValue(field, ["isAlertField", "alertField"]));
  const correctedEnabled = normalizeImportBoolean(getFirstImportValue(field, ["isCorrectedField", "correctedField"]));

  return removeEmptyFields({
    protocolId: getFirstImportValue(field, ["protocolId"]),
    afn: getFirstImportValue(field, ["afn", "AFN"]),
    taskType: getFirstImportValue(field, ["taskType", "typeCode"]),
    fieldName: getFirstImportValue(field, ["fieldName", "name", "field"]),
    fieldCnName: getFirstImportValue(field, ["fieldCnName", "cnName", "label", "title", "name"]),
    startPosition: normalizeImportNumber(getFirstImportValue(field, ["startPosition", "startBit", "offset", "start"])),
    fieldLength: normalizeImportNumber(getFirstImportValue(field, ["fieldLength", "length", "len"])),
    format: getFirstImportValue(field, ["format", "dataType", "type"]),
    unit: getFirstImportValue(field, ["unit"]),
    outputType: getFirstImportValue(field, ["outputType", "output"]),
    required: normalizeImportBoolean(getFirstImportValue(field, ["required", "isRequired"])),
    enabled: displayEnabled,
    sortOrder: normalizeImportNumber(getFirstImportValue(field, ["sortOrder", "displayOrder", "order", "priority"])),
    description: getFirstImportValue(field, ["description", "remark", "memo"]),
    isDisplay: displayEnabled,
    isAlertField: alertEnabled,
    isCorrectedField: correctedEnabled,
  });
}

function getFirstImportValue(source: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = getValue(source, [key]);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function normalizeImportBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const text = String(value).trim().toLowerCase();
  if (["false", "0", "disabled", "disable", "停用", "否", "关闭", "已关闭", "close", "closed"].includes(text)) {
    return false;
  }

  return true;
}

function normalizeImportNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function isValidProtocolId(value: unknown): value is string | number {
  return (typeof value === "string" && value.trim() !== "") || typeof value === "number";
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
  if (id && payload.id === undefined) {
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

function handleFormSelectChange(field: FieldConfig, event: { detail: { value: number } }) {
  const option = field.options?.[event.detail.value];
  formModel[field.key] = option?.value || "";

  const outputType = (option as FieldFormatOption | undefined)?.outputType;
  if (field.key === "format" && outputType) {
    formModel.outputType = outputType;
  }
}

function getFieldOptionLabel(field: FieldConfig, value: unknown) {
  const option = field.options?.find((item) => String(item.value) === String(value ?? ""));
  return option?.label || String(value || field.placeholder || "请选择");
}

function getBooleanLabel(value: unknown) {
  if (activeConfig.value.key === "protocol") {
    return value === false || value === "false" ? "已关闭" : "已开启";
  }

  return value === false || value === "false" ? "停用" : "启用";
}

function getColumnText(item: RecordLike, field: FieldConfig) {
  let value = getValue(item, [field.key]);
  if (activeConfig.value.key === "protocol" && field.key === "id" && (value === undefined || value === null || value === "")) {
    value = getValue(item, ["port"]);
  }

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

function getColumnMinWidth(field: FieldConfig) {
  return `${field.width || 120}px`;
}

function getStatusLabel(value: unknown, key: string) {
  if (key === "enabled" || key === "required") {
    if (activeConfig.value.key === "protocol" && key === "enabled") {
      return value === false || value === 0 ? "已关闭" : "已开启";
    }

    return value === false || value === 0 ? "否" : "是";
  }

  if (key === "leakStatus") {
    return Number(value) === 1 ? "异常" : "正常";
  }

  const text = String(value ?? "");
  if (!text) {
    return "-";
  }

  const normalizedText = text.toUpperCase();
  if (normalizedText === "SUCCESS") {
    return "成功";
  }

  if (normalizedText === "FAILED" || normalizedText === "FAIL" || normalizedText === "FAILURE" || normalizedText === "ERROR") {
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
  fieldRecordBaselines.value = new Map();
  selectRecord(null, 0);
}

async function handleRefresh() {
  if (refreshing.value) {
    return;
  }

  refreshing.value = true;
  try {
    await Promise.all([
      fetchRecords(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
  } finally {
    refreshing.value = false;
  }
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
  overflow: auto;
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
  overflow-x: auto;
}

.data-receive-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
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
  flex-wrap: wrap;
  flex: none;
  gap: 14px;
  padding: 12px;
}

.data-toolbar__filters,
.data-toolbar__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.data-toolbar__filters {
  flex: 1 1 520px;
}

.data-toolbar__actions {
  justify-content: flex-end;
  flex: 0 1 auto;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
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
  width: clamp(130px, 12vw, 160px);
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.filter-select {
  background: #ffffff;
}

.filter-datetime {
  width: clamp(180px, 17vw, 220px);
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
  background: #ffffff;
  border-color: #cbdced;
}

.filter-datetime :deep(.datetime-picker__value) {
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
}

.data-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.34fr);
  flex: 1;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  margin-top: 14px;
  overflow: hidden;
}

.data-layout--field-editor {
  grid-template-columns: minmax(0, 1fr);
}

.data-layout--table-only {
  grid-template-columns: minmax(0, 1fr);
}

.data-layout--parse {
  grid-template-columns: minmax(0, 1fr) minmax(390px, 0.44fr);
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.detail-panel {
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

.table-head > view,
.detail-head > view {
  min-width: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-scroll {
  flex: 1 1 0;
  width: 100%;
  max-width: 100%;
  height: 0;
  min-height: 0;
  overflow: auto;
}

.data-table {
  display: table;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: 100%;
}

.data-row {
  display: table-row;
  cursor: pointer;
}

.data-row--header {
  color: #1b344d;
  font-weight: 900;
  cursor: default;
}

.data-row--active .data-cell,
.data-row:not(.data-row--header):hover .data-cell {
  background: #f4faff;
}

.data-row--dragging .data-cell {
  opacity: 0.58;
}

.data-row--drop-target .data-cell {
  background: #edf7ff;
}

.data-cell {
  display: table-cell;
  height: 38px;
  box-sizing: border-box;
  vertical-align: middle;
  min-width: 0;
  padding: 0 12px;
  overflow: visible;
  color: #24384d;
  text-align: center;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  border-bottom: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 40px;
  background: #f3f8fd;
}

.data-cell > text:not(.status-pill) {
  min-width: 0;
  overflow: visible;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.data-cell--actions {
  text-align: center;
}

.table-input,
.table-select {
  box-sizing: border-box;
  width: 100%;
  min-width: 80px;
  height: 30px;
  padding: 0 8px;
  color: #17324d;
  font-size: 13px;
  line-height: 30px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.table-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-action-link {
  flex: none;
  color: var(--admin-primary, #0d82ee);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.row-action-link--danger {
  color: #d92d20;
}

.table-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 100%;
  height: 100%;
  min-height: 180px;
  box-sizing: border-box;
  color: var(--admin-muted-color, #7c8da1);
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}

.pagination-bar {
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid var(--admin-subtle-border, #edf3f8);
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
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

.toolbar-button--upload {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.json-upload-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
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
  display: block;
  flex: none;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-refresh--spinning {
  animation: data-receive-refresh-spin 0.75s linear infinite;
}

@keyframes data-receive-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.toolbar-icon-button[disabled] {
  color: var(--admin-primary, #0d82ee);
  background: #edf7ff;
  opacity: 1;
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

.page-input,
.page-size-input {
  box-sizing: border-box;
  width: 48px;
  height: 28px;
  padding: 0 6px;
  color: #1b344d;
  font-size: 13px;
  font-weight: 800;
  line-height: 28px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-size-input {
  width: 64px;
}

.detail-body {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  padding: 14px;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-body :deep(.uni-scroll-view-content) {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  padding-bottom: 2px;
}

.protocol-editor-card {
  box-sizing: border-box;
  width: 100%;
  overflow: auto;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
}

.protocol-editor-card--standalone {
  flex: none;
  margin: 0 0 12px;
}

.protocol-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2edf7;
}

.protocol-editor-title,
.protocol-editor-subtitle {
  display: block;
}

.protocol-editor-title {
  color: #173b5f;
  font-size: 15px;
  font-weight: 900;
}

.protocol-editor-subtitle {
  margin-top: 4px;
  color: #6c7f92;
  font-size: 12px;
  line-height: 1.4;
}

.protocol-editor-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  flex: none;
}

.protocol-editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px 12px 12px;
}

.form-grid,
.detail-grid {
  display: grid;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.form-grid {
  grid-template-columns: 1fr;
}

.detail-grid,
.form-grid--two-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item--wide {
  grid-column: 1 / -1;
}

.form-field {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
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
  display: block;
  max-width: 100%;
  min-width: 0;
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
  display: block;
  max-width: 100%;
  min-width: 0;
  height: 76px;
  padding: 8px 10px;
  line-height: 1.45;
}

.form-textarea--compact {
  height: 52px;
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
  flex-wrap: wrap;
  gap: 10px;
  min-height: 52px;
  padding: 8px 14px;
  border-top: 1px solid var(--admin-subtle-border, #edf3f8);
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 35, 55, 0.28);
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: min(460px, 100%);
  max-height: min(520px, calc(100vh - 56px));
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cfe0ee;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(28, 55, 82, 0.22);
}

.modal-panel--wide {
  width: min(620px, 100%);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  color: #173b5f;
  font-size: 16px;
  font-weight: 900;
  border-bottom: 1px solid #edf3f8;
}

.modal-close {
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.template-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.template-select-row__picker {
  flex: 1;
  min-width: 0;
}

.template-delete-button {
  flex: none;
  min-width: 64px;
  height: 36px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-tip {
  color: #5b7187;
  font-size: 13px;
  line-height: 1.6;
}

.modal-upload-button {
  align-self: flex-end;
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

@media (max-width: 1360px) {
  .data-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(260px, 1fr) minmax(220px, 0.75fr);
  }

  .detail-panel {
    min-height: 0;
  }
}

@media (max-width: 680px) {
  .detail-grid,
  .form-grid--two-column,
  .modal-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
