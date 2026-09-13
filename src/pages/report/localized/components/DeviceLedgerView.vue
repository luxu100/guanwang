<template>
  <view class="ledger-view">
    <view class="toolbar-panel">
      <view class="dept-toolbar">
        <view class="filter-group">
          <text class="filter-label">{{ localeText("设备编号", "Device No.") }}</text>
          <input v-model="number" class="filter-input" :placeholder="localeText('请输入设备编号', 'Enter device no.')" placeholder-class="input-placeholder" confirm-type="search" @confirm="search" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ localeText("所属分区", "Partition") }}</text>
          <picker :range="areaOptions" :value="areaIndex" @change="areaIndex = Number($event.detail.value)">
            <view class="filter-select"><text class="filter-select__text">{{ areaOptions[areaIndex] }}</text><text class="filter-select__arrow" /></view>
          </picker>
        </view>
        <view class="toolbar-actions">
          <button class="primary-button" @click="search">{{ localeText("查询", "Search") }}</button>
          <button class="secondary-button" @click="reset">{{ localeText("重置", "Reset") }}</button>
        </view>
      </view>
    </view>
    <view class="panel">
      <view class="summary">
        <view class="filter current-device">
          <text class="filter-label">{{ localeText("当前设备", "Current Device") }}</text>
          <view class="current-device__selection">
            <picker class="current-device__picker" :range="matches" range-key="number" :value="deviceIndex" :disabled="!matches.length" @change="deviceIndex = Number($event.detail.value); typeIndex = 0">
              <view class="filter-select" :class="{ 'filter-select--empty': !matches.length }">
                <text class="filter-select__text">{{ selected?.number || localeText('暂无设备', 'No device') }}</text>
                <text class="filter-select__arrow" />
              </view>
            </picker>
            <text class="result-count">{{ localeText(`共 ${matches.length} 台设备`, `Total: ${matches.length} devices`) }}</text>
          </view>
        </view>
        <text v-if="selected">{{ localeText("所属分区：", "Partition: ") }}{{ selected.area }}</text>
        <text v-if="selected" class="status" :class="{ offline: !selected.online }">● {{ selected.online ? localeText('在线', 'Online') : localeText('离线', 'Offline') }}</text>
      </view>
      <view class="columns">
        <view class="ledger-column">
          <view class="heading"><text>{{ localeText("设备台账", "Device Ledger") }}</text><text class="muted small">{{ localeText("设备当前信息", "Current Device Info") }}</text></view>
          <view class="detail-panel__tabs">
            <view v-for="tab in detailTabs" :key="tab.key" class="detail-panel__tab" :class="{ 'detail-panel__tab--active': activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.title }}</view>
          </view>
          <view class="detail-panel__body ledger-page">
            <view v-for="(column, columnIndex) in sectionColumns" :key="columnIndex" class="ledger-page__column">
            <view v-for="section in column" :key="section.title" class="detail-panel__timeline-section">
              <text class="detail-panel__timeline-title">{{ section.title }}</text>
              <view class="detail-panel__grid detail-panel__grid--base">
                <view v-for="field in section.fields" :key="field.key" class="detail-panel__item detail-panel__item--base">
                  <text class="detail-panel__item-label">{{ field.label }}</text>
                  <text class="detail-panel__item-value">{{ selected?.details[field.key] ?? '--' }}</text>
                </view>
              </view>
            </view>
            <view v-if="activeTab === 'extended' && columnIndex === 0" class="detail-panel__timeline-section">
              <text class="detail-panel__timeline-title">{{ localeText("设备履历", "Device Lifecycle") }}</text>
              <view class="lifecycle"><view v-for="(label, index) in lifecycleLabels" :key="label"><text class="count">{{ selected?.lifecycle[index] ?? '--' }}</text><text class="muted">{{ label }}</text></view></view>
              <view class="recent-history">
                <text class="detail-panel__timeline-title">{{ localeText("最近设备履历详情", "Recent Lifecycle Details") }}</text>
                <view v-for="record in recentLifecycle" :key="record.id" class="recent-history__record">
                  <view class="recent-history__heading">
                    <text class="tag">{{ record.eventName || '--' }}</text>
                    <text class="muted">{{ record.eventTime || '--' }}</text>
                  </view>
                  <view class="detail-panel__grid detail-panel__grid--base">
                    <view v-for="field in lifecycleFields" :key="field.key" class="detail-panel__item detail-panel__item--base">
                      <text class="detail-panel__item-label">{{ field.label }}</text>
                      <text class="detail-panel__item-value">{{ record[field.key] || '--' }}</text>
                    </view>
                  </view>
                </view>
                <view v-if="!recentLifecycle.length" class="recent-history__empty">{{ localeText("暂无设备履历详情", "No lifecycle details") }}</view>
              </view>
            </view>
            </view>
          </view>
        </view>
        <view class="history-column">
          <view class="heading history-heading">
            <text class="history-heading__title">{{ localeText("信息变更记录", "Change Records") }}</text>
            <view class="history-heading__filters">
              <text class="muted small history-heading__count">{{ localeText(`${changes.length} 条`, `${changes.length} records`) }}</text>
              <picker class="history-heading__picker" :range="types" :value="typeIndex" @change="typeIndex = Number($event.detail.value)">
                <view class="filter-select">
                  <text class="filter-select__text">{{ types[typeIndex] }}</text>
                  <text class="filter-select__arrow" />
                </view>
              </picker>
            </view>
          </view>
          <view v-if="changes.length" class="timeline">
            <view v-for="change in changes" :key="change.time" class="event">
              <view class="dot" /><view class="event-top"><text class="time">{{ change.time }}</text><text class="muted">{{ change.operator }}</text></view>
              <view class="event-card"><text class="muted">{{ change.field }}</text><view class="transition"><text class="before">{{ change.before }}</text><text class="muted">→</text><text class="after">{{ change.after }}</text></view><text class="tag">{{ change.type }}</text></view>
            </view>
          </view>
          <view v-else class="empty"><text>{{ localeText("暂无变更记录", "No change records") }}</text></view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLocaleText } from '@/i18n/localeText';

