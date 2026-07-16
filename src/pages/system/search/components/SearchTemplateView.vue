<template>
  <view class="pqt-root">
    <view class="pqt-toolbar">
      <view class="pqt-toolbar__filters">
        <view class="pqt-filter">
          <text class="pqt-filter__label">模板名称</text>
          <input
            v-model="filters.templateName"
            class="pqt-filter__control"
            placeholder="请输入模板名称"
            placeholder-class="pqt-placeholder"
            @confirm="searchCurrent"
          />
        </view>
        <view class="pqt-filter">
          <text class="pqt-filter__label">模板编码</text>
          <input
            v-model="filters.templateCode"
            class="pqt-filter__control"
            placeholder="请输入模板编码"
            placeholder-class="pqt-placeholder"
            @confirm="searchCurrent"
          />
        </view>
        <view class="pqt-filter">
          <text class="pqt-filter__label">适用范围</text>
          <picker :range="scopeFilterOptions" range-key="label" @change="handleScopeFilterChange">
            <view class="pqt-filter__control pqt-filter__control--picker">{{ currentScopeFilterLabel }}</view>
          </picker>
        </view>
        <view class="pqt-filter">
          <text class="pqt-filter__label">协议名称</text>
          <input
            v-model="filters.protocolName"
            class="pqt-filter__control"
            placeholder="请输入协议名称"
            placeholder-class="pqt-placeholder"
            @confirm="searchCurrent"
          />
        </view>
        <view class="pqt-filter">
          <text class="pqt-filter__label">启用状态</text>
          <picker :range="enabledFilterOptions" range-key="label" @change="handleEnabledFilterChange">
            <view class="pqt-filter__control pqt-filter__control--picker">{{ currentEnabledFilterLabel }}</view>
          </picker>
        </view>
      </view>

      <view class="pqt-toolbar__actions">
        <button class="pqt-btn pqt-btn--primary" hover-class="pqt-btn--hover" @click="searchCurrent">查询</button>
        <button class="pqt-btn" hover-class="pqt-btn--hover" @click="resetFilters">重置</button>
        <button class="pqt-icon-btn" :disabled="refreshing" hover-class="pqt-icon-btn--hover" aria-label="刷新" @click="handleRefresh">
          <svg class="pqt-icon-refresh" :class="{ 'pqt-icon-refresh--spinning': refreshing }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
        <button class="pqt-btn pqt-btn--primary" hover-class="pqt-btn--hover" @click="startCreate">新增模板</button>
        <button
          class="pqt-btn pqt-btn--danger"
          :disabled="!selectedTemplateId"
          hover-class="pqt-btn--hover"
          @click="deleteCurrent"
        >
          删除
        </button>
      </view>
    </view>

    <view class="pqt-layout">
      <view class="pqt-card pqt-card--table">
        <view class="pqt-card__head">
          <view>
            <text class="pqt-card__title">动态协议解析字段查询模板</text>
            <text class="pqt-card__subtitle">一个模板只能从一个协议下选择部分字段</text>
          </view>
          <text class="pqt-card__meta">共 {{ displayTotal }} 条</text>
        </view>

        <scroll-view class="pqt-table-scroll" scroll-x scroll-y>
          <view class="pqt-table">
            <view class="pqt-row pqt-row--header">
              <view class="pqt-cell pqt-cell--name">模板名称</view>
              <view class="pqt-cell pqt-cell--code">模板编码</view>
              <view class="pqt-cell pqt-cell--scope">范围</view>
              <view class="pqt-cell pqt-cell--entity">协议名称</view>
              <view class="pqt-cell pqt-cell--count">字段数</view>
              <view class="pqt-cell pqt-cell--status">状态</view>
              <view class="pqt-cell pqt-cell--remark">备注</view>
              <view class="pqt-cell pqt-cell--time">更新时间</view>
            </view>

            <view v-if="loading" class="pqt-state">加载中...</view>
            <view v-else-if="!templates.length" class="pqt-state">暂无查询模板</view>

            <view
              v-for="(item, index) in templates"
              v-else
              :key="getRowKey(item, index)"
              class="pqt-row"
              :class="{ 'pqt-row--active': getRowKey(item, index) === selectedRowKey }"
              @click="selectTemplate(item, index)"
            >
              <view class="pqt-cell pqt-cell--name">{{ getTemplateName(item) }}</view>
              <view class="pqt-cell pqt-cell--code">{{ getTemplateCode(item) }}</view>
              <view class="pqt-cell pqt-cell--scope">{{ getScopeLabel(getText(item, ["scopeType"], "")) }}</view>
              <view class="pqt-cell pqt-cell--entity">{{ getTemplateProtocolName(item) }}</view>
              <view class="pqt-cell pqt-cell--count">{{ getFieldNames(item).length }}</view>
              <view class="pqt-cell pqt-cell--status">
                <text class="pqt-status" :class="{ 'pqt-status--disabled': !getEnabled(item) }">
                  {{ getEnabled(item) ? "启用" : "停用" }}
                </text>
              </view>
              <view class="pqt-cell pqt-cell--remark">{{ getText(item, ["remark"], "-") }}</view>
              <view class="pqt-cell pqt-cell--time">{{ formatDateTime(getText(item, ["updatedAt", "createdAt"], "-")) }}</view>
            </view>
          </view>
        </scroll-view>

        <view class="pqt-pagination">
          <view class="pqt-page-size">
            <text class="pqt-page-info">每页</text>
            <input
              v-model="pageSizeInputValue"
              class="pqt-page-size__input"
              type="number"
              confirm-type="done"
              @confirm="commitPageSizeInput"
              @blur="commitPageSizeInput"
            />
            <text class="pqt-page-info">条</text>
          </view>
          <button class="pqt-page-button" :disabled="pagination.pageNum <= 1" hover-class="pqt-page-button--hover" @click="changePage(-1)">上一页</button>
          <view class="pqt-page-jump">
            <text class="pqt-page-info">第</text>
            <input
              v-model="pageInputValue"
              class="pqt-page-input"
              type="number"
              confirm-type="done"
              @confirm="commitPageInput"
              @blur="commitPageInput"
            />
            <text class="pqt-page-info">/ {{ totalPages }} 页</text>
          </view>
          <button class="pqt-page-button" :disabled="pagination.pageNum >= totalPages" hover-class="pqt-page-button--hover" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <view class="pqt-card pqt-card--detail">
        <view class="pqt-card__head">
          <view>
            <text class="pqt-card__title">{{ isCreating ? "新增查询模板" : "查询模板配置" }}</text>
            <text class="pqt-card__subtitle">先选择协议，再从该协议的字段里挑选模板字段</text>
          </view>
        </view>

        <scroll-view class="pqt-detail-scroll" scroll-y>
          <view class="pqt-form">
            <view class="pqt-form__item pqt-form__item--full pqt-form__item--protocol">
              <text class="pqt-form__label pqt-form__label--required">协议</text>
              <picker :range="protocolOptions" range-key="label" @change="handleProtocolChange">
                <view class="pqt-form__control pqt-form__control--picker">{{ currentProtocolLabel }}</view>
              </picker>
            </view>
            <view class="pqt-form__item pqt-form__item--full pqt-form__item--template-code">
              <text class="pqt-form__label pqt-form__label--required">模板编码</text>
              <input
                v-model="form.templateCode"
                class="pqt-form__control"
                placeholder="例如 protocol_default"
                placeholder-class="pqt-placeholder"
              />
            </view>
            <view class="pqt-form__item">
              <text class="pqt-form__label pqt-form__label--required">模板名称</text>
              <input
                v-model="form.templateName"
                class="pqt-form__control"
                placeholder="请输入模板名称"
                placeholder-class="pqt-placeholder"
              />
            </view>
            <view class="pqt-form__item">
              <text class="pqt-form__label">适用范围</text>
              <picker :range="scopeOptions" range-key="label" @change="handleFormScopeChange">
                <view class="pqt-form__control pqt-form__control--picker">{{ currentFormScopeLabel }}</view>
              </picker>
            </view>
            <view class="pqt-form__item">
              <text class="pqt-form__label">设备 ID</text>
              <input
                v-model="form.deviceId"
                class="pqt-form__control"
                type="number"
                placeholder="设备范围时填写"
                placeholder-class="pqt-placeholder"
              />
            </view>
            <view class="pqt-form__item">
              <text class="pqt-form__label">启用状态</text>
              <picker :range="recordEnabledOptions" range-key="label" @change="handleFormEnabledChange">
                <view class="pqt-form__control pqt-form__control--picker">{{ currentFormEnabledLabel }}</view>
              </picker>
            </view>

            <view class="pqt-form__item pqt-form__item--full">
              <view class="pqt-fields__head">
                <text class="pqt-form__label pqt-form__label--required">模板字段</text>
                <view class="pqt-fields__head-actions">
                  <text class="pqt-fields__count">已选 {{ selectedFieldNames.length }} / {{ protocolFields.length }}</text>
                  <button
                    class="pqt-btn pqt-btn--primary pqt-btn--compact pqt-fields__select-btn"
                    :disabled="!form.protocolId"
                    hover-class="pqt-btn--hover"
                    @click="openFieldDialog"
                  >
                    {{ isCreating ? "选择模板字段" : "更换模板字段" }}
                  </button>
                </view>
              </view>

              <view v-if="fieldLoading" class="pqt-fields__empty">字段加载中...</view>
              <view v-else-if="!form.protocolId" class="pqt-fields__empty">请先选择协议</view>
              <view v-else-if="!protocolFields.length" class="pqt-fields__empty">当前协议暂无字段</view>
              <view v-else-if="!selectedFieldDetails.length" class="pqt-fields__empty">当前还没有选择模板字段</view>

              <scroll-view v-else class="pqt-selected-fields" scroll-y>
                <view v-for="field in selectedFieldDetails" :key="getFieldName(field)" class="pqt-selected-field">
                  <view class="pqt-selected-field__badge"></view>
                  <view class="pqt-selected-field__body">
                    <text class="pqt-selected-field__name">{{ getFieldName(field) }}</text>
                    <text class="pqt-selected-field__meta">{{ getFieldMeta(field) }}</text>
                  </view>
                </view>
              </scroll-view>
            </view>

            <view class="pqt-form__item pqt-form__item--full">
              <text class="pqt-form__label">备注</text>
              <textarea
                v-model="form.remark"
                class="pqt-form__textarea"
                placeholder="补充说明"
                placeholder-class="pqt-placeholder"
              />
            </view>
          </view>
        </scroll-view>

        <view class="pqt-actions">
          <button class="pqt-btn" hover-class="pqt-btn--hover" @click="startCreate">清空</button>
          <button class="pqt-btn pqt-btn--primary" :disabled="saving" hover-class="pqt-btn--hover" @click="saveCurrent">
            {{ saving ? "保存中..." : "保存模板" }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="showFieldDialog" class="pqt-modal" @click.self="closeFieldDialog">
      <view class="pqt-modal__panel">
        <view class="pqt-modal__head">
          <view>
            <text class="pqt-card__title">{{ isCreating ? "选择模板字段" : "更换模板字段" }}</text>
            <text class="pqt-card__subtitle">当前协议：{{ currentProtocolLabel }}</text>
          </view>
          <button class="pqt-icon-btn" hover-class="pqt-icon-btn--hover" @click="closeFieldDialog">
            <text class="pqt-modal__close">×</text>
          </button>
        </view>

        <view v-if="fieldLoading" class="pqt-fields__empty pqt-fields__empty--modal">字段加载中...</view>
        <view v-else-if="!protocolFields.length" class="pqt-fields__empty pqt-fields__empty--modal">当前协议暂无字段</view>

        <scroll-view v-else class="pqt-modal__body" scroll-y>
          <view
            v-for="field in protocolFields"
            :key="`dialog-${getFieldName(field)}`"
            class="pqt-field"
            :class="{ 'pqt-field--selected': isDialogFieldSelected(field) }"
            @click="toggleDialogField(field)"
          >
            <view class="pqt-field__checkbox">
              <text v-if="isDialogFieldSelected(field)">✓</text>
            </view>
            <view class="pqt-field__body">
              <text class="pqt-field__name">{{ getFieldName(field) }}</text>
              <text class="pqt-field__meta">{{ getFieldMeta(field) }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="pqt-modal__foot">
          <text class="pqt-fields__count">已选 {{ dialogFieldNames.length }} / {{ protocolFields.length }}</text>
          <view class="pqt-modal__actions">
            <button class="pqt-btn" hover-class="pqt-btn--hover" @click="closeFieldDialog">取消</button>
            <button class="pqt-btn pqt-btn--primary" hover-class="pqt-btn--hover" @click="confirmFieldDialog">确定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getProtocolDefinitionList } from "@/services/data-receive/access";
import { getFieldsByProtocol } from "@/services/data-receive/parse";
import {
  createSearchTemplate,
  deleteSearchTemplate,
  getSearchTemplatePage,
  updateSearchTemplate,
  type SearchTemplateItem,
} from "@/services/system/search";
import { formatDateTime } from "@/utils/adminData";

type RecordLike = Record<string, unknown>;

interface ApiResponseLike {
  code?: number;
  msg?: string;
  message?: string;
  data?: unknown;
}

interface Option<T = string | boolean> {
  label: string;
  value: T;
}

const scopeFilterOptions: Option<string>[] = [
  { label: "全部", value: "" },
  { label: "全局", value: "GLOBAL" },
  { label: "协议", value: "PROTOCOL" },
  { label: "设备", value: "DEVICE" },
];

const scopeOptions = scopeFilterOptions.slice(1);

const enabledFilterOptions: Option<string | boolean>[] = [
  { label: "全部", value: "" },
  { label: "启用", value: true },
  { label: "停用", value: false },
];

const recordEnabledOptions: Option<boolean>[] = [
  { label: "启用", value: true },
  { label: "停用", value: false },
];
const templates = ref<SearchTemplateItem[]>([]);
const protocols = ref<RecordLike[]>([]);
const protocolFields = ref<RecordLike[]>([]);
const selectedTemplate = ref<SearchTemplateItem | null>(null);
const selectedIndex = ref(-1);
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);
const fieldLoading = ref(false);
const saving = ref(false);
const isCreating = ref(false);
const showFieldDialog = ref(false);

