<template>
  <view class="command-configuration">
    <view class="command-toolbar">
      <view class="toolbar__filters">
        <view class="filter-field filter-field--keyword">
          <text class="filter-label">指令检索</text>
          <input
            v-model="filters.keyword"
            class="filter-input"
            placeholder="输入指令名称、指令码或设备型号"
            placeholder-class="input-placeholder"
            @confirm="searchCommands"
          />
        </view>

        <view class="filter-field">
          <text class="filter-label">指令类型</text>
          <picker :range="categoryOptions" range-key="label" :value="currentCategoryIndex" @change="handleCategoryChange">
            <view class="filter-select">
              <text>{{ currentCategoryLabel }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-field">
          <text class="filter-label">启用状态</text>
          <picker :range="statusOptions" range-key="label" :value="currentStatusIndex" @change="handleStatusChange">
            <view class="filter-select">
              <text>{{ currentStatusLabel }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>
      </view>

      <view class="toolbar__actions">
        <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchCommands">查询</button>
        <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
        <button class="icon-button" hover-class="icon-button--hover" aria-label="刷新" @click="refreshCommands">
          <text class="icon-refresh"></text>
        </button>
      </view>
    </view>

    <view class="summary-grid">
      <view v-for="item in summaryCards" :key="item.label" class="summary-card" :class="`summary-card--${item.tone}`">
        <view class="summary-card__head">
          <text class="summary-card__label">{{ item.label }}</text>
          <text class="summary-card__mark"></text>
        </view>
        <view class="summary-card__body">
          <text class="summary-card__value">{{ item.value }}</text>
          <text class="summary-card__unit">{{ item.unit }}</text>
        </view>
      </view>
    </view>

    <view class="command-layout">
      <view class="table-panel">
        <view class="table-head">
          <view class="table-head__title-group">
            <text class="table-head__title">TCP 指令配置</text>
            <text class="table-head__subtitle">维护采集设备常用 TCP 指令帧、超时与重试策略</text>
          </view>
          <text class="table-head__meta">共 {{ filteredCommands.length }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--name">指令名称</text>
              <text class="data-cell data-cell--code">指令码</text>
              <text class="data-cell data-cell--category">类型</text>
              <text class="data-cell data-cell--direction">方向</text>
              <text class="data-cell data-cell--port">TCP 端口</text>
              <text class="data-cell data-cell--timeout">超时</text>
              <text class="data-cell data-cell--retry">重试</text>
              <text class="data-cell data-cell--status">状态</text>
              <text class="data-cell data-cell--time">更新时间</text>
            </view>

            <view v-if="filteredCommands.length === 0" class="table-state">暂无匹配的指令配置</view>
            <view
              v-for="(item, index) in filteredCommands"
              v-else
              :key="item.id"
              class="data-row"
              :class="{ 'data-row--active': selectedCommand?.id === item.id }"
              @click="selectCommand(item)"
            >
              <text class="data-cell data-cell--index">{{ index + 1 }}</text>
              <text class="data-cell data-cell--name">{{ item.name }}</text>
              <text class="data-cell data-cell--code">{{ item.commandCode }}</text>
              <text class="data-cell data-cell--category">{{ getCategoryLabel(item.category) }}</text>
              <text class="data-cell data-cell--direction">{{ getDirectionLabel(item.direction) }}</text>
              <text class="data-cell data-cell--port">{{ item.tcpPort }}</text>
              <text class="data-cell data-cell--timeout">{{ item.timeoutMs }} ms</text>
              <text class="data-cell data-cell--retry">{{ item.retryTimes }} 次</text>
              <text class="data-cell data-cell--status">
                <text class="status-pill" :class="item.enabled ? 'status-pill--enabled' : 'status-pill--disabled'">
                  {{ item.enabled ? "启用" : "停用" }}
                </text>
              </text>
              <text class="data-cell data-cell--time">{{ item.updatedAt }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="detail-panel">
        <view v-if="!selectedCommand" class="detail-empty">请选择左侧指令查看配置详情</view>
        <template v-else>
          <view class="detail-head">
            <view class="detail-head__title-group">
              <text class="detail-head__label">指令信息</text>
              <text class="detail-head__title">{{ selectedCommand.name }}</text>
            </view>
            <text class="status-pill" :class="selectedCommand.enabled ? 'status-pill--enabled' : 'status-pill--disabled'">
              {{ selectedCommand.enabled ? "启用" : "停用" }}
            </text>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <view class="detail-summary">
              <view class="summary-item">
                <text class="summary-item__label">指令码</text>
                <text class="summary-item__value">{{ selectedCommand.commandCode }}</text>
              </view>
              <view class="summary-item">
                <text class="summary-item__label">协议版本</text>
                <text class="summary-item__value">{{ selectedCommand.protocolVersion }}</text>
              </view>
              <view class="summary-item">
                <text class="summary-item__label">关联设备</text>
                <text class="summary-item__value">{{ selectedCommand.deviceModel }}</text>
              </view>
            </view>

            <view class="form-section">
              <view class="form-section__head">
                <text class="form-section__title">基础配置</text>
                <button
                  v-if="!editing"
                  class="mini-button mini-button--primary"
                  hover-class="mini-button--hover"
                  @click="startEdit"
                >
                  编辑
                </button>
              </view>

              <view class="form-grid">
                <view class="form-field form-field--wide">
                  <text class="form-label form-label--required">指令名称</text>
                  <input v-model="form.name" class="form-input" :disabled="!editing" placeholder="请输入指令名称" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label form-label--required">指令码</text>
                  <input v-model="form.commandCode" class="form-input form-input--mono" :disabled="!editing" placeholder="0x00" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label">指令类型</text>
                  <picker :disabled="!editing" :range="editCategoryOptions" range-key="label" :value="editCategoryIndex" @change="handleFormCategoryChange">
                    <view class="form-select" :class="{ 'form-select--disabled': !editing }">{{ getCategoryLabel(form.category) }}</view>
                  </picker>
                </view>

                <view class="form-field">
                  <text class="form-label">通讯方向</text>
                  <picker :disabled="!editing" :range="directionOptions" range-key="label" :value="editDirectionIndex" @change="handleFormDirectionChange">
                    <view class="form-select" :class="{ 'form-select--disabled': !editing }">{{ getDirectionLabel(form.direction) }}</view>
                  </picker>
                </view>

                <view class="form-field">
                  <text class="form-label">启用状态</text>
                  <picker :disabled="!editing" :range="enabledOptions" range-key="label" :value="editEnabledIndex" @change="handleFormEnabledChange">
                    <view class="form-select" :class="{ 'form-select--disabled': !editing }">{{ form.enabled ? "启用" : "停用" }}</view>
                  </picker>
                </view>

                <view class="form-field">
                  <text class="form-label">TCP 端口</text>
                  <input v-model="form.tcpPort" class="form-input" type="number" :disabled="!editing" placeholder="请输入端口" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label">超时时间(ms)</text>
                  <input v-model="form.timeoutMs" class="form-input" type="number" :disabled="!editing" placeholder="请输入超时时间" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label">重试次数</text>
                  <input v-model="form.retryTimes" class="form-input" type="number" :disabled="!editing" placeholder="请输入重试次数" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label">协议版本</text>
                  <input v-model="form.protocolVersion" class="form-input" :disabled="!editing" placeholder="请输入协议版本" placeholder-class="input-placeholder" />
                </view>

                <view class="form-field">
                  <text class="form-label">适用设备</text>
                  <input v-model="form.deviceModel" class="form-input" :disabled="!editing" placeholder="请输入设备型号" placeholder-class="input-placeholder" />
                </view>
              </view>
            </view>

            <view class="form-section">
              <view class="form-section__head">
                <text class="form-section__title">报文配置</text>
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label form-label--required">请求帧模板</text>
                <textarea
                  v-model="form.requestFrame"
                  class="form-textarea form-textarea--mono"
                  :disabled="!editing"
                  auto-height
                  placeholder="请输入 TCP 请求帧模板"
                  placeholder-class="input-placeholder"
                />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">响应判定</text>
                <textarea
                  v-model="form.responseRule"
                  class="form-textarea"
                  :disabled="!editing"
                  auto-height
                  placeholder="请输入响应解析或成功判定规则"
                  placeholder-class="input-placeholder"
                />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">说明备注</text>
                <textarea
                  v-model="form.remark"
                  class="form-textarea"
                  :disabled="!editing"
                  auto-height
                  placeholder="请输入指令用途、注意事项或现场说明"
                  placeholder-class="input-placeholder"
                />
              </view>
            </view>
          </scroll-view>

          <view class="detail-actions">
            <button class="toolbar-button" :disabled="!editing" hover-class="toolbar-button--hover" @click="cancelEdit">取消</button>
            <button class="toolbar-button toolbar-button--primary" :disabled="!editing" hover-class="toolbar-button--hover" @click="saveCommand">保存配置</button>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type CommandCategory = "sampling" | "control" | "diagnosis" | "maintenance";
type CommandDirection = "downlink" | "uplink" | "duplex";

interface CommandRecord {
  id: number;
  name: string;
  commandCode: string;
  category: CommandCategory;
  direction: CommandDirection;
  tcpPort: number;
  timeoutMs: number;
  retryTimes: number;
  enabled: boolean;
  protocolVersion: string;
  deviceModel: string;
  requestFrame: string;
  responseRule: string;
  remark: string;
  updatedAt: string;
}

interface CommandForm {
  id: number;
  name: string;
  commandCode: string;
  category: CommandCategory;
  direction: CommandDirection;
  tcpPort: string;
  timeoutMs: string;
  retryTimes: string;
  enabled: boolean;
  protocolVersion: string;
  deviceModel: string;
  requestFrame: string;
  responseRule: string;
  remark: string;
}

interface PickerChangeEvent {
  detail: {
    value: number | string;
  };
}

const STORAGE_KEY = "commandConfigurationTcpRecords";

const categoryOptions = [
  { label: "全部类型", value: "all" },
  { label: "采集指令", value: "sampling" },
  { label: "控制指令", value: "control" },
  { label: "诊断指令", value: "diagnosis" },
  { label: "维护指令", value: "maintenance" },
] as const;

const editCategoryOptions = categoryOptions.slice(1) as Array<{ label: string; value: CommandCategory }>;

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
] as const;

const directionOptions: Array<{ label: string; value: CommandDirection }> = [
  { label: "平台下发", value: "downlink" },
  { label: "设备上报", value: "uplink" },
  { label: "双向握手", value: "duplex" },
];

const enabledOptions = [
  { label: "启用", value: true },
  { label: "停用", value: false },
];

const defaultCommands: CommandRecord[] = [
  {
    id: 1,
    name: "实时采样启动",
    commandCode: "0xA1",
    category: "sampling",
    direction: "downlink",
    tcpPort: 6101,
    timeoutMs: 3000,
    retryTimes: 2,
    enabled: true,
    protocolVersion: "TCP-V2.1",
    deviceModel: "LX-LOGGER / 管网采集终端",
    requestFrame: "AA 55 {deviceId} A1 {interval} {duration} CRC16",
    responseRule: "响应帧指令码为 0xA1，结果位 0x00 表示启动成功。",
    remark: "用于临时打开高频采样窗口，适合疑似漏点复核。",
    updatedAt: "2026-07-08 10:24",
  },
  {
    id: 2,
    name: "设备状态查询",
    commandCode: "0xB2",
    category: "diagnosis",
    direction: "duplex",
    tcpPort: 6101,
    timeoutMs: 2500,
    retryTimes: 1,
    enabled: true,
    protocolVersion: "TCP-V2.1",
    deviceModel: "全系列采集终端",
    requestFrame: "AA 55 {deviceId} B2 00 CRC16",
    responseRule: "解析电量、信号强度、存储状态、传感器在线状态字段。",
    remark: "页面巡检和异常设备排查时使用。",
    updatedAt: "2026-07-06 15:12",
  },
  {
    id: 3,
    name: "阀门远程开度设置",
    commandCode: "0xC4",
    category: "control",
    direction: "downlink",
    tcpPort: 6200,
    timeoutMs: 5000,
    retryTimes: 3,
    enabled: true,
    protocolVersion: "TCP-V1.8",
    deviceModel: "VX-VALVE 智能阀控器",
    requestFrame: "7E {deviceId} C4 {openPercent} {operatorId} CRC16 7E",
    responseRule: "响应结果位 0x00 成功；0x03 表示阀门忙，需延迟重试。",
    remark: "涉及现场控制，修改后需要同步权限策略。",
    updatedAt: "2026-07-03 09:38",
  },
  {
    id: 4,
    name: "日冻结数据补传",
    commandCode: "0xD6",
    category: "maintenance",
    direction: "downlink",
    tcpPort: 6102,
    timeoutMs: 8000,
    retryTimes: 2,
    enabled: true,
    protocolVersion: "TCP-V2.0",
    deviceModel: "LX-LOGGER / DMA 边界表",
    requestFrame: "AA 55 {deviceId} D6 {dateStart} {dateEnd} CRC16",
    responseRule: "按数据包序号聚合，收到 END 包后完成补传。",
    remark: "用于网络中断后的历史数据修复。",
    updatedAt: "2026-06-28 18:05",
  },
  {
    id: 5,
    name: "传感器零点校准",
    commandCode: "0xE3",
    category: "maintenance",
    direction: "downlink",
    tcpPort: 6300,
    timeoutMs: 6000,
    retryTimes: 1,
    enabled: false,
    protocolVersion: "TCP-V1.5",
    deviceModel: "PX-PRESSURE 压力传感器",
    requestFrame: "68 {deviceId} E3 {channel} 00 CRC16 16",
    responseRule: "设备返回当前偏移值，偏移绝对值小于阈值视为校准成功。",
    remark: "现场维护窗口内启用，默认停用避免误操作。",
    updatedAt: "2026-06-20 11:46",
  },
];

const filters = reactive({
  keyword: "",
  category: "all" as "all" | CommandCategory,
  status: "all" as "all" | "enabled" | "disabled",
});

const commandRecords = ref<CommandRecord[]>(loadStoredCommands());
const selectedCommand = ref<CommandRecord | null>(commandRecords.value[0] || null);
const editing = ref(false);

const form = reactive<CommandForm>(createForm(selectedCommand.value || defaultCommands[0]));

const filteredCommands = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();

  return commandRecords.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      [item.name, item.commandCode, item.deviceModel, item.protocolVersion]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    const matchesCategory = filters.category === "all" || item.category === filters.category;
    const matchesStatus = filters.status === "all" || (filters.status === "enabled" ? item.enabled : !item.enabled);

    return matchesKeyword && matchesCategory && matchesStatus;
  });
});

