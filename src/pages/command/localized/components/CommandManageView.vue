<template>
  <view class="task-center">
    <view class="toolbar">
      <view class="toolbar__filters">
        <view class="filter-field filter-field--keyword">
          <text class="filter-label">{{ activeView === "COMMAND" ? "记录检索" : "设备编号" }}</text>
          <input
            v-model="activeFilters.keyword"
            class="filter-input"
            :placeholder="activeView === 'COMMAND' ? '输入设备编号、指令名称或指令码' : '输入设备编号'"
            @confirm="handleSearch"
          />
        </view>

        <view class="filter-field">
          <text class="filter-label">执行状态</text>
          <picker
            :range="activeStatusOptions"
            range-key="label"
            :value="activeStatusIndex"
            @change="handleStatusChange"
          >
            <view class="filter-select">
              <text>{{ activeStatusOptions[activeStatusIndex]?.label }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view v-if="activeView === 'UPGRADE'" class="filter-field">
          <text class="filter-label">固件版本</text>
          <input v-model="upgradeFilters.firmwareVersion" class="filter-input filter-input--short" placeholder="如 V1.1" @confirm="handleSearch" />
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">开始日期</text>
          <picker mode="date" :value="activeFilters.startDate" @change="handleStartDateChange">
            <view class="filter-select">{{ activeFilters.startDate || "不限" }}<text class="select-arrow"></text></view>
          </picker>
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">结束日期</text>
          <picker mode="date" :value="activeFilters.endDate" @change="handleEndDateChange">
            <view class="filter-select">{{ activeFilters.endDate || "不限" }}<text class="select-arrow"></text></view>
          </picker>
        </view>
      </view>

      <view class="toolbar__actions">
        <button class="action-button action-button--primary" :disabled="activeLoading" @click="handleSearch">查询</button>
        <button class="action-button" @click="resetFilters">重置</button>
        <button class="action-button" :disabled="activeLoading" @click="loadActivePage(true)">刷新</button>
        <button
          v-if="activeView === 'COMMAND'"
          class="action-button action-button--primary"
          @click="showCommandSendNotice"
        >
          指令下发
        </button>
        <button
          v-else
          class="action-button action-button--primary"
          @click="openUpgradeDialog"
        >
          发起固件升级
        </button>
      </view>
    </view>

    <view class="content-layout">
      <view class="list-panel">
        <view class="panel-head">
          <view class="record-switch">
            <button
              v-for="tab in recordTabs"
              :key="tab.value"
              class="record-switch__button"
              :class="{ 'record-switch__button--active': activeView === tab.value }"
              @click="switchRecordView(tab.value)"
            >
              {{ tab.label }}
            </button>
          </view>
          <text class="panel-head__meta">共 {{ activePage.total }} 条</text>
        </view>

        <CommandDataTable
          :columns="activeColumns"
          :data="activeRows"
          :loading="activeLoading"
          :selected="selectedId"
          :page-current="activePage.current"
          :page-size="activePage.size"
          :empty-text="activeView === 'COMMAND' ? '暂无指令下发记录' : '暂无固件升级记录'"
          @row-click="selectRow"
        >
          <template #cell-executeStatus="{ row }">
            <text class="status-tag" :class="getStatusClass(row.executeStatus)">
              {{ getStatusText(row.executeStatus) }}
            </text>
          </template>

          <template #cell-finishPercent="{ row }">
            <view class="progress-cell">
              <view class="progress-track"><view :style="{ width: `${clampProgress(row.finishPercent)}%` }"></view></view>
              <text>{{ clampProgress(row.finishPercent) }}%</text>
            </view>
          </template>
          <template #footer>
            <CommandPaginationBar
              :current="activePage.current"
              :size="activePage.size"
              :total="activePage.total"
              @change-page="changePage"
              @change-size="changePageSize"
            />
          </template>
        </CommandDataTable>
      </view>

      <view class="detail-panel">
        <view v-if="detailLoading" class="detail-state">正在加载详情…</view>
        <view v-else-if="!selectedDetail" class="detail-state">
          <text class="detail-state__icon">⌁</text>
          <text>请选择一条记录查看详情</text>
        </view>

        <template v-else-if="activeView === 'COMMAND'">
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">指令下发详情</text>
              <text class="detail-head__title">{{ displayValue(selectedDetail.commandName || selectedDetail.commandCode) }}</text>
              <text class="detail-head__id">记录 ID：{{ displayValue(selectedDetail.id) }}</text>
            </view>
            <text class="status-tag" :class="getCommandStatusClass(selectedDetail.executeStatus)">
              {{ getCommandStatusText(selectedDetail.executeStatus) }}
            </text>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <view class="info-section">
              <text class="section-title">下发信息</text>
              <view class="info-list">
                <view class="info-row"><text>设备编号</text><text>{{ displayValue(selectedDetail.deviceNumber) }}</text></view>
                <view class="info-row"><text>指令名称</text><text>{{ displayValue(selectedDetail.commandName) }}</text></view>
                <view class="info-row"><text>指令码</text><text>{{ displayValue(selectedDetail.commandCode) }}</text></view>
                <view class="info-row"><text>下发时间</text><text>{{ displayValue(selectedDetail.sendTime || selectedDetail.createdAt) }}</text></view>
                <view class="info-row"><text>完成时间</text><text>{{ displayValue(selectedDetail.finishTime || selectedDetail.updatedAt) }}</text></view>
              </view>
            </view>
            <view class="info-section">
              <text class="section-title">请求与响应</text>
              <view class="code-card"><text class="code-card__label">请求内容</text><text>{{ stringifyContent(selectedDetail.requestContent || selectedDetail.requestData || selectedDetail.commandContent) }}</text></view>
              <view class="code-card"><text class="code-card__label">响应内容</text><text>{{ stringifyContent(selectedDetail.responseContent || selectedDetail.responseData || selectedDetail.result) }}</text></view>
              <view v-if="selectedDetail.failureReason || selectedDetail.errorMessage" class="error-card">
                {{ selectedDetail.failureReason || selectedDetail.errorMessage }}
              </view>
            </view>
          </scroll-view>
        </template>

        <template v-else>
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">固件升级任务</text>
              <text class="detail-head__title">{{ displayValue(selectedDetail.deviceNumber) }}</text>
              <text class="detail-head__id">任务 ID：{{ displayValue(selectedDetail.id) }}</text>
            </view>
            <view class="detail-head__actions">
              <text class="status-tag" :class="getStatusClass(selectedDetail.executeStatus)">
                {{ getStatusText(selectedDetail.executeStatus) }}
              </text>
              <button
                v-if="canCancelUpgrade(selectedDetail)"
                class="mini-button mini-button--danger"
                :disabled="canceling"
                @click="confirmCancelUpgrade"
              >
                {{ canceling ? "正在取消" : "取消升级" }}
              </button>
            </view>
          </view>

          <view class="detail-tabs">
            <button
              v-for="tab in detailTabs"
              :key="tab.value"
              class="detail-tab"
              :class="{ 'detail-tab--active': detailTab === tab.value }"
              @click="switchDetailTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <template v-if="detailTab === 'OVERVIEW'">
              <view class="progress-overview">
                <view class="progress-overview__head"><text>升级进度</text><text>{{ clampProgress(selectedDetail.finishPercent) }}%</text></view>
                <view class="progress-overview__track"><view :style="{ width: `${clampProgress(selectedDetail.finishPercent)}%` }"></view></view>
                <text class="stage-text">{{ getStageText(selectedDetail.upgradeStage, selectedDetail.repairRound) }}</text>
              </view>

              <view class="stat-grid">
                <view><text>{{ displayValue(selectedDetail.frameCount, "0") }}</text><text>总帧数</text></view>
                <view><text>{{ displayValue(selectedDetail.receivedFrameCount, "0") }}</text><text>已收帧数</text></view>
                <view><text>{{ displayValue(selectedDetail.repairRound, "0") }}</text><text>补帧轮次</text></view>
              </view>

              <view class="info-section">
                <text class="section-title">任务信息</text>
                <view class="info-list">
                  <view class="info-row"><text>固件版本</text><text>{{ displayValue(selectedDetail.firmwareVersion) }}</text></view>
                  <view class="info-row"><text>传输通道</text><text>{{ getTransportText(selectedDetail.transportChannel) }}</text></view>
                  <view class="info-row"><text>开始时间</text><text>{{ displayValue(selectedDetail.startTime || selectedDetail.createdAt) }}</text></view>
                  <view class="info-row"><text>结束时间</text><text>{{ displayValue(selectedDetail.finishTime) }}</text></view>
                  <view class="info-row"><text>当前会话</text><text class="ellipsis-text" :title="selectedDetail.currentSessionId">{{ displayValue(selectedDetail.currentSessionId) }}</text></view>
                  <view class="info-row"><text>最后发送</text><text>{{ displayValue(selectedDetail.lastFrameSentAt) }}</text></view>
                  <view class="info-row"><text>最后上报</text><text>{{ displayValue(selectedDetail.lastReportAt) }}</text></view>
                  <view class="info-row"><text>固件 MD5</text><text class="ellipsis-text" :title="selectedDetail.firmwareMd5">{{ displayValue(selectedDetail.firmwareMd5) }}</text></view>
                </view>
                <view v-if="selectedDetail.failureReason" class="error-card">{{ selectedDetail.failureReason }}</view>
              </view>
            </template>

            <template v-else-if="detailTab === 'FRAMES'">
              <view class="subsection-head">
                <view><text class="section-title">固件帧记录</text><text class="subsection-hint">帧数据按需加载，不参与自动轮询</text></view>
                <button class="mini-button" :disabled="subResourceLoading" @click="loadFrames(true)">刷新</button>
              </view>
              <view v-if="subResourceLoading" class="resource-state">正在加载帧记录…</view>
              <view v-else-if="!frames.length" class="resource-state">暂无帧记录</view>
              <view v-else class="compact-table">
                <view class="compact-row compact-row--header"><text>帧序号</text><text>长度</text><text>状态</text><text>轮次</text><text>尝试</text><text>Hex 摘要</text><text>最后发送</text></view>
                <view v-for="frame in frames" :key="frame.id || frame.frameIndex" class="compact-row">
                  <text>{{ displayValue(frame.frameIndex) }}</text>
                  <text>{{ displayValue(frame.dataLength) }}</text>
                  <text>{{ getFrameStatusText(frame.sendStatus) }}</text>
                  <text>{{ displayValue(frame.sendRound, "0") }}</text>
                  <text>{{ displayValue(frame.sendAttempts, "0") }}</text>
                  <text class="hex-preview" :title="frame.payloadHex">{{ previewHex(frame.payloadHex) }}</text>
                  <text>{{ displayValue(frame.lastSentAt) }}</text>
                </view>
              </view>
            </template>

            <template v-else>
              <view class="subsection-head">
                <view><text class="section-title">上下行事件</text><text class="subsection-hint">按时间展示系统与设备交互过程</text></view>
                <button class="mini-button" :disabled="subResourceLoading" @click="loadEvents(true)">刷新</button>
              </view>
              <view v-if="subResourceLoading" class="resource-state">正在加载事件…</view>
              <view v-else-if="!events.length" class="resource-state">暂无事件记录</view>
              <view v-else class="timeline">
                <view v-for="event in events" :key="event.id" class="timeline-item" :class="`timeline-item--${String(event.direction || 'SYSTEM').toLowerCase()}`">
                  <text class="timeline-item__dot"></text>
                  <view class="timeline-item__content">
                    <view><text class="timeline-item__title">{{ getEventTypeText(event.eventType) }}</text><text class="timeline-item__time">{{ displayValue(event.createdAt) }}</text></view>
                    <text class="timeline-item__meta">{{ getDirectionText(event.direction) }}<template v-if="event.frameIndex !== undefined"> · 帧 {{ event.frameIndex }}</template></text>
                    <text v-if="event.detail" class="timeline-item__detail">{{ event.detail }}</text>
                    <text v-if="event.rawHex" class="timeline-item__hex" :title="event.rawHex">{{ previewHex(event.rawHex) }}</text>
                  </view>
                </view>
              </view>
            </template>
          </scroll-view>
        </template>
      </view>
    </view>

    <view v-if="upgradeDialogVisible" class="modal-mask" @click.self="closeUpgradeDialog">
      <view class="upgrade-modal">
        <view class="modal-head">
          <view><text class="modal-head__eyebrow">固件升级</text><text class="modal-head__title">创建升级任务</text></view>
          <button class="modal-close" aria-label="关闭" @click="closeUpgradeDialog">×</button>
        </view>

        <view class="step-bar">
          <view v-for="step in upgradeSteps" :key="step.value" class="step-item" :class="{ 'step-item--active': upgradeStep === step.value, 'step-item--done': upgradeStep > step.value }">
            <text class="step-item__number">{{ upgradeStep > step.value ? "✓" : step.value }}</text>
            <text>{{ step.label }}</text>
          </view>
        </view>

        <scroll-view class="modal-body" scroll-y>
          <view v-if="upgradeStep === 1" class="wizard-section">
            <view class="wizard-head"><view><text class="wizard-title">选择固件</text><text class="wizard-hint">请选择已经上传并验证通过的固件记录</text></view><text class="selected-count">共 {{ firmwareCandidates.length }} 个</text></view>
            <view v-if="candidateLoading" class="resource-state">正在加载固件…</view>
            <view v-else class="choice-list">
              <view
                v-for="firmware in firmwareCandidates"
                :key="firmware.id"
                class="choice-card"
                :class="{ 'choice-card--active': upgradeDraft.firmwareId === firmware.id }"
                @click="upgradeDraft.firmwareId = firmware.id"
              >
                <text class="choice-radio"><text></text></text>
                <view class="choice-content">
                  <view><text class="choice-title">{{ displayValue(firmware.firmwareName) }}</text><text class="version-pill">{{ displayValue(firmware.firmwareVersion) }}</text></view>
                  <text class="choice-description">{{ displayValue(firmware.instruction || firmware.remark, "暂无说明") }}</text>
                  <text class="choice-meta">上传时间：{{ displayValue(firmware.uploadTime || firmware.createdAt) }}</text>
                </view>
              </view>
              <view v-if="!firmwareCandidates.length" class="resource-state">暂无可用固件，请先到固件管理页面上传</view>
            </view>
          </view>

          <view v-else-if="upgradeStep === 2" class="wizard-section">
            <view class="wizard-head"><view><text class="wizard-title">选择设备</text><text class="wizard-hint">仅允许选择直连设备；离线设备创建后将等待连接</text></view><text class="selected-count">已选择 {{ selectedDevices.length }} 台</text></view>
            <view class="device-filter">
              <input v-model="deviceKeyword" class="filter-input" placeholder="筛选当前列表中的设备编号或别名" />
              <button class="mini-button" @click="toggleSelectableDevices">{{ currentSelectableSelected ? "取消可选设备" : "选择全部可用设备" }}</button>
            </view>
            <view v-if="candidateLoading" class="resource-state">正在加载设备…</view>
            <view v-else class="device-table">
              <view class="device-row device-row--header">
                <view class="device-check-cell"></view>
                <text>设备编号</text>
                <text>设备别名</text>
                <text>下发方式</text>
                <text>TCP 状态</text>
                <text>当前固件</text>
              </view>
              <view
                v-for="device in filteredDeviceCandidates"
                :key="device.id"
                class="device-row"
                :class="{ 'device-row--selected': isDeviceSelected(device), 'device-row--disabled': !isDirectDevice(device) }"
                @click="toggleDevice(device)"
              >
                <view class="device-check-cell">
                  <text class="checkbox">{{ isDeviceSelected(device) ? "✓" : "" }}</text>
                </view>
                <text>{{ displayValue(device.deviceNumber) }}</text>
                <text>{{ displayValue(device.deviceAlias || device.deviceName) }}</text>
                <text>{{ getCommandSendwayText(device.commandSendway) }}</text>
                <text><text class="online-pill" :class="isDeviceOnline(device) ? 'online-pill--online' : 'online-pill--offline'">{{ isDeviceOnline(device) ? "在线" : "离线" }}</text></text>
                <text>{{ displayValue(device.firmwareVersion) }}</text>
              </view>
              <view v-if="!filteredDeviceCandidates.length" class="resource-state">暂无符合条件的设备</view>
            </view>
          </view>

          <view v-else class="wizard-section">
            <view class="wizard-head"><view><text class="wizard-title">升级检查与确认</text><text class="wizard-hint">提交前检查设备是否存在未结束的升级任务</text></view><button class="mini-button" :disabled="checkingUpdatable" @click="runUpdatableCheck">{{ checkingUpdatable ? "正在检查" : "重新检查" }}</button></view>

            <view class="confirm-summary">
              <view><text>固件</text><text>{{ selectedFirmware?.firmwareName || "--" }}</text></view>
              <view><text>版本</text><text>{{ selectedFirmware?.firmwareVersion || "--" }}</text></view>
              <view><text>设备数量</text><text>{{ selectedDevices.length }} 台</text></view>
            </view>

            <view class="check-list">
              <view v-for="device in selectedDevices" :key="device.id" class="check-item">
                <view><text class="check-item__number">{{ device.deviceNumber }}</text><text>{{ isDeviceOnline(device) ? "TCP 在线" : "TCP 离线，任务将等待连接" }}</text></view>
                <text class="check-result" :class="getCheckResult(device.deviceNumber).updatable ? 'check-result--success' : 'check-result--danger'">
                  {{ getCheckResult(device.deviceNumber).label }}
                </text>
              </view>
            </view>
            <view v-if="hasBlockedDevice" class="warning-card">存在不可升级设备，请返回上一步移除后再提交。</view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="action-button" :disabled="submittingUpgrade" @click="closeUpgradeDialog">取消</button>
          <view>
            <button v-if="upgradeStep > 1" class="action-button" :disabled="submittingUpgrade" @click="upgradeStep--">上一步</button>
            <button v-if="upgradeStep < 3" class="action-button action-button--primary" :disabled="candidateLoading" @click="nextUpgradeStep">下一步</button>
            <button v-else class="action-button action-button--primary" :disabled="!canSubmitUpgrade || submittingUpgrade" @click="submitUpgrade">
              {{ submittingUpgrade ? "正在创建" : "确认发起升级" }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import CommandDataTable from "@/pages/command/components/t/CommandDataTable.vue";
import CommandPaginationBar from "@/pages/command/components/t/CommandPaginationBar.vue";
import type { CommandTableColumn } from "@/pages/command/components/t/types";
import { getCommandSendLogDetail, getCommandSendLogPage } from "@/services/commandSend/manage";
import { getDevicePage } from "@/services/device/info";
import { getFirmwarePage } from "@/services/firmware/manage";
import {
  cancelFirmwareUpgrade,
  checkFirmwareUpdatable,
  getFirmwareUpgradeEvents,
  getFirmwareUpgradeFrames,
  startFirmwareUpgrade,
} from "@/services/firmware/upgrade";
import { getFirmwareUpgradeLogDetail, getFirmwareUpgradeLogPage } from "@/services/firmware/upgrade-log";

type RecordView = "COMMAND" | "UPGRADE";
type DetailTab = "OVERVIEW" | "FRAMES" | "EVENTS";
type ApiRecord = Record<string, any>;

interface PageState {
  current: number;
  size: number;
  total: number;
}

interface FilterState {
  keyword: string;
  status: string;
  startDate: string;
  endDate: string;
}

const recordTabs: Array<{ label: string; value: RecordView }> = [
  { label: "指令下发记录", value: "COMMAND" },
  { label: "固件升级记录", value: "UPGRADE" },
];
const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "任务概览", value: "OVERVIEW" },
  { label: "固件帧记录", value: "FRAMES" },
  { label: "上下行事件", value: "EVENTS" },
];
const upgradeSteps = [
  { value: 1, label: "选择固件" },
  { value: 2, label: "选择设备" },
  { value: 3, label: "升级检查" },
];