const filters = reactive({
  templateName: "",
  templateCode: "",
  scopeType: "",
  protocolName: "",
  enabled: "" as string | boolean,
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
});
const pageInputValue = ref("1");
const pageSizeInputValue = ref("20");

const form = reactive({
  id: "",
  templateName: "",
  templateCode: "",
  scopeType: "PROTOCOL",
  protocolId: "",
  deviceId: "",
  enabled: true,
  remark: "",
});

const selectedFieldNames = ref<string[]>([]);
const dialogFieldNames = ref<string[]>([]);

const selectedTemplateId = computed(() => normalizeId(selectedTemplate.value));
const selectedRowKey = computed(() =>
  selectedTemplate.value ? getRowKey(selectedTemplate.value, selectedIndex.value) : "",
);
const displayTotal = computed(() => total.value || templates.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(displayTotal.value / pagination.pageSize)));

const currentScopeFilterLabel = computed(
  () => scopeFilterOptions.find((item) => item.value === filters.scopeType)?.label || "全部",
);

const currentEnabledFilterLabel = computed(
  () => enabledFilterOptions.find((item) => item.value === filters.enabled)?.label || "全部",
);

const currentFormScopeLabel = computed(() => getScopeLabel(form.scopeType));

const currentFormEnabledLabel = computed(
  () => recordEnabledOptions.find((item) => item.value === form.enabled)?.label || "启用",
);

