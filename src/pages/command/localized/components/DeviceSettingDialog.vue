<template>
  <view class="setting-mask" @click.self="closeDialog">
    <view class="setting-modal">
      <view class="setting-head">
        <view>
          <text class="setting-head__eyebrow">{{ localeText("设备参数设置", "Device parameters") }}</text>
          <text class="setting-head__title">{{ localeText("创建参数下发任务", "Create parameter tasks") }}</text>
        </view>
        <button class="setting-close" :aria-label="localeText('取消', 'Cancel')" @click="closeDialog">×</button>
      </view>

      <view class="setting-steps">
        <view
          v-for="item in steps"
          :key="item.value"
          class="setting-step"
          :class="{ 'setting-step--active': step === item.value, 'setting-step--done': step > item.value }"
        >
          <text class="setting-step__number">{{ step > item.value ? "✓" : item.value }}</text>
          <text>{{ item.label }}</text>
        </view>
      </view>

      <scroll-view class="setting-body" scroll-y @click="closeOptionMenu">
        <view v-if="step === 1" class="setting-section">
          <view class="section-head">
            <view>
              <text class="section-title">{{ localeText("选择设备", "Select devices") }}</text>
              <text class="section-hint">{{ localeText("仅选择配置完整、已启用且当前离线的设备；单次最多 200 台", "Select configured, enabled, offline devices; up to 200 per request") }}</text>
            </view>
            <text class="selected-count">{{ localeText(`已选择 ${selectedDevices.length} 台`, `${selectedDevices.length} selected`) }}</text>
          </view>
          <view class="device-filter">
            <input v-model="deviceKeyword" class="control" :placeholder="localeText('输入设备编号搜索', 'Search device number')" @confirm="searchDevices" />
            <button class="small-button" @click="searchDevices">{{ localeText("搜索", "Search") }}</button>
            <button class="small-button" @click="toggleAllDevices">
              {{ allVisibleSelected ? localeText("取消全选", "Clear all") : localeText("选择全部设备", "Select all devices") }}
            </button>
          </view>
          <view v-if="deviceLoading" class="empty-state">{{ localeText("正在加载设备…", "Loading devices…") }}</view>
          <view v-else class="device-table">
            <view class="device-row device-row--header">
              <text></text>
              <text>{{ localeText("设备编号", "Device number") }}</text>
              <text>{{ localeText("设备别名", "Device alias") }}</text>
              <text>{{ localeText("通道与状态", "Channel and status") }}</text>
              <text>{{ localeText("可选状态", "Availability") }}</text>
            </view>
            <view
              v-for="device in filteredDevices"
              :key="device.id || device.deviceNumber"
              class="device-row"
              :class="{ 'device-row--selected': isDeviceSelected(device), 'device-row--unavailable': !isDeviceSelectable(device) }"
              @click="toggleDevice(device)"
            >
              <text><text class="checkbox">{{ isDeviceSelected(device) ? "✓" : "" }}</text></text>
              <text>{{ displayValue(device.deviceNumber) }}</text>
              <text>{{ displayValue(device.deviceAlias || device.deviceName) }}</text>
              <text>
                <text class="online-tag" :class="isDeviceOnline(device) === null ? 'online-tag--unknown' : isDeviceOnline(device) ? 'online-tag--online' : 'online-tag--offline'">
                  {{ getOnlineText(device) }}
                </text>
              </text>
              <text>{{ getDeviceChannelText(getDeviceChannel(device), localeText) }} · {{ getDeviceAvailability(device) }}</text>
            </view>
            <view v-if="!filteredDevices.length" class="empty-state">{{ localeText("暂无符合条件的设备", "No matching devices") }}</view>
          </view>
          <view class="device-pager">
            <button class="small-button" :disabled="devicePage.current <= 1 || deviceLoading" @click="changeDevicePage(-1)">{{ localeText("上一页", "Previous") }}</button>
            <text>{{ devicePage.current }} / {{ Math.max(1, Math.ceil(devicePage.total / devicePage.size)) }} · {{ devicePage.total }}</text>
            <button class="small-button" :disabled="devicePage.current * devicePage.size >= devicePage.total || deviceLoading" @click="changeDevicePage(1)">{{ localeText("下一页", "Next") }}</button>
          </view>
        </view>

        <view v-else-if="step === 2" class="setting-section">
          <view class="section-head">
            <view>
              <text class="section-title">{{ localeText("选择本次修改的参数", "Choose parameters to change") }}</text>
              <text class="section-hint">{{ localeText("只有勾选的字段会提交；未勾选字段不会自动写入 0", "Only enabled fields are submitted; disabled fields are omitted") }}</text>
            </view>
            <text class="selected-count">{{ localeText(`已启用 ${enabledParameterCount} 项`, `${enabledParameterCount} enabled`) }}</text>
          </view>

          <view class="request-meta">
            <view class="form-field">
              <text class="form-label">{{ localeText("请求幂等号", "Client request ID") }}</text>
              <input v-model="clientRequestId" class="control" maxlength="48" />
              <text class="form-hint">{{ localeText("网络超时重试时请沿用此值", "Reuse this value when retrying after a timeout") }}</text>
            </view>
            <view class="form-field">
              <text class="form-label">{{ localeText("任务过期时间（可选）", "Expires at (optional)") }}</text>
              <input v-model="expiresAt" class="control" :placeholder="localeText('例如 2026-07-28T10:00:00', 'e.g. 2026-07-28T10:00:00')" />
              <text class="form-hint">{{ localeText("省略时由后端按通道和协议版本确定期限", "The server selects the expiry by channel and protocol when omitted") }}</text>
            </view>
          </view>

          <view class="parameter-grid">
            <view class="parameter-card" :class="{ 'parameter-card--enabled': isParameterEnabled('gainGroup'), 'parameter-card--unsupported': !gainSupported }">
              <view class="parameter-card__head" @click="toggleParameter('gainGroup')">
                <text class="checkbox">{{ isParameterEnabled("gainGroup") ? "✓" : "" }}</text>
                <view><text>{{ localeText("测量增益设置", "Measurement gain") }}</text><text>{{ localeText("增益模式和增益值必须一起提交", "Mode and value are submitted together") }}</text></view>
              </view>
              <view class="gain-fields">
                <view
                  class="parameter-select"
                  :class="{
                    'parameter-select--disabled': !isParameterEnabled('gainGroup'),
                    'parameter-select--open': openOptionKey === 'gainMode',
                  }"
                >
                  <view class="control control--picker parameter-select__trigger" @click.stop="toggleOptionMenu('gainMode')">
                    <text>{{ gainModeOptions[gainModeIndex]?.label }}</text>
                    <text class="parameter-select__arrow"></text>
                  </view>
                  <view v-if="openOptionKey === 'gainMode' && isParameterEnabled('gainGroup')" class="parameter-select__menu">
                    <view
                      v-for="option in gainModeOptions"
                      :key="option.value"
                      class="parameter-select__option"
                      :class="{ 'parameter-select__option--active': String(option.value) === String(parameterValues.measureGainMode) }"
                      @click.stop="selectGainMode(option)"
                    >
                      {{ option.label }}
                    </view>
                  </view>
                </view>
                <input v-model="parameterValues.gainValue" :disabled="!isParameterEnabled('gainGroup')" class="control" type="digit" :placeholder="localeText('增益值 0.0～999.9', 'Gain 0.0–999.9')" />
              </view>
            </view>

            <view
              v-for="definition in effectiveParameterDefinitions"
              :key="definition.key"
              class="parameter-card"
              :class="{ 'parameter-card--enabled': isParameterEnabled(definition.key) }"
            >
              <view class="parameter-card__head" @click="toggleParameter(definition.key)">
                <text class="checkbox">{{ isParameterEnabled(definition.key) ? "✓" : "" }}</text>
                <view><text>{{ definition.label }}</text><text>{{ definition.hint }}</text></view>
              </view>
              <view
                v-if="definition.options"
                class="parameter-select"
                :class="{
                  'parameter-select--disabled': !isParameterEnabled(definition.key),
                  'parameter-select--open': openOptionKey === definition.key,
                }"
              >
                <view class="control control--picker parameter-select__trigger" @click.stop="toggleOptionMenu(definition.key)">
                  <text>{{ getOptionLabel(definition) }}</text>
                  <text class="parameter-select__arrow"></text>
                </view>
                <view v-if="openOptionKey === definition.key && isParameterEnabled(definition.key)" class="parameter-select__menu">
                  <view
                    v-for="option in definition.options"
                    :key="option.value"
                    class="parameter-select__option"
                    :class="{ 'parameter-select__option--active': String(option.value) === String(parameterValues[definition.key]) }"
                    @click.stop="selectOption(definition, option)"
                  >
                    {{ option.label }}
                  </view>
                </view>
              </view>
              <input
                v-else
                v-model="parameterValues[definition.key]"
                :disabled="!isParameterEnabled(definition.key)"
                class="control"
                :type="definition.inputType || 'text'"
                :placeholder="definition.placeholder || definition.hint"
              />
            </view>
          </view>
        </view>

        <view v-else-if="step === 3" class="setting-section">
          <view class="section-head">
            <view>
              <text class="section-title">{{ localeText("确认下发任务", "Confirm tasks") }}</text>
              <text class="section-hint">{{ localeText("提交成功仅表示任务创建成功，不代表参数已经在设备生效", "Creation success does not mean parameters are already effective") }}</text>
            </view>
          </view>
          <view class="confirm-summary">
            <view><text>{{ localeText("设备数量", "Devices") }}</text><text>{{ selectedDevices.length }}</text></view>
            <view><text>{{ localeText("修改参数", "Parameters") }}</text><text>{{ enabledParameterCount }}</text></view>
            <view><text>{{ localeText("请求幂等号", "Request ID") }}</text><text>{{ clientRequestId }}</text></view>
          </view>
          <view class="confirm-block">
            <text class="confirm-block__title">{{ localeText("目标设备", "Target devices") }}</text>
            <view class="device-chips"><text v-for="device in selectedDevices" :key="device.deviceNumber">{{ device.deviceNumber }}</text></view>
          </view>
          <view class="confirm-block">
            <text class="confirm-block__title">{{ localeText("本次提交参数", "Submitted parameters") }}</text>
            <view class="parameter-summary">
              <view v-for="item in enabledParameterPreview" :key="item.key"><text>{{ item.label }}</text><text>{{ item.value }}</text></view>
            </view>
          </view>
          <view class="warning-card">{{ localeText("任务会进入异步队列，设备下次连接并进入指令窗口后才会真正下发。", "Tasks enter an asynchronous queue and are sent when devices next connect during the command window.") }}</view>
        </view>

        <view v-else class="setting-section">
          <view class="section-head">
            <view>
              <text class="section-title">{{ localeText("下发任务已创建", "Tasks created") }}</text>
              <text class="section-hint">{{ localeText("平台受理、平台成功和设备确认分开展示", "Platform acceptance, platform success and device confirmation are shown separately") }}</text>
            </view>
            <text class="selected-count">{{ localeText(`共 ${taskResults.length} 台`, `${taskResults.length} devices`) }}</text>
          </view>
          <view class="result-table">
            <view class="result-row result-row--header">
              <text>{{ localeText("设备编号", "Device number") }}</text>
              <text>{{ localeText("任务 ID", "Task ID") }}</text>
              <text>{{ localeText("状态", "Status") }}</text>
              <text>{{ localeText("通道状态", "Channel state") }}</text>
              <text>{{ localeText("发送时间", "Sent at") }}</text>
              <text>{{ localeText("过期时间", "Expires at") }}</text>
            </view>
            <view v-for="task in taskResults" :key="task.settingId || task.id || task.deviceNumber" class="result-row">
              <text>{{ displayValue(task.deviceNumber) }}</text>
              <text>{{ displayValue(task.settingId || task.id) }}</text>
              <text><text class="task-status" :class="getTaskStatusClass(task)">{{ getTaskStatusText(task) }}</text></text>
              <text>{{ getTaskTransportStatus(task) }}</text>
              <text>{{ formatDateTime(task.sentAt) }}</text>
              <text>{{ formatDateTime(task.expiresAt) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="setting-actions">
        <view>
          <button v-if="step > 1 && step < 4" class="action-button" :disabled="submitting" @click="step--">{{ localeText("上一步", "Previous") }}</button>
          <button v-if="step < 3" class="action-button action-button--primary" @click="nextStep">{{ localeText("下一步", "Next") }}</button>
          <button v-else-if="step === 3" class="action-button action-button--primary" :disabled="submitting" @click="submitTasks">
            {{ submitting ? localeText("正在创建…", "Creating…") : localeText("创建下发任务", "Create tasks") }}
          </button>
          <button v-else class="action-button action-button--primary" :disabled="refreshingResults" @click="refreshTaskResults">
            {{ refreshingResults ? localeText("正在刷新…", "Refreshing…") : localeText("刷新任务状态", "Refresh status") }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useLocaleText } from "@/i18n/localeText";
import { getDevicePage } from "@/services/device/info";
import { applyDeviceParameters, getDeviceSettingPage, getDeviceSettingResult } from "@/services/deviceSetting/manage";
import { getDeviceChannel, getDeviceChannelText, getDeviceOnline } from "@/utils/device-channel";
import type { DeviceParameterTask } from "@/services/deviceSetting/manage";

type ApiRecord = Record<string, any>;
interface ParameterOption { label: string; value: string | number }
interface ParameterDefinition {
  key: string;
  label: string;
  hint: string;
  inputType?: "text" | "number" | "digit";
  placeholder?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  pattern?: RegExp;
  options?: ParameterOption[];
}

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submitted", batchId?: string): void;
}>();

const localeText = useLocaleText();
const step = ref(1);
const deviceLoading = ref(false);
const submitting = ref(false);
const refreshingResults = ref(false);
const devices = ref<ApiRecord[]>([]);
const devicePage = reactive({ current: 1, size: 200, total: 0 });
const selectedDevices = ref<ApiRecord[]>([]);
const deviceKeyword = ref("");
const enabledParameters = ref<string[]>([]);
const clientRequestId = ref(createClientRequestId());
const expiresAt = ref("");
const taskResults = ref<ApiRecord[]>([]);
const resultBatchId = ref("");
const openOptionKey = ref("");
let taskPollTimer: ReturnType<typeof setTimeout> | undefined;

const parameterValues = reactive<Record<string, string | number>>({
  measureGainMode: 0,
  gainValue: "",
});

const steps = computed(() => [
  { value: 1, label: localeText("选择设备", "Select devices") },
  { value: 2, label: localeText("设置参数", "Set parameters") },
  { value: 3, label: localeText("确认提交", "Confirm") },
  { value: 4, label: localeText("任务结果", "Results") },
]);

const yesNoOptions = computed<ParameterOption[]>(() => [
  { label: localeText("否", "No"), value: 0 },
  { label: localeText("是", "Yes"), value: 1 },
]);
const gainModeOptions = computed<ParameterOption[]>(() => [
  { label: localeText("自适应增益", "Adaptive gain"), value: 0 },
  { label: localeText("固定增益", "Fixed gain"), value: 1 },
]);
const audioRuleOptions = computed<ParameterOption[]>(() => [
  { label: localeText("不上报", "Do not report"), value: 0 },
  { label: localeText("不漏的不上报", "Report leaks only"), value: 1 },
  { label: localeText("全部上报", "Report all"), value: 2 },
  { label: localeText("逢变则报", "Report on change"), value: 3 },
]);
const workModeOptions = computed<ParameterOption[]>(() => [
  { label: localeText("待启用", "Pending activation"), value: 0 },
  { label: localeText("网络模式", "Network mode"), value: 1 },
  { label: localeText("现场模式", "On-site mode"), value: 2 },
  { label: localeText("网络巡检模式", "Network inspection"), value: 3 },
  { label: localeText("待机模式", "Standby"), value: 4 },
]);

const parameterDefinitions = computed<ParameterDefinition[]>(() => [
  numberDefinition("onceMeasureLength", localeText("单次测量时长", "Measurement duration"), "0～65535", 0, 65535),
  numberDefinition("signalLevel", localeText("信号等级", "Signal level"), "0～31", 0, 31),
  numberDefinition("benchmarkValue", localeText("基准值", "Benchmark value"), "0～255", 0, 255),
  numberDefinition("noiseBenchmarkValue", localeText("噪声基准值", "Noise benchmark"), "0～255", 0, 255),
  numberDefinition("samplingWeekday", localeText("采样星期", "Sampling weekday"), "1～7", 1, 7),
  timeDefinition("samplingTime", localeText("采样时间", "Sampling time")),
  timeDefinition("synchronizationSamplingTime", localeText("同步采样时间", "Synchronized sampling time")),
  numberDefinition("synchronizeSamplingNumber", localeText("同步采样编号", "Synchronized sampling number"), "0～255", 0, 255),
  periodDefinition("samplingPeriodTime", localeText("采样时间段", "Sampling period")),
  optionDefinition("audioRule", localeText("音频上报规则", "Audio reporting rule"), audioRuleOptions.value),
  numberDefinition("reportInterval", localeText("上报间隔（分钟）", "Report interval (minutes)"), "0～65535", 0, 65535),
  optionDefinition("dayMeasureDataGroup", localeText("日测量数据组", "Daily measurement group"), [1, 5, 10, 20, 50, 100].map(value => ({ label: String(value), value }))),
  numberDefinition("leakThreshold", localeText("漏损阈值", "Leak threshold"), "1～99", 1, 99),
  optionDefinition("nb4gTrigger", localeText("NB/4G 触发", "NB/4G trigger"), yesNoOptions.value),
  numberDefinition("nb4gTransferSet", localeText("NB/4G 传输设置", "NB/4G transfer setting"), "1～7", 1, 7),
  periodDefinition("nb4gOpenTimeSet", localeText("NB/4G 开启时段", "NB/4G active period")),
  numberDefinition("loraOpenDay", localeText("LoRa 开启日", "LoRa active day"), "1～7", 1, 7),
  optionDefinition("loraSignalFrequency", localeText("LoRa 信号频率", "LoRa signal frequency"), yesNoOptions.value),
  numberDefinition("loraPower", localeText("LoRa 功率", "LoRa power"), "0～255", 0, 255),
  periodDefinition("loraOpenDate", localeText("LoRa 开启时段", "LoRa active period")),
  optionDefinition("workMode", localeText("工作模式", "Work mode"), workModeOptions.value),
  numberDefinition("thresholdRate", localeText("阈值比例", "Threshold rate"), "0～100", 0, 100),
  numberDefinition("rtcUploadInterval", localeText("RTC 上传间隔", "RTC upload interval"), "0～255", 0, 255),
  numberDefinition("pressureSettings", localeText("压力设置", "Pressure setting"), "0～255", 0, 255),
]);
const legacyParameterKeys = new Set(["signalLevel", "samplingWeekday", "samplingTime", "samplingPeriodTime", "audioRule", "reportInterval", "leakThreshold", "workMode"]);
const effectiveParameterDefinitions = computed(() => parameterDefinitions.value.filter(definition =>
  selectedDevices.value.every(device => getDeviceChannel(device) === "DIRECT_TCP" || device.downlinkProtocolVersion !== "LEGACY" || legacyParameterKeys.has(definition.key)),
));
const gainSupported = computed(() => selectedDevices.value.every(device => getDeviceChannel(device) === "DIRECT_TCP" || device.downlinkProtocolVersion !== "LEGACY"));

const filteredDevices = computed(() => {
  const keyword = deviceKeyword.value.trim().toLowerCase();
  if (!keyword) return devices.value;
  return devices.value.filter(device =>
    [device.deviceNumber, device.deviceAlias, device.deviceName].some(value => String(value || "").toLowerCase().includes(keyword)),
  );
});
const allVisibleSelected = computed(() => {
  const visibleDevices = filteredDevices.value.filter(isDeviceSelectable).slice(0, 200);
  return visibleDevices.length > 0 && visibleDevices.every(isDeviceSelected);
});
const enabledParameterCount = computed(() =>
  enabledParameters.value.reduce((count, key) => count + (key === "gainGroup" ? 2 : 1), 0),
);
const gainModeIndex = computed(() => Math.max(0, gainModeOptions.value.findIndex(option => option.value === Number(parameterValues.measureGainMode))));
const enabledParameterPreview = computed(() =>
  Object.entries(buildParameters()).map(([key, value]) => ({
    key,
    label: getParameterLabel(key),
    value: formatParameterPreview(key, value),
  })),
);

onMounted(loadDevices);
onBeforeUnmount(() => {
  if (taskPollTimer) clearTimeout(taskPollTimer);
});

function numberDefinition(key: string, label: string, hint: string, min: number, max: number): ParameterDefinition {
  return { key, label, hint, min, max, integer: true, inputType: "number" };
}

function timeDefinition(key: string, label: string): ParameterDefinition {
  return { key, label, hint: "HH:mm:ss", placeholder: "08:30:00", pattern: /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/ };
}

function periodDefinition(key: string, label: string): ParameterDefinition {
  return { key, label, hint: "HH:mm-HH:mm", placeholder: "01:00-04:00", pattern: /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/ };
}

function optionDefinition(key: string, label: string, options: ParameterOption[]): ParameterDefinition {
  return { key, label, hint: localeText("请选择", "Select"), options };
}

async function loadDevices() {
  deviceLoading.value = true;
  try {
    const page = unwrapResponse(await getDevicePage({ pageNum: devicePage.current, pageSize: devicePage.size, deviceNumber: deviceKeyword.value.trim() || undefined }));
    devices.value = getPageRecords(page);
    devicePage.total = Number(page?.total ?? devices.value.length) || 0;
  } catch (error) {
    showError(error, localeText("设备列表加载失败", "Failed to load devices"));
    devices.value = [];
    devicePage.total = 0;
  } finally {
    deviceLoading.value = false;
  }
}

async function searchDevices() {
  devicePage.current = 1;
  await loadDevices();
}

async function changeDevicePage(delta: number) {
  devicePage.current = Math.max(1, devicePage.current + delta);
  await loadDevices();
}

function toggleDevice(device: ApiRecord) {
  if (!isDeviceSelectable(device)) return showToast(getDeviceAvailability(device));
  const index = selectedDevices.value.findIndex(item => item.deviceNumber === device.deviceNumber);
  if (index >= 0) selectedDevices.value.splice(index, 1);
  else if (selectedDevices.value.length < 200) selectedDevices.value.push(device);
  else showToast(localeText("单次最多选择 200 台设备", "Select up to 200 devices"));
}

function toggleAllDevices() {
  const selectable = filteredDevices.value.slice(0, 200).filter(isDeviceSelectable);
  if (allVisibleSelected.value) {
    const numbers = new Set(selectable.map(device => device.deviceNumber));
    selectedDevices.value = selectedDevices.value.filter(device => !numbers.has(device.deviceNumber));
  } else {
    const selectedNumbers = new Set(selectedDevices.value.map(device => device.deviceNumber));
    selectedDevices.value = [...selectedDevices.value, ...selectable.filter(device => !selectedNumbers.has(device.deviceNumber))].slice(0, 200);
  }
}

function isDeviceSelected(device: ApiRecord) {
  return selectedDevices.value.some(item => item.deviceNumber === device.deviceNumber);
}

function isDeviceOnline(device: ApiRecord): boolean | null {
  return getDeviceOnline(device);
}

function isDeviceSelectable(device: ApiRecord) {
  const channel = getDeviceChannel(device);
  if (channel === "INVALID" || Number(device.enableState) === 0) return false;
  if (channel !== "DIRECT_TCP" && (!device.productId || !String(device.nbNumber ?? "").trim() || !device.downlinkProtocolVersion)) return false;
  if (isDeviceOnline(device) === true) return false;
  return true;
}

function getDeviceAvailability(device: ApiRecord) {
  if (getDeviceChannel(device) === "INVALID") return localeText("协议配置异常", "Invalid protocol");
  if (Number(device.enableState) === 0) return localeText("设备已停用", "Disabled");
  if (getDeviceChannel(device) !== "DIRECT_TCP" && (!device.productId || !String(device.nbNumber ?? "").trim() || !device.downlinkProtocolVersion)) return localeText("云配置不完整", "Cloud profile incomplete");
  if (isDeviceOnline(device) === true) return localeText("在线，暂不可设置", "Online; unavailable");
  return localeText("可设置", "Available");
}

function getOnlineText(device: ApiRecord) {
  const status = isDeviceOnline(device);
  return status === null ? localeText("未知", "Unknown") : status ? localeText("在线", "Online") : localeText("离线", "Offline");
}

function toggleParameter(key: string) {
  closeOptionMenu();
  if ((key === "gainGroup" && !gainSupported.value) || (key !== "gainGroup" && !effectiveParameterDefinitions.value.some(definition => definition.key === key))) {
    return showToast(localeText("所选旧协议设备不支持该参数", "Selected legacy devices do not support this parameter"));
  }
  const index = enabledParameters.value.indexOf(key);
  if (index >= 0) enabledParameters.value.splice(index, 1);
  else {
    enabledParameters.value.push(key);
    initializeParameterValue(key);
  }
}

function initializeParameterValue(key: string) {
  if (key === "gainGroup") {
    parameterValues.measureGainMode = 0;
    return;
  }
  const definition = parameterDefinitions.value.find(item => item.key === key);
  if (definition?.options && (parameterValues[key] === undefined || parameterValues[key] === "")) {
    parameterValues[key] = definition.options[0]?.value ?? "";
  }
}

function isParameterEnabled(key: string) {
  return enabledParameters.value.includes(key);
}

function getOptionIndex(definition: ParameterDefinition) {
  return Math.max(0, definition.options?.findIndex(option => String(option.value) === String(parameterValues[definition.key])) ?? 0);
}

function getOptionLabel(definition: ParameterDefinition) {
  return definition.options?.[getOptionIndex(definition)]?.label || localeText("请选择", "Select");
}

function toggleOptionMenu(key: string) {
  const parameterKey = key === "gainMode" ? "gainGroup" : key;
  if (!isParameterEnabled(parameterKey)) return;
  openOptionKey.value = openOptionKey.value === key ? "" : key;
}

function closeOptionMenu() {
  openOptionKey.value = "";
}

function selectOption(definition: ParameterDefinition, option: ParameterOption) {
  parameterValues[definition.key] = option.value;
  closeOptionMenu();
}

function selectGainMode(option: ParameterOption) {
  parameterValues.measureGainMode = option.value;
  closeOptionMenu();
}

function nextStep() {
  if (step.value === 1) {
    if (!selectedDevices.value.length) return showToast(localeText("请选择至少一台设备", "Select at least one device"));
    step.value = 2;
    return;
  }
  const validation = validateForm();
  if (validation) return showToast(validation);
  step.value = 3;
}

async function submitTasks() {
  const validation = validateForm();
  if (validation) return showToast(validation);
  submitting.value = true;
  try {
    const result = unwrapResponse(await applyDeviceParameters({
      deviceNumbers: selectedDevices.value.map(device => String(device.deviceNumber)),
      parameters: buildParameters(),
      clientRequestId: clientRequestId.value.trim() || undefined,
      expiresAt: expiresAt.value.trim() || undefined,
    }));
    resultBatchId.value = String(result?.batchId || clientRequestId.value || "");
    taskResults.value = Array.isArray(result?.tasks) ? result.tasks : [];
    step.value = 4;
    showToast(localeText("下发任务已创建", "Tasks created"));
    emit("submitted", resultBatchId.value || undefined);
    scheduleTaskRefresh();
  } catch (error) {
    showError(error, localeText("创建参数下发任务失败", "Failed to create parameter tasks"));
  } finally {
    submitting.value = false;
  }
}

async function refreshTaskResults() {
  if (!resultBatchId.value) return;
  refreshingResults.value = true;
  try {
    const page = unwrapResponse(await getDeviceSettingPage({
      pageNum: 1,
      pageSize: 200,
      recordSource: "COMMAND",
      batchId: resultBatchId.value,
      sortOrder: "asc",
    }));
    const historyRows = getPageRecords(page).map(normalizeTask);
    const merged = new Map<string, ApiRecord>();
    for (const task of taskResults.value) merged.set(String(task.settingId ?? task.id ?? task.deviceNumber), task);
    for (const row of historyRows) {
      const key = String(row.settingId ?? row.id ?? row.deviceNumber);
      merged.set(key, { ...merged.get(key), ...row });
    }
    taskResults.value = [...merged.values()];
    await Promise.all(taskResults.value.slice(0, 20).map(async task => {
      if (!task.settingId) return;
      try {
        const result = normalizeTask(unwrapResponse(await getDeviceSettingResult(task.settingId)));
        const index = taskResults.value.findIndex(item => String(item.settingId ?? item.id) === String(task.settingId));
        if (index >= 0) taskResults.value.splice(index, 1, { ...taskResults.value[index], ...result });
      } catch { /* Keep the last known task state when a result refresh fails. */ }
    }));
    showToast(localeText("任务状态已刷新", "Task status refreshed"));
  } catch (error) {
    showError(error, localeText("任务状态刷新失败", "Failed to refresh task status"));
  } finally {
    refreshingResults.value = false;
    scheduleTaskRefresh();
  }
}

function scheduleTaskRefresh() {
  if (taskPollTimer) clearTimeout(taskPollTimer);
  if (step.value !== 4 || !taskResults.value.some(isTaskPending)) return;
  taskPollTimer = setTimeout(() => { void refreshTaskResults(); }, 5000);
}

function isTaskPending(task: ApiRecord) {
  const status = Number(task.executeStatus ?? task.commandExecuteStatus);
  if ([4, 5].includes(status)) return false;
  if (status === 6 && (task.deviceConfirmed === true || String(task.confirmationSource).toUpperCase() === "PLATFORM")) return false;
  if (status >= 0 && status <= 3) return true;
  return !["FAILED", "EXPIRED", "CANCELED", "SUCCESS"].includes(String(task.status || task.commandStatus || "").toUpperCase());
}

function normalizeTask(source: ApiRecord): ApiRecord {
  return {
    ...source,
    settingId: source.settingId ?? source.id,
    commandId: source.commandId ?? source.commandSendLogId,
    executeStatus: source.executeStatus ?? source.commandExecuteStatus,
    status: source.status ?? source.commandStatus,
    feedback: source.feedback ?? source.commandFeedback,
    sentAt: source.sentAt ?? source.commandSentAt ?? source.sendTime,
    expiresAt: source.expiresAt ?? source.commandExpiresAt,
  };
}

function validateForm() {
  if (!enabledParameters.value.length) return localeText("请至少启用一个参数", "Enable at least one parameter");
  if (!gainSupported.value && isParameterEnabled("gainGroup")) return localeText("LEGACY 协议不支持测量增益设置", "LEGACY does not support measurement gain");
  if (enabledParameters.value.some(key => key !== "gainGroup" && !effectiveParameterDefinitions.value.some(definition => definition.key === key))) return localeText("所选 LEGACY 设备不支持部分已选参数", "Some selected parameters are unsupported by LEGACY devices");
  if (clientRequestId.value && !/^[A-Za-z0-9._-]{1,48}$/.test(clientRequestId.value)) {
    return localeText("请求幂等号只能包含字母、数字、点、下划线和短横线", "Invalid client request ID");
  }
  if (expiresAt.value) {
    const timestamp = new Date(expiresAt.value).getTime();
    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return localeText("任务过期时间必须晚于当前时间", "Expiry must be in the future");
  }
  if (isParameterEnabled("gainGroup") && gainSupported.value) {
    const gain = Number(parameterValues.gainValue);
    if (parameterValues.gainValue === "" || !Number.isFinite(gain) || gain < 0 || gain > 999.9 || !/^\d{1,3}(\.\d)?$/.test(String(parameterValues.gainValue))) {
      return localeText("增益值必须为 0.0～999.9，且最多一位小数", "Gain must be 0.0–999.9 with at most one decimal");
    }
  }
  for (const definition of effectiveParameterDefinitions.value) {
    if (!isParameterEnabled(definition.key)) continue;
    const value = parameterValues[definition.key];
    if (value === "" || value === undefined || value === null) return localeText(`请填写${definition.label}`, `Enter ${definition.label}`);
    if (definition.pattern && !definition.pattern.test(String(value))) return localeText(`${definition.label}格式应为 ${definition.hint}`, `${definition.label} must match ${definition.hint}`);
    if (definition.min !== undefined) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < definition.min || numeric > Number(definition.max)) return localeText(`${definition.label}范围为 ${definition.hint}`, `${definition.label} range: ${definition.hint}`);
      if (definition.integer && !Number.isInteger(numeric)) return localeText(`${definition.label}必须为整数`, `${definition.label} must be an integer`);
    }
  }
  return "";
}

