<!-- 指令管理业务视图：当前为纯前端流程原型，不调用接口、不连接真实设备。 -->
<template>
  <view class="command-manage">
    <view class="command-toolbar">
      <view class="toolbar__filters">
        <view class="filter-field filter-field--keyword">
          <text class="filter-label">历史检索</text>
          <input
            v-model="filters.keyword"
            class="filter-input"
            placeholder="输入任务编号、指令名称或设备编号"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="filter-field">
          <text class="filter-label">指令类型</text>
          <picker :range="typeFilterOptions" range-key="label" :value="typeFilterIndex" @change="handleTypeFilterChange">
            <view class="filter-select">
              <text>{{ typeFilterOptions[typeFilterIndex]?.label }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-field">
          <text class="filter-label">执行状态</text>
          <picker :range="taskStatusFilterOptions" range-key="label" :value="statusFilterIndex" @change="handleStatusFilterChange">
            <view class="filter-select">
              <text>{{ taskStatusFilterOptions[statusFilterIndex]?.label }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">开始日期</text>
          <picker mode="date" :value="filters.startDate" @change="handleStartDateChange">
            <view class="filter-select">
              <text>{{ filters.startDate || "不限" }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">结束日期</text>
          <picker mode="date" :value="filters.endDate" @change="handleEndDateChange">
            <view class="filter-select">
              <text>{{ filters.endDate || "不限" }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>
      </view>

      <view class="toolbar__actions">
        <button class="toolbar-button" hover-class="button-hover" @click="resetFilters">重置</button>
        <button class="toolbar-button" hover-class="button-hover" @click="refreshTasks">刷新</button>
        <button class="toolbar-button toolbar-button--primary" hover-class="button-hover" @click="openDispatch">指令下发</button>
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
        <view class="panel-head">
          <view class="panel-head__title-group">
            <text class="panel-head__title">历史指令</text>
            <text class="panel-head__subtitle">本地保存的模拟下发批次，点击记录查看完整过程</text>
          </view>
          <view class="panel-head__meta-group">
            <button v-if="tasks.length" class="text-button text-button--danger" @click="clearMockTasks">清空模拟记录</button>
            <text class="panel-head__meta">{{ localizedTotal(filteredTasks.length) }}</text>
          </view>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="history-table">
            <view class="history-row history-row--header">
              <text class="history-cell history-cell--index">序号</text>
              <text class="history-cell history-cell--task">任务编号</text>
              <text class="history-cell history-cell--command">指令名称</text>
              <text class="history-cell history-cell--type">类型</text>
              <text class="history-cell history-cell--devices">设备</text>
              <text class="history-cell history-cell--progress">总体进度</text>
              <text class="history-cell history-cell--status">状态</text>
              <text class="history-cell history-cell--time">创建时间</text>
            </view>

            <view v-if="filteredTasks.length === 0" class="table-state">
              <text class="table-state__title">暂无历史指令</text>
              <text class="table-state__hint">点击右上角“指令下发”创建第一条模拟任务</text>
            </view>

            <view
              v-for="(task, index) in filteredTasks"
              v-else
              :key="task.id"
              class="history-row"
              :class="{ 'history-row--active': selectedTask?.id === task.id }"
              @click="selectTask(task)"
            >
              <text class="history-cell history-cell--index">{{ index + 1 }}</text>
              <text class="history-cell history-cell--task">{{ task.taskNo }}</text>
              <text class="history-cell history-cell--command">{{ task.commandName }}</text>
              <text class="history-cell history-cell--type">{{ getExecutionTypeLabel(task.executionType) }}</text>
              <text class="history-cell history-cell--devices">{{ task.devices.length }} 台</text>
              <view class="history-cell history-cell--progress">
                <view class="compact-progress">
                  <view class="compact-progress__track">
                    <view class="compact-progress__value" :style="{ width: `${task.progress}%` }"></view>
                  </view>
                  <text>{{ task.progress }}%</text>
                </view>
              </view>
              <view class="history-cell history-cell--status">
                <text class="status-pill" :class="getTaskStatusClass(task.status)">{{ getTaskStatusLabel(task.status) }}</text>
              </view>
              <text class="history-cell history-cell--time">{{ task.createdAt }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="detail-panel">
        <view v-if="!selectedTask" class="detail-empty">
          <text class="detail-empty__icon">⌁</text>
          <text>请选择左侧历史指令查看详情</text>
        </view>

        <template v-else>
          <view class="detail-head">
            <view class="detail-head__title-group">
              <text class="detail-head__label">任务详情</text>
              <text class="detail-head__title">{{ selectedTask.commandName }}</text>
              <text class="detail-head__task-no">{{ selectedTask.taskNo }}</text>
            </view>
            <text class="status-pill" :class="getTaskStatusClass(selectedTask.status)">{{ getTaskStatusLabel(selectedTask.status) }}</text>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <view class="detail-stat-grid">
              <view class="detail-stat">
                <text class="detail-stat__value">{{ selectedTask.devices.length }}</text>
                <text class="detail-stat__label">设备总数</text>
              </view>
              <view class="detail-stat detail-stat--success">
                <text class="detail-stat__value">{{ selectedTask.successCount }}</text>
                <text class="detail-stat__label">已完成</text>
              </view>
              <view class="detail-stat detail-stat--danger">
                <text class="detail-stat__value">{{ selectedTask.failedCount }}</text>
                <text class="detail-stat__label">异常</text>
              </view>
            </view>

            <view class="detail-section">
              <view class="detail-section__head">
                <text class="detail-section__title">下发信息</text>
                <button class="mini-button mini-button--primary" @click="openProgress(selectedTask)">查看设备进度</button>
              </view>
              <view class="info-list">
                <view class="info-row"><text>指令码</text><text>{{ selectedTask.commandCode }}</text></view>
                <view class="info-row"><text>执行类型</text><text>{{ getExecutionTypeLabel(selectedTask.executionType) }}</text></view>
                <view class="info-row"><text>模拟场景</text><text>{{ getScenarioLabel(selectedTask.scenario) }}</text></view>
                <view class="info-row"><text>创建时间</text><text>{{ selectedTask.createdAt }}</text></view>
                <view class="info-row"><text>最后更新</text><text>{{ selectedTask.updatedAt }}</text></view>
              </view>
            </view>

            <view v-if="selectedTask.executionType === 'PARAM_SETTING'" class="detail-section">
              <text class="detail-section__title">参数快照</text>
              <view class="parameter-chips">
                <view v-for="(value, key) in selectedTask.params" :key="key" class="parameter-chip">
                  <text>{{ getParamLabel(String(key)) }}</text>
                  <text>{{ value }}</text>
                </view>
              </view>
            </view>

            <view v-if="selectedTask.firmware" class="detail-section">
              <text class="detail-section__title">固件文件</text>
              <view class="file-card">
                <view class="file-card__icon">TXT</view>
                <view class="file-card__content">
                  <text class="file-card__name">{{ selectedTask.firmware.fileName }}</text>
                  <text class="file-card__meta">{{ formatBytes(selectedTask.firmware.fileSize) }} · {{ selectedTask.firmware.totalFrames }} 帧 · 每帧最多 500 字节</text>
                </view>
              </view>
            </view>

            <view v-if="selectedTask.audio" class="detail-section">
              <text class="detail-section__title">音频记录</text>
              <view class="audio-summary">
                <view><text>总帧数</text><text>{{ selectedTask.audio.totalFrames }}</text></view>
                <view><text>初始已收</text><text>{{ selectedTask.audio.initialReceivedFrames }}</text></view>
                <view><text>初始缺失</text><text>{{ selectedTask.audio.initialMissingFrames.length }}</text></view>
              </view>
            </view>

            <view class="detail-section">
              <view class="detail-section__head">
                <text class="detail-section__title">设备结果</text>
                <text class="detail-section__meta">{{ selectedTask.progress }}%</text>
              </view>
              <view class="device-result-list">
                <view v-for="device in selectedTask.devices" :key="device.id" class="device-result-item">
                  <view class="device-result-item__top">
                    <view>
                      <text class="device-result-item__number">{{ device.deviceNumber }}</text>
                      <text class="device-result-item__phase">{{ device.phaseText }}</text>
                    </view>
                    <text class="device-status-dot" :class="getDeviceStatusClass(device.status)"></text>
                  </view>
                  <view class="device-result-item__progress">
                    <view class="device-result-item__track"><view :style="{ width: `${device.progress}%` }"></view></view>
                    <text>{{ device.progress }}%</text>
                  </view>
                  <text class="device-result-item__message">{{ device.responseMessage || "尚未收到模拟返回" }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </template>
      </view>
    </view>

    <!-- 三步指令下发弹窗 -->
    <view v-if="dispatchVisible" class="modal-mask" @click.self="closeDispatch">
      <view class="modal modal--dispatch">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">纯前端流程原型</text>
            <text class="modal-head__title">指令下发</text>
          </view>
          <button class="modal-close" aria-label="关闭" @click="closeDispatch">×</button>
        </view>

        <view class="step-bar">
          <view v-for="step in dispatchSteps" :key="step.value" class="step-item" :class="{ 'step-item--active': dispatchStep === step.value, 'step-item--done': dispatchStep > step.value }">
            <text class="step-item__number">{{ dispatchStep > step.value ? "✓" : step.value }}</text>
            <text>{{ step.label }}</text>
          </view>
        </view>

        <scroll-view class="modal-body" scroll-y>
          <view v-if="dispatchStep === 1" class="wizard-section">
            <view class="wizard-intro">
              <text class="wizard-intro__title">选择要下发的指令</text>
              <text class="wizard-intro__text">三个内置指令分别用于演示参数设置、固件断点续传和音频四轮补帧。</text>
            </view>
            <view class="command-choice-list">
              <view
                v-for="command in availableCommands"
                :key="command.id"
                class="command-choice"
                :class="{ 'command-choice--active': draft.commandId === command.id }"
                @click="draft.commandId = command.id"
              >
                <view class="command-choice__radio"><text></text></view>
                <view class="command-choice__main">
                  <view class="command-choice__head">
                    <text class="command-choice__name">{{ command.name }}</text>
                    <text class="command-choice__code">{{ command.commandCode }}</text>
                  </view>
                  <text class="command-choice__type">{{ getExecutionTypeLabel(command.executionType) }} · {{ command.category }}</text>
                  <text class="command-choice__desc">{{ command.description }}</text>
                  <text class="command-choice__frame">{{ command.requestFrame }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="dispatchStep === 2" class="wizard-section wizard-section--devices">
            <view class="wizard-intro wizard-intro--inline">
              <view>
                <text class="wizard-intro__title">批量选择设备</text>
                <text class="wizard-intro__text">离线设备会进入“等待设备上线”，可在进度弹窗中手动模拟连接。</text>
              </view>
              <text class="selected-count">已选择 {{ draft.deviceIds.length }} 台</text>
            </view>

            <view class="device-toolbar">
              <input v-model="deviceFilters.keyword" class="filter-input" placeholder="搜索设备编号或安装位置" placeholder-class="input-placeholder" />
              <picker :range="deviceStatusOptions" range-key="label" :value="deviceStatusIndex" @change="handleDeviceStatusChange">
                <view class="filter-select device-status-select">{{ deviceStatusOptions[deviceStatusIndex]?.label }}<text class="select-arrow"></text></view>
              </picker>
              <button class="mini-button" @click="toggleCurrentDevicePage">{{ isCurrentDevicePageSelected ? "取消本页" : "选择本页" }}</button>
            </view>

            <view class="device-select-table">
              <view class="device-select-row device-select-row--header">
                <text class="device-select-cell device-select-cell--check"></text>
                <text class="device-select-cell device-select-cell--number">设备编号</text>
                <text class="device-select-cell device-select-cell--type">设备类型</text>
                <text class="device-select-cell device-select-cell--version">固件版本</text>
                <text class="device-select-cell device-select-cell--online">在线状态</text>
                <text class="device-select-cell device-select-cell--address">安装位置</text>
              </view>
              <view
                v-for="device in pagedDevices"
                :key="device.id"
                class="device-select-row"
                :class="{ 'device-select-row--active': draft.deviceIds.includes(device.id) }"
                @click="toggleDevice(device.id)"
              >
                <view class="device-select-cell device-select-cell--check"><text class="mock-checkbox">{{ draft.deviceIds.includes(device.id) ? "✓" : "" }}</text></view>
                <text class="device-select-cell device-select-cell--number">{{ device.deviceNumber }}</text>
                <text class="device-select-cell device-select-cell--type">{{ device.deviceType }}</text>
                <text class="device-select-cell device-select-cell--version">{{ device.firmwareVersion }}</text>
                <view class="device-select-cell device-select-cell--online"><text class="online-pill" :class="device.onlineStatus ? 'online-pill--online' : 'online-pill--offline'">{{ device.onlineStatus ? "在线" : "离线" }}</text></view>
                <text class="device-select-cell device-select-cell--address">{{ device.installAddress }}</text>
              </view>
            </view>

            <view class="pagination-bar">
              <button class="page-button" :disabled="devicePage.current <= 1" @click="devicePage.current--">{{ localeText("上一页", "Previous") }}</button>
              <text>{{ localizedPageInfo(devicePage.current, devicePageCount) }}</text>
              <button class="page-button" :disabled="devicePage.current >= devicePageCount" @click="devicePage.current++">{{ localeText("下一页", "Next") }}</button>
            </view>
          </view>

          <view v-if="dispatchStep === 3" class="wizard-section">
            <view class="wizard-intro wizard-intro--inline">
              <view>
                <text class="wizard-intro__title">配置并确认模拟流程</text>
                <text class="wizard-intro__text">当前不会请求接口，也不会向真实设备发送任何数据。</text>
              </view>
              <view v-if="selectedDraftCommand" class="selected-command-badge">
                <text>{{ selectedDraftCommand.commandCode }}</text>
                <text>{{ selectedDraftCommand.name }}</text>
              </view>
            </view>

            <view class="config-card">
              <text class="config-card__title">模拟场景</text>
              <picker :range="scenarioOptions" range-key="label" :value="scenarioIndex" @change="handleScenarioChange">
                <view class="form-select">{{ scenarioOptions[scenarioIndex]?.label }}<text class="select-arrow"></text></view>
              </picker>
              <text class="form-hint">场景结果固定可复现，便于反复检查页面状态。</text>
            </view>

            <view v-if="selectedDraftCommand?.executionType === 'PARAM_SETTING'" class="config-card">
              <text class="config-card__title">参数设置</text>
              <view class="form-grid">
                <view class="form-field">
                  <text class="form-label">采样间隔（分钟）</text>
                  <input v-model="parameterForm.sampleInterval" class="form-input" type="number" />
                </view>
                <view class="form-field">
                  <text class="form-label">上报间隔（分钟）</text>
                  <input v-model="parameterForm.uploadInterval" class="form-input" type="number" />
                </view>
                <view class="form-field">
                  <text class="form-label">服务器地址</text>
                  <input v-model="parameterForm.serverHost" class="form-input" />
                </view>
                <view class="form-field">
                  <text class="form-label">服务器端口</text>
                  <input v-model="parameterForm.serverPort" class="form-input" type="number" />
                </view>
              </view>
              <view class="flow-note"><text>模拟规则</text><text>设备上线 → 等待 1 秒 → 10 秒窗口内下发 → 显示模拟结果</text></view>
            </view>

            <view v-if="selectedDraftCommand?.executionType === 'FIRMWARE_UPGRADE'" class="config-card">
              <text class="config-card__title">固件 TXT 文件</text>
              <view v-if="!firmwareDraft" class="file-uploader" @click="chooseFirmwareFile">
                <text class="file-uploader__icon">＋</text>
                <text class="file-uploader__title">选择本地 TXT 文件</text>
                <text class="file-uploader__hint">仅在浏览器内读取并按 500 字节拆帧，不会上传</text>
              </view>
              <view v-else class="file-card file-card--selected">
                <view class="file-card__icon">TXT</view>
                <view class="file-card__content">
                  <text class="file-card__name">{{ firmwareDraft.fileName }}</text>
                  <text class="file-card__meta">{{ formatBytes(firmwareDraft.fileSize) }} · {{ firmwareDraft.totalFrames }} 帧</text>
                  <text class="file-card__frames">帧长度：{{ getFrameLengthPreview(firmwareDraft.frameLengths) }}</text>
                </view>
                <button class="mini-button" @click.stop="chooseFirmwareFile">重新选择</button>
              </view>
              <view class="flow-note"><text>模拟规则</text><text>上线后等待 1 秒 → 每秒一帧 → 返回缺失帧 → 重连后仅补缺失帧</text></view>
            </view>

            <view v-if="selectedDraftCommand?.executionType === 'AUDIO_REPAIR'" class="config-card">
              <text class="config-card__title">音频记录</text>
              <picker :range="audioRecordOptions" range-key="label" :value="audioRecordIndex" @change="handleAudioRecordChange">
                <view class="form-select">{{ audioRecordOptions[audioRecordIndex]?.label || "请选择音频记录" }}<text class="select-arrow"></text></view>
              </picker>
              <view v-if="selectedAudioRecord" class="audio-summary audio-summary--wide">
                <view><text>总帧数</text><text>{{ selectedAudioRecord.totalFrames }}</text></view>
                <view><text>已接收</text><text>{{ selectedAudioRecord.receivedFrames }}</text></view>
                <view><text>缺失帧</text><text>{{ selectedAudioRecord.missingFrames.length }}</text></view>
                <view><text>缺失序号</text><text>{{ formatMissingFrames(selectedAudioRecord.missingFrames) }}</text></view>
              </view>
              <view class="flow-note"><text>模拟规则</text><text>每次设备连接执行一轮，收齐即结束，最多补发 4 轮</text></view>
            </view>

            <view class="confirm-card">
              <view><text>指令</text><text>{{ selectedDraftCommand?.name }}</text></view>
              <view><text>设备</text><text>{{ draft.deviceIds.length }} 台</text></view>
              <view><text>场景</text><text>{{ scenarioOptions[scenarioIndex]?.label }}</text></view>
            </view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="toolbar-button" @click="closeDispatch">取消</button>
          <view class="modal-actions__right">
            <button v-if="dispatchStep > 1" class="toolbar-button" @click="dispatchStep--">上一步</button>
            <button v-if="dispatchStep < 3" class="toolbar-button toolbar-button--primary" @click="goNextStep">下一步</button>
            <button v-else class="toolbar-button toolbar-button--primary" @click="createMockTask">开始模拟下发</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 逐设备进度弹窗 -->
    <view v-if="progressVisible && progressTask" class="modal-mask" @click.self="closeProgress">
      <view class="modal modal--progress">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ progressTask.taskNo }}</text>
            <text class="modal-head__title">设备下发进度</text>
          </view>
          <view class="progress-head-actions">
            <button v-if="hasActionableDevices(progressTask)" class="mini-button mini-button--primary" @click="simulateAllPending(progressTask)">模拟全部上线/重连</button>
            <button class="modal-close" aria-label="关闭" @click="closeProgress">×</button>
          </view>
        </view>

        <view class="progress-summary-bar">
          <view><text>指令</text><text>{{ progressTask.commandName }}</text></view>
          <view><text>设备</text><text>{{ progressTask.devices.length }} 台</text></view>
          <view><text>完成</text><text>{{ progressTask.successCount }} 台</text></view>
          <view><text>总体进度</text><text>{{ progressTask.progress }}%</text></view>
        </view>

        <scroll-view class="progress-table-scroll" scroll-x scroll-y>
          <view class="progress-table">
            <view class="progress-row progress-row--header">
              <text class="progress-cell progress-cell--number">设备编号</text>
              <text class="progress-cell progress-cell--online">连接</text>
              <text class="progress-cell progress-cell--phase">当前阶段</text>
              <text class="progress-cell progress-cell--round">轮次</text>
              <text class="progress-cell progress-cell--value">下发进度</text>
              <text class="progress-cell progress-cell--message">最近返回消息</text>
              <text class="progress-cell progress-cell--time">更新时间</text>
              <text class="progress-cell progress-cell--action">操作</text>
            </view>
            <view v-for="device in progressTask.devices" :key="device.id" class="progress-row">
              <text class="progress-cell progress-cell--number">{{ device.deviceNumber }}</text>
              <view class="progress-cell progress-cell--online"><text class="online-pill" :class="device.onlineStatus ? 'online-pill--online' : 'online-pill--offline'">{{ device.onlineStatus ? localeText("在线", "Online") : localeText("离线", "Offline") }}</text></view>
              <view class="progress-cell progress-cell--phase">
                <text v-if="isDeviceLoading(device.status)" class="loading-spinner"></text>
                <text>{{ device.phaseText }}</text>
              </view>
              <text class="progress-cell progress-cell--round">{{ formatRound(device) }}</text>
              <view class="progress-cell progress-cell--value">
                <view class="table-progress"><view><text :style="{ width: `${device.progress}%` }"></text></view><text>{{ getDeviceProgressText(progressTask, device) }}</text></view>
              </view>
              <text class="progress-cell progress-cell--message" :title="device.responseMessage">{{ device.responseMessage || "尚未收到返回消息" }}</text>
              <text class="progress-cell progress-cell--time">{{ device.updatedAt }}</text>
              <view class="progress-cell progress-cell--action">
                <button v-if="canSimulateConnection(device.status)" class="table-action-button" @click="simulateDeviceConnection(progressTask, device)">{{ device.status === "WAITING_ONLINE" ? "模拟上线" : "继续模拟" }}</button>
                <text v-else class="action-placeholder">—</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <text class="prototype-tip">当前所有状态均为本地模拟，不代表真实设备执行结果。</text>
          <button class="toolbar-button toolbar-button--primary" @click="closeProgress">完成</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useLocaleText, useLocalizedPageInfo, useLocalizedTotal } from "@/i18n/localeText";
import {
  prototypeAudioRecords,
  prototypeCommands,
  prototypeDevices,
  scenarioOptions,
} from "../mock/commandMockData";
import type {
  CommandExecutionType,
  CommandTaskStatus,
  DeviceTaskStatus,
  FirmwarePrototypeInfo,
  MockAudioRecord,
  MockCommandTask,
  MockDeviceTask,
  MockScenario,
} from "../commandManage.types";

const localeText = useLocaleText();
const localizedPageInfo = useLocalizedPageInfo();
const localizedTotal = useLocalizedTotal();

interface PickerChangeEvent {
  detail: { value: number | string };
}

const TASK_STORAGE_KEY = "commandManageMockTasks";
const ACTIVE_DEVICE_STATUSES: DeviceTaskStatus[] = ["WAITING_DELAY", "SENDING", "WAITING_RESPONSE"];
const timers = new Map<string, Array<ReturnType<typeof setTimeout>>>();

const filters = reactive({
  keyword: "",
  executionType: "ALL" as "ALL" | CommandExecutionType,
  status: "ALL" as "ALL" | CommandTaskStatus,
  startDate: "",
  endDate: "",
});

const typeFilterOptions: Array<{ label: string; value: "ALL" | CommandExecutionType }> = [
  { label: "全部类型", value: "ALL" },
  { label: "参数设置", value: "PARAM_SETTING" },
  { label: "固件升级", value: "FIRMWARE_UPGRADE" },
  { label: "音频补帧", value: "AUDIO_REPAIR" },
];

const taskStatusFilterOptions: Array<{ label: string; value: "ALL" | CommandTaskStatus }> = [
  { label: "全部状态", value: "ALL" },
  { label: "等待执行", value: "WAITING" },
  { label: "执行中", value: "RUNNING" },
  { label: "部分完成", value: "PARTIAL" },
  { label: "已完成", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
  { label: "已放弃", value: "ABANDONED" },
  { label: "已暂停", value: "PAUSED" },
];

const tasks = ref<MockCommandTask[]>(loadTasks());
const selectedTaskId = ref(tasks.value[0]?.id || "");
const selectedTask = computed(() => tasks.value.find((item) => item.id === selectedTaskId.value) || null);

const typeFilterIndex = computed(() => Math.max(0, typeFilterOptions.findIndex((item) => item.value === filters.executionType)));
const statusFilterIndex = computed(() => Math.max(0, taskStatusFilterOptions.findIndex((item) => item.value === filters.status)));

const filteredTasks = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return tasks.value.filter((task) => {
    const searchable = [task.taskNo, task.commandName, task.commandCode, ...task.devices.map((device) => device.deviceNumber)]
      .join(" ")
      .toLowerCase();
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesType = filters.executionType === "ALL" || task.executionType === filters.executionType;
    const matchesStatus = filters.status === "ALL" || task.status === filters.status;
    const date = task.createdAt.slice(0, 10);
    const matchesStart = !filters.startDate || date >= filters.startDate;
    const matchesEnd = !filters.endDate || date <= filters.endDate;
    return matchesKeyword && matchesType && matchesStatus && matchesStart && matchesEnd;
  });
});

const summaryCards = computed(() => {
  const today = formatDate(new Date()).slice(0, 10);
  const todayCount = tasks.value.filter((task) => task.createdAt.startsWith(today)).length;
  const waiting = tasks.value.filter((task) => ["WAITING", "PAUSED"].includes(task.status)).length;
  const running = tasks.value.filter((task) => task.status === "RUNNING").length;
  const abnormal = tasks.value.filter((task) => ["FAILED", "ABANDONED", "PARTIAL"].includes(task.status)).length;
  return [
    { label: "今日下发", value: todayCount, unit: "批", tone: "blue" },
    { label: "等待执行", value: waiting, unit: "批", tone: "orange" },
    { label: "模拟执行中", value: running, unit: "批", tone: "cyan" },
    { label: "异常任务", value: abnormal, unit: "批", tone: "red" },
  ];
});

const dispatchVisible = ref(false);
const dispatchStep = ref(1);
const dispatchSteps = [
  { value: 1, label: "选择指令" },
  { value: 2, label: "选择设备" },
  { value: 3, label: "配置确认" },
];
const availableCommands = prototypeCommands;
const draft = reactive({
  commandId: prototypeCommands[0].id,
  deviceIds: [] as number[],
  scenario: "NORMAL" as MockScenario,
  audioRecordId: prototypeAudioRecords[0].id,
});
const parameterForm = reactive({
  sampleInterval: "15",
  uploadInterval: "60",
  serverHost: "192.168.10.20",
  serverPort: "6101",
});
const firmwareDraft = ref<FirmwarePrototypeInfo | null>(null);

const selectedDraftCommand = computed(() => availableCommands.find((item) => item.id === draft.commandId) || null);
const scenarioIndex = computed(() => Math.max(0, scenarioOptions.findIndex((item) => item.value === draft.scenario)));
const audioRecordOptions = prototypeAudioRecords.map((record) => ({
  label: `${record.deviceNumber} · ${record.collectedAt} · 缺 ${record.missingFrames.length} 帧`,
  value: record.id,
}));
const audioRecordIndex = computed(() => Math.max(0, audioRecordOptions.findIndex((item) => item.value === draft.audioRecordId)));
const selectedAudioRecord = computed(() => prototypeAudioRecords.find((item) => item.id === draft.audioRecordId) || null);

const deviceFilters = reactive({ keyword: "", onlineStatus: "ALL" as "ALL" | "ONLINE" | "OFFLINE" });
const devicePage = reactive({ current: 1, size: 8 });
const deviceStatusOptions = [
  { label: "全部连接状态", value: "ALL" },
  { label: "在线", value: "ONLINE" },
  { label: "离线", value: "OFFLINE" },
] as const;
const deviceStatusIndex = computed(() => Math.max(0, deviceStatusOptions.findIndex((item) => item.value === deviceFilters.onlineStatus)));
const filteredDevices = computed(() => {
  const keyword = deviceFilters.keyword.trim().toLowerCase();
  return prototypeDevices.filter((device) => {
    const matchesKeyword = !keyword || [device.deviceNumber, device.deviceType, device.installAddress].join(" ").toLowerCase().includes(keyword);
    const matchesStatus =
      deviceFilters.onlineStatus === "ALL" ||
      (deviceFilters.onlineStatus === "ONLINE" ? device.onlineStatus === 1 : device.onlineStatus === 0);
    return matchesKeyword && matchesStatus;
  });
});
const devicePageCount = computed(() => Math.max(1, Math.ceil(filteredDevices.value.length / devicePage.size)));
const pagedDevices = computed(() => {
  const start = (devicePage.current - 1) * devicePage.size;
  return filteredDevices.value.slice(start, start + devicePage.size);
});
const isCurrentDevicePageSelected = computed(
  () => pagedDevices.value.length > 0 && pagedDevices.value.every((device) => draft.deviceIds.includes(device.id)),
);

const progressVisible = ref(false);
const progressTaskId = ref("");
const progressTask = computed(() => tasks.value.find((item) => item.id === progressTaskId.value) || null);

watch(
  () => [deviceFilters.keyword, deviceFilters.onlineStatus],
  () => {
    devicePage.current = 1;
  },
);

watch(devicePageCount, (count) => {
  if (devicePage.current > count) devicePage.current = count;
});

onMounted(() => {
  if (!selectedTaskId.value && tasks.value.length) selectedTaskId.value = tasks.value[0].id;
});

onUnmounted(() => clearAllTimers());

function loadTasks(): MockCommandTask[] {
  try {
    const stored = uni.getStorageSync(TASK_STORAGE_KEY);
    if (!Array.isArray(stored)) return [];
    return (stored as MockCommandTask[]).map((task) => {
      const devices = task.devices.map((device) => {
        if (!ACTIVE_DEVICE_STATUSES.includes(device.status)) return device;
        return {
          ...device,
          status: "PAUSED" as DeviceTaskStatus,
          phaseText: "模拟已暂停",
          responseMessage: "页面曾被关闭或刷新，点击“继续模拟”恢复流程",
        };
      });
      const nextTask = { ...task, devices };
      recalculateTask(nextTask, false);
      return nextTask;
    });
  } catch (error) {
    console.warn("读取模拟指令历史失败", error);
    return [];
  }
}

function persistTasks() {
  try {
    uni.setStorageSync(TASK_STORAGE_KEY, tasks.value);
  } catch (error) {
    console.warn("保存模拟指令历史失败", error);
  }
}

function refreshTasks() {
  clearAllTimers();
  tasks.value = loadTasks();
  selectedTaskId.value = tasks.value[0]?.id || "";
  uni.showToast({ title: "已刷新本地记录", icon: "success" });
}

function resetFilters() {
  filters.keyword = "";
  filters.executionType = "ALL";
  filters.status = "ALL";
  filters.startDate = "";
  filters.endDate = "";
}

function clearMockTasks() {
  uni.showModal({
    title: "清空模拟记录",
    content: "确认清空全部历史指令和模拟进度吗？",
    success(result) {
      if (!result.confirm) return;
      clearAllTimers();
      tasks.value = [];
      selectedTaskId.value = "";
      progressVisible.value = false;
      persistTasks();
    },
  });
}

function openDispatch() {
  dispatchStep.value = 1;
  draft.commandId = prototypeCommands[0].id;
  draft.deviceIds = [];
  draft.scenario = "NORMAL";
  draft.audioRecordId = prototypeAudioRecords[0].id;
  firmwareDraft.value = null;
  deviceFilters.keyword = "";
  deviceFilters.onlineStatus = "ALL";
  devicePage.current = 1;
  dispatchVisible.value = true;
}

function closeDispatch() {
  dispatchVisible.value = false;
}

function goNextStep() {
  if (dispatchStep.value === 1 && !selectedDraftCommand.value) {
    showToast("请选择指令");
    return;
  }
  if (dispatchStep.value === 2 && draft.deviceIds.length === 0) {
    showToast("请至少选择一台设备");
    return;
  }
  dispatchStep.value++;
}

function createMockTask() {
  const command = selectedDraftCommand.value;
  if (!command) return;
  if (!draft.deviceIds.length) {
    showToast("请至少选择一台设备");
    return;
  }
  if (command.executionType === "FIRMWARE_UPGRADE" && !firmwareDraft.value) {
    showToast("请选择固件 TXT 文件");
    return;
  }
  if (command.executionType === "AUDIO_REPAIR" && (!selectedAudioRecord.value || selectedAudioRecord.value.missingFrames.length === 0)) {
    showToast("所选音频已收齐，请选择存在缺帧的记录");
    return;
  }

  const now = formatDate(new Date());
  const id = createId("task");
  const selectedDevices = prototypeDevices.filter((device) => draft.deviceIds.includes(device.id));
  const audio = selectedAudioRecord.value;
  const totalFrames = command.executionType === "FIRMWARE_UPGRADE" ? firmwareDraft.value?.totalFrames || 0 : command.executionType === "AUDIO_REPAIR" ? audio?.totalFrames || 0 : 1;
  const completedFrames = command.executionType === "AUDIO_REPAIR" ? audio?.receivedFrames || 0 : 0;
  const missingFrames = command.executionType === "AUDIO_REPAIR" ? [...(audio?.missingFrames || [])] : [];

  const task: MockCommandTask = {
    id,
    taskNo: createTaskNo(),
    commandId: command.id,
    commandName: command.name,
    commandCode: command.commandCode,
    executionType: command.executionType,
    scenario: draft.scenario,
    params:
      command.executionType === "PARAM_SETTING"
        ? {
            sampleInterval: Number(parameterForm.sampleInterval),
            uploadInterval: Number(parameterForm.uploadInterval),
            serverHost: parameterForm.serverHost,
            serverPort: Number(parameterForm.serverPort),
          }
        : {},
    firmware: command.executionType === "FIRMWARE_UPGRADE" ? { ...firmwareDraft.value! } : undefined,
    audio:
      command.executionType === "AUDIO_REPAIR" && audio
        ? {
            recordId: audio.id,
            totalFrames: audio.totalFrames,
            initialReceivedFrames: audio.receivedFrames,
            initialMissingFrames: [...audio.missingFrames],
          }
        : undefined,
    devices: selectedDevices.map((device) => ({
      id: `${id}-${device.id}`,
      deviceId: device.id,
      deviceNumber: device.deviceNumber,
      deviceType: device.deviceType,
      onlineStatus: device.onlineStatus,
      status: device.onlineStatus ? "WAITING_DELAY" : "WAITING_ONLINE",
      phaseText: device.onlineStatus ? "等待 1 秒后下发" : "等待设备上线",
      progress: command.executionType === "AUDIO_REPAIR" ? Math.round((completedFrames / totalFrames) * 100) : 0,
      round: device.onlineStatus ? 1 : 0,
      maxRounds: command.executionType === "AUDIO_REPAIR" ? 4 : null,
      totalFrames,
      completedFrames,
      missingFrames: [...missingFrames],
      responseMessage: device.onlineStatus ? "检测到模拟设备在线" : "尚未检测到设备连接",
      updatedAt: now,
      timeline: [
        {
          id: createId("event"),
          time: now,
          title: "创建模拟设备任务",
          message: device.onlineStatus ? "设备当前为模拟在线状态" : "设备当前为模拟离线状态",
          tone: "info",
        },
      ],
    })),
    status: "WAITING",
    progress: 0,
    successCount: 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  recalculateTask(task, false);
  tasks.value.unshift(task);
  selectedTaskId.value = task.id;
  persistTasks();
  closeDispatch();
  openProgress(task);

  task.devices.filter((device) => device.onlineStatus === 1).forEach((device) => beginDeviceCycle(task, device, false));
}

function beginDeviceCycle(task: MockCommandTask, device: MockDeviceTask, reconnect: boolean) {
  clearDeviceTimers(device.id);
  device.onlineStatus = 1;
  device.round = reconnect ? Math.max(1, device.round + 1) : Math.max(1, device.round);
  updateDevice(task, device, {
    status: "WAITING_DELAY",
    phaseText: "等待 1 秒后下发",
    responseMessage: reconnect ? `检测到第 ${device.round} 次模拟连接` : "检测到模拟设备在线，准备下发",
    progress: Math.max(device.progress, 5),
  }, "设备连接", reconnect ? `开始第 ${device.round} 轮模拟流程` : "模拟设备已连接，等待下发窗口");

  queueDeviceTimer(device.id, () => {
    if (task.executionType === "PARAM_SETTING") runParameterSimulation(task, device);
    if (task.executionType === "FIRMWARE_UPGRADE") runFirmwareSimulation(task, device, reconnect);
    if (task.executionType === "AUDIO_REPAIR") runAudioSimulation(task, device);
  }, 1000);
}

function runParameterSimulation(task: MockCommandTask, device: MockDeviceTask) {
  updateDevice(task, device, { status: "SENDING", phaseText: "正在下发参数", progress: 55, responseMessage: "模拟写入参数指令" }, "开始下发", "已进入 10 秒模拟下发窗口");
  queueDeviceTimer(device.id, () => {
    updateDevice(task, device, { status: "WAITING_RESPONSE", phaseText: "等待模拟返回", progress: 85, responseMessage: "指令已下发，等待设备返回" });
    queueDeviceTimer(device.id, () => {
      if (task.scenario === "FAILURE") {
        finishDevice(task, device, "FAILED", "模拟返回：参数校验失败", "设备拒绝参数设置");
        return;
      }
      if (task.scenario === "NO_RESPONSE") {
        finishDevice(task, device, "SUCCESS", "已下发（暂未验证设备执行结果）", "当前协议不校验参数设置回执");
        return;
      }
      finishDevice(task, device, "SUCCESS", "模拟返回：参数设置完成", "设备返回参数设置成功");
    }, 1000);
  }, 700);
}

function runFirmwareSimulation(task: MockCommandTask, device: MockDeviceTask, reconnect: boolean) {
  const total = Math.max(1, device.totalFrames);
  const frames = reconnect && device.missingFrames.length ? [...device.missingFrames] : Array.from({ length: total }, (_, index) => index + 1);
  const alreadyCompleted = reconnect ? total - device.missingFrames.length : 0;
  updateDevice(task, device, { status: "SENDING", phaseText: "正在依次下发固件帧", responseMessage: `第 ${device.round} 轮计划发送 ${frames.length} 帧` }, "开始发送固件", `按 1 秒间隔模拟发送 ${frames.length} 个数据帧`);

  const sendNext = (index: number) => {
    if (index >= frames.length) {
      updateDevice(task, device, { status: "WAITING_RESPONSE", phaseText: "等待缺帧反馈", progress: 94, responseMessage: "本轮发送完成，等待设备反馈" });
      queueDeviceTimer(device.id, () => completeFirmwareRound(task, device, frames), 1000);
      return;
    }
    const completed = Math.min(total, alreadyCompleted + index + 1);
    updateDevice(task, device, {
      completedFrames: completed,
      progress: Math.max(6, Math.round((completed / total) * 90)),
      responseMessage: `正在发送第 ${frames[index]} 帧，本轮 ${index + 1}/${frames.length}`,
    });
    queueDeviceTimer(device.id, () => sendNext(index + 1), 1000);
  };

  sendNext(0);
}

function completeFirmwareRound(task: MockCommandTask, device: MockDeviceTask, frames: number[]) {
  if (task.scenario === "FAILURE") {
    finishDevice(task, device, "FAILED", "模拟返回：固件校验失败", "设备返回升级失败");
    return;
  }

  if (task.scenario === "NORMAL" || (task.scenario === "PARTIAL_MISSING" && device.round >= 2)) {
    device.missingFrames = [];
    device.completedFrames = device.totalFrames;
    finishDevice(task, device, "SUCCESS", "模拟返回：全部固件帧已接收，升级成功", "设备确认固件升级成功");
    return;
  }

  let missing: number[];
  if (task.scenario === "NO_RESPONSE") {
    missing = device.missingFrames.length ? [...device.missingFrames] : frames.slice(-Math.min(5, frames.length));
  } else {
    missing = frames.filter((frame) => frame % 7 === 0 || frame === frames[frames.length - 1]).slice(0, Math.max(1, Math.ceil(frames.length * 0.15)));
  }
  device.missingFrames = missing;
  device.completedFrames = Math.max(0, device.totalFrames - missing.length);
  updateDevice(task, device, {
    status: "WAITING_RECONNECT",
    phaseText: "等待设备下次连接",
    progress: Math.round((device.completedFrames / device.totalFrames) * 90),
    responseMessage:
      task.scenario === "NO_RESPONSE"
        ? `未收到完整反馈，保留 ${missing.length} 帧待重试`
        : `模拟返回：缺失 ${missing.length} 帧（${formatMissingFrames(missing)}）`,
  }, "等待断点续传", `下次连接只补发缺失的 ${missing.length} 帧`, "warning");
}

function runAudioSimulation(task: MockCommandTask, device: MockDeviceTask) {
  updateDevice(task, device, {
    status: "SENDING",
    phaseText: "正在下发音频补帧指令",
    responseMessage: `第 ${device.round}/4 轮，缺失 ${device.missingFrames.length} 帧`,
  }, "下发补帧指令", `本轮请求补传 ${device.missingFrames.length} 帧`);

  queueDeviceTimer(device.id, () => {
    if (task.scenario === "FAILURE") {
      finishDevice(task, device, "FAILED", "模拟返回：设备拒绝音频补帧指令", "音频补帧失败");
      return;
    }

    const before = [...device.missingFrames];
    const receiveCount = task.scenario === "NO_RESPONSE" ? 0 : task.scenario === "NORMAL" ? before.length : Math.max(1, Math.ceil(before.length * 0.55));
    device.missingFrames = before.slice(receiveCount);
    device.completedFrames = Math.max(0, device.totalFrames - device.missingFrames.length);
    device.progress = Math.round((device.completedFrames / device.totalFrames) * 100);

    if (device.missingFrames.length === 0) {
      finishDevice(task, device, "SUCCESS", `模拟返回：音频 ${device.totalFrames}/${device.totalFrames} 帧已收齐`, "音频补帧完成");
      return;
    }

    if (device.round >= 4) {
      finishDevice(task, device, "ABANDONED", `第 4 轮后仍缺失 ${device.missingFrames.length} 帧，已放弃`, "达到最大补帧轮次", "danger");
      return;
    }

    updateDevice(task, device, {
      status: "WAITING_RECONNECT",
      phaseText: "等待下一次连接补帧",
      responseMessage:
        receiveCount > 0
          ? `模拟收到 ${receiveCount} 帧，当前 ${device.completedFrames}/${device.totalFrames}，仍缺 ${device.missingFrames.length} 帧`
          : `本轮未收到音频帧，仍缺 ${device.missingFrames.length} 帧`,
    }, "本轮补帧结束", `等待第 ${device.round + 1}/4 轮模拟连接`, "warning");
  }, 1000);
}

function simulateDeviceConnection(task: MockCommandTask, device: MockDeviceTask) {
  if (!canSimulateConnection(device.status)) return;
  const reconnect = device.round > 0 || device.status !== "WAITING_ONLINE";
  beginDeviceCycle(task, device, reconnect);
}

function simulateAllPending(task: MockCommandTask) {
  task.devices.filter((device) => canSimulateConnection(device.status)).forEach((device) => simulateDeviceConnection(task, device));
}

function updateDevice(
  task: MockCommandTask,
  device: MockDeviceTask,
  patch: Partial<MockDeviceTask>,
  eventTitle?: string,
  eventMessage?: string,
  tone: "info" | "success" | "warning" | "danger" = "info",
) {
  Object.assign(device, patch, { updatedAt: formatDate(new Date()) });
  if (eventTitle) {
    device.timeline.unshift({ id: createId("event"), time: device.updatedAt, title: eventTitle, message: eventMessage || "", tone });
    device.timeline = device.timeline.slice(0, 30);
  }
  recalculateTask(task);
}

function finishDevice(
  task: MockCommandTask,
  device: MockDeviceTask,
  status: "SUCCESS" | "FAILED" | "ABANDONED",
  responseMessage: string,
  eventMessage: string,
  tone: "success" | "danger" = status === "SUCCESS" ? "success" : "danger",
) {
  updateDevice(
    task,
    device,
    {
      status,
      phaseText: status === "SUCCESS" ? "执行完成" : status === "FAILED" ? "执行失败" : "已放弃",
      progress: status === "SUCCESS" ? 100 : device.progress,
      responseMessage,
    },
    status === "SUCCESS" ? "模拟任务完成" : status === "FAILED" ? "模拟任务失败" : "停止补帧",
    eventMessage,
    tone,
  );
}

function recalculateTask(task: MockCommandTask, persist = true) {
  const total = Math.max(1, task.devices.length);
  task.successCount = task.devices.filter((device) => device.status === "SUCCESS").length;
  task.failedCount = task.devices.filter((device) => ["FAILED", "ABANDONED"].includes(device.status)).length;
  task.progress = Math.round(task.devices.reduce((sum, device) => sum + device.progress, 0) / total);
  const terminalCount = task.successCount + task.failedCount;
  const hasRunning = task.devices.some((device) => ["WAITING_DELAY", "SENDING", "WAITING_RESPONSE"].includes(device.status));
  const hasPaused = task.devices.some((device) => device.status === "PAUSED");
  const hasAbandoned = task.devices.some((device) => device.status === "ABANDONED");

  if (task.successCount === task.devices.length && task.devices.length > 0) task.status = "SUCCESS";
  else if (terminalCount === task.devices.length && task.devices.length > 0) {
    if (hasAbandoned && task.successCount === 0) task.status = "ABANDONED";
    else task.status = task.successCount > 0 ? "PARTIAL" : "FAILED";
  } else if (hasRunning) task.status = "RUNNING";
  else if (hasPaused) task.status = "PAUSED";
  else if (task.successCount > 0 || task.failedCount > 0) task.status = "PARTIAL";
  else task.status = "WAITING";

  task.updatedAt = formatDate(new Date());
  if (persist) persistTasks();
}

function queueDeviceTimer(deviceId: string, callback: () => void, delay: number) {
  const timer = setTimeout(callback, delay);
  const list = timers.get(deviceId) || [];
  list.push(timer);
  timers.set(deviceId, list);
}

function clearDeviceTimers(deviceId: string) {
  (timers.get(deviceId) || []).forEach((timer) => clearTimeout(timer));
  timers.delete(deviceId);
}

function clearAllTimers() {
  timers.forEach((list) => list.forEach((timer) => clearTimeout(timer)));
  timers.clear();
}

function chooseFirmwareFile() {
  if (typeof document === "undefined") {
    showToast("当前运行环境暂不支持本地文件选择");
    return;
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,text/plain";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      showToast("请选择 TXT 文件");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0) {
      showToast("文件内容不能为空");
      return;
    }
    const frameLengths: number[] = [];
    for (let offset = 0; offset < bytes.length; offset += 500) {
      frameLengths.push(bytes.slice(offset, offset + 500).length);
    }
    firmwareDraft.value = {
      fileName: file.name,
      fileSize: bytes.length,
      frameSize: 500,
      totalFrames: frameLengths.length,
      frameLengths,
    };
  };
  input.click();
}

function toggleDevice(id: number) {
  draft.deviceIds = draft.deviceIds.includes(id) ? draft.deviceIds.filter((item) => item !== id) : [...draft.deviceIds, id];
}

function toggleCurrentDevicePage() {
  const pageIds = pagedDevices.value.map((device) => device.id);
  if (isCurrentDevicePageSelected.value) draft.deviceIds = draft.deviceIds.filter((id) => !pageIds.includes(id));
  else draft.deviceIds = Array.from(new Set([...draft.deviceIds, ...pageIds]));
}

function selectTask(task: MockCommandTask) {
  selectedTaskId.value = task.id;
}

function openProgress(task: MockCommandTask) {
  progressTaskId.value = task.id;
  progressVisible.value = true;
}

function closeProgress() {
  progressVisible.value = false;
}

function hasActionableDevices(task: MockCommandTask) {
  return task.devices.some((device) => canSimulateConnection(device.status));
}

function canSimulateConnection(status: DeviceTaskStatus) {
  return ["WAITING_ONLINE", "WAITING_RECONNECT", "PAUSED"].includes(status);
}

function isDeviceLoading(status: DeviceTaskStatus) {
  return ["WAITING_ONLINE", "WAITING_DELAY", "SENDING", "WAITING_RESPONSE", "WAITING_RECONNECT", "PAUSED"].includes(status);
}

function getDeviceProgressText(task: MockCommandTask, device: MockDeviceTask) {
  if (task.executionType === "PARAM_SETTING") return `${device.progress}%`;
  return `${device.completedFrames}/${device.totalFrames}`;
}

function formatRound(device: MockDeviceTask) {
  if (!device.maxRounds) return device.round ? `第 ${device.round} 轮` : "未开始";
  return device.round ? `${device.round}/${device.maxRounds}` : `0/${device.maxRounds}`;
}

function getExecutionTypeLabel(type: CommandExecutionType) {
  return {
    PARAM_SETTING: localeText("参数设置", "Parameter setup"),
    FIRMWARE_UPGRADE: localeText("固件升级", "Firmware upgrade"),
    AUDIO_REPAIR: localeText("音频补帧", "Audio repair"),
  }[type];
}

function getTaskStatusLabel(status: CommandTaskStatus) {
  return {
    WAITING: localeText("等待执行", "Waiting"),
    RUNNING: localeText("执行中", "Running"),
    PARTIAL: localeText("部分完成", "Partial"),
    SUCCESS: localeText("已完成", "Completed"),
    FAILED: localeText("失败", "Failed"),
    ABANDONED: localeText("已放弃", "Abandoned"),
    PAUSED: localeText("已暂停", "Paused"),
  }[status];
}

function getTaskStatusClass(status: CommandTaskStatus) {
  return `status-pill--${status.toLowerCase()}`;
}

function getDeviceStatusClass(status: DeviceTaskStatus) {
  if (status === "SUCCESS") return "device-status-dot--success";
  if (["FAILED", "ABANDONED"].includes(status)) return "device-status-dot--danger";
  if (["WAITING_RECONNECT", "PAUSED", "WAITING_ONLINE"].includes(status)) return "device-status-dot--warning";
  return "device-status-dot--running";
}

function getScenarioLabel(value: MockScenario) {
  const labels: Record<MockScenario, [string, string]> = {
    NORMAL: ["正常完成", "Completed"],
    PARTIAL_MISSING: ["部分帧缺失", "Missing frames"],
    NO_RESPONSE: ["设备无响应", "No response"],
    FAILURE: ["最终失败", "Failed"],
  };
  const label = labels[value];
  return label ? localeText(label[0], label[1]) : localeText("未配置", "Not set");
}

function getParamLabel(key: string) {
  return {
    sampleInterval: localeText("采样间隔", "Sample interval"),
    uploadInterval: localeText("上报间隔", "Upload interval"),
    serverHost: localeText("服务器地址", "Server"),
    serverPort: localeText("服务器端口", "Port"),
  }[key] || key;
}

function formatMissingFrames(frames: number[]) {
  if (!frames.length) return "无";
  const sorted = [...frames].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let index = 1; index <= sorted.length; index++) {
    const current = sorted[index];
    if (current === end + 1) {
      end = current;
      continue;
    }
    ranges.push(start === end ? String(start) : `${start}-${end}`);
    start = current;
    end = current;
  }
  const text = ranges.join("、");
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

function getFrameLengthPreview(lengths: number[]) {
  if (lengths.length <= 8) return lengths.map((length, index) => `#${index + 1} ${length}B`).join("、");
  return `${lengths.slice(0, 6).map((length, index) => `#${index + 1} ${length}B`).join("、")} … 最后一帧 ${lengths[lengths.length - 1]}B`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function createTaskNo() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `CMD-${stamp}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function showToast(title: string) {
  uni.showToast({ title, icon: "none" });
}

function handleTypeFilterChange(event: PickerChangeEvent) {
  filters.executionType = typeFilterOptions[Number(event.detail.value)]?.value || "ALL";
}

function handleStatusFilterChange(event: PickerChangeEvent) {
  filters.status = taskStatusFilterOptions[Number(event.detail.value)]?.value || "ALL";
}

function handleStartDateChange(event: PickerChangeEvent) {
  filters.startDate = String(event.detail.value || "");
}

function handleEndDateChange(event: PickerChangeEvent) {
  filters.endDate = String(event.detail.value || "");
}

function handleDeviceStatusChange(event: PickerChangeEvent) {
  deviceFilters.onlineStatus = deviceStatusOptions[Number(event.detail.value)]?.value || "ALL";
}

function handleScenarioChange(event: PickerChangeEvent) {
  draft.scenario = scenarioOptions[Number(event.detail.value)]?.value || "NORMAL";
}

function handleAudioRecordChange(event: PickerChangeEvent) {
  draft.audioRecordId = audioRecordOptions[Number(event.detail.value)]?.value || prototypeAudioRecords[0].id;
}
</script>

<style lang="scss" scoped>
.command-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  gap: 12px;
  overflow: hidden;
  color: #24384d;
  background: #eef4f8;
  box-sizing: border-box;
}

.command-toolbar,
.summary-card,
.table-panel,
.detail-panel {
  background: #fff;
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

.toolbar__filters,
.toolbar__actions,
.panel-head__meta-group,
.modal-actions__right,
.progress-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar__filters {
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.toolbar__actions { flex: none; }

.filter-field,
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-field { width: 154px; }
.filter-field--keyword { width: 280px; }
.filter-field--date { width: 132px; }

.filter-label,
.form-label {
  color: #587086;
  font-size: 12px;
  font-weight: 800;
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
.form-input { width: 100%; }

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

.input-placeholder { color: #9aaaba; }

.toolbar-button,
.mini-button,
.page-button,
.table-action-button,
.text-button,
.modal-close {
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 800;
  border-radius: 4px;
  box-sizing: border-box;
}

.toolbar-button {
  height: 34px;
  padding: 0 14px;
  color: #31506d;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.toolbar-button--primary,
.mini-button--primary {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee !important;
}

.button-hover { opacity: 0.86; }

.summary-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card { padding: 12px 14px; }

.summary-card__head,
.summary-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.summary-card__label { color: #5f7286; font-size: 13px; font-weight: 800; }
.summary-card__mark { width: 9px; height: 9px; border-radius: 50%; background: #0d82ee; }
.summary-card__body { justify-content: flex-start; margin-top: 8px; }
.summary-card__value { color: #203e59; font-size: 26px; font-weight: 900; line-height: 1; }
.summary-card__unit { align-self: flex-end; color: #6f8397; font-size: 12px; font-weight: 800; }
.summary-card--orange .summary-card__mark { background: #e68a00; }
.summary-card--cyan .summary-card__mark { background: #13a8bb; }
.summary-card--red .summary-card__mark { background: #dc5252; }

.command-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(390px, 24vw, 460px);
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

.panel-head,
.detail-head,
.modal-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #edf3f8;
}

.panel-head__title-group,
.detail-head__title-group { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.panel-head__title,
.detail-head__title { color: #24445f; font-size: 16px; font-weight: 800; }
.panel-head__subtitle,
.detail-head__label { color: #72869a; font-size: 11px; font-weight: 700; }
.panel-head__meta { padding: 4px 10px; color: #6a7f94; font-size: 12px; font-weight: 800; background: #f7fafc; border: 1px solid #e3ebf2; border-radius: 999px; }
.text-button { height: 28px; padding: 0 8px; line-height: 28px; background: transparent; border: 0; }
.text-button--danger { color: #bf4a4a; }

.table-scroll,
.detail-scroll { flex: 1; height: auto; min-height: 0; }

.history-table { min-width: 1030px; background: #fff; }
.history-row {
  display: grid;
  grid-template-columns: 54px minmax(170px, 1.35fr) minmax(150px, 1.2fr) 100px 76px 132px 100px 156px;
  min-width: 1030px;
  min-height: 44px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
}
.history-row:not(.history-row--header):nth-child(odd) { background: #fbfdff; }
.history-row:not(.history-row--header):hover { background: #f1f8ff; }
.history-row--active { background: #e7f3ff !important; box-shadow: inset 3px 0 #0d82ee; }
.history-row--header { position: sticky; top: 0; z-index: 2; min-height: 44px; background: #f6f9fc; cursor: default; box-shadow: 0 1px 0 #dbe7f0; }
.history-cell,
.progress-cell,
.device-select-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  box-sizing: border-box;
}
.history-row--header .history-cell,
.progress-row--header .progress-cell,
.device-select-row--header .device-select-cell { color: #415a73; font-size: 12px; font-weight: 800; }
.history-cell--task,
.history-cell--command { justify-content: flex-start; }
.history-cell--task { color: #506b83; font-family: Consolas, monospace; }
.history-cell--command { color: #0f4c81; font-weight: 800; }

.compact-progress { display: flex; align-items: center; gap: 7px; width: 100%; color: #587086; font-size: 11px; }
.compact-progress__track { flex: 1; height: 6px; overflow: hidden; background: #e7eef4; border-radius: 999px; }
.compact-progress__value { height: 100%; background: linear-gradient(90deg, #2495ff, #0d82ee); border-radius: inherit; }

.table-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 220px; gap: 8px; }
.table-state__title { color: #5f7488; font-size: 15px; font-weight: 800; }
.table-state__hint { color: #91a0ae; font-size: 12px; }

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
  border: 1px solid transparent;
  border-radius: 999px;
  box-sizing: border-box;
}
.status-pill--success { color: #177245; background: #eaf8ef; border-color: #bfe8ce; }
.status-pill--running { color: #086abf; background: #e8f4ff; border-color: #b9ddfb; }
.status-pill--waiting,
.status-pill--paused { color: #8a6400; background: #fff7df; border-color: #f0d999; }
.status-pill--partial { color: #a66000; background: #fff2df; border-color: #f1c98e; }
.status-pill--failed,
.status-pill--abandoned { color: #b33e3e; background: #fff0f0; border-color: #f0bcbc; }

.detail-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #7c8da1; font-size: 14px; }
.detail-empty__icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; color: #7ba6ca; font-size: 24px; background: #edf6fd; border-radius: 50%; }
.detail-head { align-items: flex-start; padding: 14px; }
.detail-head__task-no { color: #8596a7; font-size: 11px; font-family: Consolas, monospace; }
.detail-scroll { padding: 14px; box-sizing: border-box; }
.detail-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.detail-stat { display: flex; flex-direction: column; gap: 3px; padding: 10px; background: #f6faff; border: 1px solid #dceaf5; border-radius: 5px; }
.detail-stat__value { color: #256da8; font-size: 20px; font-weight: 900; }
.detail-stat__label { color: #74879a; font-size: 11px; font-weight: 700; }
.detail-stat--success .detail-stat__value { color: #178354; }
.detail-stat--danger .detail-stat__value { color: #c64b4b; }
.detail-section { padding-top: 14px; border-top: 1px solid #edf3f8; }
.detail-section + .detail-section { margin-top: 14px; }
.detail-section__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
.detail-section__title { display: block; margin-bottom: 9px; color: #24445f; font-size: 14px; font-weight: 900; }
.detail-section__head .detail-section__title { margin-bottom: 0; }
.detail-section__meta { color: #0d82ee; font-size: 13px; font-weight: 900; }
.mini-button { height: 28px; padding: 0 10px; color: #31506d; line-height: 28px; background: #f6fbff; border: 1px solid #cbdced; }
.info-list { border: 1px solid #e2ebf3; border-radius: 5px; overflow: hidden; }
.info-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; font-size: 12px; background: #fbfdff; border-bottom: 1px solid #edf3f8; }
.info-row:last-child { border-bottom: 0; }
.info-row text:first-child { color: #718498; font-weight: 700; }
.info-row text:last-child { color: #294963; font-weight: 800; text-align: right; }
.parameter-chips { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; }
.parameter-chip { display: flex; flex-direction: column; gap: 4px; padding: 8px; background: #f7fafc; border: 1px solid #e2ebf3; border-radius: 4px; }
.parameter-chip text:first-child { color: #778a9d; font-size: 10px; }
.parameter-chip text:last-child { color: #294963; font-size: 12px; font-weight: 800; }

.file-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f7fbff; border: 1px solid #dbeaf5; border-radius: 5px; }
.file-card__icon { flex: none; display: flex; align-items: center; justify-content: center; width: 42px; height: 46px; color: #fff; font-size: 11px; font-weight: 900; background: linear-gradient(145deg, #1c92f2, #0b6fca); border-radius: 5px; }
.file-card__content { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.file-card__name { color: #24445f; font-size: 13px; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-card__meta,
.file-card__frames { color: #71869a; font-size: 11px; line-height: 1.5; }
.audio-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.audio-summary > view { display: flex; flex-direction: column; gap: 3px; padding: 8px; background: #f7fafc; border: 1px solid #e2ebf3; border-radius: 4px; }
.audio-summary text:first-child { color: #788b9d; font-size: 10px; }
.audio-summary text:last-child { color: #24445f; font-size: 13px; font-weight: 900; }
.device-result-list { display: flex; flex-direction: column; gap: 7px; }
.device-result-item { padding: 9px; background: #fbfdff; border: 1px solid #e2ebf3; border-radius: 5px; }
.device-result-item__top { display: flex; justify-content: space-between; gap: 10px; }
.device-result-item__top > view { display: flex; flex-direction: column; gap: 2px; }
.device-result-item__number { color: #24445f; font-size: 12px; font-weight: 900; }
.device-result-item__phase { color: #7a8d9f; font-size: 10px; }
.device-status-dot { width: 8px; height: 8px; margin-top: 3px; border-radius: 50%; }
.device-status-dot--success { background: #23a36d; }
.device-status-dot--danger { background: #d55454; }
.device-status-dot--warning { background: #dfa11c; }
.device-status-dot--running { background: #1689ed; box-shadow: 0 0 0 4px rgba(22, 137, 237, 0.12); }
.device-result-item__progress { display: flex; align-items: center; gap: 7px; margin-top: 7px; color: #718498; font-size: 10px; }
.device-result-item__track { flex: 1; height: 5px; overflow: hidden; background: #e6edf3; border-radius: 999px; }
.device-result-item__track view { height: 100%; background: #1689ed; border-radius: inherit; }
.device-result-item__message { display: block; margin-top: 6px; color: #597186; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.modal-mask { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(19, 38, 56, 0.52); box-sizing: border-box; }
.modal { display: flex; flex-direction: column; width: min(1080px, 94vw); max-height: 90vh; overflow: hidden; background: #fff; border: 1px solid #cbdce9; border-radius: 8px; box-shadow: 0 26px 70px rgba(10, 35, 57, 0.3); }
.modal--dispatch { height: min(760px, 88vh); }
.modal--progress { width: min(1280px, 96vw); height: min(720px, 88vh); }
.modal-head { min-height: 62px; padding: 11px 18px; background: #fbfdff; }
.modal-head > view:first-child { display: flex; flex-direction: column; gap: 3px; }
.modal-head__eyebrow { color: #6e88a0; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
.modal-head__title { color: #203f5b; font-size: 18px; font-weight: 900; }
.modal-close { width: 32px; height: 32px; color: #6d8295; font-size: 24px; line-height: 29px; background: transparent; border: 0; }
.step-bar { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); padding: 13px 22px; background: #f5f9fc; border-bottom: 1px solid #e2ebf3; }
.step-item { position: relative; display: flex; align-items: center; justify-content: center; gap: 7px; color: #8797a6; font-size: 12px; font-weight: 800; }
.step-item:not(:last-child)::after { position: absolute; top: 13px; left: calc(50% + 54px); right: calc(-50% + 54px); height: 1px; content: ""; background: #ccdae5; }
.step-item__number { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; color: #6f8295; background: #fff; border: 1px solid #c8d7e3; border-radius: 50%; box-sizing: border-box; }
.step-item--active { color: #0d75cf; }
.step-item--active .step-item__number { color: #fff; background: #0d82ee; border-color: #0d82ee; }
.step-item--done { color: #249166; }
.step-item--done .step-item__number { color: #fff; background: #25a373; border-color: #25a373; }
.modal-body { flex: 1; height: auto; min-height: 0; padding: 18px 22px; background: #f8fbfd; box-sizing: border-box; }
.wizard-section { max-width: 960px; margin: 0 auto; }
.wizard-intro { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.wizard-intro--inline { flex-direction: row; align-items: center; justify-content: space-between; gap: 14px; }
.wizard-intro__title { color: #24445f; font-size: 17px; font-weight: 900; }
.wizard-intro__text { color: #72869a; font-size: 12px; line-height: 1.6; }
.selected-count { flex: none; padding: 6px 11px; color: #086fc8; font-size: 12px; font-weight: 900; background: #eaf5ff; border: 1px solid #c6e3fb; border-radius: 999px; }
.command-choice-list { display: flex; flex-direction: column; gap: 10px; }
.command-choice { display: flex; gap: 12px; padding: 14px; background: #fff; border: 1px solid #d9e5ee; border-radius: 6px; cursor: pointer; transition: 0.16s ease; }
.command-choice:hover { border-color: #9bcaf0; box-shadow: 0 8px 20px rgba(36, 91, 134, 0.08); }
.command-choice--active { background: #eff8ff; border-color: #61abe7; box-shadow: inset 0 0 0 1px #b6dcf8; }
.command-choice__radio { flex: none; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; margin-top: 2px; border: 2px solid #b2c3d1; border-radius: 50%; box-sizing: border-box; }
.command-choice--active .command-choice__radio { border-color: #0d82ee; }
.command-choice--active .command-choice__radio text { width: 8px; height: 8px; background: #0d82ee; border-radius: 50%; }
.command-choice__main { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.command-choice__head { display: flex; justify-content: space-between; gap: 12px; }
.command-choice__name { color: #24445f; font-size: 14px; font-weight: 900; }
.command-choice__code { color: #0d72c7; font-size: 12px; font-family: Consolas, monospace; font-weight: 900; }
.command-choice__type { color: #4c85af; font-size: 11px; font-weight: 800; }
.command-choice__desc { color: #687e92; font-size: 12px; line-height: 1.55; }
.command-choice__frame { margin-top: 3px; padding: 6px 8px; color: #5b7186; font-size: 10px; font-family: Consolas, monospace; background: rgba(235, 242, 247, 0.72); border-radius: 3px; }
.device-toolbar { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.device-toolbar .filter-input { flex: 1; }
.device-status-select { width: 168px; }
.device-select-table { overflow: hidden; background: #fff; border: 1px solid #d9e5ee; border-radius: 5px; }
.device-select-row { display: grid; grid-template-columns: 46px 130px 140px 100px 90px minmax(180px, 1fr); min-height: 42px; border-bottom: 1px solid #edf1f5; cursor: pointer; }
.device-select-row:last-child { border-bottom: 0; }
.device-select-row:not(.device-select-row--header):hover { background: #f3f9fe; }
.device-select-row--active { background: #eaf5ff; }
.device-select-row--header { background: #f4f8fb; cursor: default; }
.device-select-cell--number { justify-content: flex-start; color: #0f568e; font-weight: 800; }
.device-select-cell--address { justify-content: flex-start; }
.mock-checkbox { display: flex; align-items: center; justify-content: center; width: 17px; height: 17px; color: #fff; font-size: 12px; font-weight: 900; background: #fff; border: 1px solid #adbfce; border-radius: 3px; box-sizing: border-box; }
.device-select-row--active .mock-checkbox { background: #0d82ee; border-color: #0d82ee; }
.online-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 48px; height: 22px; font-size: 11px; font-weight: 800; border-radius: 999px; }
.online-pill--online { color: #14754b; background: #e9f8ef; border: 1px solid #bee7ce; }
.online-pill--offline { color: #6b7d8e; background: #f1f4f7; border: 1px solid #d6e0e8; }
.pagination-bar { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; color: #6f8294; font-size: 12px; }
.page-button { height: 28px; padding: 0 11px; color: #31506d; line-height: 28px; background: #fff; border: 1px solid #cbdced; }
.page-button[disabled] { color: #a8b5c0; background: #f1f4f7; }
.selected-command-badge { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; padding: 7px 10px; background: #ecf7ff; border: 1px solid #c7e4fa; border-radius: 5px; }
.selected-command-badge text:first-child { color: #0873cc; font-size: 11px; font-family: Consolas, monospace; font-weight: 900; }
.selected-command-badge text:last-child { color: #456b8b; font-size: 11px; font-weight: 800; }
.config-card { padding: 14px; background: #fff; border: 1px solid #d9e5ee; border-radius: 6px; }
.config-card + .config-card { margin-top: 10px; }
.config-card__title { display: block; margin-bottom: 9px; color: #24445f; font-size: 13px; font-weight: 900; }
.form-hint { display: block; margin-top: 6px; color: #8596a5; font-size: 10px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.flow-note { display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 8px 10px; background: #f4f9fd; border-left: 3px solid #55a5e7; }
.flow-note text:first-child { flex: none; color: #2b76b4; font-size: 11px; font-weight: 900; }
.flow-note text:last-child { color: #667e93; font-size: 11px; line-height: 1.5; }
.file-uploader { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 112px; gap: 4px; color: #70869a; background: #f8fbfe; border: 1px dashed #9dc4e2; border-radius: 5px; cursor: pointer; }
.file-uploader__icon { color: #0d82ee; font-size: 26px; line-height: 1; }
.file-uploader__title { color: #316487; font-size: 13px; font-weight: 900; }
.file-uploader__hint { font-size: 10px; }
.file-card--selected { padding: 12px; }
.audio-summary--wide { grid-template-columns: 90px 90px 90px minmax(0, 1fr); margin-top: 10px; }
.audio-summary--wide > view:last-child text:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.confirm-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.confirm-card > view { display: flex; flex-direction: column; gap: 3px; padding: 9px 10px; background: #edf7ff; border: 1px solid #d2e9fa; border-radius: 5px; }
.confirm-card text:first-child { color: #71899d; font-size: 10px; }
.confirm-card text:last-child { color: #225578; font-size: 12px; font-weight: 900; }
.modal-actions { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; background: #fff; border-top: 1px solid #e2ebf3; }

.progress-summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; padding: 10px 18px; background: #edf5fb; border-bottom: 1px solid #dce8f1; }
.progress-summary-bar > view { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.progress-summary-bar text:first-child { color: #74899d; font-size: 10px; }
.progress-summary-bar text:last-child { color: #244a68; font-size: 13px; font-weight: 900; }
.progress-table-scroll { flex: 1; height: auto; min-height: 0; background: #fff; }
.progress-table { min-width: 1160px; }
.progress-row { display: grid; grid-template-columns: 125px 78px 155px 76px 170px minmax(230px, 1fr) 154px 100px; min-width: 1160px; min-height: 48px; border-bottom: 1px solid #edf1f5; }
.progress-row--header { position: sticky; top: 0; z-index: 2; min-height: 42px; background: #f5f8fb; }
.progress-cell--number { justify-content: flex-start; color: #0e568f; font-weight: 800; }
.progress-cell--phase { justify-content: flex-start; gap: 7px; }
.progress-cell--message { justify-content: flex-start; color: #60778b; }
.loading-spinner { flex: none; width: 12px; height: 12px; border: 2px solid #bcdcf6; border-top-color: #0d82ee; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.table-progress { display: flex; align-items: center; gap: 7px; width: 100%; color: #60778b; font-size: 10px; }
.table-progress > view { flex: 1; height: 6px; overflow: hidden; background: #e6edf3; border-radius: 999px; }
.table-progress > view > text { display: block; height: 100%; background: linear-gradient(90deg, #26a2f5, #0d7bdc); border-radius: inherit; }
.table-action-button { height: 26px; padding: 0 8px; color: #0873ca; line-height: 26px; background: #ecf7ff; border: 1px solid #bfe0f8; }
.action-placeholder { color: #a3b0bb; }
.prototype-tip { color: #7c8f9f; font-size: 11px; }

@media (max-width: 1280px) {
  .filter-field--date { display: none; }
  .command-layout { grid-template-columns: minmax(0, 1fr) 390px; }
}

@media (max-width: 980px) {
  .command-toolbar { align-items: stretch; flex-direction: column; }
  .toolbar__actions { justify-content: flex-end; }
  .command-layout { grid-template-columns: 1fr; overflow: auto; }
  .detail-panel { min-height: 540px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .modal-mask { padding: 10px; }
  .audio-summary--wide { grid-template-columns: repeat(2, 1fr); }
}
</style>