const protocolOptions = computed(() =>
  protocols.value
    .map((item) => ({
      label: getProtocolLabel(item),
      value: String(getProtocolId(item)),
    }))
    .filter((item) => item.value),
);

const currentProtocolLabel = computed(() => {
  const option = protocolOptions.value.find((item) => item.value === String(form.protocolId));
  return option?.label || "请选择协议";
});

const selectedFieldDetails = computed(() => {
  const fieldMap = new Map(protocolFields.value.map((item) => [getFieldName(item), item] as const));
  return selectedFieldNames.value.map((name) => fieldMap.get(name) || { fieldName: name });
});

onMounted(() => {
  void loadProtocols();
  void refreshCurrent();
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

function isObject(value: unknown): value is RecordLike {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getValue(item: unknown, keys: string[]) {
  if (!isObject(item)) return undefined;
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function getText(item: unknown, keys: string[], fallback = "") {
  const value = getValue(item, keys);
  return value === undefined || value === null ? fallback : String(value);
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  return [];
}

function toBoolean(value: unknown, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (["false", "0", "off", "disabled", "n", "no"].includes(text)) return false;
  if (["true", "1", "on", "enabled", "y", "yes"].includes(text)) return true;
  return fallback;
}

function parseNumericValue(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function getId(item: unknown) {
  if (!isObject(item)) return "";
  const id = item.id ?? item.templateId ?? "";
  return id === undefined || id === null ? "" : String(id);
}

function normalizeId(item: unknown) {
  return getId(item).trim();
}

function getTemplateName(item: unknown) {
  return getText(item, ["templateName", "name"], "-");
}

function getTemplateCode(item: unknown) {
  return getText(item, ["templateCode", "code"], "-");
}

function getEnabled(item: unknown) {
  return toBoolean(getValue(item, ["enabled"]), true);
}

function getFieldNames(item: unknown) {
  return normalizeStringArray(getValue(item, ["fieldNames"]));
}

function getScopeLabel(value: string) {
  return scopeFilterOptions.find((item) => item.value === value)?.label || value || "全局";
}

function getRowKey(item: unknown, index: number) {
  return String(getId(item) || `${getTemplateCode(item)}-${index}`);
}

function getProtocolId(item: unknown) {
  return getText(item, ["id", "protocolId", "port"], "");
}

function getProtocolLabel(item: unknown) {
  const id = getProtocolId(item);
  const name = getText(item, ["protocolName", "name"], "未命名协议");
  const code = getText(item, ["protocolCode", "code"], "");
  return `${id ? `${id} - ` : ""}${name}${code ? ` (${code})` : ""}`;
}

function getTemplateProtocolName(item: unknown) {
  const directName = getText(item, ["protocolName"], "");
  if (directName) return directName;

  const protocolId = getText(item, ["protocolId"], "");
  const protocol = protocols.value.find((record) => getProtocolId(record) === protocolId);
  return protocol ? getText(protocol, ["protocolName", "name", "protocolCode"], "-") : "-";
}

function getFieldName(item: unknown) {
  return getText(item, ["fieldName", "name", "field"], "");
}

function getFieldMeta(item: unknown) {
  const cnName = getText(item, ["fieldCnName", "label", "title"], "");
  const format = getText(item, ["format"], "");
  const unit = getText(item, ["unit"], "");
  return [cnName, format, unit].filter(Boolean).join(" / ") || "字段定义";
}

function getFieldOrder(item: unknown) {
  return parseNumericValue(getValue(item, ["order", "sort", "fieldOrder"])) ?? Number.MAX_SAFE_INTEGER;
}

function compareField(a: RecordLike, b: RecordLike) {
  const orderDiff = getFieldOrder(a) - getFieldOrder(b);
  if (orderDiff !== 0) return orderDiff;
  return getFieldName(a).localeCompare(getFieldName(b));
}

function isDialogFieldSelected(item: unknown) {
  const name = getFieldName(item);
  return Boolean(name && dialogFieldNames.value.includes(name));
}

function parseListResponse(response: ApiResponseLike) {
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (isObject(data)) {
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.list)) return data.list;
    if (Array.isArray(data.rows)) return data.rows;
  }
  return [];
}

function parseTotalResponse(response: ApiResponseLike, records: unknown[]) {
  const data = response.data;
  if (isObject(data)) {
    return Number(data.total ?? data.count ?? records.length) || records.length;
  }
  return records.length;
}

function assertSuccessResponse(response: ApiResponseLike) {
  const code = Number(response?.code ?? 200);
  if (![0, 200].includes(code)) {
    throw new Error(response?.msg || response?.message || "请求失败");
  }
}

function removeEmptyFields<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

function parseNumber(value: string) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const num = Number(text);
  return Number.isFinite(num) ? num : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isObject(error)) {
    const message = error.msg || error.message;
    if (message) return String(message);
  }
  return fallback;
}

function handleScopeFilterChange(event: { detail: { value: number } }) {
  filters.scopeType = scopeFilterOptions[event.detail.value]?.value || "";
}

function handleEnabledFilterChange(event: { detail: { value: number } }) {
  filters.enabled = enabledFilterOptions[event.detail.value]?.value ?? "";
}

function handleFormScopeChange(event: { detail: { value: number } }) {
  form.scopeType = scopeOptions[event.detail.value]?.value || "PROTOCOL";
}

function handleFormEnabledChange(event: { detail: { value: number } }) {
  form.enabled = recordEnabledOptions[event.detail.value]?.value ?? true;
}

function handleProtocolChange(event: { detail: { value: number } }) {
  const option = protocolOptions.value[event.detail.value];
  form.protocolId = option?.value || "";
  selectedFieldNames.value = [];
  dialogFieldNames.value = [];
  void loadProtocolFields(form.protocolId);
}

function toggleDialogField(item: unknown) {
  const name = getFieldName(item);
  if (!name) return;

  if (dialogFieldNames.value.includes(name)) {
    dialogFieldNames.value = dialogFieldNames.value.filter((field) => field !== name);
    return;
  }

  dialogFieldNames.value = [...dialogFieldNames.value, name];
}

function openFieldDialog() {
  if (!form.protocolId) {
    uni.showToast({ title: "请先选择协议", icon: "none" });
    return;
  }

  dialogFieldNames.value = [...selectedFieldNames.value];
  showFieldDialog.value = true;

  if (!protocolFields.value.length && !fieldLoading.value) {
    void loadProtocolFields(form.protocolId);
  }
}

function closeFieldDialog() {
  showFieldDialog.value = false;
  dialogFieldNames.value = [];
}

function confirmFieldDialog() {
  const ordered = protocolFields.value
    .map((item) => getFieldName(item))
    .filter((name) => name && dialogFieldNames.value.includes(name));
  selectedFieldNames.value = ordered;
  showFieldDialog.value = false;
  dialogFieldNames.value = [];
}

function searchCurrent() {
  pagination.pageNum = 1;
  void refreshCurrent();
}

async function handleRefresh() {
  if (refreshing.value) {
    return;
  }

  refreshing.value = true;
  try {
    await Promise.all([
      refreshCurrent(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
  } finally {
    refreshing.value = false;
  }
}

function resetFilters() {
  filters.templateName = "";
  filters.templateCode = "";
  filters.scopeType = "";
  filters.protocolName = "";
  filters.enabled = "";
  pagination.pageNum = 1;
  void refreshCurrent();
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
  void refreshCurrent();
}

function normalizePageSize(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numberValue), 1), 500);
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

function jumpToPage(page: number) {
  const nextPage = Math.min(Math.max(Math.trunc(page), 1), totalPages.value);
  pageInputValue.value = String(nextPage);

  if (nextPage === pagination.pageNum) {
    return;
  }

  pagination.pageNum = nextPage;
  void refreshCurrent();
}

async function loadProtocols() {
  try {
    const response = (await getProtocolDefinitionList()) as ApiResponseLike;
    assertSuccessResponse(response);
    protocols.value = parseListResponse(response).filter(isObject);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "协议列表加载失败"), icon: "none" });
  }
}