const upgradeStatusMap: Record<number, { label: string; tone: string; terminal: boolean }> = {
  0: { label: "等待发送", tone: "waiting", terminal: false },
  1: { label: "升级中", tone: "running", terminal: false },
  2: { label: "取消中", tone: "warning", terminal: false },
  3: { label: "升级失败", tone: "danger", terminal: true },
  4: { label: "升级完成", tone: "success", terminal: true },
  5: { label: "已取消", tone: "muted", terminal: true },
  6: { label: "设备或网络异常", tone: "danger", terminal: true },
};
const upgradeStageMap: Record<string, string> = {
  PREPARING: "正在准备任务",
  WAITING_CONNECTION: "等待设备连接",
  SENDING_INITIAL: "正在发送固件",
  WAITING_DEVICE_REPORT: "等待设备收帧报告",
  WAITING_RECONNECT: "存在丢帧，等待设备重连",
  SENDING_REPAIR: "正在补发缺失帧",
  DEVICE_UPGRADING: "设备正在升级",
  CANCEL_PENDING: "等待发送取消指令",
  CANCEL_SENT: "取消指令已发送",
  TERMINAL: "任务已结束",
};
const eventTypeMap: Record<string, string> = {
  TASK_CREATED: "任务创建",
  DATA_FRAME: "下发固件帧",
  LOSS_REPORT: "设备上报丢帧",
  RECEIVE_COMPLETE: "设备已收齐",
  UPGRADE_SUCCESS: "升级成功",
  UPGRADE_FAILED: "升级失败",
  CANCEL_COMMAND: "下发取消指令",
  CANCEL_RECEIVED: "设备收到取消指令",
  CANCEL_SUCCESS: "取消成功",
  CONNECTION_CLOSED: "TCP 连接断开",
  SEND_FAILED: "发送失败或等待超时",
};