function buildParameters() {
  const parameters: Record<string, string | number> = {};
  if (isParameterEnabled("gainGroup")) {
    parameters.measureGainMode = Number(parameterValues.measureGainMode);
    parameters.gainValue = Number(parameterValues.gainValue);
  }
  for (const definition of parameterDefinitions.value) {
    if (!isParameterEnabled(definition.key)) continue;
    const value = parameterValues[definition.key];
    parameters[definition.key] = definition.min !== undefined || definition.options ? Number(value) : String(value);
  }
  return parameters;
}

function getParameterLabel(key: string) {
  if (key === "measureGainMode") return localeText("测量增益模式", "Gain mode");
  if (key === "gainValue") return localeText("增益值", "Gain value");
  return parameterDefinitions.value.find(item => item.key === key)?.label || key;
}

function formatParameterPreview(key: string, value: string | number) {
  if (key === "measureGainMode") return gainModeOptions.value.find(option => option.value === value)?.label || String(value);
  const definition = parameterDefinitions.value.find(item => item.key === key);
  return definition?.options?.find(option => String(option.value) === String(value))?.label || String(value);
}

function getTaskStatusText(task: ApiRecord) {
  const status = task.status ?? task.commandStatus;
  const executeStatus = Number(task.executeStatus);
  if ([4, 5].includes(executeStatus)) return displayValue(task.feedback, executeStatus === 4 ? localeText("下发失败", "Dispatch failed") : localeText("已取消或过期", "Canceled or expired"));
  if (task.deviceConfirmed === true && String(task.confirmationSource).toUpperCase() === "DEVICE") return localeText("设备已确认执行完成", "Confirmed by device");
  if (executeStatus === 6 && String(task.confirmationSource).toUpperCase() === "PLATFORM") return localeText("平台返回成功，尚无设备级确认", "Platform succeeded; no device confirmation");
  const executeLabels: Record<number, string> = {
    0: localeText("排队中", "Queued"), 1: localeText("处理中或待发送", "Processing or pending"),
    2: localeText("已提交或已发送", "Submitted or sent"), 3: localeText("已送达", "Delivered"),
    4: localeText("下发失败", "Dispatch failed"), 5: localeText("已取消或过期", "Canceled or expired"),
    6: localeText("成功结果已返回", "Success result returned"),
  };
  if (executeLabels[executeStatus]) return executeLabels[executeStatus];
  const value = String(status || "").toUpperCase();
  const labels: Record<string, string> = {
    QUEUED: localeText("等待设备连接", "Waiting for device"),
    CLAIMED: localeText("正在下发", "Dispatching"),
    TCP_SENT: localeText("已写入连接，等待设备后续上报确认", "Written to TCP; awaiting later device report"),
    FAILED: localeText("下发失败", "Dispatch failed"),
    EXPIRED: localeText("等待下发已过期", "Dispatch expired"),
    CANCELED: localeText("已取消", "Cancelled"),
    NOT_QUEUED: localeText("指令创建异常", "Command creation failed"),
    DEVICE_DELIVERED: localeText("设备已送达", "Delivered"),
    SUCCESS: localeText("成功结果已返回", "Success result returned"),
    PLATFORM_ACCEPTED: localeText("平台已受理", "Accepted by platform"),
  };
  return labels[value] || displayValue(status, localeText("未知状态", "Unknown"));
}