async function loadProtocolFields(protocolId: string | number) {
  if (!protocolId) {
    protocolFields.value = [];
    return;
  }

  fieldLoading.value = true;
  try {
    const response = (await getFieldsByProtocol(protocolId)) as ApiResponseLike;
    assertSuccessResponse(response);
    const fields = parseListResponse(response).filter(isObject) as RecordLike[];
    protocolFields.value = fields.slice().sort(compareField);

    const availableFields = new Set(protocolFields.value.map((item) => getFieldName(item)).filter(Boolean));
    selectedFieldNames.value = selectedFieldNames.value.filter((name) => availableFields.has(name));
  } catch (error) {
    protocolFields.value = [];
    uni.showToast({ title: getErrorMessage(error, "协议字段加载失败"), icon: "none" });
  } finally {
    fieldLoading.value = false;
  }
}

async function refreshCurrent() {
  loading.value = true;
  try {
    const response = (await getSearchTemplatePage(
      removeEmptyFields({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        templateName: filters.templateName.trim() || undefined,
        templateCode: filters.templateCode.trim() || undefined,
        scopeType: filters.scopeType || undefined,
        protocolName: filters.protocolName.trim() || undefined,
        enabled: filters.enabled,
      }),
    )) as ApiResponseLike;

    assertSuccessResponse(response);
    const records = parseListResponse(response) as SearchTemplateItem[];
    templates.value = records;
    total.value = parseTotalResponse(response, records);

    if (!records.length) {
      if (pagination.pageNum > 1 && total.value > 0) {
        jumpToPage(pagination.pageNum - 1);
        return;
      }

      selectedTemplate.value = null;
      selectedIndex.value = -1;
      if (!isCreating.value) {
        startCreate();
      }
      return;
    }

    const nextIndex = selectedTemplate.value
      ? records.findIndex((item) => normalizeId(item) === selectedTemplateId.value)
      : 0;
    const safeIndex = nextIndex >= 0 ? nextIndex : 0;
    selectTemplate(records[safeIndex], safeIndex);
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "查询模板加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectTemplate(item: SearchTemplateItem, index: number) {
  selectedTemplate.value = item;
  selectedIndex.value = index;
  isCreating.value = false;
  showFieldDialog.value = false;
  dialogFieldNames.value = [];
  selectedFieldNames.value = getFieldNames(item);

  Object.assign(form, {
    id: normalizeId(item),
    templateName: getTemplateName(item) === "-" ? "" : getTemplateName(item),
    templateCode: getTemplateCode(item) === "-" ? "" : getTemplateCode(item),
    scopeType: getText(item, ["scopeType"], "PROTOCOL"),
    protocolId: getText(item, ["protocolId"], ""),
    deviceId: getText(item, ["deviceId"], ""),
    enabled: getEnabled(item),
    remark: getText(item, ["remark"], ""),
  });

  void loadProtocolFields(form.protocolId);
}

function startCreate() {
  selectedTemplate.value = null;
  selectedIndex.value = -1;
  isCreating.value = true;
  showFieldDialog.value = false;
  selectedFieldNames.value = [];
  dialogFieldNames.value = [];
  protocolFields.value = [];

  Object.assign(form, {
    id: "",
    templateName: "",
    templateCode: "",
    scopeType: "PROTOCOL",
    protocolId: "",
    deviceId: "",
    enabled: true,
    remark: "",
  });
}

async function saveCurrent() {
  if (!form.templateName.trim() || !form.templateCode.trim()) {
    uni.showToast({ title: "请填写模板名称和模板编码", icon: "none" });
    return;
  }

  if (!form.protocolId) {
    uni.showToast({ title: "请先选择协议", icon: "none" });
    return;
  }

  if (!selectedFieldNames.value.length) {
    uni.showToast({ title: "请至少选择一个协议字段", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      id: form.id ? Number(form.id) : undefined,
      templateCode: form.templateCode.trim(),
      templateName: form.templateName.trim(),
      scopeType: form.scopeType,
      protocolId: parseNumber(form.protocolId),
      deviceId: parseNumber(form.deviceId),
      fieldNames: selectedFieldNames.value,
      enabled: form.enabled,
      remark: form.remark.trim(),
    });

    if (isCreating.value || !form.id) {
      await createSearchTemplate(payload);
    } else {
      await updateSearchTemplate(form.id, payload);
    }

    uni.showToast({ title: "查询模板已保存", icon: "success" });
    await refreshCurrent();
  } catch (error) {
    uni.showToast({ title: getErrorMessage(error, "查询模板保存失败"), icon: "none" });
  } finally {
    saving.value = false;
  }
}

async function deleteCurrent() {
  if (!selectedTemplateId.value) return;

  uni.showModal({
    title: "删除确认",
    content: "确定删除当前查询模板吗？",
    success: (result) => {
      if (!result.confirm) return;

      void (async () => {
        try {
          await deleteSearchTemplate(selectedTemplateId.value);
          uni.showToast({ title: "查询模板已删除", icon: "success" });
          selectedTemplate.value = null;
          selectedIndex.value = -1;
          await refreshCurrent();
        } catch (error) {
          uni.showToast({ title: getErrorMessage(error, "查询模板删除失败"), icon: "none" });
        }
      })();
    },
  });
}
</script>

<style scoped lang="scss">
.pqt-root {
  display: flex;
  flex-direction: column;
  min-height: var(--shell-content-min-height);
  padding: 14px;
  overflow: hidden;
  background: #f5f8fc;
}

.pqt-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e3eaf4;
  border-radius: 8px;
}