const summaryCards = computed(() => {
  const total = commandRecords.value.length;
  const enabledCount = commandRecords.value.filter((item) => item.enabled).length;
  const controlCount = commandRecords.value.filter((item) => item.category === "control").length;
  const portCount = new Set(commandRecords.value.map((item) => item.tcpPort)).size;

  return [
    { label: "指令总数", value: total, unit: "条", tone: "blue" },
    { label: "启用指令", value: enabledCount, unit: "条", tone: "green" },
    { label: "控制类", value: controlCount, unit: "条", tone: "orange" },
    { label: "TCP 端口", value: portCount, unit: "个", tone: "cyan" },
  ];
});

const currentCategoryIndex = computed(() => categoryOptions.findIndex((item) => item.value === filters.category));
const currentStatusIndex = computed(() => statusOptions.findIndex((item) => item.value === filters.status));
const currentCategoryLabel = computed(() => categoryOptions[currentCategoryIndex.value]?.label || "全部类型");
const currentStatusLabel = computed(() => statusOptions[currentStatusIndex.value]?.label || "全部状态");
const editCategoryIndex = computed(() => Math.max(0, editCategoryOptions.findIndex((item) => item.value === form.category)));
const editDirectionIndex = computed(() => Math.max(0, directionOptions.findIndex((item) => item.value === form.direction)));
const editEnabledIndex = computed(() => (form.enabled ? 0 : 1));