const commandStatusOptions = [
  { label: "全部状态", value: "" },
  { label: "等待执行", value: "0" },
  { label: "执行中", value: "1" },
  { label: "执行成功", value: "2" },
  { label: "执行失败", value: "3" },
];
const upgradeStatusOptions = [
  { label: "全部状态", value: "" },
  ...Object.entries(upgradeStatusMap).map(([value, item]) => ({ label: item.label, value })),
];

const commandColumns: CommandTableColumn[] = [
  { key: "id", label: "记录 ID", width: 90 },
  { key: "deviceNumber", label: "设备编号", width: 150 },
  { key: "commandName", label: "指令名称", width: 170 },
  { key: "commandCode", label: "指令码", width: 120 },
  { key: "executeStatus", label: "执行状态", width: 120 },
  { key: "sendTime", label: "下发时间", width: 170 },
  { key: "finishTime", label: "完成时间", width: 170 },
];
const upgradeColumns: CommandTableColumn[] = [
  { key: "id", label: "任务 ID", width: 90 },
  { key: "deviceNumber", label: "设备编号", width: 150 },
  { key: "firmwareVersion", label: "固件版本", width: 110 },
  { key: "executeStatus", label: "执行状态", width: 130 },
  { key: "upgradeStageText", label: "当前阶段", width: 190 },
  { key: "finishPercent", label: "进度", width: 170 },
  { key: "frameSummary", label: "已收/总帧", width: 110 },
  { key: "repairRound", label: "补帧轮次", width: 100 },
  { key: "startTime", label: "开始时间", width: 170 },
];