.pqt-toolbar__filters,
.pqt-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}

.pqt-toolbar__filters {
  flex: 1 1 auto;
  min-width: 0;
}

.pqt-toolbar__actions {
  flex: none;
}

.pqt-filter,
.pqt-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pqt-filter__label,
.pqt-form__label {
  color: #34495e;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.pqt-form__label--required::after {
  content: " *";
  color: #dc2626;
}

.pqt-filter__control,
.pqt-form__control,
.pqt-form__textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.pqt-filter__control {
  width: 150px;
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.pqt-filter__control--picker,
.pqt-form__control--picker {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  white-space: normal;
  word-break: break-all;
}

.pqt-form__control {
  min-height: 36px;
  padding: 0 10px;
  line-height: 1.45;
}

.pqt-form__control--picker {
  height: auto;
  max-height: 78px;
  padding-top: 7px;
  padding-bottom: 7px;
  overflow-y: auto;
}

.pqt-form__textarea {
  height: 88px;
  padding: 10px;
  line-height: 1.5;
}

.pqt-btn,
.pqt-icon-btn {
  margin: 0;
  border: 0;
  border-radius: 4px;
}

.pqt-btn::after,
.pqt-icon-btn::after {
  border: 0;
}

.pqt-btn {
  height: 34px;
  padding: 0 14px;
  color: #2f3b4f;
  font-size: 13px;
  font-weight: 800;
  line-height: 34px;
  background: #edf2f7;
}

.pqt-btn--compact {
  min-width: 110px;
  height: 32px;
  padding: 0 12px;
  line-height: 32px;
}

.pqt-btn--primary {
  color: #ffffff;
  background: #0d82ee;
}

.pqt-btn--danger {
  color: #ffffff;
  background: #d92d20;
}

.pqt-btn--hover {
  opacity: 0.92;
}

.pqt-btn[disabled] {
  color: #a0aec0;
  background: #edf2f7;
}

.pqt-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #0d82ee;
  background: #edf7ff;
}

