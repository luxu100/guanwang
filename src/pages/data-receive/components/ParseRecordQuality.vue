<template>
  <view class="parse-quality">
    <view class="parse-quality__head">
      <text>{{ localeText("字段解析质量", "Field parsing quality") }}</text>
      <text v-if="loading">{{ localeText("读取中…", "Loading…") }}</text>
      <text v-else-if="parsed" :class="{ 'parse-quality__partial': isPartial, 'parse-quality__failed': record.parseStatus === 'FAILED' }">
        {{ qualityText }}
      </text>
    </view>
    <view v-if="error" class="parse-quality__error" role="alert">
      <text data-i18n-raw>{{ error }}</text>
      <button class="secondary-button" @click="loadQuality(record)">{{ localeText("重新读取", "Retry") }}</button>
    </view>
    <text v-else-if="unavailable">{{ unavailable }}</text>
    <template v-else-if="parsed">
      <view class="parse-quality__row">
        <text>{{ localeText("降级字段数", "Fallback field count") }}</text>
        <text data-i18n-raw>{{ display(parsed.fallbackFieldCount) }}</text>
      </view>
      <view class="parse-quality__row">
        <text>{{ localeText("降级字段", "Fallback fields") }}</text>
        <text data-i18n-raw>{{ display(parsed.fallbackFields) }}</text>
      </view>
      <text>{{ localeText("完整解析结果（保留原始值）", "Full parsing result with original values") }}</text>
      <text class="parse-quality__json" data-i18n-raw>{{ rawJson }}</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useLocaleText } from "@/i18n/localeText";
import { getProtocolParsedJsonPage } from "@/services/data-receive/parse";
import { assertSuccessResponse, getId, getText, isObject, parsePageResponse, type RecordLike } from "@/utils/adminData";

const props = defineProps<{ record: RecordLike }>();
const localeText = useLocaleText();
const loading = ref(false);
const error = ref("");
const unavailable = ref("");
const parsed = ref<RecordLike | null>(null);
const rawJson = ref("");
let requestVersion = 0;
let disposed = false;

const isPartial = computed(() => {
  const value = parsed.value;
  const fallbackFields = value?.fallbackFields;
  return value?.qualityStatus === "PARTIAL" || Number(value?.fallbackFieldCount) > 0
    || (Array.isArray(fallbackFields) && fallbackFields.length > 0);
});
const qualityText = computed(() => {
  if (props.record.parseStatus === "FAILED") return localeText("解析失败", "Parsing failed");
  if (isPartial.value) return localeText("部分解析成功", "Partially parsed");
  return display(parsed.value?.qualityStatus);
});

watch(() => props.record, (record) => { void loadQuality(record); }, { immediate: true });
onBeforeUnmount(() => { disposed = true; requestVersion += 1; });

async function loadQuality(record: RecordLike) {
  const version = ++requestVersion;
  loading.value = false;
  error.value = "";
  unavailable.value = "";
  parsed.value = null;
  rawJson.value = "";
  const protocolId = record.protocolId;
  if (!record.deviceNumber || protocolId === null || protocolId === undefined || protocolId === "") {
    unavailable.value = localeText("缺少设备编号或协议关联，字段质量不可用，请查看原记录的错误信息", "Field quality is unavailable without a device number and protocol. See the record error");
    return;
  }
  const id = getId(record);
  const traceId = getText(record, ["traceId"]);
  if (id === "" && !traceId) {
    unavailable.value = localeText("缺少记录 ID 或追踪 ID，无法核对完整解析结果", "A record ID or trace ID is required to locate the full parsing result");
    return;
  }
  loading.value = true;
  try {
    let pageNum = 1;
    const pageSize = 100;
    while (!disposed && version === requestVersion) {
      const response = await getProtocolParsedJsonPage({
        deviceNumber: String(record.deviceNumber),
        protocolId: protocolId as string | number,
        pageNum,
        pageSize,
        channel: record.channel,
        afn: getText(record, ["afn"]) || undefined,
        taskType: getText(record, ["taskType"]) || undefined,
        contentPrefix: getText(record, ["contentPrefix"]) || undefined,
        parseStatus: getText(record, ["parseStatus"]) || undefined,
      });
      if (disposed || version !== requestVersion) return;
      assertSuccessResponse(response);
      const page = parsePageResponse(response);
      const match = page.records.find(item => id !== ""
        ? String(getId(item)) === String(id)
        : getText(item, ["traceId"]) === traceId);
      if (match) {
        if (typeof match.parsedJson !== "string" || !match.parsedJson.trim()) {
          throw new Error(localeText("此记录未返回完整解析 JSON", "The record has no full parsing JSON"));
        }
        rawJson.value = match.parsedJson;
        const value: unknown = JSON.parse(match.parsedJson);
        if (!isObject(value)) throw new Error(localeText("完整解析 JSON 应为对象", "The full parsing JSON must be an object"));
        parsed.value = value;
        return;
      }
      if (!page.records.length || pageNum * pageSize >= page.total) break;
      pageNum += 1;
    }
    throw new Error(localeText("未找到当前记录的完整解析结果", "The full parsing result for this record was not found"));
  } catch (cause) {
    if (disposed || version !== requestVersion) return;
    const detail = cause as { msg?: string; message?: string };
    error.value = detail?.msg || detail?.message || localeText("字段质量读取失败", "Failed to load field quality");
  } finally {
    if (!disposed && version === requestVersion) loading.value = false;
  }
}

function display(value: unknown) {
  if (value === undefined || value === null || value === "") return localeText("未提供", "Not provided");
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}
</script>

<style scoped>
.parse-quality {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  color: #52657a;
  font-size: 13px;
}
.parse-quality__head, .parse-quality__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.parse-quality__head { font-weight: 700; }
.parse-quality__partial { color: #b86a0b; }
.parse-quality__failed { color: #c53030; }
.parse-quality__error {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #c53030;
}
.parse-quality__row > :last-child {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.parse-quality__json {
  display: block;
  margin-top: 8px;
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: monospace;
}
</style>
