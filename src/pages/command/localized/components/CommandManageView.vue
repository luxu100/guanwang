<template>
  <view class="task-center">
    <view class="toolbar">
      <view class="toolbar__filters">
        <view class="filter-field filter-field--keyword">
          <text class="filter-label">{{ localeText("设备编号", "Device number") }}</text>
          <input v-model="activeFilters.keyword" class="filter-input"
            :placeholder="localeText('输入设备编号', 'Enter device number')" @confirm="handleSearch" />
        </view>

        <view class="filter-field">
          <text class="filter-label">{{ localeText("执行状态", "Status") }}</text>
          <picker :range="activeStatusOptions" range-key="label" :value="activeStatusIndex"
            @change="handleStatusChange">
            <view class="filter-select">
              <text>{{ activeStatusOptions[activeStatusIndex]?.label }}</text>
              <text class="select-arrow"></text>
            </view>
          </picker>
        </view>

        <view v-if="activeView === 'UPGRADE'" class="filter-field">
          <text class="filter-label">{{ localeText("固件版本", "Firmware version") }}</text>
          <input v-model="upgradeFilters.firmwareVersion" class="filter-input filter-input--short"
            :placeholder="localeText('如 V1.1', 'e.g. V1.1')" @confirm="handleSearch" />
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">{{ localeText("开始日期", "Start date") }}</text>
          <picker mode="date" :value="activeFilters.startDate" @change="handleStartDateChange">
            <view class="filter-select">{{ activeFilters.startDate || localeText("不限", "Any") }}<text
                class="select-arrow"></text></view>
          </picker>
        </view>

        <view class="filter-field filter-field--date">
          <text class="filter-label">{{ localeText("结束日期", "End date") }}</text>
          <picker mode="date" :value="activeFilters.endDate" @change="handleEndDateChange">
            <view class="filter-select">{{ activeFilters.endDate || localeText("不限", "Any") }}<text
                class="select-arrow"></text></view>
          </picker>
        </view>
      </view>

      <view class="toolbar__actions">
        <button class="action-button action-button--primary" :disabled="activeLoading" @click="handleSearch">{{
          localeText("查询", "Search") }}</button>
        <button class="action-button" @click="resetFilters">{{ localeText("重置", "Reset") }}</button>
        <button class="action-button" :disabled="activeLoading" @click="loadActivePage(true)">{{ localeText("刷新",
          "Refresh") }}</button>
        <button v-if="activeView === 'UPGRADE'" class="action-button action-button--primary" @click="openUpgradeDialog">
          {{ localeText("发起固件升级", "Start firmware upgrade") }}
        </button>
        <button v-if="activeView === 'SETTING'" class="action-button action-button--primary"
          @click="deviceSettingDialogVisible = true">
          {{ localeText("设置设备参数", "Set device parameters") }}
        </button>
      </view>
    </view>

    <view class="content-layout">
      <view class="list-panel">
        <view class="panel-head">
          <view class="record-switch">
            <button v-for="tab in recordTabs" :key="tab.value" class="record-switch__button"
              :class="{ 'record-switch__button--active': activeView === tab.value }"
              @click="switchRecordView(tab.value)">
              {{ tab.label }}
            </button>
          </view>
          <text class="panel-head__meta">{{ localizedTotal(activePage.total) }}</text>
          <button v-if="activeView === 'UPGRADE' && lastCreatedUpgradeIds.length" class="mini-button" @click="showCreatedUpgradeTasks">
            {{ localeText(`本次创建 ${lastCreatedUpgradeIds.length} 个任务`, `${lastCreatedUpgradeIds.length} newly created`) }}
          </button>
        </view>

        <CommandDataTable :columns="activeColumns" :data="activeRows" :loading="activeLoading" :selected="selectedId"
          :page-current="activePage.current" :page-size="activePage.size"
          :loading-text="localeText('正在加载…', 'Loading…')" :empty-text="getActiveEmptyText()" @row-click="selectRow">
          <template #cell-executeStatus="{ row }">
            <text class="status-tag"
              :class="activeView === 'COMMAND' ? getCommandStatusClass(row.executeStatus) : getStatusClass(row.executeStatus)">
              {{ activeView === "COMMAND" ? getCommandStatusText(row.executeStatus) : getStatusText(row.executeStatus)
              }}
            </text>
          </template>

          <template #cell-commandStatus="{ row }">
            <text class="status-tag" :class="getSettingStatusClass(row.commandStatus)">
              {{ getSettingStatusText(row.commandStatus) }}
            </text>
          </template>

          <template #cell-commandExecuteStatus="{ row }">
            <text class="status-tag" :class="getCommandStatusClass(row.commandExecuteStatus)">
              {{ getCommandStatusText(row.commandExecuteStatus) }}
            </text>
          </template>

          <template #cell-status="{ row }">
            <text class="status-tag" :class="getAudioRepairStatusClass(row.status)">
              {{ getAudioRepairStatusText(row.status) }}
            </text>
          </template>

          <template #cell-finishPercent="{ row }">
            <view class="progress-cell">
              <view class="progress-track">
                <view :style="{ width: `${clampProgress(row.finishPercent)}%` }"></view>
              </view>
              <text>{{ clampProgress(row.finishPercent) }}%</text>
            </view>
          </template>
          <template #cell-repairProgress="{ row }">
            <view class="progress-cell">
              <view class="progress-track">
                <view :style="{ width: `${clampProgress(row.repairProgress)}%` }"></view>
              </view>
              <text>{{ clampProgress(row.repairProgress) }}%</text>
            </view>
          </template>
          <template #footer>
            <CommandPaginationBar :current="activePage.current" :size="activePage.size" :total="activePage.total"
              @change-page="changePage" @change-size="changePageSize" />
          </template>
        </CommandDataTable>
      </view>

      <view class="detail-panel">
        <view v-if="detailLoading" class="detail-state">{{ localeText("正在加载详情…", "Loading details…") }}</view>
        <view v-else-if="!selectedDetail" class="detail-state">
          <text>{{ localeText("请选择一条记录查看详情", "Select a record to view details") }}</text>
        </view>

        <template v-else-if="activeView === 'COMMAND'">
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">{{ localeText("指令下发详情", "Command details") }}</text>
              <text class="detail-head__title">{{ displayValue(selectedDetail.commandName || selectedDetail.commandCode)
                }}</text>
              <text class="detail-head__id">{{ localeText("记录 ID", "Record ID") }}: {{ displayValue(selectedDetail.id)
                }}</text>
            </view>
            <text class="status-tag" :class="getCommandStatusClass(selectedDetail.executeStatus)">
              {{ getCommandStatusText(selectedDetail.executeStatus) }}
            </text>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <view class="info-section">
              <text class="section-title">{{ localeText("下发信息", "Dispatch information") }}</text>
              <view class="info-list">
                <view class="info-row"><text>{{ localeText("设备编号", "Device number") }}</text><text>{{
                  displayValue(selectedDetail.deviceNumber) }}</text></view>
                <view class="info-row"><text>{{ localeText("传输通道", "Transport") }}</text><text>{{ getTransportText(selectedDetail.transportChannel) }}</text></view>
                <view class="info-row"><text>{{ localeText("下发协议版本", "Protocol version") }}</text><text>{{ displayProtocolVersion(selectedDetail.protocolVersion) }}</text></view>
                <view class="info-row"><text>{{ localeText("平台状态", "Platform status") }}</text><text>{{ displayValue(selectedDetail.platformStatus) }}</text></view>
                <view class="info-row"><text>{{ localeText("设备确认", "Device confirmation") }}</text><text>{{ getConfirmationText(selectedDetail) }}</text></view>
                <view class="info-row"><text>{{ localeText("确认来源", "Confirmation source") }}</text><text>{{ displayValue(selectedDetail.confirmationSource) }}</text></view>
                <view class="info-row"><text>{{ localeText("电信命令 ID", "CTWing command ID") }}</text><text>{{ displayValue(selectedDetail.nbCommandId) }}</text></view>
                <view class="info-row"><text>{{ localeText("指令名称", "Command name") }}</text><text>{{
                  displayValue(selectedDetail.commandName) }}</text></view>
                <view class="info-row"><text>{{ localeText("指令类型", "Command type") }}</text><text>{{
                  displayValue(selectedDetail.commandCode) }}</text></view>
                <view class="info-row"><text>{{ localeText("下发时间", "Sent at") }}</text><text>{{
                  formatDateTime(selectedDetail.sendTime) }}</text></view>
                <view class="info-row"><text>{{ localeText("完成时间", "Expires at") }}</text><text>{{
                  formatDateTime(selectedDetail.expiresAt) }}</text></view>
              </view>
            </view>
            <view class="info-section">
              <text class="section-title">{{ localeText("请求与响应", "Request and response") }}</text>
              <view class="code-card"><text class="code-card__label">{{ localeText("请求内容", "Request") }}</text><text>{{
                stringifyContent(selectedDetail.requestContent || selectedDetail.requestData ||
                  selectedDetail.commandContent) }}</text></view>
              <view class="code-card"><text class="code-card__label">{{ localeText("响应内容", "Response") }}</text><text>{{
                stringifyContent(selectedDetail.responseContent || selectedDetail.responseData ||
                  selectedDetail.result) }}</text></view>
              <view v-if="selectedDetail.failureReason || selectedDetail.errorMessage" class="error-card">
                {{ selectedDetail.failureReason || selectedDetail.errorMessage }}
              </view>
            </view>
          </scroll-view>
        </template>

        <template v-else-if="activeView === 'UPGRADE'">
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">{{ localeText("固件升级任务", "Firmware upgrade task") }}</text>
              <text class="detail-head__title">{{ displayValue(selectedDetail.deviceNumber) }}</text>
              <text class="detail-head__id">{{ localeText("任务 ID", "Task ID") }}: {{ displayValue(selectedDetail.id)
                }}</text>
            </view>
            <view class="detail-head__actions">
              <text class="status-tag" :class="getStatusClass(selectedDetail.executeStatus)">
                {{ getStatusText(selectedDetail.executeStatus) }}
              </text>
              <button v-if="canCancelUpgrade(selectedDetail)" class="mini-button mini-button--danger"
                :disabled="canceling" @click="confirmCancelUpgrade">
                {{ canceling ? localeText("正在取消", "Cancelling") : localeText("取消升级", "Cancel upgrade") }}
              </button>
            </view>
          </view>

          <view class="detail-tabs">
            <button v-for="tab in detailTabs" :key="tab.value" class="detail-tab"
              :class="{ 'detail-tab--active': detailTab === tab.value }" @click="switchDetailTab(tab.value)">
              {{ tab.label }}
            </button>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <template v-if="detailTab === 'OVERVIEW'">
              <view class="progress-overview">
                <view class="progress-overview__head"><text>{{ localeText("升级进度", "Upgrade progress") }}</text><text>{{
                  clampProgress(selectedDetail.finishPercent) }}%</text></view>
                <view class="progress-overview__track">
                  <view :style="{ width: `${clampProgress(selectedDetail.finishPercent)}%` }"></view>
                </view>
                <text class="stage-text">{{ getStageText(selectedDetail.upgradeStage, selectedDetail.repairRound)
                  }}</text>
              </view>

              <view class="stat-grid">
                <view><text>{{ displayValue(selectedDetail.frameCount, "0") }}</text><text>{{ localeText("总帧数", "Total frames") }}</text></view>
                <view><text>{{ displayValue(selectedDetail.receivedFrameCount, "0") }}</text><text>{{ localeText("已收帧数",
                    "Received frames") }}</text></view>
                <view><text>{{ displayValue(selectedDetail.repairRound, "0") }}</text><text>{{ localeText("补帧轮次",
                    "Repair round") }}</text></view>
              </view>

              <view class="info-section">
                <text class="section-title">{{ localeText("任务信息", "Task information") }}</text>
                <view class="info-list">
                  <view class="info-row"><text>{{ localeText("固件版本", "Firmware version") }}</text><text>{{
                    displayValue(selectedDetail.firmwareVersion) }}</text></view>
                  <view class="info-row"><text>{{ localeText("传输通道", "Transport") }}</text><text>{{
                    getTransportText(selectedDetail.transportChannel) }}</text></view>
                  <view class="info-row"><text>{{ localeText("开始时间", "Started at") }}</text><text>{{
                    formatDateTime(selectedDetail.startTime || selectedDetail.createdAt) }}</text></view>
                  <view class="info-row"><text>{{ localeText("结束时间", "Finished at") }}</text><text>{{
                    formatDateTime(selectedDetail.finishTime) }}</text></view>
                  <view class="info-row"><text>{{ localeText("当前会话", "Current session") }}</text><text
                      class="ellipsis-text" :title="selectedDetail.currentSessionId">{{
                        displayValue(selectedDetail.currentSessionId) }}</text></view>
                  <view class="info-row"><text>{{ localeText("最后发送", "Last sent") }}</text><text>{{
                    formatDateTime(selectedDetail.lastFrameSentAt) }}</text></view>
                  <view class="info-row"><text>{{ localeText("最后上报", "Last report") }}</text><text>{{
                    formatDateTime(selectedDetail.lastReportAt) }}</text></view>
                  <view class="info-row"><text>{{ localeText("固件 MD5", "Firmware MD5") }}</text><text
                      class="ellipsis-text" :title="selectedDetail.firmwareMd5">{{
                        displayValue(selectedDetail.firmwareMd5) }}</text></view>
                </view>
                <view v-if="selectedDetail.failureReason" class="error-card">{{ selectedDetail.failureReason }}</view>
              </view>
            </template>

            <template v-else-if="detailTab === 'FRAMES'">
              <view class="subsection-head">
                <view><text class="section-title">{{ localeText("固件帧记录", "Firmware frames") }}</text><text
                    class="subsection-hint">{{ localeText("帧数据按需加载，不参与自动轮询", "Frame data is loaded on demand") }}</text>
                </view>
                <view class="subsection-actions">
                  <button class="mini-button" :disabled="!frames.length" @click="openFrameDetail">{{ localeText("详情",
                    "Details") }}</button>
                  <button class="mini-button" :disabled="subResourceLoading" @click="loadFrames(true)">{{
                    localeText("刷新", "Refresh") }}</button>
                </view>
              </view>
              <view v-if="subResourceLoading" class="resource-state">{{ localeText("正在加载帧记录…", "Loading frames…") }}
              </view>
              <view v-else-if="!frames.length" class="resource-state">{{ localeText("暂无帧记录", "No frame records") }}
              </view>
              <view v-else class="compact-table-scroll">
                <view class="compact-table">
                  <view class="compact-row compact-row--header"><text>{{ localeText("帧序号", "Frame") }}</text><text>{{
                    localeText("长度", "Length") }}</text><text>{{ localeText("状态", "Status") }}</text></view>
                  <view v-for="frame in frames" :key="frame.id || frame.frameIndex" class="compact-row"
                    :class="{ 'compact-row--active': selectedFrame === frame }" @click="selectedFrame = frame">
                    <text>{{ displayValue(frame.frameIndex) }}</text>
                    <text>{{ displayValue(frame.dataLength) }}</text>
                    <text>{{ getFrameStatusText(frame.sendStatus) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <template v-else>
              <view class="subsection-head">
                <view><text class="section-title">{{ localeText("上下行事件", "Events") }}</text><text
                    class="subsection-hint">{{ localeText("按时间展示系统与设备交互过程", "System and device events in chronological order") }}</text></view>
                <view class="subsection-actions">
                  <button class="mini-button" :disabled="!events.length" @click="openEventDetail">{{ localeText("详情",
                    "Details") }}</button>
                  <button class="mini-button" :disabled="subResourceLoading" @click="loadEvents(true)">{{
                    localeText("刷新", "Refresh") }}</button>
                </view>
              </view>
              <view v-if="subResourceLoading" class="resource-state">{{ localeText("正在加载事件…", "Loading events…") }}
              </view>
              <view v-else-if="!events.length" class="resource-state">{{ localeText("暂无事件记录", "No event records") }}
              </view>
              <view v-else class="timeline">
                <view v-for="event in events" :key="event.id" class="timeline-item"
                  :class="`timeline-item--${String(event.direction || 'SYSTEM').toLowerCase()}`">
                  <text class="timeline-item__dot"></text>
                  <view class="timeline-item__content">
                    <view>
                      <text class="timeline-item__title">{{ event.eventTypeName || getEventTypeText(event.eventType) }}</text>
                      <text class="event-level" :class="getEventLevelClass(event.eventLevel)">{{ displayValue(event.eventLevel, "INFO") }}</text>
                      <text class="timeline-item__time">{{ formatDateTime(event.createdAt) }}</text>
                    </view>
                    <text class="timeline-item__meta">{{ event.directionName || getDirectionText(event.direction) }}（{{ displayValue(event.direction, localeText("未知", "Unknown")) }}）<template
                        v-if="event.frameIndex !== undefined && event.frameIndex !== null"> · {{ localeText("帧", "Frame") }} {{ event.frameIndex
                        }}</template></text>
                    <text v-if="event.summary" class="timeline-item__summary">{{ event.summary }}</text>
                    <text v-if="event.detail" class="timeline-item__detail">{{ event.detail }}</text>
                    <text v-if="event.rawHex" class="timeline-item__hex" :title="event.rawHex">{{
                      previewHex(event.rawHex) }}</text>
                    <text v-if="event.rawHexBytes !== undefined && event.rawHexBytes !== null" class="timeline-item__meta">{{ localeText("原始报文字节数", "Raw bytes") }}：{{ event.rawHexBytes }}</text>
                  </view>
                </view>
              </view>
            </template>
          </scroll-view>
        </template>

        <template v-else-if="activeView === 'SETTING'">
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">{{ localeText("设备参数设置详情", "Device parameter task") }}</text>
              <!-- <text class="detail-head__title">{{ displayValue(selectedDetail.deviceNumber) }}</text> -->
              <text class="detail-head__id">{{ localeText("记录 ID", "Record ID") }}: {{ displayValue(selectedDetail.id)
                }}</text>
            </view>
            <text class="status-tag">
              {{ displayValue(selectedDetail.deviceNumber) }}
            </text>
          </view>
          <scroll-view class="detail-scroll" scroll-y>
            <view class="info-section">
              <text class="section-title">{{ localeText("任务信息", "Task information") }}</text>
              <view class="info-list">
                <view class="info-row"><text>{{ localeText("设备编号", "Device number") }}</text><text>{{
                  displayValue(selectedDetail.deviceNumber) }}</text></view>
                <view class="info-row"><text>{{ localeText("批次 ID", "Batch ID") }}</text><text class="ellipsis-text"
                    :title="selectedDetail.batchId">{{ displayValue(selectedDetail.batchId) }}</text></view>
                <view class="info-row"><text>{{ localeText("指令 ID", "Command ID") }}</text><text>{{
                  displayValue(selectedDetail.commandSendLogId) }}</text></view>
                <view class="info-row"><text>{{ localeText("指令执行状态", "Command status") }}</text><text>{{
                  getCommandStatusText(selectedDetail.commandExecuteStatus) }}</text></view>
                <view class="info-row"><text>{{ localeText("实际通道", "Transport") }}</text><text>{{ getTransportText(selectedDetail.transportChannel) }}</text></view>
                <view class="info-row"><text>{{ localeText("下发协议版本", "Protocol version") }}</text><text>{{ displayProtocolVersion(selectedDetail.protocolVersion) }}</text></view>
                <view class="info-row"><text>{{ localeText("平台状态", "Platform status") }}</text><text>{{ displayValue(selectedDetail.platformStatus) }}</text></view>
                <view class="info-row"><text>{{ localeText("设备确认", "Device confirmation") }}</text><text>{{ getConfirmationText(selectedDetail) }}</text></view>
                <view class="info-row"><text>{{ localeText("确认来源", "Confirmation source") }}</text><text>{{ displayValue(selectedDetail.confirmationSource) }}</text></view>
                <view class="info-row"><text>{{ localeText("云在线", "Cloud online") }}</text><text>{{ getBooleanText(selectedDetail.cloudOnline) }}</text></view>
                <view class="info-row"><text>{{ localeText("记录来源", "Record source") }}</text><text>{{
                  displayValue(selectedDetail.recordSource) }}</text></view>
                <view class="info-row"><text>{{ localeText("操作账号", "Command account") }}</text><text>{{
                  displayValue(selectedDetail.commandAccount) }}</text></view>
                <view class="info-row"><text>{{ localeText("下单时间", "Ordered at") }}</text><text>{{
                  formatDateTime(selectedDetail.orderTime) }}</text></view>
                <view class="info-row"><text>{{ localeText("创建时间", "Created at") }}</text><text>{{
                  formatDateTime(selectedDetail.createdAt) }}</text></view>
                <view class="info-row"><text>{{ localeText("发送时间", "Sent at") }}</text><text>{{
                  formatDateTime(selectedDetail.commandSentAt) }}</text></view>
                <view class="info-row"><text>{{ localeText("过期时间", "Expires at") }}</text><text>{{
                  formatDateTime(selectedDetail.commandExpiresAt) }}</text></view>
              </view>
            </view>
            <view class="info-section">
              <text class="section-title">{{ localeText("设置参数", "Parameters") }}</text>
              <view v-if="selectedSettingParameters.length" class="info-list">
                <view v-for="parameter in selectedSettingParameters" :key="parameter.key" class="info-row">
                  <text>{{ parameter.label }}</text>
                  <text :title="stringifyContent(parameter.value)">{{ stringifyContent(parameter.value) }}</text>
                </view>
              </view>
              <view v-else class="empty-inline">{{ localeText("本条记录没有非空设置参数", "No configured parameters") }}</view>
            </view>
            <view class="info-section">
              <text class="section-title">{{ localeText("原始指令内容", "Raw command") }}</text>
              <view class="code-card"><text>{{ stringifyContent(selectedDetail.detailHex) }}</text></view>
            </view>
            <view class="info-section">
              <text class="section-title">{{ localeText("任务反馈", "Task feedback") }}</text>
              <view class="code-card"><text>{{ stringifyContent(selectedDetail.commandFeedback) }}</text></view>
              <view v-if="String(selectedDetail.commandStatus || '').toUpperCase() === 'TCP_SENT'" class="warning-card">
                {{ localeText("已写入设备连接，但当前没有可匹配的设备回执，不能视为参数已经生效。", "Written to the device connection, but no matching acknowledgement is available; parameters are not confirmed effective.") }}
              </view>
            </view>
          </scroll-view>
        </template>

        <template v-else>
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">{{ localeText("TCP 音频补帧任务", "TCP audio repair task") }}</text>
              <text class="detail-head__title">{{ displayValue(selectedDetail.deviceNumber) }}</text>
              <text class="detail-head__id">{{ localeText("任务 ID", "Task ID") }}: {{
                displayValue(selectedDetail.transferId || selectedDetail.id) }}</text>
            </view>
            <text class="status-tag" :class="getAudioRepairStatusClass(selectedDetail.status)">
              {{ getAudioRepairStatusText(selectedDetail.status) }}
            </text>
          </view>

          <view class="detail-tabs">
            <button v-for="tab in audioDetailTabs" :key="tab.value" class="detail-tab"
              :class="{ 'detail-tab--active': audioDetailTab === tab.value }" @click="switchAudioDetailTab(tab.value)">
              {{ tab.label }}
            </button>
          </view>

          <scroll-view class="detail-scroll" scroll-y>
            <template v-if="audioDetailTab === 'OVERVIEW'">
              <view class="progress-overview">
                <view class="progress-overview__head"><text>{{ localeText("分片收集进度", "Frame collection progress")
                    }}</text><text>{{ clampProgress(selectedDetail.repairProgress) }}%</text></view>
                <view class="progress-overview__track">
                  <view :style="{ width: `${clampProgress(selectedDetail.repairProgress)}%` }"></view>
                </view>
                <text class="stage-text">{{ getAudioRepairStatusText(selectedDetail.status) }}</text>
              </view>
              <view class="stat-grid">
                <view><text>{{ displayValue(selectedDetail.totalFrames, "0") }}</text><text>{{ localeText("总分片数", "Total frames") }}</text></view>
                <view><text>{{ displayValue(selectedDetail.receivedFrames, "0") }}</text><text>{{ localeText("已接收",
                    "Received") }}</text></view>
                <view><text>{{ displayValue(selectedDetail.missingFrameCount, "0") }}</text><text>{{ localeText("缺失分片",
                    "Missing") }}</text></view>
              </view>
              <view class="info-section">
                <text class="section-title">{{ localeText("任务信息", "Task information") }}</text>
                <view class="info-list">
                  <view class="info-row"><text>{{ localeText("设备编号", "Device number") }}</text><text>{{
                    displayValue(selectedDetail.deviceNumber) }}</text></view>
                  <view class="info-row"><text>{{ localeText("任务状态", "Status") }}</text><text>{{
                    getAudioRepairStatusText(selectedDetail.status) }}</text></view>
                  <view class="info-row"><text>{{ localeText("开始时间", "Started at") }}</text><text>{{
                    formatDateTime(selectedDetail.createdAt) }}</text></view>
                  <view class="info-row"><text>{{ localeText("更新时间", "Updated at") }}</text><text>{{
                    formatDateTime(selectedDetail.updatedAt) }}</text></view>
                  <view class="info-row"><text>{{ localeText("最近指令", "Latest command") }}</text><text>{{
                    displayValue(selectedDetail.lastCommandType || selectedDetail.commandType) }}</text></view>
                </view>
                <view v-if="selectedDetail.failureReason || selectedDetail.errorMessage" class="error-card">{{
                  selectedDetail.failureReason || selectedDetail.errorMessage }}</view>
              </view>
              <view class="info-section">
                <text class="section-title">{{ localeText("缺失分片序号", "Missing frame numbers") }}</text>
                <view v-if="audioMissingFrames.length" class="missing-frame-list">
                  <text v-for="frameNumber in audioMissingFrames" :key="frameNumber">{{ frameNumber }}</text>
                </view>
                <view v-else class="empty-inline">{{ localeText("当前没有缺失分片", "No missing frames") }}</view>
              </view>
            </template>

            <template v-else-if="audioDetailTab === 'FRAMES'">
              <view class="subsection-head">
                <view><text class="section-title">{{ localeText("已接收分片", "Received frames") }}</text><text
                    class="subsection-hint">{{ localeText("点击详情可查看全部分片字段", "View all frame fields in details") }}</text>
                </view>
                <view class="subsection-actions">
                  <button class="mini-button" :disabled="!audioFrames.length" @click="openAudioFrameDetail">{{
                    localeText("详情", "Details") }}</button>
                  <button class="mini-button" :disabled="audioResourceLoading" @click="loadAudioFrames(true)">{{
                    localeText("刷新", "Refresh") }}</button>
                </view>
              </view>
              <view v-if="audioResourceLoading" class="resource-state">{{ localeText("正在加载分片…", "Loading frames…") }}
              </view>
              <view v-else-if="!audioFrames.length" class="resource-state">{{ localeText("暂无已接收分片", "No received frames") }}</view>
              <view v-else class="compact-table-scroll">
                <view class="compact-table compact-table--audio">
                  <view class="compact-row compact-row--audio compact-row--header">
                    <text>{{ localeText("分片序号", "Frame") }}</text>
                    <text>{{ localeText("任务 ID", "Task ID") }}</text>
                    <text>{{localeText("报文字节数", "Raw bytes") }}</text>
                  </view>
                  <view v-for="frame in audioFrames" :key="frame.id || `${frame.transferId}-${frame.frameNo}`"
                    class="compact-row compact-row--audio">
                    <text>{{ displayValue(frame.frameNo ) }}</text>
                    <text>{{ displayValue(frame.transferId) }}</text>
                    <text>{{ displayValue(frame.rawHexBytes) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <template v-else>
              <view class="subsection-head">
                <view><text class="section-title">{{ localeText("相关指令记录", "Related commands") }}</text><text
                    class="subsection-hint">{{ localeText("仅展示补帧和收齐确认指令", "Repair and completion commands only")
                    }}</text></view>
                <button class="mini-button" :disabled="audioResourceLoading" @click="loadAudioCommands(true)">{{
                  localeText("刷新", "Refresh") }}</button>
              </view>
              <view v-if="audioResourceLoading" class="resource-state">{{ localeText("正在加载指令…", "Loading commands…") }}
              </view>
              <view v-else-if="!audioCommands.length" class="resource-state">{{ localeText("暂无相关指令", "No related commands") }}</view>
              <view v-else class="audio-command-list">
                <view v-for="command in audioCommands" :key="command.id" class="audio-command-card">
                  <view class="audio-command-card__head">
                    <view><text>{{ getAudioCommandTypeText(command.commandCode || command.commandType)
                        }}</text><text>#{{ displayValue(command.id) }}</text></view>
                    <text class="status-tag" :class="getCommandStatusClass(command.executeStatus)">{{
                      getCommandStatusText(command.executeStatus) }}</text>
                  </view>
                  <view class="audio-command-card__time">{{ formatDateTime(command.sendTime || command.createdAt) }}
                  </view>
                  <view
                    v-if="command.requestContent || command.requestData || command.requestHex || command.commandContent"
                    class="audio-command-card__content">
                    <text class="audio-command-card__label">{{ localeText("请求内容", "Request") }}</text>
                    {{ stringifyContent(command.requestContent || command.requestData || command.requestHex ||
                      command.commandContent) }}
                  </view>
                  <view v-if="command.responseContent || command.responseData || command.responseHex || command.result"
                    class="audio-command-card__content">
                    <text class="audio-command-card__label">{{ localeText("响应内容", "Response") }}</text>
                    {{ stringifyContent(command.responseContent || command.responseData || command.responseHex ||
                    command.result) }}
                  </view>
                  <view v-if="command.failureReason || command.errorMessage" class="error-card">{{ command.failureReason
                    || command.errorMessage }}</view>
                </view>
              </view>
            </template>
          </scroll-view>
        </template>
      </view>
    </view>

    <view v-if="frameDetailVisible" class="modal-mask" @click.self="closeFrameDetail">
      <view class="frame-detail-modal">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ localeText("固件帧记录", "Firmware frame") }}</text>
            <text class="modal-head__title">{{ localeText("全部固件帧详情", "All firmware frame details") }}</text>
          </view>
          <text class="panel-head__meta">{{ localizedTotal(frames.length) }}</text>
          <button class="modal-close" :aria-label="localeText('关闭', 'Close')" @click="closeFrameDetail">×</button>
        </view>
        <view class="frame-detail-body">
          <view class="frame-full-table"
            :style="{ width: `${frameDetailTableWidth}px`, minWidth: `${frameDetailTableWidth}px` }">
            <view class="frame-full-row frame-full-row--header"
              :style="{ gridTemplateColumns: frameDetailGridTemplate }">
              <text v-for="column in frameDetailColumns" :key="column.key">{{ column.label }}</text>
            </view>
            <view v-for="frame in frames" :key="frame.id || frame.frameIndex" class="frame-full-row"
              :class="{ 'frame-full-row--active': selectedFrame === frame }"
              :style="{ gridTemplateColumns: frameDetailGridTemplate }" @click="selectedFrame = frame">
              <text v-for="column in frameDetailColumns" :key="column.key" :class="{
                'frame-full-cell--code': column.code,
                'frame-full-cell--ellipsis': column.key === 'payloadHex' || 'sessionId',
              }" :title="formatFrameFieldValue(column.key, frame[column.key])">
                {{ formatFrameFieldValue(column.key, frame[column.key]) }}
              </text>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="action-button action-button--primary" @click="closeFrameDetail">{{ localeText("关闭", "Close")
            }}</button>
        </view>
      </view>
    </view>

    <view v-if="eventDetailVisible" class="modal-mask" @click.self="closeEventDetail">
      <view class="frame-detail-modal">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ localeText("上下行事件", "Upgrade events") }}</text>
            <text class="modal-head__title">{{ localeText("全部上下行事件详情", "All upgrade event details") }}</text>
          </view>
          <text class="panel-head__meta">{{ localizedTotal(events.length) }}</text>
          <button class="modal-close" :aria-label="localeText('关闭', 'Close')" @click="closeEventDetail">×</button>
        </view>
        <view class="frame-detail-body">
          <view class="frame-full-table"
            :style="{ width: `${eventDetailTableWidth}px`, minWidth: `${eventDetailTableWidth}px` }">
            <view class="frame-full-row frame-full-row--header"
              :style="{ gridTemplateColumns: eventDetailGridTemplate }">
              <text v-for="column in eventDetailColumns" :key="column.key">{{ column.label }}</text>
            </view>
            <view v-for="event in events" :key="event.id || `${event.eventType}-${event.createdAt}-${event.frameIndex}`"
              class="frame-full-row" :class="{ 'frame-full-row--active': selectedEvent === event }"
              :style="{ gridTemplateColumns: eventDetailGridTemplate }" @click="selectedEvent = event">
              <text v-for="column in eventDetailColumns" :key="column.key" :class="{
                'frame-full-cell--code': column.code,
                'frame-full-cell--ellipsis': column.key === 'rawHex' || 'sessionId',
              }" :title="formatEventFieldValue(column.key, event[column.key])">
                {{ formatEventFieldValue(column.key, event[column.key]) }}
              </text>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="action-button action-button--primary" @click="closeEventDetail">{{ localeText("关闭", "Close")
            }}</button>
        </view>
      </view>
    </view>

    <view v-if="audioFrameDetailVisible" class="modal-mask" @click.self="closeAudioFrameDetail">
      <view class="frame-detail-modal audio-frame-detail-modal">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ localeText("音频补帧分片", "Audio repair frames") }}</text>
            <text class="modal-head__title">{{ localeText("全部已接收分片详情", "All received frame details") }}</text>
          </view>
          <text class="panel-head__meta">{{ localizedTotal(audioFrameDetails.length) }}</text>
          <button class="modal-close" :aria-label="localeText('关闭', 'Close')" @click="closeAudioFrameDetail">×</button>
        </view>
        <view v-if="!audioFrameDetails.length" class="frame-detail-body resource-state">{{ localeText("暂无已接收分片", "No received frames") }}</view>
        <view v-else class="frame-detail-body">
          <view class="frame-full-table"
            :style="{ width: `${audioFrameDetailTableWidth}px`, minWidth: `${audioFrameDetailTableWidth}px` }">
            <view class="frame-full-row frame-full-row--header"
              :style="{ gridTemplateColumns: audioFrameDetailGridTemplate }">
              <text v-for="column in audioFrameDetailColumns" :key="column.key">{{ column.label }}</text>
            </view>
            <view v-for="frame in audioFrameDetails" :key="frame.id || `${frame.transferId}-${frame.frameNo}`"
              class="frame-full-row" :style="{ gridTemplateColumns: audioFrameDetailGridTemplate }">
              <text v-for="column in audioFrameDetailColumns" :key="column.key"
                :class="{
                  'frame-full-cell--code': column.code,
                  'frame-full-cell--ellipsis': column.key === 'rawHex',
                }"
                :title="formatAudioFrameFieldValue(column.key, frame[column.key])">
                {{ formatAudioFrameFieldValue(column.key, frame[column.key]) }}
              </text>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="action-button action-button--primary" @click="closeAudioFrameDetail">{{ localeText("关闭",
            "Close")
            }}</button>
        </view>
      </view>
    </view>

    <view v-if="upgradeDialogVisible" class="modal-mask" @click.self="closeUpgradeDialog">
      <view class="upgrade-modal">
        <view class="modal-head">
          <view><text class="modal-head__eyebrow">{{ localeText("固件升级", "Firmware upgrade") }}</text><text
              class="modal-head__title">{{ localeText("创建升级任务", "Create upgrade tasks") }}</text></view>
          <button class="modal-close" :aria-label="localeText('关闭', 'Close')" @click="closeUpgradeDialog">×</button>
        </view>

        <view class="step-bar">
          <view v-for="step in upgradeSteps" :key="step.value" class="step-item"
            :class="{ 'step-item--active': upgradeStep === step.value, 'step-item--done': upgradeStep > step.value }">
            <text class="step-item__number">{{ upgradeStep > step.value ? "✓" : step.value }}</text>
            <text>{{ step.label }}</text>
          </view>
        </view>

        <scroll-view class="modal-body" scroll-y>
          <view v-if="upgradeStep === 1" class="wizard-section">
            <view class="wizard-head">
              <view><text class="wizard-title">{{ localeText("选择固件", "Select firmware") }}</text><text
                  class="wizard-hint">{{ localeText("请选择已经上传并验证通过的固件记录", "Choose an uploaded and validated firmware record")
                  }}</text></view><text class="selected-count">{{ localizedCount(firmwareCandidates.length) }}</text>
            </view>
            <view v-if="candidateLoading" class="resource-state">{{ localeText("正在加载固件…", "Loading firmware…") }}</view>
            <view v-else class="choice-list">
              <view v-for="firmware in firmwareCandidates" :key="firmware.id" class="choice-card"
                :class="{ 'choice-card--active': upgradeDraft.firmwareId === firmware.id }"
                @click="upgradeDraft.firmwareId = firmware.id">
                <text class="choice-radio"><text></text></text>
                <view class="choice-content">
                  <view><text class="choice-title">{{ displayValue(firmware.firmwareName) }}</text><text
                      class="version-pill">{{ displayValue(firmware.firmwareVersion) }}</text></view>
                  <text class="choice-description">{{ displayValue(firmware.instruction || firmware.remark,
                    localeText("暂无说明", "No description")) }}</text>
                  <text class="choice-meta">{{ localeText("上传时间", "Uploaded at") }}: {{
                    formatDateTime(firmware.uploadTime
                    || firmware.createdAt) }}</text>
                </view>
              </view>
              <view v-if="!firmwareCandidates.length" class="resource-state">{{ localeText("暂无可用固件，请先到固件管理页面上传", "No firmware available. Upload firmware first.") }}</view>
            </view>
          </view>

          <view v-else-if="upgradeStep === 2" class="wizard-section">
            <view class="wizard-head">
              <view><text class="wizard-title">{{ localeText("选择设备", "Select devices") }}</text><text
                  class="wizard-hint">{{
                    localeText("设备通道按档案识别，升级资格以服务端预检结果为准", "Channels come from device profiles; server precheck decides eligibility") }}</text></view><text class="selected-count">{{ localeText(`已选择 ${selectedDevices.length}
                台`,
                    `${selectedDevices.length} selected`) }}</text>
            </view>
            <view class="device-filter">
              <input v-model="deviceKeyword" class="filter-input"
                :placeholder="localeText('输入设备编号搜索', 'Search device number')" @confirm="searchDeviceCandidates" />
              <button class="mini-button" @click="searchDeviceCandidates">{{ localeText("搜索", "Search") }}</button>
              <button class="mini-button" @click="toggleSelectableDevices">{{ currentSelectableSelected ?
                localeText("取消可选设备", "Clear selectable") : localeText("选择全部可用设备", "Select all available") }}</button>
            </view>
            <view v-if="candidateLoading" class="resource-state">{{ localeText("正在加载设备…", "Loading devices…") }}</view>
            <view v-else class="device-table">
              <view class="device-row device-row--header">
                <view class="device-check-cell"></view>
                <text>{{ localeText("设备编号", "Device number") }}</text>
                <text>{{ localeText("设备别名", "Device alias") }}</text>
                <text>{{ localeText("接入通道", "Transport") }}</text>
                <text>{{ localeText("在线状态", "Online status") }}</text>
                <text>{{ localeText("当前固件", "Current firmware") }}</text>
              </view>
              <view v-for="device in filteredDeviceCandidates" :key="device.id" class="device-row"
                :class="{ 'device-row--selected': isDeviceSelected(device), 'device-row--disabled': !isDeviceUpgradeSelectable(device) }"
                @click="toggleDevice(device)">
                <view class="device-check-cell">
                  <text class="checkbox">{{ isDeviceSelected(device) ? "✓" : "" }}</text>
                </view>
                <text>{{ displayValue(device.deviceNumber) }}</text>
                <text>{{ displayValue(device.deviceAlias || device.deviceName) }}</text>
                <text>{{ getDeviceChannelLabel(device) }}</text>
                <text><text class="online-pill"
                    :class="isDeviceOnline(device) === null ? 'online-pill--unknown' : isDeviceOnline(device) ? 'online-pill--online' : 'online-pill--offline'">{{ getOnlineText(device) }}</text></text>
                <text>{{ displayValue(device.firmwareVersion) }}</text>
              </view>
              <view v-if="!filteredDeviceCandidates.length" class="resource-state">{{ localeText("暂无符合条件的设备", "No matching devices") }}</view>
            </view>
            <view class="device-candidate-pagination">
              <button class="mini-button" :disabled="deviceCandidatePage.current <= 1 || candidateLoading" @click="changeDeviceCandidatePage(-1)">{{ localeText("上一页", "Previous") }}</button>
              <text>{{ deviceCandidatePage.current }} / {{ Math.max(1, Math.ceil(deviceCandidatePage.total / deviceCandidatePage.size)) }} · {{ deviceCandidatePage.total }}</text>
              <button class="mini-button" :disabled="deviceCandidatePage.current * deviceCandidatePage.size >= deviceCandidatePage.total || candidateLoading" @click="changeDeviceCandidatePage(1)">{{ localeText("下一页", "Next") }}</button>
            </view>
          </view>

          <view v-else class="wizard-section">
            <view class="wizard-head">
              <view><text class="wizard-title">{{ localeText("升级检查与确认", "Check and confirm") }}</text><text
                  class="wizard-hint">{{ localeText("提交前检查设备是否存在未结束的升级任务", "Check for unfinished upgrade tasks before submission") }}</text></view><button class="mini-button" :disabled="checkingUpdatable"
                @click="runUpdatableCheck">{{ checkingUpdatable ? localeText("正在检查", "Checking") : localeText("重新检查", "Check again") }}</button>
            </view>

            <view class="confirm-summary">
              <view><text>{{ localeText("固件", "Firmware") }}</text><text>{{ selectedFirmware?.firmwareName || "--"
                  }}</text>
              </view>
              <view><text>{{ localeText("版本", "Version") }}</text><text>{{ selectedFirmware?.firmwareVersion || "--"
                  }}</text></view>
              <view><text>{{ localeText("设备数量", "Devices") }}</text><text>{{ localeText(`${selectedDevices.length} 台`,
                String(selectedDevices.length)) }}</text></view>
            </view>

            <view class="check-list">
              <view v-for="device in selectedDevices" :key="device.id" class="check-item">
                <view><text class="check-item__number">{{ device.deviceNumber }}</text><text>{{ getDeviceChannelLabel(device) }} · {{ getOnlineText(device) }}</text></view>
                <text class="check-result"
                  :class="getCheckResult(device.deviceNumber).updatable ? 'check-result--success' : 'check-result--danger'">
                  {{ getCheckResult(device.deviceNumber).label }}
                </text>
              </view>
            </view>
            <view v-if="hasBlockedDevice" class="warning-card">{{ localeText("存在不可升级设备，请返回上一步移除后再提交。", "Remove unavailable devices before submitting.") }}</view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="action-button" :disabled="submittingUpgrade" @click="closeUpgradeDialog">{{ localeText("取消",
            "Cancel") }}</button>
          <view>
            <button v-if="upgradeStep > 1" class="action-button" :disabled="submittingUpgrade" @click="upgradeStep--">{{
              localeText("上一步", "Previous") }}</button>
            <button v-if="upgradeStep < 3" class="action-button action-button--primary" :disabled="candidateLoading"
              @click="nextUpgradeStep">{{ localeText("下一步", "Next") }}</button>
            <button v-else class="action-button action-button--primary"
              :disabled="!canSubmitUpgrade || submittingUpgrade" @click="submitUpgrade">
              {{ submittingUpgrade ? localeText("正在创建", "Creating") : localeText("确认发起升级", "Start upgrade") }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <DeviceSettingDialog v-if="deviceSettingDialogVisible" @close="deviceSettingDialogVisible = false"
      @submitted="handleDeviceSettingSubmitted" />
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useLocaleText, useLocalizedCount, useLocalizedTotal } from "@/i18n/localeText";
import CommandDataTable from "@/pages/command/components/t/CommandDataTable.vue";
import CommandPaginationBar from "@/pages/command/components/t/CommandPaginationBar.vue";
import DeviceSettingDialog from "@/pages/command/localized/components/DeviceSettingDialog.vue";
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
import { getDeviceSettingDetail, getDeviceSettingPage, getDeviceSettingResult } from "@/services/deviceSetting/manage";
import { getDeviceChannel, getDeviceChannelText, getDeviceOnline } from "@/utils/device-channel";
import {
  getAudioRepairCommands,
  getAudioRepairDetail,
  getAudioRepairFrames,
  getAudioRepairPage,
} from "@/services/audioRepair/manage";