function loadStoredCommands() {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored as CommandRecord[];
    }
  } catch (error) {
    console.warn("读取指令配置缓存失败", error);
  }

  return defaultCommands;
}

function persistCommands() {
  try {
    uni.setStorageSync(STORAGE_KEY, commandRecords.value);
  } catch (error) {
    console.warn("保存指令配置缓存失败", error);
  }
}

function createForm(command: CommandRecord): CommandForm {
  return {
    ...command,
    tcpPort: String(command.tcpPort),
    timeoutMs: String(command.timeoutMs),
    retryTimes: String(command.retryTimes),
  };
}

function syncForm(command: CommandRecord) {
  Object.assign(form, createForm(command));
}

function selectCommand(command: CommandRecord) {
  if (editing.value && selectedCommand.value?.id !== command.id) {
    uni.showToast({ title: "请先保存或取消当前编辑", icon: "none" });
    return;
  }

  selectedCommand.value = command;
  syncForm(command);
  editing.value = false;
}

function searchCommands() {
  const first = filteredCommands.value[0] || null;
  if (first) {
    selectedCommand.value = first;
    syncForm(first);
  }
  editing.value = false;
}

function resetFilters() {
  filters.keyword = "";
  filters.category = "all";
  filters.status = "all";
  searchCommands();
}