const activeView = ref<RecordView>("COMMAND");
const commandFilters = reactive<FilterState>({ keyword: "", status: "", startDate: "", endDate: "" });
const upgradeFilters = reactive<FilterState & { firmwareVersion: string }>({ keyword: "", firmwareVersion: "", status: "", startDate: "", endDate: "" });
const commandPage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const upgradePage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const commandRows = ref<ApiRecord[]>([]);
const upgradeRows = ref<ApiRecord[]>([]);
const commandLoading = ref(false);
const upgradeLoading = ref(false);
const selectedCommandId = ref<string | number | null>(null);
const selectedUpgradeId = ref<string | number | null>(null);
const selectedDetail = ref<ApiRecord | null>(null);
const detailLoading = ref(false);
const detailTab = ref<DetailTab>("OVERVIEW");
const frames = ref<ApiRecord[]>([]);
const events = ref<ApiRecord[]>([]);
const subResourceLoading = ref(false);
const canceling = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const upgradeDialogVisible = ref(false);
const upgradeStep = ref(1);
const candidateLoading = ref(false);
const checkingUpdatable = ref(false);
const submittingUpgrade = ref(false);
const firmwareCandidates = ref<ApiRecord[]>([]);
const deviceCandidates = ref<ApiRecord[]>([]);
const deviceKeyword = ref("");
const upgradeDraft = reactive<{ firmwareId: string | number | null; devices: ApiRecord[] }>({ firmwareId: null, devices: [] });
const updatableResults = ref<ApiRecord[]>([]);

const activeFilters = computed(() => activeView.value === "COMMAND" ? commandFilters : upgradeFilters);
const activePage = computed(() => activeView.value === "COMMAND" ? commandPage : upgradePage);
const activeRows = computed(() => activeView.value === "COMMAND" ? commandRows.value : upgradeRows.value);
const activeLoading = computed(() => activeView.value === "COMMAND" ? commandLoading.value : upgradeLoading.value);
const activeColumns = computed(() => activeView.value === "COMMAND" ? commandColumns : upgradeColumns);
const selectedId = computed(() => activeView.value === "COMMAND" ? selectedCommandId.value : selectedUpgradeId.value);
const activeStatusOptions = computed(() => activeView.value === "COMMAND" ? commandStatusOptions : upgradeStatusOptions);
const activeStatusIndex = computed(() => Math.max(0, activeStatusOptions.value.findIndex(item => item.value === activeFilters.value.status)));
const selectedFirmware = computed(() => firmwareCandidates.value.find(item => item.id === upgradeDraft.firmwareId) || null);
const selectedDevices = computed(() => upgradeDraft.devices);
const filteredDeviceCandidates = computed(() => {
  const keyword = deviceKeyword.value.trim().toLowerCase();
  if (!keyword) return deviceCandidates.value;
  return deviceCandidates.value.filter(item => [item.deviceNumber, item.deviceAlias, item.deviceName].some(value => String(value || "").toLowerCase().includes(keyword)));
});
const currentSelectableSelected = computed(() => {
  const selectable = filteredDeviceCandidates.value.filter(isDirectDevice);
  return selectable.length > 0 && selectable.every(isDeviceSelected);
});
const hasBlockedDevice = computed(() => selectedDevices.value.some(device => !getCheckResult(device.deviceNumber).updatable));
const canSubmitUpgrade = computed(() => selectedDevices.value.length > 0 && updatableResults.value.length === selectedDevices.value.length && !hasBlockedDevice.value);

onMounted(() => {
  loadCommandPage(true);
});

onUnmounted(() => {
  stopPolling();
});

async function switchRecordView(view: RecordView) {
  if (activeView.value === view) return;
  stopPolling();
  activeView.value = view;
  selectedDetail.value = null;
  detailTab.value = "OVERVIEW";
  await loadActivePage(false);
}

async function loadActivePage(selectFirst = false) {
  if (activeView.value === "COMMAND") await loadCommandPage(selectFirst);
  else await loadUpgradePage(selectFirst);
}

async function loadCommandPage(selectFirst = false) {
  commandLoading.value = true;
  try {
    const response = await getCommandSendLogPage({
      pageNum: commandPage.current,
      pageSize: commandPage.size,
      keyword: commandFilters.keyword || undefined,
      executeStatus: toOptionalNumber(commandFilters.status),
      startTime: toStartTime(commandFilters.startDate),
      endTime: toEndTime(commandFilters.endDate),
      sortOrder: "desc",
    });
    const pageData = unwrapResponse(response);
    commandRows.value = getPageRecords(pageData).map(normalizeCommandLog);
    commandPage.total = getPageTotal(pageData, commandRows.value.length);
    if (selectFirst || !commandRows.value.some(item => item.id === selectedCommandId.value)) {
      if (commandRows.value[0]) await selectCommandRow(commandRows.value[0]);
      else clearSelection("COMMAND");
    }
  } catch (error) {
    showError(error, "指令记录加载失败");
  } finally {
    commandLoading.value = false;
  }
}

async function loadUpgradePage(selectFirst = false) {
  upgradeLoading.value = true;
  try {
    const response = await getFirmwareUpgradeLogPage({
      pageNum: upgradePage.current,
      pageSize: upgradePage.size,
      deviceNumber: upgradeFilters.keyword || undefined,
      firmwareVersion: upgradeFilters.firmwareVersion || undefined,
      executeStatus: toOptionalNumber(upgradeFilters.status),
      startTime: toStartTime(upgradeFilters.startDate),
      endTime: toEndTime(upgradeFilters.endDate),
      sortOrder: "desc",
    });
    const pageData = unwrapResponse(response);
    upgradeRows.value = getPageRecords(pageData).map(normalizeUpgradeLog);
    upgradePage.total = getPageTotal(pageData, upgradeRows.value.length);
    if (selectFirst || !upgradeRows.value.some(item => item.id === selectedUpgradeId.value)) {
      if (upgradeRows.value[0]) await selectUpgradeRow(upgradeRows.value[0]);
      else clearSelection("UPGRADE");
    }
  } catch (error) {
    showError(error, "升级记录加载失败");
  } finally {
    upgradeLoading.value = false;
  }
}

async function selectRow(row: ApiRecord) {
  if (activeView.value === "COMMAND") await selectCommandRow(row);
  else await selectUpgradeRow(row);
}

async function selectCommandRow(row: ApiRecord) {
  stopPolling();
  selectedCommandId.value = row.id;
  detailLoading.value = true;
  try {
    selectedDetail.value = normalizeCommandLog(unwrapResponse(await getCommandSendLogDetail(row.id)));
  } catch (error) {
    selectedDetail.value = row;
    showError(error, "指令详情加载失败");
  } finally {
    detailLoading.value = false;
  }
}

async function selectUpgradeRow(row: ApiRecord) {
  selectedUpgradeId.value = row.id;
  detailTab.value = "OVERVIEW";
  frames.value = [];
  events.value = [];
  await loadSelectedUpgradeDetail(false);
  startPollingIfNeeded();
}

async function loadSelectedUpgradeDetail(silent = false) {
  if (selectedUpgradeId.value === null) return;
  if (!silent) detailLoading.value = true;
  try {
    const detail = normalizeUpgradeLog(unwrapResponse(await getFirmwareUpgradeLogDetail(selectedUpgradeId.value)));
    selectedDetail.value = detail;
    const index = upgradeRows.value.findIndex(item => item.id === detail.id);
    if (index >= 0) upgradeRows.value.splice(index, 1, detail);
    if (isTerminalStatus(detail.executeStatus)) stopPolling();
  } catch (error) {
    if (!silent) showError(error, "升级详情加载失败");
  } finally {
    if (!silent) detailLoading.value = false;
  }
}

function startPollingIfNeeded() {
  stopPolling();
  if (!selectedDetail.value || isTerminalStatus(selectedDetail.value.executeStatus)) return;
  pollingTimer = setInterval(() => {
    if (activeView.value === "UPGRADE" && detailTab.value === "OVERVIEW") loadSelectedUpgradeDetail(true);
  }, 5000);
}

function stopPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = null;
}

async function switchDetailTab(tab: DetailTab) {
  detailTab.value = tab;
  if (tab === "FRAMES" && !frames.value.length) await loadFrames(false);
  if (tab === "EVENTS" && !events.value.length) await loadEvents(false);
}

async function loadFrames(showMessage: boolean) {
  if (selectedUpgradeId.value === null) return;
  subResourceLoading.value = true;
  try {
    frames.value = asArray(unwrapResponse(await getFirmwareUpgradeFrames(selectedUpgradeId.value)));
    if (showMessage) showToast("帧记录已刷新");
  } catch (error) {
    showError(error, "帧记录加载失败");
  } finally {
    subResourceLoading.value = false;
  }
}

async function loadEvents(showMessage: boolean) {
  if (selectedUpgradeId.value === null) return;
  subResourceLoading.value = true;
  try {
    events.value = asArray(unwrapResponse(await getFirmwareUpgradeEvents(selectedUpgradeId.value)));
    if (showMessage) showToast("事件记录已刷新");
  } catch (error) {
    showError(error, "事件记录加载失败");
  } finally {
    subResourceLoading.value = false;
  }
}

async function confirmCancelUpgrade() {
  if (!selectedDetail.value || !canCancelUpgrade(selectedDetail.value)) return;
  const confirmed = await showConfirm("取消固件升级", `确认取消设备 ${selectedDetail.value.deviceNumber || "--"} 的升级任务吗？`);
  if (!confirmed) return;
  canceling.value = true;
  try {
    unwrapResponse(await cancelFirmwareUpgrade({ upgradeLogIds: [selectedDetail.value.id] }));
    showToast("取消请求已提交");
    await loadSelectedUpgradeDetail(false);
    startPollingIfNeeded();
  } catch (error) {
    showError(error, "取消升级失败");
  } finally {
    canceling.value = false;
  }
}

async function openUpgradeDialog() {
  upgradeDialogVisible.value = true;
  upgradeStep.value = 1;
  upgradeDraft.firmwareId = null;
  upgradeDraft.devices = [];
  updatableResults.value = [];
  deviceKeyword.value = "";
  candidateLoading.value = true;
  try {
    await Promise.all([loadFirmwareCandidates(), loadDeviceCandidates()]);
  } finally {
    candidateLoading.value = false;
  }
}

function closeUpgradeDialog() {
  if (submittingUpgrade.value) return;
  upgradeDialogVisible.value = false;
}

async function loadFirmwareCandidates() {
  try {
    const page = unwrapResponse(await getFirmwarePage({ pageNum: 1, pageSize: 100, sortOrder: "desc" }));
    firmwareCandidates.value = getPageRecords(page);
    if (!upgradeDraft.firmwareId && firmwareCandidates.value[0]) upgradeDraft.firmwareId = firmwareCandidates.value[0].id;
  } catch (error) {
    firmwareCandidates.value = [];
    showError(error, "固件列表加载失败");
  }
}

async function loadDeviceCandidates() {
  try {
    const page = unwrapResponse(await getDevicePage({ pageNum: 1, pageSize: 200 }));
    deviceCandidates.value = getPageRecords(page);
  } catch (error) {
    deviceCandidates.value = [];
    showError(error, "设备列表加载失败");
  }
}

async function nextUpgradeStep() {
  if (upgradeStep.value === 1) {
    if (!upgradeDraft.firmwareId) return showToast("请选择固件");
    upgradeStep.value = 2;
    return;
  }
  if (!selectedDevices.value.length) return showToast("请选择至少一台设备");
  upgradeStep.value = 3;
  await runUpdatableCheck();
}

async function runUpdatableCheck() {
  if (!selectedDevices.value.length) return;
  checkingUpdatable.value = true;
  try {
    const result = unwrapResponse(await checkFirmwareUpdatable({
      deviceNumbers: selectedDevices.value.map(item => item.deviceNumber),
    }));
    updatableResults.value = asArray(result);
  } catch (error) {
    updatableResults.value = [];
    showError(error, "设备升级检查失败");
  } finally {
    checkingUpdatable.value = false;
  }
}

async function submitUpgrade() {
  if (!canSubmitUpgrade.value || !selectedFirmware.value) return;
  submittingUpgrade.value = true;
  try {
    const userInfo = uni.getStorageSync("userInfo") || {};
    const result = unwrapResponse(await startFirmwareUpgrade({
      firmwareId: selectedFirmware.value.id,
      deviceNumbers: selectedDevices.value.map(item => item.deviceNumber),
      createUser: userInfo.username || userInfo.userName || userInfo.realName || undefined,
    }));
    const taskCount = Array.isArray(result?.upgradeLogIds) ? result.upgradeLogIds.length : selectedDevices.value.length;
    upgradeDialogVisible.value = false;
    activeView.value = "UPGRADE";
    upgradePage.current = 1;
    showToast(`已创建 ${taskCount} 个升级任务`);
    await loadUpgradePage(true);
  } catch (error) {
    showError(error, "发起固件升级失败");
  } finally {
    submittingUpgrade.value = false;
  }
}

function toggleDevice(device: ApiRecord) {
  if (!isDirectDevice(device)) return showToast("该设备不是 TCP 直连下发方式");
  const index = upgradeDraft.devices.findIndex(item => item.id === device.id);
  if (index >= 0) upgradeDraft.devices.splice(index, 1);
  else upgradeDraft.devices.push(device);
  updatableResults.value = [];
}

function toggleSelectableDevices() {
  const selectable = filteredDeviceCandidates.value.filter(isDirectDevice);
  if (currentSelectableSelected.value) {
    const ids = new Set(selectable.map(item => item.id));
    upgradeDraft.devices = upgradeDraft.devices.filter(item => !ids.has(item.id));
  } else {
    const ids = new Set(upgradeDraft.devices.map(item => item.id));
    upgradeDraft.devices = [...upgradeDraft.devices, ...selectable.filter(item => !ids.has(item.id))];
  }
  updatableResults.value = [];
}

function isDeviceSelected(device: ApiRecord) {
  return upgradeDraft.devices.some(item => item.id === device.id);
}

function isDirectDevice(device: ApiRecord) {
  return Number(device.commandSendway) === 0;
}

function isDeviceOnline(device: ApiRecord) {
  return Number(device.tcpOnlineStatus ?? device.onlineStatus ?? device.isOnline) === 1;
}

function getCheckResult(deviceNumber: string) {
  if (checkingUpdatable.value) return { updatable: false, label: "检查中" };
  const result = updatableResults.value.find(item => String(item.deviceNumber) === String(deviceNumber));
  if (!result) return { updatable: false, label: "尚未检查" };
  return { updatable: result.updatable === true || Number(result.updatable) === 1, label: result.updatable === true || Number(result.updatable) === 1 ? "可以升级" : (result.reason || result.message || "存在未结束任务") };
}

function handleSearch() {
  activePage.value.current = 1;
  loadActivePage(true);
}

function resetFilters() {
  Object.assign(activeFilters.value, { keyword: "", status: "", startDate: "", endDate: "" });
  if (activeView.value === "UPGRADE") upgradeFilters.firmwareVersion = "";
  handleSearch();
}

function handleStatusChange(event: { detail: { value: string | number } }) {
  activeFilters.value.status = activeStatusOptions.value[Number(event.detail.value)]?.value || "";
  handleSearch();
}

function handleStartDateChange(event: { detail: { value: string } }) {
  activeFilters.value.startDate = event.detail.value;
}

function handleEndDateChange(event: { detail: { value: string } }) {
  activeFilters.value.endDate = event.detail.value;
}

function changePage(page: number) {
  activePage.value.current = page;
  loadActivePage(true);
}