type RecordView = "COMMAND" | "UPGRADE" | "SETTING" | "AUDIO_REPAIR";
type DetailTab = "OVERVIEW" | "FRAMES" | "EVENTS";
type AudioDetailTab = "OVERVIEW" | "FRAMES" | "COMMANDS";
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

const localeText = useLocaleText();
const localizedTotal = useLocalizedTotal();
const localizedCount = useLocalizedCount();

const recordTabs = computed<Array<{ label: string; value: RecordView }>>(() => [
  { label: localeText("指令下发记录", "Command records"), value: "COMMAND" },
  { label: localeText("固件升级记录", "Firmware upgrades"), value: "UPGRADE" },
  { label: localeText("设备参数设置记录", "Device parameter tasks"), value: "SETTING" },
  { label: localeText("音频补帧记录", "Audio repair tasks"), value: "AUDIO_REPAIR" },
]);
const detailTabs = computed<Array<{ label: string; value: DetailTab }>>(() => [
  { label: localeText("任务概览", "Overview"), value: "OVERVIEW" },
  { label: localeText("固件帧记录", "Firmware frames"), value: "FRAMES" },
  { label: localeText("上下行事件", "Events"), value: "EVENTS" },
]);
const upgradeSteps = computed(() => [
  { value: 1, label: localeText("选择固件", "Select firmware") },
  { value: 2, label: localeText("选择设备", "Select devices") },
  { value: 3, label: localeText("升级检查", "Upgrade check") },
]);