function refreshCommands() {
  commandRecords.value = loadStoredCommands();
  selectedCommand.value = filteredCommands.value[0] || commandRecords.value[0] || null;
  if (selectedCommand.value) {
    syncForm(selectedCommand.value);
  }
  editing.value = false;
  uni.showToast({ title: "已刷新", icon: "success" });
}

function startEdit() {
  editing.value = true;
}

function cancelEdit() {
  if (selectedCommand.value) {
    syncForm(selectedCommand.value);
  }
  editing.value = false;
}

function saveCommand() {
  const nextCommand = normalizeForm();

  if (!nextCommand.name || !nextCommand.commandCode || !nextCommand.requestFrame) {
    uni.showToast({ title: "请完善必填项", icon: "none" });
    return;
  }

  if (!isValidPort(nextCommand.tcpPort)) {
    uni.showToast({ title: "TCP 端口范围应为 1-65535", icon: "none" });
    return;
  }

  commandRecords.value = commandRecords.value.map((item) => (item.id === nextCommand.id ? nextCommand : item));
  selectedCommand.value = nextCommand;
  syncForm(nextCommand);
  editing.value = false;
  persistCommands();
  uni.showToast({ title: "配置已保存", icon: "success" });
}

function normalizeForm(): CommandRecord {
  return {
    id: form.id,
    name: form.name.trim(),
    commandCode: form.commandCode.trim(),
    category: form.category,
    direction: form.direction,
    tcpPort: Number(form.tcpPort) || 0,
    timeoutMs: Number(form.timeoutMs) || 0,
    retryTimes: Number(form.retryTimes) || 0,
    enabled: form.enabled,
    protocolVersion: form.protocolVersion.trim(),
    deviceModel: form.deviceModel.trim(),
    requestFrame: form.requestFrame.trim(),
    responseRule: form.responseRule.trim(),
    remark: form.remark.trim(),
    updatedAt: formatNow(),
  };
}