.pqt-icon-btn--hover {
  background: #dff0ff;
}

.pqt-icon-btn[disabled] {
  color: #0d82ee;
  background: #edf7ff;
  opacity: 1;
}

.pqt-icon-refresh {
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

.pqt-icon-refresh--spinning {
  animation: pqt-refresh-spin 0.75s linear infinite;
}

@keyframes pqt-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.pqt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.4fr);
  flex: 1;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  margin-top: 14px;
  overflow: hidden;
}

.pqt-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e3eaf4;
  border-radius: 8px;
}

.pqt-card__head,
.pqt-actions {
  display: flex;
  align-items: center;
  flex: none;
}

.pqt-card__head {
  justify-content: space-between;
  gap: 12px;
  min-height: 60px;
  padding: 0 14px;
  border-bottom: 1px solid #edf3f8;
}

.pqt-card__head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pqt-card__title {
  display: block;
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.pqt-card__subtitle,
.pqt-card__meta {
  color: #73859a;
  font-size: 12px;
  font-weight: 600;
}

.pqt-card__subtitle {
  display: block;
  margin-top: 4px;
}

.pqt-table-scroll,
.pqt-detail-scroll {
  flex: 1 1 0;
  width: 100%;
  height: 0;
  min-height: 0;
  overflow: auto;
}

.pqt-detail-scroll {
  height: auto;
}

.pqt-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  min-height: 52px;
  padding: 8px 14px;
  box-sizing: border-box;
  border-top: 1px solid #edf3f8;
  background: #ffffff;
}