const upgradeStatusMap: Record<number, { tone: string; terminal: boolean }> = {
  0: { tone: "waiting", terminal: false },
  1: { tone: "running", terminal: false },
  2: { tone: "warning", terminal: false },
  3: { tone: "danger", terminal: true },
  4: { tone: "success", terminal: true },
  5: { tone: "muted", terminal: true },
  6: { tone: "danger", terminal: true },
};

const commandStatusMap: Record<number, { tone: string; terminal: boolean }> = {
  0: { tone: "waiting", terminal: false },
  1: { tone: "waiting", terminal: false },
  2: { tone: "running", terminal: false },
  3: { tone: "success", terminal: true },
  4: { tone: "danger", terminal: true },
  5: { tone: "muted", terminal: true },
  6: { tone: "success", terminal: true },
};

const commandStatusOptions = computed(() => [
  { label: localeText("全部状态", "All statuses"), value: "" },
  ...Object.keys(commandStatusMap).map(value => ({ label: getCommandStatusText(value), value })),
]);
const upgradeStatusOptions = computed(() => [
  { label: localeText("全部状态", "All statuses"), value: "" },
  ...Object.keys(upgradeStatusMap).map(value => ({ label: getStatusText(value), value })),
]);
const settingStatusValues = ["QUEUED", "CLAIMED", "TCP_SENT", "FAILED", "EXPIRED", "CANCELED", "NOT_QUEUED", "DEVICE_DELIVERED", "SUCCESS"];
const deviceSettingParameterFields = [
  "onceMeasureLength",
  "signalLevel",
  "benchmarkValue",
  "noiseBenchmarkValue",
  "samplingCount",
  "samplingWeekday",
  "samplingTime",
  "syncSamplingTime",
  "syncSamplingNumber",
  "samplingPeriodTime",
  "audioRule",
  "reportInterval",
  "dayMeasureDataGroup",
  "leakThreshold",
  "nb4gTrigger",
  "nb4gTransferSet",
  "nb4gOpenTimeSet",
  "loraOpenDay",
  "loraSignalFrequency",
  "loraPower",
  "loraOpenDate",
  "workMode",
  "measureGainMode",
  "gainValue",
  "filterMethod",
  "filterLowFrequency",
  "filterHighFrequency",
  "thresholdRate",
  "rtcUploadInterval",
  "pressureSettings",
  "signalChannel",
  "inspectDelay",
  "inspectionControl",
  "enabledControl",
] as const;
const settingStatusOptions = computed(() => [
  { label: localeText("全部状态", "All statuses"), value: "" },
  ...settingStatusValues.map(value => ({ label: getSettingStatusText(value), value })),
]);
const audioRepairStatusValues = ["COLLECTING", "REPAIR_PENDING", "WAITING_UPLOAD", "COMPLETE", "FAILED"];
const audioRepairStatusOptions = computed(() => [
  { label: localeText("全部状态", "All statuses"), value: "" },
  ...audioRepairStatusValues.map(value => ({ label: getAudioRepairStatusText(value), value })),
]);
const audioDetailTabs = computed<Array<{ label: string; value: AudioDetailTab }>>(() => [
  { label: localeText("任务概览", "Overview"), value: "OVERVIEW" },
  { label: localeText("已接收分片", "Received frames"), value: "FRAMES" },
  { label: localeText("相关指令", "Commands"), value: "COMMANDS" },
]);