function changePageSize(size: number) {
  activePage.value.size = size;
  activePage.value.current = 1;
  loadActivePage(true);
}

function clearSelection(view: RecordView) {
  if (view === "COMMAND") selectedCommandId.value = null;
  else selectedUpgradeId.value = null;
  selectedDetail.value = null;
  stopPolling();
}

function showCommandSendNotice() {
  uni.showModal({
    title: "指令下发",
    content: "当前后端仅提供指令下发记录查询接口，尚未提供创建指令下发任务的接口。",
    showCancel: false,
  });
}

function normalizeCommandLog(source: ApiRecord = {}) {
  return {
    ...source,
    id: source.id ?? source.commandSendLogId,
    deviceNumber: source.deviceNumber ?? source.deviceNo,
    commandName: source.commandName ?? source.commandDictName ?? source.commandTypeName,
    commandCode: source.commandCode ?? source.command ?? source.commandType,
    executeStatus: source.executeStatus ?? source.sendStatus ?? source.status,
    sendTime: source.sendTime ?? source.createdAt ?? source.createTime,
    finishTime: source.finishTime ?? source.updatedAt ?? source.updateTime,
  };
}

function normalizeUpgradeLog(source: ApiRecord = {}) {
  const received = Number(source.receivedFrameCount || 0);
  const total = Number(source.frameCount || 0);
  return {
    ...source,
    id: source.id ?? source.upgradeLogId,
    finishPercent: clampProgress(source.finishPercent),
    upgradeStageText: getStageText(source.upgradeStage, source.repairRound),
    frameSummary: `${received}/${total}`,
    startTime: source.startTime ?? source.createdAt,
  };
}

function unwrapResponse(response: any) {
  if (response && typeof response === "object" && "code" in response) {
    const code = Number(response.code);
    if (code !== 0 && code !== 200) throw response;
    return response.data;
  }
  return response;
}

function getPageRecords(pageData: any): ApiRecord[] {
  if (Array.isArray(pageData)) return pageData;
  return asArray(pageData?.records ?? pageData?.list ?? pageData?.content);
}

function getPageTotal(pageData: any, fallback: number) {
  return Number(pageData?.total ?? pageData?.totalElements ?? fallback) || 0;
}

function asArray(value: any): ApiRecord[] {
  return Array.isArray(value) ? value : [];
}

function toOptionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function toStartTime(date: string) {
  return date ? `${date} 00:00:00` : undefined;
}

function toEndTime(date: string) {
  return date ? `${date} 23:59:59` : undefined;
}

function getStatusText(status: unknown) {
  return upgradeStatusMap[Number(status)]?.label || "未知状态";
}

function getStatusClass(status: unknown) {
  const toneMap: Record<string, string> = {
    waiting: "default",
    running: "primary",
    warning: "warning",
    danger: "danger",
    success: "success",
    muted: "default",
  };
  return `status-tag--${toneMap[upgradeStatusMap[Number(status)]?.tone || "muted"]}`;
}

function getCommandStatusText(status: unknown) {
  const textMap: Record<string, string> = { "0": "等待执行", "1": "执行中", "2": "执行成功", "3": "执行失败", SUCCESS: "执行成功", FAILED: "执行失败", RUNNING: "执行中", WAITING: "等待执行" };
  return textMap[String(status)] || displayValue(status, "未知状态");
}

function getCommandStatusClass(status: unknown) {
  const text = getCommandStatusText(status);
  if (text.includes("成功")) return "status-tag--success";
  if (text.includes("失败") || text.includes("异常")) return "status-tag--danger";
  if (text.includes("中")) return "status-tag--primary";
  return "status-tag--default";
}

function getStageText(stage: unknown, round?: unknown) {
  const text = upgradeStageMap[String(stage)] || displayValue(stage, "等待任务状态");
  return String(stage) === "SENDING_REPAIR" && Number(round) > 0 ? `${text}（第 ${round} 轮）` : text;
}

function getTransportText(channel: unknown) {
  return ({ DIRECT_TCP: "TCP 直连", AEP_TCP: "AEP TCP", AEP_NB: "AEP NB" } as Record<string, string>)[String(channel)] || displayValue(channel);
}

function getFrameStatusText(status: unknown) {
  return ({ 0: "待发送", 1: "发送中", 2: "已发送", 3: "发送失败" } as Record<number, string>)[Number(status)] || "未知";
}

function getEventTypeText(type: unknown) {
  return eventTypeMap[String(type)] || displayValue(type, "系统事件");
}

function getDirectionText(direction: unknown) {
  return ({ DOWN: "系统下发", UP: "设备上报", SYSTEM: "系统事件" } as Record<string, string>)[String(direction)] || displayValue(direction);
}

function getCommandSendwayText(value: unknown) {
  return ({ 0: "4G/TCP 直连", 1: "NB", 2: "光纤", 3: "串口", 4: "网口" } as Record<number, string>)[Number(value)] || displayValue(value);
}

function canCancelUpgrade(task: ApiRecord) {
  return [0, 1].includes(Number(task.executeStatus));
}

function isTerminalStatus(status: unknown) {
  return upgradeStatusMap[Number(status)]?.terminal === true;
}

function clampProgress(value: unknown) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(number) ? Math.round(number) : 0));
}

function previewHex(value: unknown) {
  const text = String(value || "");
  return text.length > 48 ? `${text.slice(0, 24)}...${text.slice(-24)}` : displayValue(text);
}