const localeText = useLocaleText();

interface LedgerLifecycleRecord {
  id: string | number;
  eventName: string;
  eventTime: string;
  operatorName?: string;
  beforeStatus?: string;
  afterStatus?: string;
  address?: string;
  description?: string;
}

interface LedgerDevice {
  number: string;
  details: Record<string, string | number | undefined>;
  area: string;
  online: boolean;
  lifecycle: number[];
  lifecycleRecords?: LedgerLifecycleRecord[];
  changes: { time: string; operator: string; field: string; before: string; after: string; type: string }[];
}

const devices = ref<LedgerDevice[]>([]);
const areas = ref<string[]>(['全部分区']);
const areaOptions = computed(() => areas.value.map((area, index) => index === 0 ? localeText('全部分区', 'All Partitions') : area));
const typeSources = ['全部类型', '基础信息变更', '安装信息变更', '分区变更', '状态信息变更'] as const;
const types = computed(() => [
  localeText('全部类型', 'All Types'),
  localeText('基础信息变更', 'Basic Info Change'),
  localeText('安装信息变更', 'Install Info Change'),
  localeText('分区变更', 'Partition Change'),
  localeText('状态信息变更', 'Status Info Change'),
]);
const lifecycleLabels = computed(() => [
  localeText('安装', 'Install'),
  localeText('拆卸', 'Remove'),
  localeText('维护', 'Maintenance'),
  localeText('巡检', 'Inspection'),
]);
const number = ref('');
const areaIndex = ref(0);
const queryNumber = ref('');
const queryArea = ref(0);
const deviceIndex = ref(0);
const typeIndex = ref(0);
const matches = computed(() => devices.value.filter(device => device.number.includes(queryNumber.value) && (!queryArea.value || device.area === areas.value[queryArea.value])));
const selected = computed(() => matches.value[deviceIndex.value]);
const recentLifecycle = computed(() => [...(selected.value?.lifecycleRecords || [])]
  .sort((a, b) => b.eventTime.localeCompare(a.eventTime))
  .slice(0, 2));