const commandColumns = computed<CommandTableColumn[]>(() => [
  { key: "id", label: localeText("记录 ID", "Record ID"), width: 90 },
  { key: "deviceNumber", label: localeText("设备编号", "Device number"), width: 150 },
  { key: "commandName", label: localeText("指令名称", "Command name"), width: 170 },
  { key: "commandCode", label: localeText("指令码", "Command code"), width: 120 },
  { key: "executeStatus", label: localeText("执行状态", "Status"), width: Number(localeText("120", "168")) },
  { key: "sendTime", label: localeText("下发时间", "Sent at"), width: 170, formatter: value => formatDateTime(value) },
  { key: "expiresAt", label: localeText("完成时间", "Completed at"), width: 170, formatter: value => formatDateTime(value) },
]);
const upgradeColumns = computed<CommandTableColumn[]>(() => [
  { key: "id", label: localeText("任务 ID", "Task ID"), width: 90 },
  { key: "deviceNumber", label: localeText("设备编号", "Device number"), width: 150 },
  { key: "firmwareVersion", label: localeText("固件版本", "Firmware version"), width: 110 },
  { key: "executeStatus", label: localeText("执行状态", "Status"), width: Number(localeText("130", "200")) },
  { key: "upgradeStageText", label: localeText("当前阶段", "Current stage"), width: 190 },
  { key: "finishPercent", label: localeText("进度", "Progress"), width: 170 },
  { key: "frameSummary", label: localeText("已收/总帧", "Received/total"), width: 110 },
  { key: "repairRound", label: localeText("补帧轮次", "Repair round"), width: 100 },
  { key: "startTime", label: localeText("开始时间", "Started at"), width: 170, formatter: value => formatDateTime(value) },
]);
const settingColumns = computed<CommandTableColumn[]>(() => [
  { key: "id", label: localeText("任务 ID", "Task ID"), width: 95 },
  { key: "deviceNumber", label: localeText("设备编号", "Device number"), width: 150 },
  { key: "batchId", label: localeText("批次 ID", "Batch ID"), width: 210 },
  // { key: "commandStatus", label: localeText("任务状态", "Task status"), width: Number(localeText("180", "230")) },
  { key: "commandExecuteStatus", label: localeText("指令执行状态", "Command status"), width: Number(localeText("150", "210")) },
  { key: "commandSentAt", label: localeText("发送时间", "Sent at"), width: 170, formatter: value => formatDateTime(value) },
  { key: "commandExpiresAt", label: localeText("过期时间", "Expires at"), width: 170, formatter: value => formatDateTime(value) },
  { key: "createdAt", label: localeText("创建时间", "Created at"), width: 170, formatter: value => formatDateTime(value) },
]);
const audioRepairColumns = computed<CommandTableColumn[]>(() => [
  { key: "id", label: localeText("任务 ID", "Task ID"), width: 100 },
  { key: "deviceNumber", label: localeText("设备编号", "Device number"), width: 150 },
  { key: "status", label: localeText("任务状态", "Status"), width: Number(localeText("140", "190")) },
  { key: "repairProgress", label: localeText("收集进度", "Progress"), width: 170 },
  { key: "frameSummary", label: localeText("已收/总帧", "Received/total"), width: 120 },
  { key: "missingFrameCount", label: localeText("缺失帧数", "Missing frames"), width: 110 },
  { key: "updatedAt", label: localeText("更新时间", "Updated at"), width: 170, formatter: value => formatDateTime(value) },
]);

const activeView = ref<RecordView>("COMMAND");
const commandFilters = reactive<FilterState>({ keyword: "", status: "", startDate: "", endDate: "" });
const upgradeFilters = reactive<FilterState & { firmwareVersion: string }>({ keyword: "", firmwareVersion: "", status: "", startDate: "", endDate: "" });
const settingFilters = reactive<FilterState>({ keyword: "", status: "", startDate: "", endDate: "" });
const audioRepairFilters = reactive<FilterState>({ keyword: "", status: "", startDate: "", endDate: "" });
const commandPage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const upgradePage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const settingPage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const audioRepairPage = reactive<PageState>({ current: 1, size: 10, total: 0 });
const commandRows = ref<ApiRecord[]>([]);
const upgradeRows = ref<ApiRecord[]>([]);
const settingRows = ref<ApiRecord[]>([]);
const audioRepairRows = ref<ApiRecord[]>([]);
const commandLoading = ref(false);
const upgradeLoading = ref(false);
const settingLoading = ref(false);
const audioRepairLoading = ref(false);
const selectedCommandId = ref<string | number | null>(null);
const selectedUpgradeId = ref<string | number | null>(null);
const selectedSettingId = ref<string | number | null>(null);
const selectedAudioRepairId = ref<string | number | null>(null);
const selectedDetail = ref<ApiRecord | null>(null);
const detailLoading = ref(false);
const detailTab = ref<DetailTab>("OVERVIEW");
const frames = ref<ApiRecord[]>([]);
const selectedFrame = ref<ApiRecord | null>(null);
const frameDetailVisible = ref(false);
const events = ref<ApiRecord[]>([]);
const selectedEvent = ref<ApiRecord | null>(null);
const eventDetailVisible = ref(false);
const subResourceLoading = ref(false);
const canceling = ref(false);
const deviceSettingDialogVisible = ref(false);
const audioDetailTab = ref<AudioDetailTab>("OVERVIEW");
const audioFrames = ref<ApiRecord[]>([]);
const audioCommands = ref<ApiRecord[]>([]);
const audioResourceLoading = ref(false);
const audioFrameDetails = ref<ApiRecord[]>([]);
const audioFrameDetailVisible = ref(false);

const upgradeDialogVisible = ref(false);
const upgradeStep = ref(1);
const candidateLoading = ref(false);
const checkingUpdatable = ref(false);
const submittingUpgrade = ref(false);
const firmwareCandidates = ref<ApiRecord[]>([]);
const deviceCandidates = ref<ApiRecord[]>([]);
const deviceKeyword = ref("");
const deviceCandidatePage = reactive({ current: 1, size: 200, total: 0 });
const upgradeDraft = reactive<{ firmwareId: string | number | null; devices: ApiRecord[] }>({ firmwareId: null, devices: [] });
const updatableResults = ref<ApiRecord[]>([]);
const lastCreatedUpgradeIds = ref<Array<string | number>>([]);
let upgradePollTimer: ReturnType<typeof setTimeout> | undefined;
let upgradePollRequest = 0;