.pqt-page-size,
.pqt-page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pqt-page-size__input,
.pqt-page-button,
.pqt-page-input {
  box-sizing: border-box;
  height: 32px;
  color: #34495e;
  font-size: 13px;
  font-weight: 800;
  line-height: 32px;
  border: 1px solid #d4e2f0;
  border-radius: 4px;
  background: #f8fbff;
}

.pqt-page-size__input {
  width: 64px;
  padding: 0 6px;
  text-align: center;
}

.pqt-page-button {
  min-width: 72px;
  margin: 0;
  padding: 0 12px;
}

.pqt-page-button::after {
  border: 0;
}

.pqt-page-button--hover {
  background: #edf7ff;
}

.pqt-page-button[disabled] {
  color: #a0aec0;
  background: #f2f5f8;
}

.pqt-page-info {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.pqt-page-input {
  width: 54px;
  padding: 0 6px;
  text-align: center;
}

.pqt-table {
  display: table;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
}

.pqt-row {
  display: table-row;
  color: #344054;
  cursor: pointer;
}

.pqt-row--header {
  color: #667085;
  font-weight: 900;
  cursor: default;
}

.pqt-row--active .pqt-cell {
  background: #eef6ff;
}

.pqt-cell {
  display: table-cell;
  box-sizing: border-box;
  height: 44px;
  min-width: 0;
  padding: 0 12px;
  color: #24384d;
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  border-bottom: 1px solid #edf1f5;
}

.pqt-row--header .pqt-cell {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f3f8fd;
}

.pqt-cell--name {
  min-width: 180px;
}

.pqt-cell--code {
  min-width: 160px;
}

.pqt-cell--scope,
.pqt-cell--entity,
.pqt-cell--count,
.pqt-cell--status {
  min-width: 90px;
}

.pqt-cell--entity {
  min-width: 150px;
}

.pqt-cell--remark {
  min-width: 180px;
}

.pqt-cell--time {
  min-width: 170px;
}

.pqt-state {
  padding: 32px 16px;
  color: #7c8798;
  text-align: center;
}

.pqt-status {
  padding: 4px 8px;
  color: #047857;
  background: #dff8ec;
  border-radius: 999px;
}

.pqt-status--disabled {
  color: #9f1239;
  background: #ffe4e6;
}

.pqt-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
}