const lifecycleFields = computed<{ key: keyof LedgerLifecycleRecord; label: string }[]>(() => [
  { key: 'operatorName', label: localeText('操作人', 'Operator') },
  { key: 'beforeStatus', label: localeText('操作前状态', 'Before Status') },
  { key: 'afterStatus', label: localeText('操作后状态', 'After Status') },
  { key: 'address', label: localeText('操作地址', 'Operation Address') },
  { key: 'description', label: localeText('详情描述', 'Description') },
]);
const changes = computed(() => (selected.value?.changes || []).filter(change => !typeIndex.value || change.type === typeSources[typeIndex.value] || change.type === types.value[typeIndex.value]).slice().sort((a, b) => b.time.localeCompare(a.time)));
const activeTab = ref('overview');
const detailTabs = computed(() => [
  { key: 'overview', title: localeText('基础、状态与安装信息', 'Basic, Status & Install Info') },
  { key: 'extended', title: localeText('通信与关联信息', 'Communication & Relations') },
]);
// 字段名称与设备管理的设备信息面板一致；未接入接口时仅展示空值。
const detailSections = computed(() => [
  { tab: 'base', title: localeText('基础信息', 'Basic Information'), fields: [
    ['deviceNumber', localeText('设备编号', 'Device No.')], ['deviceAlias', localeText('设备别名', 'Device Alias')], ['deviceType', localeText('产品型号', 'Product Model')], ['nbNumber', localeText('NB编号', 'NB No.')],
    ['hardwareVersion', localeText('硬件版本', 'Hardware Version')], ['softwareVersion', localeText('软件版本', 'Software Version')], ['algorithmType', localeText('算法类型', 'Algorithm Type')], ['algorithmVersion', localeText('算法版本', 'Algorithm Version')],
    ['pressureSensorModel', localeText('压力传感器型号', 'Pressure Sensor Model')], ['pressureSensorSerialNumber', localeText('压力传感器序列号', 'Pressure Sensor SN')],
  ] },
  { tab: 'status', title: localeText('状态信息', 'Status Information'), fields: [['enableState', localeText('启用状态', 'Enable Status')], ['onlineStatus', localeText('在线状态', 'Online Status')], ['leakStatus', localeText('渗漏状态', 'Leak Status')], ['lastSamplingTime', localeText('最后采样时间', 'Last Sampling Time')]] },
  { tab: 'install', title: localeText('安装信息', 'Install Information'), fields: [['installState', localeText('安装状态', 'Install Status')], ['installMode', localeText('安装模式', 'Install Mode')], ['installAddress', localeText('安装地址', 'Install Address')], ['installLongitude', localeText('安装经度', 'Install Longitude')], ['installLatitude', localeText('安装纬度', 'Install Latitude')]] },
  { tab: 'communication', title: localeText('通信信息', 'Communication Information'), fields: [['wifiName', localeText('WIFI名称', 'WiFi Name')], ['wifiMac', localeText('WIFI地址', 'WiFi Address')], ['serverIp', localeText('服务器IP', 'Server IP')], ['serverPort', localeText('服务器端口', 'Server Port')], ['tcpSessionId', localeText('TCP会话ID', 'TCP Session ID')], ['tcpLastSeenAt', localeText('最后通信时间', 'Last Communication Time')], ['aepProtocol', localeText('AEP协议', 'AEP Protocol')]] },
  { tab: 'relation', title: localeText('产品信息', 'Product Information'), fields: [['productName', localeText('产品名称', 'Product Name')], ['productCode', localeText('产品编码', 'Product Code')], ['protocolVersion', localeText('协议版本', 'Protocol Version')], ['aepProtocol', localeText('AEP协议', 'AEP Protocol')]] },
  { tab: 'relation', title: localeText('管网信息', 'Pipeline Information'), fields: [['tubeName', localeText('管网名称', 'Pipeline Name')], ['tubeMaterial', localeText('管材', 'Pipe Material')], ['tubeBore', localeText('管径', 'Pipe Diameter')], ['tubeNumber', localeText('管道编号', 'Pipeline No.')], ['tubeAdministrator', localeText('负责人', 'Owner')]] },
  { tab: 'relation', title: localeText('阀门信息', 'Valve Information'), fields: [['valveNumber', localeText('阀门编号', 'Valve No.')], ['valveName', localeText('阀门名称', 'Valve Name')]] },
  { tab: 'relation', title: localeText('分区信息', 'Partition Information'), fields: [['deptName', localeText('所属分区', 'Partition')], ['deptAdministrator', localeText('负责人', 'Owner')], ['description', localeText('描述', 'Description')]] },
]);
const sectionColumns = computed(() => {
  const groups = activeTab.value === 'overview'
    ? [['base'], ['status', 'install']]
    : [['communication'], ['relation']];
  return groups.map(tabs => detailSections.value.filter(section => tabs.includes(section.tab)).map(section => ({
    title: section.title,
    fields: section.fields.map(([key, label]) => ({ key, label })),
  })));
});
function search() { queryNumber.value = number.value.trim(); queryArea.value = areaIndex.value; deviceIndex.value = 0; typeIndex.value = 0; }
function reset() { number.value = ''; areaIndex.value = 0; search(); }
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/dialog/styles/detail-panel.css";

.ledger-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
  color: #24445f;
  font-size: 14px;
}

.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35,72,104,.09);
}

.filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter > text {
  flex-shrink: 0;
}

input,
.select {
  box-sizing: border-box;
  height: 36px;
  border: 1px solid #d8e3ed;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
}

input {
  width: 220px;
  padding: 0 12px;
}

.select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 144px;
  padding: 0 12px;
  gap: 18px;
  cursor: pointer;
  font-weight: 400;
}

.select > text {
  color: #8c9cac;
}

button {
  margin: 0;
  padding: 0 20px;
  height: 36px;
  line-height: 34px;
  border: 1px solid #d8e3ed;
  border-radius: 4px;
  background: #fff;
  color: #526b82;
  font-size: 14px;
}

button::after {
  border: 0;
}

button.primary {
  background: #2878d0;
  border-color: #2878d0;
  color: #fff;
}

.result-count {
  flex-shrink: 0;
  color: #93a1ae;
  font-size: 12px;
  white-space: nowrap;
}