function stringifyContent(value: unknown) {
  if (value === undefined || value === null || value === "") return "--";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function displayValue(value: unknown, fallback = "--") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function showToast(title: string) {
  uni.showToast({ title, icon: "none", duration: 2200 });
}

function showError(error: any, fallback: string) {
  showToast(error?.msg || error?.message || fallback);
}

function showConfirm(title: string, content: string): Promise<boolean> {
  return new Promise(resolve => {
    uni.showModal({ title, content, success: result => resolve(Boolean(result.confirm)), fail: () => resolve(false) });
  });
}
</script>

<style scoped lang="scss">
.task-center { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 12px; gap: 12px; overflow: hidden; color: #233d55; background: #f3f7fa; box-sizing: border-box; }
button { margin: 0; font-size: 13px; border-radius: 5px; }
button::after { border: 0; }
.toolbar, .list-panel, .detail-panel { background: #fff; border: 1px solid #d8e5ef; border-radius: 7px; box-shadow: 0 12px 26px rgba(35, 72, 104, 0.08); }
.toolbar { flex: none; display: flex; align-items: flex-end; justify-content: space-between; padding: 12px 14px; gap: 14px; box-sizing: border-box; }
.toolbar__filters, .toolbar__actions { display: flex; align-items: center; gap: 8px; }
.toolbar__filters { flex: 1; min-width: 0; flex-wrap: wrap; gap: 12px; }
.filter-field { display: flex; align-items: center; flex-direction: row; min-width: 180px; gap: 10px; }
.filter-field--keyword { width: 360px; }
.filter-label { flex: none; color: #587086; font-size: 14px; font-weight: 800; }
.filter-input, .filter-select { flex: 1; width: 100%; height: 34px; min-width: 0; padding: 0 10px; color: #24445f; font-size: 13px; line-height: 34px; background: #f8fbfe; border: 1px solid #d6e2ed; border-radius: 4px; box-sizing: border-box; }
.filter-input--short { width: 132px; }
.filter-select { display: flex; align-items: center; justify-content: space-between; min-width: 132px; }
.select-arrow { width: 0; height: 0; margin-left: 10px; border-top: 5px solid #8192a2; border-right: 4px solid transparent; border-left: 4px solid transparent; }
.action-button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; height: 36px; padding: 0 18px; color: #31516d; font-size: 14px; font-weight: 700; line-height: 36px; background: #fff; border: 1px solid #c9d9e7; border-radius: 4px; }
.action-button:hover { color: #0d82ee; background: #edf7ff; border-color: #a9d7ff; }
.action-button--primary { color: #fff; background: #0d82ee; border-color: #0d82ee; }
.action-button--primary:hover { color: #fff; background: #0674d8; border-color: #0674d8; }
.action-button[disabled] { opacity: 0.55; }
.content-layout { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 330px; min-height: 0; gap: 12px; }
.list-panel, .detail-panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.list-panel > :deep(.data-table-container) { flex: 1; height: auto; border: 0; border-radius: 0; box-shadow: none; }
.panel-head, .detail-head, .modal-head { flex: none; display: flex; align-items: flex-start; justify-content: space-between; min-height: 58px; padding: 14px; gap: 12px; border-bottom: 1px solid #e6edf3; box-sizing: border-box; }
.panel-head { align-items: center; }
.panel-head > view, .detail-head > view:first-child, .modal-head > view:first-child { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.panel-head__title, .detail-head__title, .modal-head__title { color: #23435e; font-size: 16px; font-weight: 900; }
.panel-head__subtitle, .detail-head__eyebrow, .modal-head__eyebrow { color: #8192a2; font-size: 10px; font-weight: 700; }
.panel-head__meta { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; margin: 0; padding: 0 14px; color: #647b91; font-size: 14px; font-weight: 800; line-height: 32px; background: #f7fafc; border: 1px solid #dce7ef; border-radius: 999px; }
.record-switch { display: flex !important; align-items: center; flex-direction: row !important; gap: 8px !important; }
.record-switch__button { display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 14px; color: #587086; font-size: 13px; font-weight: 800; line-height: 32px; background: #f7fafc; border: 1px solid #d6e2ed; border-radius: 4px; }
.record-switch__button:hover { color: #0d82ee; background: #edf7ff; border-color: #a9d7ff; }
.record-switch__button--active { color: #fff; background: #0d82ee; border-color: #0d82ee; }
.record-switch__button--active:hover { color: #fff; background: #0674d8; border-color: #0674d8; }
.detail-state { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 9px; color: #75899c; font-size: 13px; }
.detail-state__icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; color: #4f90c4; font-size: 23px; background: #edf6fd; border-radius: 50%; }
.detail-head { align-items: flex-start; }
.detail-head__id { color: #8798a8; font-size: 10px; font-family: Consolas, monospace; }
.detail-head__actions { display: flex !important; align-items: flex-end; gap: 7px !important; }
.detail-tabs { flex: none; display: flex; height: 42px; padding: 0 12px; gap: 4px; background: #fafcfe; border-bottom: 1px solid #e6edf3; }
.detail-tab { position: relative; padding: 0 12px; color: #718397; line-height: 42px; background: transparent; border: 0; }
.detail-tab--active { color: #0875cc; font-weight: 800; }
.detail-tab--active::after { position: absolute; right: 8px; bottom: 0; left: 8px; height: 2px; content: ""; background: #0d82ee; }
.detail-scroll { flex: 1; height: auto; min-height: 0; padding: 13px; box-sizing: border-box; }
.status-tag { display: inline-flex; align-items: center; justify-content: center; min-width: 54px; height: 24px; padding: 0 9px; font-size: 12px; font-weight: 800; line-height: 24px; border: 1px solid transparent; border-radius: 999px; box-sizing: border-box; }
.status-tag--primary { color: #0d82ee; background: #f3f9ff; border-color: #d7eaff; }
.status-tag--success { color: #177245; background: #eaf8ef; border-color: #bfe8ce; }
.status-tag--warning { color: #b54708; background: #fff8eb; border-color: #fedf89; }
.status-tag--danger { color: #b42318; background: #fff1ee; border-color: #ffd3cb; }
.status-tag--default { color: #5f7186; background: #f3f6f9; border-color: #dbe4ec; }
.progress-cell { display: flex; align-items: center; width: 100%; gap: 7px; font-size: 11px; }
.progress-track, .progress-overview__track { flex: 1; height: 7px; overflow: hidden; background: #e4edf4; border-radius: 999px; }
.progress-track view, .progress-overview__track view { height: 100%; background: linear-gradient(90deg, #27a4ef, #087bd7); border-radius: inherit; }
.section-title { display: block; color: #294b66; font-size: 13px; font-weight: 900; }
.info-section + .info-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid #edf2f6; }
.info-list { margin-top: 8px; overflow: hidden; border: 1px solid #e2eaf1; border-radius: 5px; }
.info-row { display: flex; align-items: center; justify-content: space-between; min-height: 34px; padding: 7px 9px; gap: 12px; font-size: 11px; background: #fbfdff; border-bottom: 1px solid #edf2f6; box-sizing: border-box; }
.info-row:last-child { border-bottom: 0; }.info-row text:first-child { flex: none; color: #75899c; }.info-row text:last-child { min-width: 0; color: #294b66; font-weight: 800; text-align: right; }
.ellipsis-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.code-card { display: flex; flex-direction: column; margin-top: 8px; padding: 9px; gap: 6px; color: #425c72; font-size: 10px; line-height: 1.55; white-space: pre-wrap; word-break: break-all; background: #f5f8fa; border: 1px solid #e1e9ef; border-radius: 5px; }
.code-card__label { color: #75899c; font-weight: 800; }.error-card, .warning-card { margin-top: 10px; padding: 9px 10px; color: #b34040; font-size: 11px; line-height: 1.5; background: #fff1f1; border: 1px solid #f0c3c3; border-radius: 5px; }
.progress-overview { padding: 12px; background: #f5faff; border: 1px solid #d8eaf7; border-radius: 6px; }
.progress-overview__head { display: flex; justify-content: space-between; margin-bottom: 8px; color: #2b5777; font-size: 12px; font-weight: 900; }.progress-overview__track { width: 100%; }.stage-text { display: block; margin-top: 7px; color: #628097; font-size: 10px; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); margin: 10px 0 14px; gap: 8px; }.stat-grid > view { display: flex; align-items: center; flex-direction: column; padding: 9px; gap: 3px; background: #f7fafc; border: 1px solid #e2eaf1; border-radius: 5px; }.stat-grid text:first-child { color: #2177b7; font-size: 18px; font-weight: 900; }.stat-grid text:last-child { color: #7b8d9e; font-size: 10px; }
.mini-button { height: 29px; padding: 0 10px; color: #31506d; font-size: 11px; line-height: 29px; background: #f6fbff; border: 1px solid #cbdced; }.mini-button--danger { color: #b13f3f; background: #fff5f5; border-color: #edc4c4; }
.subsection-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }.subsection-head > view { display: flex; flex-direction: column; gap: 3px; }.subsection-hint { color: #8798a8; font-size: 9px; }
.resource-state { padding: 40px 12px; color: #7a8d9f; font-size: 12px; text-align: center; }
.compact-table { min-width: 720px; overflow: hidden; border: 1px solid #e1e9ef; border-radius: 5px; }.compact-row { display: grid; grid-template-columns: 70px 60px 75px 55px 55px minmax(180px, 1fr) 140px; min-height: 36px; border-bottom: 1px solid #edf2f6; }.compact-row:last-child { border-bottom: 0; }.compact-row > text { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 5px 7px; overflow: hidden; color: #425d73; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #edf2f6; box-sizing: border-box; }.compact-row--header { background: #f5f8fb; }.compact-row--header text { color: #516b81; font-weight: 900; }.hex-preview { font-family: Consolas, monospace; }
.timeline { padding-left: 8px; }.timeline-item { position: relative; padding: 0 0 14px 22px; border-left: 1px solid #d9e4ec; }.timeline-item__dot { position: absolute; top: 3px; left: -5px; width: 9px; height: 9px; background: #8195a7; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px #8195a7; }.timeline-item--down .timeline-item__dot { background: #1989e5; box-shadow: 0 0 0 1px #1989e5; }.timeline-item--up .timeline-item__dot { background: #22a36c; box-shadow: 0 0 0 1px #22a36c; }.timeline-item__content { display: flex; flex-direction: column; gap: 4px; }.timeline-item__content > view { display: flex; justify-content: space-between; gap: 10px; }.timeline-item__title { color: #294b66; font-size: 11px; font-weight: 900; }.timeline-item__time, .timeline-item__meta { color: #8496a6; font-size: 9px; }.timeline-item__detail { color: #5d7488; font-size: 10px; line-height: 1.5; }.timeline-item__hex { overflow: hidden; color: #51728d; font-size: 9px; font-family: Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
.modal-mask { position: fixed; z-index: 3000; inset: 0; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(20, 39, 56, 0.55); box-sizing: border-box; }.upgrade-modal { display: flex; flex-direction: column; width: min(1180px, 95vw); height: min(800px, 90vh); overflow: hidden; background: #fff; border: 1px solid #c9d9e6; border-radius: 8px; box-shadow: 0 26px 70px rgba(13, 39, 59, 0.3); }.modal-head { background: #fbfdff; }.upgrade-modal .modal-head__eyebrow { font-size: 13px; }.upgrade-modal .modal-head__title { font-size: 21px; }.modal-close { width: 38px; height: 38px; padding: 0; color: #718497; font-size: 28px; line-height: 35px; background: transparent; border: 0; }
.step-bar { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); padding: 16px 24px; background: #f5f9fc; border-bottom: 1px solid #e2eaf1; }.step-item { display: flex; align-items: center; justify-content: center; gap: 9px; color: #8495a5; font-size: 14px; font-weight: 800; }.step-item__number { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-size: 14px; background: #fff; border: 1px solid #c5d5e2; border-radius: 50%; box-sizing: border-box; }.step-item--active { color: #0874cb; }.step-item--active .step-item__number { color: #fff; background: #0d82ee; border-color: #0d82ee; }.step-item--done { color: #208a5f; }.step-item--done .step-item__number { color: #fff; background: #27a471; border-color: #27a471; }
.modal-body { flex: 1; height: auto; min-height: 0; padding: 22px 26px; background: #f7fafc; box-sizing: border-box; }.wizard-section { width: 100%; max-width: 1080px; margin: 0 auto; }.wizard-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }.wizard-head > view:first-child { display: flex; flex-direction: column; gap: 5px; }.wizard-title { color: #294b66; font-size: 20px; font-weight: 900; }.wizard-hint { color: #7d90a2; font-size: 14px; }.selected-count { padding: 6px 12px; color: #0875cc; font-size: 14px; font-weight: 900; background: #e8f4fe; border: 1px solid #c6e2f8; border-radius: 999px; }
.choice-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.choice-card { display: flex; padding: 15px; gap: 12px; background: #fff; border: 1px solid #d9e4ec; border-radius: 6px; cursor: pointer; }.choice-card--active { background: #eff8ff; border-color: #58a7e5; box-shadow: inset 0 0 0 1px #bce0f8; }.choice-radio { flex: none; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; margin-top: 2px; border: 2px solid #b3c3d0; border-radius: 50%; box-sizing: border-box; }.choice-card--active .choice-radio { border-color: #0d82ee; }.choice-card--active .choice-radio text { width: 9px; height: 9px; background: #0d82ee; border-radius: 50%; }.choice-content { display: flex; flex: 1; flex-direction: column; min-width: 0; gap: 7px; }.choice-content > view { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.choice-title { color: #294b66; font-size: 16px; font-weight: 900; }.version-pill { padding: 4px 9px; color: #13755c; font-size: 13px; font-weight: 900; background: #eaf8f2; border-radius: 999px; }.choice-description, .choice-meta { overflow: hidden; color: #718698; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.device-filter { display: flex; margin-bottom: 12px; gap: 10px; }.device-filter .filter-input { flex: 1; height: 40px; font-size: 14px; line-height: 40px; }.device-filter .mini-button { height: 40px; padding: 0 15px; font-size: 14px; line-height: 40px; }.device-table { width: 100%; overflow: hidden; background: #fff; border: 1px solid #d9e4ec; border-radius: 5px; box-sizing: border-box; }.device-row { display: grid; grid-template-columns: 56px minmax(150px, 1.05fr) minmax(170px, 1.45fr) 150px 120px 130px; width: 100%; min-height: 50px; border-bottom: 1px solid #edf2f6; cursor: pointer; box-sizing: border-box; }.device-row:last-child { border-bottom: 0; }.device-row > text, .device-check-cell { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 8px 10px; overflow: hidden; color: #405c73; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #edf2f6; box-sizing: border-box; }.device-row--header { min-height: 52px; color: #4c657a; font-weight: 900; background: #f4f8fb; cursor: default; }.device-row--header > text { font-size: 14px; }.device-row--selected { background: #eaf5ff; }.device-row--disabled { opacity: 0.5; cursor: not-allowed; }.checkbox { display: flex; align-items: center; justify-content: center; flex: none; width: 20px; height: 20px; padding: 0; color: #fff; font-size: 14px; line-height: 20px; background: #fff; border: 1px solid #aebfcd; border-radius: 3px; box-sizing: border-box; }.device-row--selected .checkbox { background: #0d82ee; border-color: #0d82ee; }.online-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 54px; height: 24px; padding: 0 9px; font-size: 12px; font-weight: 800; border-radius: 999px; box-sizing: border-box; }.online-pill--online { color: #16744b; background: #e9f8ef; border: 1px solid #bee7ce; }.online-pill--offline { color: #6d7e8e; background: #f0f3f6; border: 1px solid #d5dfe7; }
.confirm-summary { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 14px; gap: 10px; }.confirm-summary > view { display: flex; flex-direction: column; padding: 12px; gap: 5px; background: #eef7ff; border: 1px solid #d2e8f8; border-radius: 5px; }.confirm-summary text:first-child { color: #778c9e; font-size: 13px; }.confirm-summary text:last-child { color: #285773; font-size: 16px; font-weight: 900; }.check-list { overflow: hidden; background: #fff; border: 1px solid #dce6ed; border-radius: 5px; }.check-item { display: flex; align-items: center; justify-content: space-between; min-height: 60px; padding: 10px 14px; gap: 12px; border-bottom: 1px solid #edf2f6; box-sizing: border-box; }.check-item:last-child { border-bottom: 0; }.check-item > view { display: flex; flex-direction: column; gap: 4px; color: #7a8d9f; font-size: 13px; }.check-item__number { color: #2a526f; font-size: 15px; font-weight: 900; }.check-result { max-width: 260px; padding: 5px 10px; font-size: 13px; font-weight: 800; text-align: right; border-radius: 999px; }.check-result--success { color: #177245; background: #eaf8ef; }.check-result--danger { color: #b33e3e; background: #fff0f0; }
.upgrade-modal .resource-state, .upgrade-modal .warning-card { font-size: 14px; }.modal-actions { flex: none; display: flex; align-items: center; justify-content: space-between; min-height: 72px; padding: 14px 18px; background: #fff; border-top: 1px solid #e2eaf1; box-sizing: border-box; }.modal-actions > view { display: flex; gap: 10px; }.upgrade-modal .modal-actions .action-button { min-width: 88px; height: 42px; font-size: 16px; line-height: 42px; }
@media (max-width: 1280px) { .filter-field--date { display: none; }.content-layout { grid-template-columns: minmax(0, 1fr) 330px; } }
@media (max-width: 980px) { .task-center { height: auto; min-height: calc(100vh - 88px); overflow: visible; }.toolbar { align-items: stretch; flex-direction: column; }.toolbar__filters { flex-wrap: wrap; }.toolbar__actions { justify-content: flex-end; }.content-layout { grid-template-columns: 1fr; }.list-panel { min-height: 560px; }.detail-panel { min-height: 540px; }.choice-list { grid-template-columns: 1fr; } }
</style>