function getTaskStatusClass(task: ApiRecord) {
  const status = task.status ?? task.commandStatus;
  const value = String(status || "").toUpperCase();
  if ([4, 5].includes(Number(task.executeStatus)) || ["FAILED", "EXPIRED", "NOT_QUEUED"].includes(value)) return "task-status--danger";
  if (task.deviceConfirmed === true || ["DEVICE_DELIVERED", "SUCCESS"].includes(value)) return "task-status--success";
  if (task.platformStatus) return "task-status--warning";
  if (value === "TCP_SENT") return "task-status--primary";
  if (value === "CLAIMED") return "task-status--warning";
  return "task-status--default";
}

function getTaskTransportStatus(task: ApiRecord) {
  const channel = String(task.transportChannel || "");
  const online = channel === "DIRECT_TCP" ? task.tcpOnline : task.cloudOnline;
  const onlineText = online === true ? localeText("在线", "Online") : online === false ? localeText("离线", "Offline") : localeText("未知", "Unknown");
  const channelText = channel || localeText("历史通道未知", "Historical channel unknown");
  return `${channelText} · ${onlineText}${task.platformStatus ? ` · ${task.platformStatus}` : ""}${task.deviceConfirmed === true ? ` · ${localeText("设备已确认", "Device confirmed")}` : ""}`;
}