.current-device {
  min-width: 0;
  max-width: 100%;
}

.current-device__selection {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.current-device__picker {
  display: block;
  width: 236px;
  min-width: 0;
}

.summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 32px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5edf4;
}

.status {
  color: #23a27a;
  background: #eaf7f1;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status.offline {
  color: #8694a3;
  background: #f0f3f6;
}

.summary,
.heading {
  flex-shrink: 0;
}

.columns {
  display: grid;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
}

.ledger-column,
.history-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.history-column {
  border-left: 1px solid #e5edf4;
}

.heading {
  box-sizing: border-box;
  height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #edf3ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
}

.muted {
  color: #7b8d9f;
  font-size: 13px;
  font-weight: 400;
}

.small {
  font-size: 12px;
}

.lifecycle {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 16px 0;
}

.lifecycle > view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border-right: 1px solid #e5edf4;
}

.lifecycle > view:last-child {
  border-right: 0;
}

.recent-history {
  margin-top: 10px;
  padding-top: 14px;
  border-top: 1px solid #edf3f8;
}

.recent-history__record + .recent-history__record {
  margin-top: 14px;
}

.recent-history__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.recent-history__empty {
  padding: 24px 10px;
  color: #8a9aab;
  font-size: 13px;
  text-align: center;
}

.count {
  color: #2878d0;
  font-size: 24px;
  font-weight: 600;
}

.timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 22px 20px 22px 28px;
}

.event {
  position: relative;
  border-left: 1px solid #dce7f1;
  padding: 0 0 30px 24px;
}

.event:last-child {
  border-left-color: transparent;
  padding-bottom: 0;
}

.dot {
  position: absolute;
  top: 4px;
  left: -5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #92b6d9;
  box-shadow: 0 0 0 4px #f0f6fc;
}

.event:first-child .dot {
  background: #2878d0;
}

.event-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.time {
  font-weight: 600;
}

.event-card {
  padding: 16px;
  border: 1px solid #e5edf4;
  border-radius: 5px;
}

.transition {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 14px 0 16px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.before {
  color: #8999a8;
}

.after {
  color: #2878d0;
  font-weight: 500;
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  color: #6383a2;
  background: #edf4fa;
  border-radius: 3px;
  font-size: 12px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 260px;
  padding: 24px;
  text-align: center;
  color: #8a9aab;
}

.toolbar-panel {
  flex: none;
  display: flex;
  padding: 14px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35,72,104,.09);
}

.dept-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 12px;
  min-width: 0;
  padding: 5px 10px;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 236px;
  min-width: 0;
  overflow: hidden;
}

.filter-group picker {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
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
  height: 28px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.filter-select__text {
  display: block;
  flex: 1;
  width: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-select__arrow {
  flex: none;
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.filter-select--empty {
  color: #8a9aab;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
}

.primary-button,
.secondary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 64px;
  max-width: 100px;
  height: 36px;
  padding: 0 12px;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 36px;
  border-radius: 4px;
}

.primary-button {
  color: #fff;
  background: #0d82ee;
  border: 1px solid #0d82ee;
}

.primary-button:hover {
  background: #0674d8;
  border-color: #0674d8;
}

.secondary-button {
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.secondary-button:hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.detail-panel__body {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.history-column > .empty {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.ledger-page {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.ledger-page__column {
  min-width: 0;
}

.ledger-page .detail-panel__item--base {
  grid-template-columns: minmax(0, 1fr) minmax(50px, 1fr);
  gap: 10px;
}

.ledger-page .detail-panel__item-label {
  line-height: 1.4;
}

.detail-panel__timeline-section + .detail-panel__timeline-section {
  margin-top: 12px;
}

.history-heading {
  justify-content: flex-start;
  flex-wrap: wrap;
  height: auto;
  min-height: 50px;
  padding: 10px 14px;
  gap: 8px 10px;
}

.history-heading__title {
  flex-shrink: 0;
}

.history-heading__filters {
  display: flex;
  align-items: center;
  flex: 0 1 166px;
  min-width: 0;
  max-width: 100%;
  gap: 8px;
}

.history-heading__count {
  flex-shrink: 0;
  white-space: nowrap;
}

.history-heading__picker {
  display: block;
  flex: 1;
  width: 136px;
  min-width: 0;
}

@media (max-width: 820px) {
  .toolbar-panel {
    padding: 12px;
  }

  .dept-toolbar {
    width: 100%;
    padding: 0;
  }

  .filter-group {
    flex: 1 1 180px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 1100px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 2fr) minmax(0, 1fr);
  }

  .history-column {
    border-left: 0;
    border-top: 1px solid #e5edf4;
  }
}

@media (max-width: 600px) {
  .ledger-page {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary {
    gap: 12px;
  }
}
</style>