function isValidPort(port: number) {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

function handleCategoryChange(event: PickerChangeEvent) {
  const index = Number(event.detail.value);
  filters.category = categoryOptions[index]?.value || "all";
  searchCommands();
}

function handleStatusChange(event: PickerChangeEvent) {
  const index = Number(event.detail.value);
  filters.status = statusOptions[index]?.value || "all";
  searchCommands();
}

function handleFormCategoryChange(event: PickerChangeEvent) {
  const index = Number(event.detail.value);
  form.category = editCategoryOptions[index]?.value || "sampling";
}

function handleFormDirectionChange(event: PickerChangeEvent) {
  const index = Number(event.detail.value);
  form.direction = directionOptions[index]?.value || "downlink";
}

function handleFormEnabledChange(event: PickerChangeEvent) {
  const index = Number(event.detail.value);
  form.enabled = enabledOptions[index]?.value ?? true;
}

function getCategoryLabel(value: CommandCategory) {
  return editCategoryOptions.find((item) => item.value === value)?.label || "未分类";
}

function getDirectionLabel(value: CommandDirection) {
  return directionOptions.find((item) => item.value === value)?.label || "未配置";
}

function formatNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<style lang="scss" scoped>
.command-configuration {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  gap: 12px;
  overflow: hidden;
  background: #eef4f8;
  box-sizing: border-box;
}

.command-toolbar,
.table-panel,
.detail-panel,
.summary-card {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.command-toolbar {
  flex: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
}

.toolbar__filters {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.filter-field,
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-field {
  width: 170px;
}

.filter-field--keyword {
  width: 320px;
}

.filter-label,
.form-label {
  color: #587086;
  font-size: 12px;
  font-weight: 800;
}

.form-label--required::after {
  content: "*";
  margin-left: 3px;
  color: #d94a4a;
}

.filter-input,
.filter-select,
.form-input,
.form-select {
  height: 34px;
  min-width: 0;
  padding: 0 10px;
  color: #24445f;
  font-size: 13px;
  line-height: 34px;
  background: #f8fbfe;
  border: 1px solid #d6e2ed;
  border-radius: 4px;
  box-sizing: border-box;
}

.filter-input,
.form-input {
  width: 100%;
}

.filter-select,
.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.select-arrow {
  width: 7px;
  height: 7px;
  border-right: 1px solid #7d91a5;
  border-bottom: 1px solid #7d91a5;
  transform: rotate(45deg) translateY(-2px);
}

.form-input--mono,
.form-textarea--mono {
  font-family: Consolas, "Courier New", monospace;
}

.form-select--disabled,
.form-input[disabled],
.form-textarea[disabled] {
  color: #5f7182;
  background: #f3f6f9;
}

.input-placeholder {
  color: #9aaaba;
}

.toolbar-button,
.icon-button,
.mini-button {
  margin: 0;
  color: #31506d;
  font-size: 13px;
  font-weight: 800;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button {
  height: 34px;
  padding: 0 14px;
  line-height: 34px;
}

.toolbar-button--primary,
.mini-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.toolbar-button--hover,
.mini-button--hover,
.icon-button--hover {
  opacity: 0.86;
}

.toolbar-button[disabled] {
  color: #a8b5c2;
  background: #f1f5f8;
  border-color: #dbe5ee;
}

.icon-button {
  position: relative;
  width: 34px;
  height: 34px;
  padding: 0;
}

.icon-refresh {
  position: absolute;
  top: 9px;
  left: 9px;
  width: 14px;
  height: 14px;
  border: 2px solid #53718e;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  content: "";
  position: absolute;
  top: -4px;
  right: -3px;
  width: 0;
  height: 0;
  border-left: 5px solid #53718e;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transform: rotate(22deg);
}

.summary-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  min-width: 0;
  padding: 12px 14px;
}

.summary-card__head,
.summary-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.summary-card__label {
  color: #5f7286;
  font-size: 13px;
  font-weight: 800;
}

.summary-card__mark {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #0d82ee;
}

.summary-card__body {
  justify-content: flex-start;
  margin-top: 8px;
}

.summary-card__value {
  color: #203e59;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
}

.summary-card__unit {
  align-self: flex-end;
  color: #6f8397;
  font-size: 12px;
  font-weight: 800;
}

.summary-card--green .summary-card__mark {
  background: #16a06b;
}

.summary-card--orange .summary-card__mark {
  background: #e68a00;
}

.summary-card--cyan .summary-card__mark {
  background: #13a8bb;
}

.command-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px);
  gap: 14px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-panel,
.detail-panel {
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
  box-sizing: border-box;
}

.table-head__title-group,
.detail-head__title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.table-head__title,
.detail-head__title {
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
}

.table-head__subtitle,
.detail-head__label {
  color: #72869a;
  font-size: 11px;
  font-weight: 700;
}

.table-head__meta {
  flex: none;
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

.table-scroll :deep(.uni-scroll-view),
.detail-scroll :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar),
.detail-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track),
.detail-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track) {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb),
.detail-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.data-table {
  width: 100%;
  min-width: 1120px;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns:
    54px minmax(150px, 1.45fr) minmax(96px, 0.82fr) minmax(92px, 0.78fr)
    minmax(92px, 0.78fr) minmax(84px, 0.72fr) minmax(92px, 0.72fr)
    minmax(78px, 0.64fr) minmax(88px, 0.7fr) minmax(152px, 1.08fr);
  width: 100%;
  min-width: 1120px;
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
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

.data-row--active,
.data-row--active:not(.data-row--header):hover {
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
  box-sizing: border-box;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--name {
  justify-content: flex-start;
  color: #0f4c81;
  font-weight: 800;
}

.data-cell--code,
.data-cell--port,
.data-cell--timeout,
.data-cell--retry {
  font-family: Consolas, "Courier New", monospace;
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8da1;
  font-size: 14px;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.detail-empty {
  flex: 1;
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
  box-sizing: border-box;
}

.status-pill--enabled {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--disabled {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.detail-head {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #edf3f8;
}

.detail-scroll {
  flex: 1;
  min-height: 0;
  padding: 14px;
  box-sizing: border-box;
}

.detail-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  padding: 8px 10px;
  background: #f7fafc;
  border: 1px solid #e2ebf3;
  border-radius: 4px;
  box-sizing: border-box;
}

.summary-item__label {
  flex: none;
  color: #6d8094;
  font-size: 12px;
  font-weight: 800;
}

.summary-item__value {
  min-width: 0;
  color: #294963;
  font-size: 13px;
  font-weight: 900;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-section {
  padding-top: 14px;
  border-top: 1px solid #edf3f8;
}

.form-section + .form-section {
  margin-top: 14px;
}

.form-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.form-section__title {
  color: #24445f;
  font-size: 14px;
  font-weight: 900;
}

.mini-button {
  height: 28px;
  padding: 0 12px;
  line-height: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-textarea {
  width: 100%;
  min-height: 76px;
  padding: 9px 10px;
  color: #24445f;
  font-size: 13px;
  line-height: 1.55;
  background: #f8fbfe;
  border: 1px solid #d6e2ed;
  border-radius: 4px;
  box-sizing: border-box;
}

.detail-actions {
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 1180px) {
  .command-layout {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    min-height: 520px;
  }
}

@media (max-width: 860px) {
  .command-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar__actions {
    justify-content: flex-end;
  }

  .filter-field,
  .filter-field--keyword {
    width: calc(50% - 6px);
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