.pqt-form__item--full {
  grid-column: 1 / -1;
}

.pqt-form__item--protocol,
.pqt-form__item--template-code {
  width: 100%;
}

.pqt-fields__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pqt-fields__head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pqt-fields__select-btn {
  flex: none;
}

.pqt-fields__count {
  color: #73859a;
  font-size: 12px;
  font-weight: 700;
}

.pqt-selected-fields,
.pqt-fields__empty {
  box-sizing: border-box;
  border: 1px solid #dbe7f3;
  border-radius: 6px;
}

.pqt-selected-fields {
  min-height: 280px;
  max-height: 360px;
  background: #fbfdff;
}

.pqt-fields__empty {
  padding: 24px 12px;
  color: #73859a;
  text-align: center;
  background: #f8fbff;
}

.pqt-selected-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #edf2f7;
}

.pqt-selected-field:last-child,
.pqt-field:last-child {
  border-bottom: 0;
}

.pqt-selected-field__badge {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  background: #0d82ee;
  border-radius: 50%;
}

.pqt-selected-field__body,
.pqt-field__body {
  min-width: 0;
  flex: 1;
}

.pqt-selected-field__name,
.pqt-field__name {
  display: block;
  color: #17324d;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.5;
  word-break: break-all;
}

.pqt-selected-field__meta,
.pqt-field__meta {
  display: block;
  margin-top: 2px;
  color: #73859a;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.pqt-actions {
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #edf3f8;
}

.pqt-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.36);
}

.pqt-modal__panel {
  display: flex;
  flex-direction: column;
  width: min(820px, calc(100vw - 48px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 18px 42px rgba(16, 24, 40, 0.22);
}

.pqt-modal__head,
.pqt-modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.pqt-modal__head {
  border-bottom: 1px solid #edf3f8;
}

.pqt-modal__foot {
  border-top: 1px solid #edf3f8;
}

.pqt-modal__body {
  min-height: 360px;
  max-height: 56vh;
}

.pqt-modal__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pqt-modal__close {
  color: #34495e;
  font-size: 20px;
  line-height: 1;
}

.pqt-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
}

.pqt-field--selected {
  background: #edf7ff;
}

.pqt-field__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  background: #ffffff;
  border: 1px solid #aac5df;
  border-radius: 4px;
}

.pqt-field--selected .pqt-field__checkbox {
  background: #0d82ee;
  border-color: #0d82ee;
}

.pqt-fields__empty--modal {
  margin: 16px;
}

.pqt-placeholder {
  color: #a0aec0;
}

@media (max-width: 1180px) {
  .pqt-layout {
    grid-template-columns: 1fr;
  }
}
</style>