function createClientRequestId() {
  return `device-setting-${Date.now()}`.slice(0, 48);
}

function unwrapResponse(response: any) {
  if (response?.code !== undefined && response.code !== 200 && response.code !== 0) throw new Error(response.msg || response.message || "Request failed");
  return response?.data ?? response;
}

function getPageRecords(page: any): ApiRecord[] {
  if (Array.isArray(page)) return page;
  const records = page?.records ?? page?.list ?? page?.content;
  return Array.isArray(records) ? records : [];
}

function displayValue(value: unknown, fallback = "--") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function formatDateTime(value: unknown) {
  if (!value) return "--";
  return String(value).replace("T", " ").replace(/(\.\d{3})\d+/, "$1").replace(/Z$/, "");
}

function showToast(title: string) {
  uni.showToast({ title, icon: "none", duration: 2600 });
}

function showError(error: any, fallback: string) {
  showToast(error?.msg || error?.message || fallback);
}

function closeDialog() {
  if (!submitting.value) emit("close");
}
</script>

<style scoped lang="scss">
.setting-mask { position: fixed; z-index: 3200; inset: 0; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(20, 39, 56, 0.58); box-sizing: border-box; }
.setting-modal { display: flex; flex-direction: column; width: min(1080px, 86vw); height: min(760px, 84vh); overflow: hidden; background: #fff; border: 1px solid #c9d9e6; border-radius: 8px; box-shadow: 0 26px 70px rgba(13, 39, 59, 0.3); }
.setting-head { position: relative; flex: none; display: flex; align-items: center; min-height: 68px; padding: 14px 72px 14px 20px; background: #fbfdff; border-bottom: 1px solid #e2eaf1; box-sizing: border-box; }.setting-head > view { display: flex; flex-direction: column; gap: 4px; }.setting-head__eyebrow { color: #8192a2; font-size: 13px; font-weight: 700; }.setting-head__title { color: #23435e; font-size: 21px; font-weight: 900; }.setting-close { position: absolute; top: 14px; right: 20px; display: inline-flex; align-items: center; justify-content: center; width: 40px; min-width: 40px; height: 40px; padding: 0; color: #718497; font-size: 28px; font-weight: 400; line-height: 40px; background: transparent; border: 0; border-radius: 0; box-sizing: border-box; }.setting-close::after { border: 0; }
.setting-steps { flex: none; display: grid; grid-template-columns: repeat(4, 1fr); padding: 14px 20px; background: #f5f9fc; border-bottom: 1px solid #e2eaf1; }.setting-step { display: flex; align-items: center; justify-content: center; gap: 8px; color: #8495a5; font-size: 14px; font-weight: 800; }.setting-step__number { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #fff; border: 1px solid #c5d5e2; border-radius: 50%; box-sizing: border-box; }.setting-step--active { color: #0874cb; }.setting-step--active .setting-step__number { color: #fff; background: #0d82ee; border-color: #0d82ee; }.setting-step--done { color: #208a5f; }.setting-step--done .setting-step__number { color: #fff; background: #27a471; border-color: #27a471; }
.setting-body { flex: 1; height: auto; min-height: 0; padding: 20px 24px; background: #f7fafc; box-sizing: border-box; }.setting-section { width: 100%; max-width: 1120px; margin: 0 auto; }.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; gap: 12px; }.section-head > view { display: flex; flex-direction: column; gap: 5px; }.section-title { color: #294b66; font-size: 19px; font-weight: 900; }.section-hint { color: #7d90a2; font-size: 13px; }.selected-count { flex: none; padding: 6px 12px; color: #0875cc; font-size: 13px; font-weight: 900; background: #e8f4fe; border: 1px solid #c6e2f8; border-radius: 999px; }
.device-filter { display: flex; margin-bottom: 12px; gap: 10px; }.control { width: 100%; height: 40px; padding: 0 11px; color: #294b66; font-size: 14px; background: #fff; border: 1px solid #cfdeea; border-radius: 4px; box-sizing: border-box; }.control[disabled], .control--picker[disabled] { color: #9aa9b6; background: #f1f4f6; }.control--picker { line-height: 40px; }.small-button { flex: none; height: 40px; padding: 0 15px; color: #31506d; font-size: 13px; line-height: 40px; background: #f6fbff; border: 1px solid #cbdced; border-radius: 4px; }
.device-table, .result-table { overflow: hidden; background: #fff; border: 1px solid #d9e4ec; border-radius: 5px; }.device-row { display: grid; grid-template-columns: 52px 1.1fr 1.4fr 110px 160px; min-height: 48px; border-bottom: 1px solid #edf2f6; cursor: pointer; }.device-row > text, .result-row > text { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 8px 10px; overflow: hidden; color: #405c73; font-size: 13px; text-align: center; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #edf2f6; box-sizing: border-box; }.device-row--header, .result-row--header { min-height: 50px; color: #4c657a; font-weight: 900; background: #f4f8fb; cursor: default; }.device-row--selected { background: #eaf5ff; }.checkbox { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: #fff; font-size: 14px; background: #fff; border: 1px solid #aebfcd; border-radius: 3px; box-sizing: border-box; }.device-row--selected .checkbox, .parameter-card--enabled .checkbox { background: #0d82ee; border-color: #0d82ee; }.online-tag, .task-status { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; padding: 2px 9px; font-size: 12px; font-weight: 800; white-space: nowrap; border-radius: 999px; box-sizing: border-box; }.online-tag--online { color: #16744b; background: #e9f8ef; }.online-tag--offline { color: #6d7e8e; background: #f0f3f6; }
.request-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 14px; gap: 12px; }.form-field { display: flex; flex-direction: column; padding: 12px; gap: 7px; background: #fff; border: 1px solid #dce6ed; border-radius: 5px; }.form-label { color: #3d5b73; font-size: 14px; font-weight: 900; }.form-hint { color: #8496a6; font-size: 11px; }
.parameter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.parameter-card { display: flex; flex-direction: column; min-height: 128px; padding: 12px; gap: 10px; background: #fff; border: 1px solid #dce6ed; border-radius: 5px; box-sizing: border-box; }.parameter-card--enabled { background: #f4faff; border-color: #8bc4ed; }.parameter-card__head { display: flex; align-items: flex-start; gap: 9px; cursor: pointer; }.parameter-card__head > view { display: flex; flex-direction: column; gap: 3px; }.parameter-card__head > view text:first-child { color: #35556d; font-size: 14px; font-weight: 900; }.parameter-card__head > view text:last-child { color: #8496a6; font-size: 11px; }.gain-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.parameter-select { position: relative; z-index: 5; width: 100%; }.parameter-select--open { z-index: 4100; }.parameter-select--disabled { opacity: 0.62; cursor: not-allowed; }.parameter-select__trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; }.parameter-select--disabled .parameter-select__trigger { cursor: not-allowed; }.parameter-select__arrow { flex: none; width: 7px; height: 7px; margin: 0 3px 4px 0; border-right: 1.5px solid #6d8295; border-bottom: 1.5px solid #6d8295; transform: rotate(45deg); }.parameter-select__menu { position: absolute; top: calc(100% + 4px); right: 0; left: 0; z-index: 4100; max-height: 220px; padding: 4px 0; overflow-y: auto; background: #fff; border: 1px solid #cbdbe7; border-radius: 4px; box-shadow: 0 10px 24px rgba(31, 67, 95, 0.2); }.parameter-select__option { min-height: 36px; padding: 0 11px; color: #35556d; font-size: 13px; line-height: 36px; cursor: pointer; box-sizing: border-box; }.parameter-select__option:hover { color: #0875cc; background: #edf7ff; }.parameter-select__option--active { color: #0875cc; font-weight: 800; background: #eaf5ff; }
.confirm-summary { display: grid; grid-template-columns: 150px 150px minmax(0, 1fr); margin-bottom: 14px; gap: 10px; }.confirm-summary > view { display: flex; flex-direction: column; padding: 12px; gap: 5px; background: #eef7ff; border: 1px solid #d2e8f8; border-radius: 5px; }.confirm-summary text:first-child { color: #778c9e; font-size: 12px; }.confirm-summary text:last-child { overflow: hidden; color: #285773; font-size: 15px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }.confirm-block { margin-top: 12px; padding: 13px; background: #fff; border: 1px solid #dce6ed; border-radius: 5px; }.confirm-block__title { display: block; margin-bottom: 9px; color: #35556d; font-size: 14px; font-weight: 900; }.device-chips { display: flex; flex-wrap: wrap; gap: 6px; }.device-chips text { padding: 4px 8px; color: #315e7c; font-size: 12px; background: #edf6fc; border-radius: 4px; }.parameter-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: #e3ebf1; border: 1px solid #e3ebf1; }.parameter-summary > view { display: flex; justify-content: space-between; padding: 9px 10px; gap: 12px; background: #fff; }.parameter-summary text:first-child { color: #718598; font-size: 12px; }.parameter-summary text:last-child { color: #31516c; font-size: 12px; font-weight: 800; }.warning-card { margin-top: 12px; padding: 11px 12px; color: #9a5a13; font-size: 13px; line-height: 1.5; background: #fff8eb; border: 1px solid #f0d39e; border-radius: 5px; }
.result-row { display: grid; grid-template-columns: 150px 100px minmax(260px, 1.5fr) 80px 170px 170px; min-height: 50px; border-bottom: 1px solid #edf2f6; }.task-status--primary { color: #0875cc; background: #eaf5ff; }.task-status--warning { color: #a35b0b; background: #fff5e5; }.task-status--success { color: #177245; background: #eaf8ef; }.task-status--danger { color: #b33f3f; background: #fff0f0; }.task-status--default { color: #617589; background: #f0f3f6; }
.empty-state { padding: 42px 12px; color: #7a8d9f; font-size: 13px; text-align: center; }.setting-actions { flex: none; display: flex; align-items: center; justify-content: flex-end; min-height: 70px; padding: 13px 18px; background: #fff; border-top: 1px solid #e2eaf1; box-sizing: border-box; }.setting-actions > view { display: flex; gap: 10px; }.action-button { display: inline-flex; align-items: center; justify-content: center; min-width: 88px; height: 40px; padding: 0 17px; color: #31516d; font-size: 14px; font-weight: 800; line-height: 40px; background: #fff; border: 1px solid #c9d9e7; border-radius: 4px; }.action-button--primary { color: #fff; background: #0d82ee; border-color: #0d82ee; }.action-button[disabled] { opacity: 0.55; }
.online-tag--unknown { color: #8a5c0a; background: #fff5df; }.device-row--unavailable { opacity: .65; }.parameter-card--unsupported { opacity: .72; }.device-pager { display: flex; align-items: center; justify-content: center; margin-top: 10px; gap: 12px; color: #718698; font-size: 12px; }
@media (max-width: 980px) { .parameter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.request-meta { grid-template-columns: 1fr; }.setting-step { font-size: 12px; } }
</style>