const activeFilters = computed(() => {
  if (activeView.value === "COMMAND") return commandFilters;
  if (activeView.value === "UPGRADE") return upgradeFilters;
  if (activeView.value === "SETTING") return settingFilters;
  return audioRepairFilters;
});
const activePage = computed(() => {
  if (activeView.value === "COMMAND") return commandPage;
  if (activeView.value === "UPGRADE") return upgradePage;
  if (activeView.value === "SETTING") return settingPage;
  return audioRepairPage;
});
const activeRows = computed(() => {
  if (activeView.value === "COMMAND") return commandRows.value;
  if (activeView.value === "UPGRADE") return upgradeRows.value;
  if (activeView.value === "SETTING") return settingRows.value;
  return audioRepairRows.value;
});
const activeLoading = computed(() => {
  if (activeView.value === "COMMAND") return commandLoading.value;
  if (activeView.value === "UPGRADE") return upgradeLoading.value;
  if (activeView.value === "SETTING") return settingLoading.value;
  return audioRepairLoading.value;
});
const activeColumns = computed(() => {
  if (activeView.value === "COMMAND") return commandColumns.value;
  if (activeView.value === "UPGRADE") return upgradeColumns.value;
  if (activeView.value === "SETTING") return settingColumns.value;
  return audioRepairColumns.value;
});
const selectedId = computed(() => {
  if (activeView.value === "COMMAND") return selectedCommandId.value;
  if (activeView.value === "UPGRADE") return selectedUpgradeId.value;
  if (activeView.value === "SETTING") return selectedSettingId.value;
  return selectedAudioRepairId.value;
});
const activeStatusOptions = computed(() => {
  if (activeView.value === "COMMAND") return commandStatusOptions.value;
  if (activeView.value === "UPGRADE") return upgradeStatusOptions.value;
  if (activeView.value === "SETTING") return settingStatusOptions.value;
  return audioRepairStatusOptions.value;
});
const audioMissingFrames = computed<number[]>(() => {
  const value = selectedDetail.value?.missingFrameNumbers ?? selectedDetail.value?.missingFrames;
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
});
const selectedSettingParameters = computed(() => {
  const detail = selectedDetail.value || {};
  return deviceSettingParameterFields
    .filter(key => detail[key] !== null && detail[key] !== undefined && detail[key] !== "")
    .map(key => ({
      key,
      label: getDeviceSettingParameterLabel(key),
      value: detail[key],
    }));
});
const audioFrameDetailColumns = computed(() => {
  const fieldOrder = [
    "id",
    "transferId",
    "frameNo",
    "rawHexBytes",
    "receivedAt",
    "createdAt",
    "rawHex",
    "contentData",
  ];
  const keys = [...new Set(audioFrameDetails.value.flatMap(frame => Object.keys(frame)))];
  return keys.sort((left, right) => {
    const leftIndex = fieldOrder.indexOf(left);
    const rightIndex = fieldOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }).map(key => ({
    key,
    label: getAudioFrameFieldLabel(key),
    code: key !== "rawHexBytes" && /hex|content|payload|raw/i.test(key),
    width: key !== "rawHexBytes" && /hex|content|payload|raw/i.test(key)
      ? 480
      : (/time|at$/i.test(key) ? 230 : 140),
  }));
});
const audioFrameDetailGridTemplate = computed(() => audioFrameDetailColumns.value.map(column => `${column.width}px`).join(" "));
const audioFrameDetailTableWidth = computed(() => audioFrameDetailColumns.value.reduce((total, column) => total + column.width, 0));
const activeStatusIndex = computed(() => Math.max(0, activeStatusOptions.value.findIndex(item => item.value === activeFilters.value.status)));
const selectedFirmware = computed(() => firmwareCandidates.value.find(item => item.id === upgradeDraft.firmwareId) || null);
const selectedDevices = computed(() => upgradeDraft.devices);
const filteredDeviceCandidates = computed(() => {
  const keyword = deviceKeyword.value.trim().toLowerCase();
  if (!keyword) return deviceCandidates.value;
  return deviceCandidates.value.filter(item => [item.deviceNumber, item.deviceAlias, item.deviceName].some(value => String(value || "").toLowerCase().includes(keyword)));
});
const currentSelectableSelected = computed(() => {
  const selectable = filteredDeviceCandidates.value.filter(isDeviceUpgradeSelectable);
  return selectable.length > 0 && selectable.every(isDeviceSelected);
});
const hasBlockedDevice = computed(() => selectedDevices.value.some(device => !getCheckResult(device.deviceNumber).updatable));
const canSubmitUpgrade = computed(() => selectedDevices.value.length > 0 && updatableResults.value.length === selectedDevices.value.length && !hasBlockedDevice.value);
const frameDetailColumns = computed(() => {
  const fieldOrder = [
    "id",
    "frameIndex",
    "payloadHex",
    "dataLength",
    "sendStatus",
    "sendRound",
    "sendAttempts",
    "lastSessionId",
    "lastSentAt",
  ];
  const keys = [...new Set(frames.value.flatMap(frame => Object.keys(frame)))].sort((left, right) => {
    const leftIndex = fieldOrder.indexOf(left);
    const rightIndex = fieldOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
  return keys.map(key => ({
    key,
    label: getFrameFieldLabel(key),
    code: /hex|payload|content|raw/i.test(key),
    width: getFrameColumnWidth(key),
  }));
});
const frameDetailGridTemplate = computed(() => frameDetailColumns.value.map(column => `${column.width}px`).join(" "));
const frameDetailTableWidth = computed(() => frameDetailColumns.value.reduce((total, column) => total + column.width, 0));
const eventDetailColumns = computed(() => {
  const fieldOrder = [
    "id",
    "upgradeLogId",
    "deviceNumber",
    "direction",
    "directionName",
    "eventType",
    "eventTypeName",
    "eventLevel",
    "summary",
    "frameIndex",
    "sessionId",
    "rawHex",
    "rawHexBytes",
    "detail",
    "createdAt",
    "updatedAt",
  ];
  const keys = [...new Set(events.value.flatMap(event => Object.keys(event)))].sort((left, right) => {
    const leftIndex = fieldOrder.indexOf(left);
    const rightIndex = fieldOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
  return keys.map(key => ({
    key,
    label: getEventFieldLabel(key),
    code: key !== "rawHexBytes" && /hex|payload|content|raw|detail/i.test(key),
    width: getEventColumnWidth(key),
  }));
});
const eventDetailGridTemplate = computed(() => eventDetailColumns.value.map(column => `${column.width}px`).join(" "));
const eventDetailTableWidth = computed(() => eventDetailColumns.value.reduce((total, column) => total + column.width, 0));

onMounted(() => {
  loadCommandPage(true);
});

onBeforeUnmount(stopUpgradePolling);

async function switchRecordView(view: RecordView) {
  if (activeView.value === view) return;
  stopUpgradePolling();
  activeView.value = view;
  selectedDetail.value = null;
  detailTab.value = "OVERVIEW";
  // 每次进入记录模块都选中当前页第一条，避免保留旧 ID 时右侧详情为空。
  await loadActivePage(true);
}

async function loadActivePage(selectFirst = false) {
  if (activeView.value === "COMMAND") await loadCommandPage(selectFirst);
  else if (activeView.value === "UPGRADE") await loadUpgradePage(selectFirst);
  else if (activeView.value === "SETTING") await loadSettingPage(selectFirst);
  else await loadAudioRepairPage(selectFirst);
}

async function loadCommandPage(selectFirst = false) {
  commandLoading.value = true;
  try {
    const response = await getCommandSendLogPage({
      pageNum: commandPage.current,
      pageSize: commandPage.size,
      deviceNumber: commandFilters.keyword.trim() || undefined,
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
    showError(error, localeText("指令记录加载失败", "Failed to load command records"));
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
    showError(error, localeText("升级记录加载失败", "Failed to load upgrade records"));
  } finally {
    upgradeLoading.value = false;
  }
}

async function loadSettingPage(selectFirst = false) {
  settingLoading.value = true;
  try {
    const response = await getDeviceSettingPage({
      pageNum: settingPage.current,
      pageSize: settingPage.size,
      deviceNumber: settingFilters.keyword.trim() || undefined,
      recordSource: "COMMAND",
      sortOrder: "desc",
    });
    const pageData = unwrapResponse(response);
    settingRows.value = getPageRecords(pageData).map(normalizeDeviceSetting);
    settingPage.total = getPageTotal(pageData, settingRows.value.length);
    if (selectFirst || !settingRows.value.some(item => item.id === selectedSettingId.value)) {
      if (settingRows.value[0]) await selectSettingRow(settingRows.value[0]);
      else clearSelection("SETTING");
    }
  } catch (error) {
    showError(error, localeText("设备参数设置记录加载失败", "Failed to load device parameter tasks"));
  } finally {
    settingLoading.value = false;
  }
}

async function loadAudioRepairPage(selectFirst = false) {
  audioRepairLoading.value = true;
  try {
    const response = await getAudioRepairPage({
      pageNum: audioRepairPage.current,
      pageSize: Math.min(audioRepairPage.size, 200),
      deviceNumber: audioRepairFilters.keyword.trim() || undefined,
      status: audioRepairFilters.status || undefined,
      startTime: toStartTime(audioRepairFilters.startDate),
      endTime: toEndTime(audioRepairFilters.endDate),
      sortOrder: "desc",
    });
    const pageData = unwrapResponse(response);
    audioRepairRows.value = getPageRecords(pageData).map(normalizeAudioRepairTask);
    audioRepairPage.total = getPageTotal(pageData, audioRepairRows.value.length);
    if (selectFirst || !audioRepairRows.value.some(item => item.id === selectedAudioRepairId.value)) {
      if (audioRepairRows.value[0]) await selectAudioRepairRow(audioRepairRows.value[0]);
      else clearSelection("AUDIO_REPAIR");
    }
  } catch (error) {
    showError(error, localeText("音频补帧记录加载失败", "Failed to load audio repair tasks"));
  } finally {
    audioRepairLoading.value = false;
  }
}

async function selectRow(row: ApiRecord) {
  if (activeView.value === "COMMAND") await selectCommandRow(row);
  else if (activeView.value === "UPGRADE") await selectUpgradeRow(row);
  else if (activeView.value === "SETTING") await selectSettingRow(row);
  else await selectAudioRepairRow(row);
}

async function selectCommandRow(row: ApiRecord) {
  selectedCommandId.value = row.id;
  detailLoading.value = true;
  try {
    const detail = unwrapResponse(await getCommandSendLogDetail(row.id));
    // 详情接口缺少部分字段时，用列表行数据补齐右侧展示内容。
    selectedDetail.value = normalizeCommandLog({ ...row, ...(detail || {}) });
  } catch (error) {
    selectedDetail.value = row;
    showError(error, localeText("指令详情加载失败", "Failed to load command details"));
  } finally {
    detailLoading.value = false;
  }
}

async function selectUpgradeRow(row: ApiRecord) {
  stopUpgradePolling();
  selectedUpgradeId.value = row.id;
  detailTab.value = "OVERVIEW";
  frames.value = [];
  selectedFrame.value = null;
  frameDetailVisible.value = false;
  events.value = [];
  selectedEvent.value = null;
  eventDetailVisible.value = false;
  await loadSelectedUpgradeDetail(false);
  scheduleUpgradePolling();
}

async function selectSettingRow(row: ApiRecord) {
  if (row.id === undefined || row.id === null) return;
  selectedSettingId.value = row.id;
  detailLoading.value = true;
  try {
    const detail = unwrapResponse(await getDeviceSettingDetail(row.id));
    let result: ApiRecord = {};
    if (String(row.recordSource || detail?.recordSource || "COMMAND").toUpperCase() === "COMMAND") {
      try { result = unwrapResponse(await getDeviceSettingResult(row.id)) || {}; }
      catch (error) { showError(error, localeText("任务回执暂时无法刷新", "Task receipt could not be refreshed")); }
    }
    selectedDetail.value = normalizeDeviceSetting({ ...row, ...(detail || {}), ...result });
  } catch (error) {
    selectedDetail.value = row;
    showError(error, localeText("设备参数设置详情加载失败", "Failed to load device parameter task details"));
  } finally {
    detailLoading.value = false;
  }
}

async function selectAudioRepairRow(row: ApiRecord) {
  selectedAudioRepairId.value = row.transferId ?? row.id;
  if (selectedAudioRepairId.value === null || selectedAudioRepairId.value === undefined) return;
  audioDetailTab.value = "OVERVIEW";
  audioFrames.value = [];
  audioCommands.value = [];
  audioFrameDetails.value = [];
  audioFrameDetailVisible.value = false;
  detailLoading.value = true;
  try {
    const detail = unwrapResponse(await getAudioRepairDetail(selectedAudioRepairId.value));
    const normalized = normalizeAudioRepairTask({ ...row, ...(detail || {}) });
    selectedDetail.value = normalized;
    const index = audioRepairRows.value.findIndex(item => item.id === normalized.id);
    if (index >= 0) audioRepairRows.value.splice(index, 1, normalized);
  } catch (error) {
    selectedDetail.value = row;
    showError(error, localeText("音频补帧任务详情加载失败", "Failed to load audio repair task details"));
  } finally {
    detailLoading.value = false;
  }
}

async function switchAudioDetailTab(tab: AudioDetailTab) {
  audioDetailTab.value = tab;
  if (tab === "FRAMES" && !audioFrames.value.length) await loadAudioFrames(false);
  if (tab === "COMMANDS" && !audioCommands.value.length) await loadAudioCommands(false);
}

async function loadAudioFrames(showMessage: boolean) {
  if (selectedAudioRepairId.value === null) return;
  audioResourceLoading.value = true;
  try {
    audioFrames.value = asArray(unwrapResponse(await getAudioRepairFrames(selectedAudioRepairId.value)));
    if (audioFrameDetailVisible.value) audioFrameDetails.value = [...audioFrames.value];
    if (showMessage) showToast(localeText("分片记录已刷新", "Frame records refreshed"));
  } catch (error) {
    showError(error, localeText("音频分片加载失败", "Failed to load audio frames"));
  } finally {
    audioResourceLoading.value = false;
  }
}

async function openAudioFrameDetail() {
  if (selectedAudioRepairId.value === null) return;
  if (!audioFrames.value.length) await loadAudioFrames(false);
  audioFrameDetails.value = [...audioFrames.value];
  if (audioFrameDetails.value.length) audioFrameDetailVisible.value = true;
}

function closeAudioFrameDetail() {
  audioFrameDetailVisible.value = false;
}

async function loadAudioCommands(showMessage: boolean) {
  if (selectedAudioRepairId.value === null) return;
  audioResourceLoading.value = true;
  try {
    audioCommands.value = asArray(unwrapResponse(await getAudioRepairCommands(selectedAudioRepairId.value))).map(normalizeCommandLog);
    if (showMessage) showToast(localeText("相关指令已刷新", "Commands refreshed"));
  } catch (error) {
    showError(error, localeText("补帧指令加载失败", "Failed to load repair commands"));
  } finally {
    audioResourceLoading.value = false;
  }
}

async function loadSelectedUpgradeDetail(silent = false) {
  if (selectedUpgradeId.value === null) return;
  if (!silent) detailLoading.value = true;
  try {
    const detail = normalizeUpgradeLog(unwrapResponse(await getFirmwareUpgradeLogDetail(selectedUpgradeId.value)));
    if (detail.id !== selectedUpgradeId.value) return;
    selectedDetail.value = detail;
    const index = upgradeRows.value.findIndex(item => item.id === detail.id);
    if (index >= 0) upgradeRows.value.splice(index, 1, detail);
  } catch (error) {
    if (!silent) showError(error, localeText("升级详情加载失败", "Failed to load upgrade details"));
  } finally {
    if (!silent) detailLoading.value = false;
  }
}

function stopUpgradePolling() {
  upgradePollRequest += 1;
  if (upgradePollTimer) clearTimeout(upgradePollTimer);
  upgradePollTimer = undefined;
}

function scheduleUpgradePolling() {
  stopUpgradePolling();
  const task = selectedDetail.value;
  const id = selectedUpgradeId.value;
  if (activeView.value !== "UPGRADE" || id === null || !task || [3, 4, 5, 6].includes(Number(task.executeStatus))) return;
  const requestId = upgradePollRequest;
  upgradePollTimer = setTimeout(async () => {
    if (requestId !== upgradePollRequest || activeView.value !== "UPGRADE" || selectedUpgradeId.value !== id) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      scheduleUpgradePolling();
      return;
    }
    await loadSelectedUpgradeDetail(true);
    if (requestId !== upgradePollRequest || selectedUpgradeId.value !== id) return;
    if (detailTab.value === "FRAMES") await loadFrames(false);
    if (detailTab.value === "EVENTS") await loadEvents(false);
    scheduleUpgradePolling();
  }, 5000);
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
    const previousId = selectedFrame.value?.id;
    const previousFrameIndex = selectedFrame.value?.frameIndex;
    frames.value = asArray(unwrapResponse(await getFirmwareUpgradeFrames(selectedUpgradeId.value)));
    selectedFrame.value = frames.value.find(frame =>
      previousId !== undefined
        ? frame.id === previousId
        : previousFrameIndex !== undefined && frame.frameIndex === previousFrameIndex,
    ) || frames.value[0] || null;
    if (showMessage) showToast(localeText("帧记录已刷新", "Frame records refreshed"));
  } catch (error) {
    showError(error, localeText("帧记录加载失败", "Failed to load frame records"));
  } finally {
    subResourceLoading.value = false;
  }
}

function openFrameDetail() {
  if (frames.value.length) frameDetailVisible.value = true;
}

function closeFrameDetail() {
  frameDetailVisible.value = false;
}

async function loadEvents(showMessage: boolean) {
  if (selectedUpgradeId.value === null) return;
  subResourceLoading.value = true;
  try {
    const previousId = selectedEvent.value?.id;
    events.value = asArray(unwrapResponse(await getFirmwareUpgradeEvents(selectedUpgradeId.value))).map(normalizeUpgradeEvent);
    selectedEvent.value = events.value.find(event => previousId !== undefined && event.id === previousId) || events.value[0] || null;
    if (showMessage) showToast(localeText("事件记录已刷新", "Event records refreshed"));
  } catch (error) {
    showError(error, localeText("事件记录加载失败", "Failed to load event records"));
  } finally {
    subResourceLoading.value = false;
  }
}

function openEventDetail() {
  if (events.value.length) eventDetailVisible.value = true;
}

function closeEventDetail() {
  eventDetailVisible.value = false;
}

async function confirmCancelUpgrade() {
  if (!selectedDetail.value || !canCancelUpgrade(selectedDetail.value)) return;
  const deviceNumber = selectedDetail.value.deviceNumber || "--";
  const confirmed = await showConfirm(
    localeText("取消固件升级", "Cancel firmware upgrade"),
    localeText(`确认取消设备 ${deviceNumber} 的升级任务吗？`, `Cancel the upgrade task for device ${deviceNumber}?`),
  );
  if (!confirmed) return;
  canceling.value = true;
  try {
    unwrapResponse(await cancelFirmwareUpgrade({ upgradeLogIds: [selectedDetail.value.id] }));
    showToast(localeText("取消请求已提交", "Cancellation request submitted"));
    await loadSelectedUpgradeDetail(false);
  } catch (error) {
    showError(error, localeText("取消升级失败", "Failed to cancel upgrade"));
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
  deviceCandidatePage.current = 1;
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
    showError(error, localeText("固件列表加载失败", "Failed to load firmware"));
  }
}

async function loadDeviceCandidates() {
  candidateLoading.value = true;
  try {
    const page = unwrapResponse(await getDevicePage({ pageNum: deviceCandidatePage.current, pageSize: deviceCandidatePage.size, deviceNumber: deviceKeyword.value.trim() || undefined }));
    deviceCandidates.value = getPageRecords(page);
    deviceCandidatePage.total = getPageTotal(page, deviceCandidates.value.length);
  } catch (error) {
    deviceCandidates.value = [];
    deviceCandidatePage.total = 0;
    showError(error, localeText("设备列表加载失败", "Failed to load devices"));
  } finally {
    candidateLoading.value = false;
  }
}

async function searchDeviceCandidates() {
  deviceCandidatePage.current = 1;
  await loadDeviceCandidates();
}

async function changeDeviceCandidatePage(delta: number) {
  deviceCandidatePage.current = Math.max(1, deviceCandidatePage.current + delta);
  await loadDeviceCandidates();
}

async function nextUpgradeStep() {
  if (upgradeStep.value === 1) {
    if (!upgradeDraft.firmwareId) return showToast(localeText("请选择固件", "Select firmware"));
    upgradeStep.value = 2;
    return;
  }
  if (!selectedDevices.value.length) return showToast(localeText("请选择至少一台设备", "Select at least one device"));
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
    showError(error, localeText("设备升级检查失败", "Failed to check device eligibility"));
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
    const taskIds = Array.isArray(result?.upgradeLogIds) ? result.upgradeLogIds : [];
    lastCreatedUpgradeIds.value = taskIds;
    const taskCount = taskIds.length || selectedDevices.value.length;
    upgradeDialogVisible.value = false;
    activeView.value = "UPGRADE";
    upgradePage.current = 1;
    upgradePage.size = 200;
    showToast(localeText(`已创建 ${taskCount} 个升级任务`, `${taskCount} upgrade task(s) created`));
    await loadUpgradePage(true);
    if (taskIds.length === 1) {
      const created = upgradeRows.value.find(item => String(item.id) === String(taskIds[0]));
      if (created) await selectUpgradeRow(created);
    }
  } catch (error) {
    showError(error, localeText("发起固件升级失败", "Failed to start firmware upgrade"));
  } finally {
    submittingUpgrade.value = false;
  }
}

async function showCreatedUpgradeTasks() {
  activeView.value = "UPGRADE";
  upgradePage.current = 1;
  upgradePage.size = 200;
  await loadUpgradePage(false);
  const created = upgradeRows.value.find(row => lastCreatedUpgradeIds.value.some(id => String(id) === String(row.id)));
  if (created) await selectUpgradeRow(created);
  else showToast(localeText("本次任务已创建，但当前分页未返回其记录，请刷新列表", "Tasks were created; refresh the list to locate them"));
}

function toggleDevice(device: ApiRecord) {
  if (!isDeviceUpgradeSelectable(device)) return showToast(getDeviceAvailability(device));
  const index = upgradeDraft.devices.findIndex(item => item.id === device.id);
  if (index >= 0) upgradeDraft.devices.splice(index, 1);
  else upgradeDraft.devices.push(device);
  updatableResults.value = [];
}

function toggleSelectableDevices() {
  const selectable = filteredDeviceCandidates.value.filter(isDeviceUpgradeSelectable);
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

function isDeviceUpgradeSelectable(device: ApiRecord) {
  const channel = getDeviceChannel(device);
  if (channel === "INVALID") return false;
  if (channel !== "DIRECT_TCP" && (!String(device.nbNumber ?? "").trim() || !device.productId || !device.downlinkProtocolVersion || Number(device.enableState) === 0)) return false;
  return true;
}

function isDeviceOnline(device: ApiRecord): boolean | null {
  return getDeviceOnline(device);
}

function getDeviceAvailability(device: ApiRecord) {
  if (!isDeviceUpgradeSelectable(device)) return localeText("云配置缺少设备 ID 或协议异常", "Missing cloud identity or invalid protocol");
  if (getDeviceChannel(device) !== "DIRECT_TCP" && !device.downlinkProtocolVersion) return localeText("等待识别下发协议版本", "Waiting for downlink version detection");
  return localeText("可参加后端预检", "Eligible for server precheck");
}

function getOnlineText(device: ApiRecord) {
  const online = isDeviceOnline(device);
  return online === null ? localeText("未知", "Unknown") : online ? localeText("在线", "Online") : localeText("离线", "Offline");
}

function getCheckResult(deviceNumber: string) {
  if (checkingUpdatable.value) return { updatable: false, label: localeText("检查中", "Checking") };
  const result = updatableResults.value.find(item => String(item.deviceNumber) === String(deviceNumber));
  if (!result) return { updatable: false, label: localeText("尚未检查", "Not checked") };
  return {
    updatable: result.updatable === true || Number(result.updatable) === 1,
    label: result.updatable === true || Number(result.updatable) === 1
      ? localeText("可以升级", "Upgradable")
      : (result.reason || result.message || localeText("存在未结束任务", "An unfinished task exists")),
  };
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

async function handleDeviceSettingSubmitted() {
  activeView.value = "SETTING";
  settingPage.current = 1;
  await loadSettingPage(true);
}

function clearSelection(view: RecordView) {
  if (view === "COMMAND") selectedCommandId.value = null;
  else if (view === "UPGRADE") selectedUpgradeId.value = null;
  else if (view === "SETTING") selectedSettingId.value = null;
  else selectedAudioRepairId.value = null;
  selectedDetail.value = null;
}

function normalizeCommandLog(source: ApiRecord = {}) {
  return {
    ...source,
    id: source.id ?? source.commandSendLogId,
    deviceNumber: source.deviceNumber ?? source.deviceNo,
    commandName: source.commandName ?? source.commandDictName ?? source.commandTypeName,
    commandCode: source.commandCode ?? source.command ?? source.commandType,
    executeStatus: source.executeStatus ?? source.sendStatus ?? source.status,
    sendTime: source.sendTime ?? source.sentAt ?? source.createdAt ?? source.createTime,
    expiresAt: source.expiresAt,
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

function normalizeUpgradeEvent(source: ApiRecord = {}) {
  return {
    ...source,
    directionName: source.directionName || getDirectionText(source.direction),
    eventTypeName: source.eventTypeName || getEventTypeText(source.eventType),
    eventLevel: String(source.eventLevel || "INFO").toUpperCase(),
  };
}

function normalizeDeviceSetting(source: ApiRecord = {}) {
  const commandStatus = source.commandStatus ?? source.status;
  return {
    ...source,
    id: source.id ?? source.settingId,
    deviceNumber: source.deviceNumber ?? source.deviceNo,
    batchId: source.batchId ?? source.clientRequestId,
    commandStatus,
    commandSendLogId: source.commandSendLogId ?? source.commandId,
    commandExecuteStatus: source.commandExecuteStatus ?? source.executeStatus,
    commandSentAt: source.commandSentAt ?? source.sentAt ?? source.sendTime,
    commandExpiresAt: source.commandExpiresAt ?? source.expiresAt,
    commandFeedback: source.commandFeedback ?? source.feedback ?? source.result ?? source.message,
    sentAt: source.sentAt ?? source.commandSentAt ?? source.sendTime,
    expiresAt: source.expiresAt ?? source.commandExpiresAt,
  };
}

function displayProtocolVersion(value: unknown) {
  if (Number(value) === 1) return "NEW";
  if (Number(value) === 0) return "LEGACY";
  return displayValue(value, localeText("未知", "Unknown"));
}

function getBooleanText(value: unknown) {
  return value === true ? localeText("在线", "Online") : value === false ? localeText("离线", "Offline") : localeText("未知", "Unknown");
}

function getConfirmationText(task: ApiRecord) {
  if (task.deviceConfirmed === true && String(task.confirmationSource).toUpperCase() === "DEVICE") return localeText("设备已确认执行完成", "Confirmed by device");
  if (Number(task.executeStatus) === 6 && String(task.confirmationSource).toUpperCase() === "PLATFORM") return localeText("平台返回成功，尚无设备级确认", "Platform succeeded; no device confirmation");
  if (Number(task.executeStatus) === 4) return displayValue(task.feedback ?? task.commandFeedback, localeText("下发失败", "Dispatch failed"));
  if (Number(task.executeStatus) === 5) return displayValue(task.feedback ?? task.commandFeedback, localeText("已取消或过期", "Canceled or expired"));
  return task.deviceConfirmed === false ? localeText("尚未确认", "Not confirmed") : localeText("未知", "Unknown");
}

function normalizeAudioRepairTask(source: ApiRecord = {}) {
  const totalFrames = Number(source.totalFrames ?? source.totalFrameCount ?? source.frameCount ?? 0) || 0;
  const receivedFrames = Number(source.receivedFrames ?? source.receivedFrameCount ?? source.receivedCount ?? 0) || 0;
  const missingNumbers = Array.isArray(source.missingFrameNumbers)
    ? source.missingFrameNumbers
    : (Array.isArray(source.missingFrames) ? source.missingFrames : []);
  const missingFrameCount = Number(
    source.missingFrameCount
    ?? source.missingCount
    ?? (missingNumbers.length > 0 ? missingNumbers.length : Math.max(totalFrames - receivedFrames, 0)),
  ) || 0;
  const calculatedProgress = totalFrames > 0 ? (receivedFrames / totalFrames) * 100 : 0;
  return {
    ...source,
    id: source.transferId ?? source.id,
    transferId: source.transferId ?? source.id,
    deviceNumber: source.deviceNumber ?? source.deviceNo,
    status: source.status ?? source.transferStatus,
    totalFrames,
    receivedFrames,
    missingFrameCount,
    repairProgress: clampProgress(source.progress ?? source.finishPercent ?? calculatedProgress),
    frameSummary: `${receivedFrames}/${totalFrames}`,
    createdAt: source.createdAt ?? source.createTime ?? source.startTime,
    updatedAt: source.updatedAt ?? source.updateTime ?? source.lastReceivedAt,
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
  const labels: Record<number, string> = {
    0: localeText("待发送", "Pending"),
    1: localeText("升级中", "Upgrading"),
    2: localeText("取消中", "Cancelling"),
    3: localeText("升级失败", "Upgrade failed"),
    4: localeText("升级完成", "Completed"),
    5: localeText("已取消", "Cancelled"),
    6: localeText("设备或网络异常", "Device or network error"),
  };
  return labels[Number(status)] || localeText("未知状态", "Unknown status");
}

function getStatusClass(status: unknown) {
  return getStatusToneClass(upgradeStatusMap[Number(status)]?.tone);
}

function getDeviceSettingParameterLabel(key: string) {
  const labels: Record<string, string> = {
    onceMeasureLength: localeText("单次测量时长", "Measurement duration"),
    signalLevel: localeText("信号等级", "Signal level"),
    benchmarkValue: localeText("基准值", "Benchmark value"),
    noiseBenchmarkValue: localeText("噪声基准值", "Noise benchmark"),
    samplingCount: localeText("采样次数", "Sampling count"),
    samplingWeekday: localeText("采样星期", "Sampling weekday"),
    samplingTime: localeText("采样时间", "Sampling time"),
    syncSamplingTime: localeText("同步采样时间", "Synchronized sampling time"),
    syncSamplingNumber: localeText("同步采样编号", "Synchronized sampling number"),
    samplingPeriodTime: localeText("采样时间段", "Sampling period"),
    audioRule: localeText("音频上报规则", "Audio reporting rule"),
    reportInterval: localeText("上报间隔（分钟）", "Report interval (minutes)"),
    dayMeasureDataGroup: localeText("日测量数据组", "Daily measurement group"),
    leakThreshold: localeText("漏损阈值", "Leak threshold"),
    nb4gTrigger: localeText("NB/4G 触发", "NB/4G trigger"),
    nb4gTransferSet: localeText("NB/4G 传输设置", "NB/4G transfer setting"),
    nb4gOpenTimeSet: localeText("NB/4G 开启时段", "NB/4G active period"),
    loraOpenDay: localeText("LoRa 开启日", "LoRa active day"),
    loraSignalFrequency: localeText("LoRa 信号频率", "LoRa signal frequency"),
    loraPower: localeText("LoRa 功率", "LoRa power"),
    loraOpenDate: localeText("LoRa 开启时段", "LoRa active period"),
    workMode: localeText("工作模式", "Work mode"),
    measureGainMode: localeText("测量增益模式", "Measurement gain mode"),
    gainValue: localeText("增益值", "Gain value"),
    filterMethod: localeText("滤波方式", "Filter method"),
    filterLowFrequency: localeText("滤波低频", "Filter low frequency"),
    filterHighFrequency: localeText("滤波高频", "Filter high frequency"),
    thresholdRate: localeText("阈值比例", "Threshold rate"),
    rtcUploadInterval: localeText("RTC 上传间隔", "RTC upload interval"),
    pressureSettings: localeText("压力设置", "Pressure setting"),
    signalChannel: localeText("信号通道", "Signal channel"),
    inspectDelay: localeText("巡检延时", "Inspection delay"),
    inspectionControl: localeText("巡检控制", "Inspection control"),
    enabledControl: localeText("启用控制", "Enabled control"),
  };
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getSettingStatusText(status: unknown) {
  const value = String(status || "").toUpperCase();
  const labels: Record<string, string> = {
    QUEUED: localeText("等待设备连接", "Waiting for device"),
    CLAIMED: localeText("正在下发", "Dispatching"),
    // TCP_SENT: localeText("已写入连接，等待设备后续上报确认", "Written to TCP; awaiting later device report"),
    FAILED: localeText("下发失败", "Dispatch failed"),
    EXPIRED: localeText("等待下发已过期", "Dispatch expired"),
    CANCELED: localeText("已取消", "Cancelled"),
    NOT_QUEUED: localeText("指令创建异常", "Command creation failed"),
    DEVICE_DELIVERED: localeText("设备已送达（预留）", "Delivered (reserved)"),
    SUCCESS: localeText("成功（预留）", "Success (reserved)"),
  };
  return labels[value] || displayValue(status, localeText("未知状态", "Unknown status"));
}

function getSettingStatusClass(status: unknown) {
  const value = String(status || "").toUpperCase();
  if (["FAILED", "EXPIRED", "NOT_QUEUED"].includes(value)) return "status-tag--danger";
  if (["DEVICE_DELIVERED", "SUCCESS"].includes(value)) return "status-tag--success";
  if (value === "TCP_SENT") return "status-tag--primary";
  if (value === "CLAIMED") return "status-tag--warning";
  return "status-tag--default";
}

function getActiveEmptyText() {
  if (activeView.value === "COMMAND") return localeText("暂无指令下发记录", "No command records");
  if (activeView.value === "UPGRADE") return localeText("暂无固件升级记录", "No upgrade records");
  if (activeView.value === "SETTING") return localeText("暂无设备参数设置记录", "No device parameter tasks");
  return localeText("暂无音频补帧记录", "No audio repair tasks");
}

function getAudioRepairStatusText(status: unknown) {
  const labels: Record<string, string> = {
    COLLECTING: localeText("分片收集中", "Collecting"),
    REPAIR_PENDING: localeText("等待补帧", "Repair pending"),
    WAITING_UPLOAD: localeText("等待设备上传", "Waiting for upload"),
    COMPLETE: localeText("已完成", "Completed"),
    FAILED: localeText("失败", "Failed"),
  };
  return labels[String(status || "").toUpperCase()] || displayValue(status, localeText("未知状态", "Unknown status"));
}

function getAudioRepairStatusClass(status: unknown) {
  const value = String(status || "").toUpperCase();
  if (value === "COMPLETE") return "status-tag--success";
  if (value === "FAILED") return "status-tag--danger";
  if (value === "REPAIR_PENDING") return "status-tag--warning";
  if (value === "COLLECTING") return "status-tag--primary";
  return "status-tag--default";
}

function getAudioCommandTypeText(type: unknown) {
  return ({
    AUDIO_REPAIR: localeText("音频补帧指令", "Audio repair"),
    AUDIO_COMPLETE: localeText("音频收齐确认", "Audio complete"),
  } as Record<string, string>)[String(type)] || displayValue(type);
}

function getAudioFrameFieldLabel(key: string) {
  const labels: Record<string, string> = {
    id: localeText("记录 ID", "Record ID"),
    frameId: localeText("分片 ID", "Frame ID"),
    transferId: localeText("任务 ID", "Task ID"),
    frameNo: localeText("分片序号", "Frame number"),
    frameIndex: localeText("分片序号", "Frame index"),
    rawHexBytes: localeText("原始报文字节数", "Raw Hex bytes"),
    dataLength: localeText("数据长度（字节）", "Data length (bytes)"),
    receivedAt: localeText("接收时间", "Received at"),
    createdAt: localeText("创建时间", "Created at"),
    rawHex: localeText("原始报文", "Raw Hex"),
    contentData: localeText("业务数据", "Content data"),
  };
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function formatAudioFrameFieldValue(key: string, value: unknown) {
  if (/time|at$/i.test(key)) return formatDateTime(value);
  return stringifyContent(value);
}

function getCommandStatusText(status: unknown) {
  const labels: Record<number, string> = {
    0: localeText("待传输", "Pending transfer"),
    1: localeText("待发送", "Pending send"),
    2: localeText("已发送", "Sent"),
    3: localeText("已送达", "Delivered"),
    4: localeText("失败", "Failed"),
    5: localeText("已取消", "Cancelled"),
    6: localeText("已成功", "Succeeded"),
  };
  return labels[Number(status)] || localeText("未知状态", "Unknown status");
}

function getCommandStatusClass(status: unknown) {
  return getStatusToneClass(commandStatusMap[Number(status)]?.tone);
}

function getStatusToneClass(tone = "muted") {
  const toneMap: Record<string, string> = {
    waiting: "default",
    running: "primary",
    warning: "warning",
    danger: "danger",
    success: "success",
    muted: "default",
  };
  return `status-tag--${toneMap[tone] || "default"}`;
}

function getStageText(stage: unknown, round?: unknown) {
  const labels: Record<string, string> = {
    PREPARING: localeText("正在准备任务", "Preparing task"),
    WAITING_CONNECTION: localeText("等待设备连接", "Waiting for device connection"),
    WAITING_SEND: localeText("等待发送固件帧", "Waiting to send firmware frames"),
    WAITING_PLATFORM_CALLBACK: localeText("等待电信平台回执", "Waiting for CTWing callback"),
    SUBMISSION_UNKNOWN: localeText("平台受理结果待核实", "Platform submission needs verification"),
    SENDING_INITIAL: localeText("正在发送固件", "Sending firmware"),
    WAITING_DEVICE_REPORT: localeText("等待设备收帧报告", "Waiting for device frame report"),
    QUERY_PENDING: localeText("等待查询设备接收情况", "Waiting to query device reception"),
    WAITING_RECONNECT: localeText("存在丢帧，等待设备重连", "Frames lost; waiting for device reconnection"),
    SENDING_REPAIR: localeText("正在补发缺失帧", "Resending missing frames"),
    DEVICE_UPGRADING: localeText("设备正在升级", "Device is upgrading"),
    CANCEL_PENDING: localeText("等待发送取消指令", "Waiting to send cancellation"),
    CANCEL_WAIT_SUBMISSION: localeText("等待当前提交结果后取消", "Waiting for submission result before canceling"),
    CANCEL_PLATFORM_PENDING: localeText("正在取消平台指令", "Canceling platform command"),
    CANCEL_SENT: localeText("取消指令已发送", "Cancellation sent"),
    TERMINAL: localeText("任务已结束", "Task finished"),
    DONE: localeText("升级完成", "Upgrade complete"),
    FAILED: localeText("升级失败", "Upgrade failed"),
    CANCELED: localeText("已取消", "Canceled"),
  };
  const text = labels[String(stage)] || displayValue(stage, localeText("等待任务状态", "Waiting for task status"));
  if (Number(round) <= 0 || !["SENDING_REPAIR", "WAITING_SEND", "WAITING_PLATFORM_CALLBACK"].includes(String(stage))) return text;
  return localeText(`${text}（第 ${round} 轮）`, `${text} (round ${round})`);
}

function getTransportText(channel: unknown) {
  return ({ DIRECT_TCP: localeText("TCP 直连", "Direct TCP"), AEP_TCP: "AEP TCP", AEP_NB: "AEP NB" } as Record<string, string>)[String(channel)] || displayValue(channel);
}

function getFrameStatusText(status: unknown) {
  return ({
    0: localeText("待发送", "Pending"),
    1: localeText("发送中", "Sending"),
    2: localeText("已发送", "Sent"),
    3: localeText("失败", "Failed"),
  } as Record<number, string>)[Number(status)] || localeText("未知", "Unknown");
}

function getFrameFieldLabel(key: string) {
  const labels: Record<string, string> = {
    id: localeText("记录 ID", "Record ID"),
    frameIndex: localeText("帧序号", "Frame index"),
    payloadHex: localeText("帧十六进制内容", "Payload Hex"),
    dataLength: localeText("数据长度（字节）", "Data length (bytes)"),
    sendStatus: localeText("发送状态", "Send status"),
    sendRound: localeText("发送轮次", "Send round"),
    sendAttempts: localeText("尝试次数", "Send attempts"),
    lastSessionId: localeText("最近会话 ID", "Last session ID"),
    lastSentAt: localeText("最近发送时间", "Last sent at"),
    upgradeLogId: localeText("升级任务 ID", "Upgrade task ID"),
    createdAt: localeText("创建时间", "Created at"),
    updatedAt: localeText("更新时间", "Updated at"),
  };
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getFrameColumnWidth(key: string) {
  if (/hex|payload|content|data/i.test(key) && key !== "dataLength") return 420;
  if (/time|at$/i.test(key)) return 180;
  if (key === "sendStatus") return 140;
  if (/id$/i.test(key)) return 120;
  return 150;
}

function formatFrameFieldValue(key: string, value: unknown) {
  if (key === "sendStatus") {
    return `${displayValue(value)} (${getFrameStatusText(value)})`;
  }
  if (/time|at$/i.test(key)) return formatDateTime(value);
  return stringifyContent(value);
}

function getEventFieldLabel(key: string) {
  const labels: Record<string, string> = {
    id: localeText("事件记录 ID", "Event record ID"),
    upgradeLogId: localeText("固件升级任务 ID", "Upgrade task ID"),
    deviceNumber: localeText("设备编号", "Device number"),
    direction: localeText("事件方向编码", "Direction code"),
    directionName: localeText("事件方向中文名", "Direction name"),
    eventType: localeText("事件类型编码", "Event type code"),
    eventTypeName: localeText("事件类型中文名", "Event type name"),
    eventLevel: localeText("事件级别", "Event level"),
    summary: localeText("事件摘要", "Summary"),
    frameIndex: localeText("相关固件帧序号", "Frame index"),
    sessionId: localeText("TCP 会话 ID", "TCP session ID"),
    rawHex: localeText("原始十六进制报文", "Raw Hex"),
    rawHexBytes: localeText("原始报文字节数", "Raw Hex bytes"),
    detail: localeText("事件详细信息", "Event detail"),
    createdAt: localeText("创建时间", "Created at"),
    updatedAt: localeText("更新时间", "Updated at"),
  };
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getEventColumnWidth(key: string) {
  if (key !== "rawHexBytes" && /hex|payload|content|raw/i.test(key)) return 420;
  if (key === "summary") return 320;
  if (/detail|message|reason/i.test(key)) return 300;
  if (/time|at$/i.test(key)) return 180;
  if (key === "sessionId") return 220;
  if (["eventType", "eventTypeName"].includes(key)) return 190;
  if (["direction", "directionName"].includes(key)) return 150;
  if (/id$/i.test(key)) return 130;
  return 150;
}

function formatEventFieldValue(key: string, value: unknown) {
  if (/time|at$/i.test(key)) return formatDateTime(value);
  return stringifyContent(value);
}

function getEventTypeText(type: unknown) {
  const labels: Record<string, string> = {
    TASK_CREATED: localeText("升级任务创建", "Upgrade task created"),
    DATA_FRAME: localeText("固件数据帧下发成功", "Firmware frame sent"),
    LOSS_REPORT: localeText("设备丢帧上报", "Frame loss reported"),
    RECEIVE_COMPLETE: localeText("设备确认固件帧收齐", "All frames received"),
    UPGRADE_SUCCESS: localeText("设备升级成功", "Upgrade succeeded"),
    UPGRADE_FAILED: localeText("设备升级失败", "Upgrade failed"),
    CANCEL_COMMAND: localeText("取消升级指令下发", "Cancellation sent"),
    CANCEL_RECEIVED: localeText("设备确认收到取消指令", "Cancellation received"),
    CANCEL_SUCCESS: localeText("取消升级成功", "Cancellation succeeded"),
    CONNECTION_CLOSED: localeText("TCP 连接断开", "TCP connection closed"),
    SEND_FAILED: localeText("发送或等待响应失败", "Send failed or timed out"),
  };
  return labels[String(type)] || displayValue(type, localeText("未知事件", "Unknown event"));
}

function getDirectionText(direction: unknown) {
  if (direction === undefined || direction === null || direction === "") return localeText("未知", "Unknown");
  return ({
    DOWN: localeText("服务端下行", "Server downlink"),
    UP: localeText("设备上行", "Device uplink"),
    SYSTEM: localeText("系统事件", "System event"),
    PLATFORM: localeText("电信平台事件", "CTWing platform event"),
  } as Record<string, string>)[String(direction)] || displayValue(direction);
}

function getEventLevelClass(level: unknown) {
  const value = String(level || "INFO").toUpperCase();
  if (value === "ERROR") return "event-level--error";
  if (value === "WARN") return "event-level--warn";
  return "event-level--info";
}

function getDeviceChannelLabel(device: ApiRecord) {
  return getDeviceChannelText(getDeviceChannel(device), localeText);
}

function canCancelUpgrade(task: ApiRecord) {
  return [0, 1].includes(Number(task.executeStatus));
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

/** 将后端 ISO 时间统一显示为 YYYY-MM-DD HH:mm:ss，并去掉微秒部分。 */
function formatDateTime(value: unknown) {
  if (value === undefined || value === null || value === "") return "--";

  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const pad = (part: number) => String(part).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
  }

  const text = String(value).trim();
  const matched = text.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
  return matched ? `${matched[1]} ${matched[2]}` : text;
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
    uni.showModal({
      title,
      content,
      cancelText: localeText("取消", "Cancel"),
      confirmText: localeText("确定", "Confirm"),
      success: result => resolve(Boolean(result.confirm)),
      fail: () => resolve(false),
    });
  });
}
</script>

<style scoped lang="scss">
.task-center {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  gap: 12px;
  overflow: hidden;
  color: #233d55;
  background: #f3f7fa;
  box-sizing: border-box;
}

button {
  margin: 0;
  font-size: 13px;
  border-radius: 5px;
}

button::after {
  border: 0;
}

.toolbar,
.list-panel,
.detail-panel {
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 7px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.08);
}

.toolbar {
  flex: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 12px 14px;
  gap: 14px;
  box-sizing: border-box;
}

.toolbar__filters,
.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar__filters {
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-field {
  display: flex;
  align-items: center;
  flex-direction: row;
  min-width: 180px;
  gap: 10px;
}

.filter-field--keyword {
  width: 360px;
}

.filter-label {
  flex: none;
  color: #587086;
  font-size: 14px;
  font-weight: 800;
}

.filter-input,
.filter-select {
  flex: 1;
  width: 100%;
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

.filter-input--short {
  width: 132px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 132px;
}

.select-arrow {
  width: 0;
  height: 0;
  margin-left: 10px;
  border-top: 5px solid #8192a2;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 36px;
  padding: 0 18px;
  color: #31516d;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  background: #fff;
  border: 1px solid #c9d9e7;
  border-radius: 4px;
}

.action-button:hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.action-button--primary {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.action-button--primary:hover {
  color: #fff;
  background: #0674d8;
  border-color: #0674d8;
}

.action-button[disabled] {
  opacity: 0.55;
}

.content-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  min-height: 0;
  gap: 12px;
}

.list-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.list-panel> :deep(.data-table-container) {
  flex: 1;
  height: auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.panel-head,
.detail-head,
.modal-head {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 58px;
  padding: 14px;
  gap: 12px;
  border-bottom: 1px solid #e6edf3;
  box-sizing: border-box;
}

.panel-head {
  align-items: center;
}

.panel-head>view,
.detail-head>view:first-child,
.modal-head>view:first-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.panel-head__title,
.detail-head__title,
.modal-head__title {
  color: #23435e;
  font-size: 16px;
  font-weight: 900;
}

.panel-head__subtitle,
.detail-head__eyebrow,
.modal-head__eyebrow {
  color: #8192a2;
  font-size: 10px;
  font-weight: 700;
}

.panel-head__meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  margin: 0;
  padding: 0 14px;
  color: #647b91;
  font-size: 14px;
  font-weight: 800;
  line-height: 32px;
  background: #f7fafc;
  border: 1px solid #dce7ef;
  border-radius: 999px;
}

.record-switch {
  display: flex !important;
  align-items: center;
  flex-direction: row !important;
  gap: 8px !important;
}

.record-switch__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  color: #587086;
  font-size: 13px;
  font-weight: 800;
  line-height: 32px;
  background: #f7fafc;
  border: 1px solid #d6e2ed;
  border-radius: 4px;
}

.record-switch__button:hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.record-switch__button--active {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.record-switch__button--active:hover {
  color: #fff;
  background: #0674d8;
  border-color: #0674d8;
}

.detail-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  color: #75899c;
  font-size: 13px;
}

.detail-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #4f90c4;
  font-size: 23px;
  background: #edf6fd;
  border-radius: 50%;
}

.detail-head {
  align-items: flex-start;
}

.detail-head__id {
  color: #8798a8;
  font-size: 10px;
  font-family: Consolas, monospace;
}

.detail-head__actions {
  display: flex !important;
  align-items: flex-end;
  gap: 7px !important;
}

.detail-tabs {
  flex: none;
  display: flex;
  height: 42px;
  padding: 0 12px;
  gap: 4px;
  background: #fafcfe;
  border-bottom: 1px solid #e6edf3;
}

.detail-tab {
  position: relative;
  padding: 0 12px;
  color: #718397;
  line-height: 42px;
  background: transparent;
  border: 0;
}

.detail-tab--active {
  color: #0875cc;
  font-weight: 800;
}

.detail-tab--active::after {
  position: absolute;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 2px;
  content: "";
  background: #0d82ee;
}

.detail-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 13px;
  box-sizing: border-box;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
  white-space: nowrap;
  word-break: keep-all;
  border: 1px solid transparent;
  border-radius: 999px;
  box-sizing: border-box;
}

.status-tag--primary {
  color: #0d82ee;
  background: #f3f9ff;
  border-color: #d7eaff;
}

.status-tag--success {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-tag--warning {
  color: #b54708;
  background: #fff8eb;
  border-color: #fedf89;
}

.status-tag--danger {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.status-tag--default {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.progress-cell {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 7px;
  font-size: 11px;
}

.progress-track,
.progress-overview__track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  background: #e4edf4;
  border-radius: 999px;
}

.progress-track view,
.progress-overview__track view {
  height: 100%;
  background: linear-gradient(90deg, #27a4ef, #087bd7);
  border-radius: inherit;
}

.section-title {
  display: block;
  color: #294b66;
  font-size: 13px;
  font-weight: 900;
}

.info-section+.info-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf2f6;
}

.info-list {
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid #e2eaf1;
  border-radius: 5px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 7px 9px;
  gap: 12px;
  font-size: 11px;
  background: #fbfdff;
  border-bottom: 1px solid #edf2f6;
  box-sizing: border-box;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row text:first-child {
  flex: none;
  color: #75899c;
}

.info-row text:last-child {
  min-width: 0;
  color: #294b66;
  font-weight: 800;
  text-align: right;
}

.ellipsis-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-card {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  padding: 9px;
  gap: 6px;
  color: #425c72;
  font-size: 10px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f5f8fa;
  border: 1px solid #e1e9ef;
  border-radius: 5px;
}

.code-card__label {
  color: #75899c;
  font-weight: 800;
}

.error-card,
.warning-card {
  margin-top: 10px;
  padding: 9px 10px;
  color: #b34040;
  font-size: 11px;
  line-height: 1.5;
  background: #fff1f1;
  border: 1px solid #f0c3c3;
  border-radius: 5px;
}

.progress-overview {
  padding: 12px;
  background: #f5faff;
  border: 1px solid #d8eaf7;
  border-radius: 6px;
}

.progress-overview__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #2b5777;
  font-size: 12px;
  font-weight: 900;
}

.progress-overview__track {
  width: 100%;
}

.stage-text {
  display: block;
  margin-top: 7px;
  color: #628097;
  font-size: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 10px 0 14px;
  gap: 8px;
}

.stat-grid>view {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 9px;
  gap: 3px;
  background: #f7fafc;
  border: 1px solid #e2eaf1;
  border-radius: 5px;
}

.stat-grid text:first-child {
  color: #2177b7;
  font-size: 18px;
  font-weight: 900;
}

.stat-grid text:last-child {
  color: #7b8d9e;
  font-size: 10px;
}

.mini-button {
  height: 29px;
  padding: 0 10px;
  color: #31506d;
  font-size: 11px;
  line-height: 29px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.mini-button--danger {
  color: #b13f3f;
  background: #fff5f5;
  border-color: #edc4c4;
}

.subsection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.subsection-head>view {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.subsection-hint {
  color: #8798a8;
  font-size: 9px;
}

.subsection-head>.subsection-actions {
  align-items: center;
  flex-direction: row;
  gap: 7px;
}

.resource-state {
  padding: 40px 12px;
  color: #7a8d9f;
  font-size: 12px;
  text-align: center;
}

.compact-table-scroll {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.compact-table {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e1e9ef;
  border-radius: 5px;
  box-sizing: border-box;
}

.compact-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(86px, 1fr));
  min-height: 44px;
  border-bottom: 1px solid #edf2f6;
  cursor: pointer;
}

.compact-row--audio {
  grid-template-columns: 80px 100px 100px;
  cursor: default;
}

.compact-table--audio {
  width: 280px;
  max-width: 100%;
}

.compact-row:last-child {
  border-bottom: 0;
}

.compact-row>text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 7px;
  overflow: hidden;
  color: #425d73;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf2f6;
  box-sizing: border-box;
}

.compact-row--header {
  background: #f5f8fb;
  cursor: default;
}

.compact-row--header text {
  color: #516b81;
  font-weight: 900;
}

.compact-row--active {
  background: #e8f4fe;
  box-shadow: inset 3px 0 0 #0d82ee;
}

.compact-row:not(.compact-row--header):hover {
  background: #f3f9fe;
}

.timeline {
  padding-left: 8px;
}

.timeline-item {
  position: relative;
  padding: 0 0 14px 22px;
  border-left: 1px solid #d9e4ec;
}

.timeline-item__dot {
  position: absolute;
  top: 3px;
  left: -5px;
  width: 9px;
  height: 9px;
  background: #8195a7;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #8195a7;
}

.timeline-item--down .timeline-item__dot {
  background: #1989e5;
  box-shadow: 0 0 0 1px #1989e5;
}

.timeline-item--up .timeline-item__dot {
  background: #22a36c;
  box-shadow: 0 0 0 1px #22a36c;
}

.timeline-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-item__content>view {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.timeline-item__title {
  flex: 1;
  min-width: 0;
  color: #294b66;
  font-size: 11px;
  font-weight: 900;
}

.event-level {
  flex: none;
  height: 20px;
  padding: 0 7px;
  font-size: 9px;
  font-weight: 900;
  line-height: 20px;
  border-radius: 999px;
}

.event-level--info {
  color: #0875cc;
  background: #eaf5ff;
}

.event-level--warn {
  color: #a35b0b;
  background: #fff5e5;
}

.event-level--error {
  color: #b42318;
  background: #fff1ee;
}

.timeline-item__time,
.timeline-item__meta {
  color: #8496a6;
  font-size: 9px;
}

.timeline-item__summary {
  color: #294b66;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.5;
}

.timeline-item__detail {
  color: #5d7488;
  font-size: 10px;
  line-height: 1.5;
}

.timeline-item__hex {
  overflow: hidden;
  color: #51728d;
  font-size: 9px;
  font-family: Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.missing-frame-list {
  display: flex;
  flex-wrap: wrap;
  max-height: 150px;
  margin-top: 8px;
  padding: 9px;
  gap: 6px;
  overflow-y: auto;
  background: #f8fbfd;
  border: 1px solid #e1e9ef;
  border-radius: 5px;
}

.missing-frame-list>text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 26px;
  padding: 0 7px;
  color: #a35b0b;
  font-family: Consolas, monospace;
  font-size: 11px;
  font-weight: 800;
  background: #fff5e5;
  border: 1px solid #f2d29a;
  border-radius: 4px;
  box-sizing: border-box;
}

.empty-inline {
  margin-top: 8px;
  padding: 18px 10px;
  color: #7f91a1;
  font-size: 11px;
  text-align: center;
  background: #f8fbfd;
  border: 1px solid #e4ebf1;
  border-radius: 5px;
}

.audio-command-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audio-command-card {
  padding: 10px;
  background: #fbfdff;
  border: 1px solid #e0e9f0;
  border-radius: 5px;
}

.audio-command-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.audio-command-card__head>view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.audio-command-card__head>view text:first-child {
  color: #294b66;
  font-size: 11px;
  font-weight: 900;
}

.audio-command-card__head>view text:last-child,
.audio-command-card__time {
  color: #8496a6;
  font-size: 9px;
}

.audio-command-card__time {
  margin-top: 5px;
}

.audio-command-card__content {
  display: flex;
  flex-direction: column;
  max-height: 88px;
  margin-top: 7px;
  padding: 7px;
  gap: 4px;
  overflow: auto;
  color: #526d83;
  font-family: Consolas, monospace;
  font-size: 9px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f3f7fa;
  border-radius: 4px;
}

.audio-command-card__label {
  color: #71879a;
  font-family: sans-serif;
  font-weight: 800;
}

.modal-mask {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(20, 39, 56, 0.55);
  box-sizing: border-box;
}

.upgrade-modal {
  display: flex;
  flex-direction: column;
  width: min(1180px, 95vw);
  height: min(800px, 90vh);
  overflow: hidden;
  background: #fff;
  border: 1px solid #c9d9e6;
  border-radius: 8px;
  box-shadow: 0 26px 70px rgba(13, 39, 59, 0.3);
}

.modal-head {
  background: #fbfdff;
}

.upgrade-modal .modal-head__eyebrow {
  font-size: 13px;
}

.upgrade-modal .modal-head__title {
  font-size: 21px;
}

.modal-close {
  width: 38px;
  height: 38px;
  padding: 0;
  color: #718497;
  font-size: 28px;
  line-height: 35px;
  background: transparent;
  border: 0;
}

.frame-detail-modal {
  display: flex;
  flex-direction: column;
  width: min(1380px, 96vw);
  height: min(820px, 90vh);
  overflow: hidden;
  background: #fff;
  border: 1px solid #c9d9e6;
  border-radius: 8px;
  box-shadow: 0 26px 70px rgba(13, 39, 59, 0.3);
}

.audio-frame-detail-modal {
  width: min(1120px, 90vw);
}

.frame-detail-modal .modal-head {
  align-items: center;
}

.frame-detail-modal .modal-head__eyebrow {
  font-size: 12px;
}

.frame-detail-modal .modal-head__title {
  font-size: 20px;
}

.frame-detail-body {
  flex: 1;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: 16px 18px;
  overflow: auto;
  scrollbar-color: #8fa4b8 #e8eef4;
  scrollbar-gutter: stable;
  background: #f7fafc;
  box-sizing: border-box;
}

.frame-detail-body::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.frame-detail-body::-webkit-scrollbar-track {
  background: #e8eef4;
}

.frame-detail-body::-webkit-scrollbar-thumb {
  background: #8fa4b8;
  border: 2px solid #e8eef4;
  border-radius: 999px;
}

.frame-full-table {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce6ed;
  border-radius: 5px;
  box-sizing: border-box;
}

.frame-full-row {
  display: grid;
  min-height: 48px;
  border-bottom: 1px solid #e8eef4;
  cursor: pointer;
}

.frame-full-row:last-child {
  border-bottom: 0;
}

.frame-full-row>text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 9px 10px;
  overflow: hidden;
  color: #3f5c73;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  word-break: break-all;
  border-right: 1px solid #e8eef4;
  box-sizing: border-box;
}

.frame-full-row>text:last-child {
  border-right: 0;
}

.frame-full-row--header {
  position: sticky;
  z-index: 2;
  top: 0;
  min-height: 52px;
  color: #4e687e;
  font-weight: 900;
  background: #f3f7fa;
  cursor: default;
}

.frame-full-row--active {
  background: #e8f4fe;
  box-shadow: inset 3px 0 0 #0d82ee;
}

.frame-full-row:not(.frame-full-row--header):hover {
  background: #f2f8fd;
}

.frame-full-cell--code {
  align-items: flex-start !important;
  justify-content: flex-start !important;
  font-family: Consolas, monospace;
  text-align: left !important;
  white-space: pre-wrap;
}

.frame-full-cell--ellipsis {
  display: block !important;
  align-self: center;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap !important;
}

.frame-detail-modal .modal-actions {
  justify-content: flex-end;
  min-height: 62px;
}

.frame-detail-modal .action-button {
  min-width: 86px;
}

.step-bar {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px 24px;
  background: #f5f9fc;
  border-bottom: 1px solid #e2eaf1;
}

.step-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #8495a5;
  font-size: 14px;
  font-weight: 800;
}

.step-item__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  background: #fff;
  border: 1px solid #c5d5e2;
  border-radius: 50%;
  box-sizing: border-box;
}

.step-item--active {
  color: #0874cb;
}

.step-item--active .step-item__number {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.step-item--done {
  color: #208a5f;
}

.step-item--done .step-item__number {
  color: #fff;
  background: #27a471;
  border-color: #27a471;
}

.modal-body {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 22px 26px;
  background: #f7fafc;
  box-sizing: border-box;
}

.wizard-section {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
}

.wizard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.wizard-head>view:first-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.wizard-title {
  color: #294b66;
  font-size: 20px;
  font-weight: 900;
}

.wizard-hint {
  color: #7d90a2;
  font-size: 14px;
}

.selected-count {
  padding: 6px 12px;
  color: #0875cc;
  font-size: 14px;
  font-weight: 900;
  background: #e8f4fe;
  border: 1px solid #c6e2f8;
  border-radius: 999px;
}

.choice-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.choice-card {
  display: flex;
  padding: 15px;
  gap: 12px;
  background: #fff;
  border: 1px solid #d9e4ec;
  border-radius: 6px;
  cursor: pointer;
}

.choice-card--active {
  background: #eff8ff;
  border-color: #58a7e5;
  box-shadow: inset 0 0 0 1px #bce0f8;
}

.choice-radio {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border: 2px solid #b3c3d0;
  border-radius: 50%;
  box-sizing: border-box;
}

.choice-card--active .choice-radio {
  border-color: #0d82ee;
}

.choice-card--active .choice-radio text {
  width: 9px;
  height: 9px;
  background: #0d82ee;
  border-radius: 50%;
}

.choice-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 7px;
}

.choice-content>view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.choice-title {
  color: #294b66;
  font-size: 16px;
  font-weight: 900;
}

.version-pill {
  padding: 4px 9px;
  color: #13755c;
  font-size: 13px;
  font-weight: 900;
  background: #eaf8f2;
  border-radius: 999px;
}

.choice-description,
.choice-meta {
  overflow: hidden;
  color: #718698;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-filter {
  display: flex;
  margin-bottom: 12px;
  gap: 10px;
}

.device-filter .filter-input {
  flex: 1;
  height: 40px;
  font-size: 14px;
  line-height: 40px;
}

.device-filter .mini-button {
  height: 40px;
  padding: 0 15px;
  font-size: 14px;
  line-height: 40px;
}

.device-candidate-pagination { display: flex; align-items: center; justify-content: center; margin-top: 10px; gap: 12px; color: #718698; font-size: 12px; }

.device-table {
  width: 100%;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d9e4ec;
  border-radius: 5px;
  box-sizing: border-box;
}

.device-row {
  display: grid;
  grid-template-columns: 56px minmax(150px, 1.05fr) minmax(170px, 1.45fr) 150px 120px 130px;
  width: 100%;
  min-height: 50px;
  border-bottom: 1px solid #edf2f6;
  cursor: pointer;
  box-sizing: border-box;
}

.device-row:last-child {
  border-bottom: 0;
}

.device-row>text,
.device-check-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 10px;
  overflow: hidden;
  color: #405c73;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf2f6;
  box-sizing: border-box;
}

.device-row--header {
  min-height: 52px;
  color: #4c657a;
  font-weight: 900;
  background: #f4f8fb;
  cursor: default;
}

.device-row--header>text {
  font-size: 14px;
}

.device-row--selected {
  background: #eaf5ff;
}

.device-row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  background: #fff;
  border: 1px solid #aebfcd;
  border-radius: 3px;
  box-sizing: border-box;
}

.device-row--selected .checkbox {
  background: #0d82ee;
  border-color: #0d82ee;
}

.online-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
  box-sizing: border-box;
}

.online-pill--online {
  color: #16744b;
  background: #e9f8ef;
  border: 1px solid #bee7ce;
}

.online-pill--offline {
  color: #6d7e8e;
  background: #f0f3f6;
  border: 1px solid #d5dfe7;
}

.online-pill--unknown { color: #8a5c0a; background: #fff5df; border: 1px solid #f0d89c; }

.confirm-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 14px;
  gap: 10px;
}

.confirm-summary>view {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 5px;
  background: #eef7ff;
  border: 1px solid #d2e8f8;
  border-radius: 5px;
}

.confirm-summary text:first-child {
  color: #778c9e;
  font-size: 13px;
}

.confirm-summary text:last-child {
  color: #285773;
  font-size: 16px;
  font-weight: 900;
}

.check-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce6ed;
  border-radius: 5px;
}

.check-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 10px 14px;
  gap: 12px;
  border-bottom: 1px solid #edf2f6;
  box-sizing: border-box;
}

.check-item:last-child {
  border-bottom: 0;
}

.check-item>view {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #7a8d9f;
  font-size: 13px;
}

.check-item__number {
  color: #2a526f;
  font-size: 15px;
  font-weight: 900;
}

.check-result {
  max-width: 260px;
  padding: 5px 10px;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
  border-radius: 999px;
}

.check-result--success {
  color: #177245;
  background: #eaf8ef;
}

.check-result--danger {
  color: #b33e3e;
  background: #fff0f0;
}

.upgrade-modal .resource-state,
.upgrade-modal .warning-card {
  font-size: 14px;
}

.modal-actions {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 14px 18px;
  background: #fff;
  border-top: 1px solid #e2eaf1;
  box-sizing: border-box;
}

.modal-actions>view {
  display: flex;
  gap: 10px;
}

.upgrade-modal .modal-actions .action-button {
  min-width: 88px;
  height: 42px;
  font-size: 16px;
  line-height: 42px;
}

@media (max-width: 1280px) {
  .filter-field--date {
    display: none;
  }

  .content-layout {
    grid-template-columns: minmax(0, 1fr) 330px;
  }
}

@media (max-width: 980px) {
  .task-center {
    height: auto;
    min-height: calc(100vh - 88px);
    overflow: visible;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar__filters {
    flex-wrap: wrap;
  }

  .toolbar__actions {
    justify-content: flex-end;
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .list-panel {
    min-height: 560px;
  }

  .detail-panel {
    min-height: 540px;
  }

  .choice-list {
    grid-template-columns: 1fr;
  }
}
</style>
