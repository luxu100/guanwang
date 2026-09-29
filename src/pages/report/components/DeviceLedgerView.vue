<template>
  <view class="ledger-view">
    <view class="toolbar-panel">
      <view class="dept-toolbar">
        <view class="filter-group">
          <text class="filter-label">设备编号</text>
          <input v-model="number" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" confirm-type="search" @confirm="search" />
        </view>
        <view class="filter-group">
          <text class="filter-label">所属分区</text>
          <picker :range="areas" :disabled="departmentsLoading" :value="areaIndex" @change="areaIndex = Number($event.detail.value)">
            <view class="filter-select"><text class="filter-select__text">{{ departmentsLoading ? '正在加载分区…' : areas[areaIndex] }}</text><text class="filter-select__arrow" /></view>
          </picker>
        </view>
        <view class="toolbar-actions">
          <button class="primary-button" @click="search">查询</button>
          <button class="secondary-button" @click="reset">重置</button>
        </view>
      </view>
    </view>
    <view v-if="departmentsFailed" class="partition-error">
      <text>{{ '分区加载失败，请重试' }}</text>
      <button class="secondary-button" :disabled="departmentsLoading" @click="loadDepartments">{{ '重试' }}</button>
    </view>
    <view v-if="listError" class="partition-error">
      <text>{{ listError }}</text>
      <button class="secondary-button" @click="search">{{ '重试' }}</button>
    </view>
    <view class="panel">
      <view class="summary">
        <view class="filter current-device">
          <text class="filter-label">当前设备</text>
          <view class="current-device__selection">
            <picker class="current-device__picker" :range="matches" range-key="number" :value="deviceIndex" :disabled="!matches.length" @change="selectDevice">
              <view class="filter-select" :class="{ 'filter-select--empty': !matches.length }">
                <text class="filter-select__text">{{ loading ? '正在加载…' : selected?.number || '暂无设备' }}</text>
                <text class="filter-select__arrow" />
              </view>
            </picker>
            <text class="result-count">共 {{ matches.length }} 台设备</text>
          </view>
        </view>
        <text v-if="selected">所属分区：{{ selected.area }}</text>
        <text v-if="selected && selected.online !== null" class="status" :class="{ offline: !selected.online }">● {{ selected.online ? '在线' : '离线' }}</text>
      </view>
      <view class="columns">
        <view class="ledger-column">
          <view class="heading"><text>设备台账</text><text class="muted small">{{ detailLoading ? '正在加载详情…' : '设备当前信息' }}</text></view>
          <view class="detail-panel__tabs">
            <view v-for="tab in detailTabs" :key="tab.key" class="detail-panel__tab" :class="{ 'detail-panel__tab--active': activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.title }}</view>
          </view>
          <view class="detail-panel__body ledger-page">
            <view v-if="detailError" class="detail-error">{{ detailError }}</view>
            <view v-for="(column, columnIndex) in sectionColumns" :key="columnIndex" class="ledger-page__column">
            <view v-for="section in column" :key="section.title" class="detail-panel__timeline-section">
              <text class="detail-panel__timeline-title">{{ section.title }}</text>
              <view class="detail-panel__grid detail-panel__grid--base">
                <view v-for="field in section.fields" :key="field.key" class="detail-panel__item detail-panel__item--base">
                  <text class="detail-panel__item-label">{{ field.label }}</text>
                  <text class="detail-panel__item-value">{{ formatDetail(field.key, field.value ?? selected?.details[field.key]) }}</text>
                </view>
              </view>
            </view>
            <view v-if="activeTab === 'extended' && columnIndex === 0" class="detail-panel__timeline-section">
              <text class="detail-panel__timeline-title">设备履历</text>
              <view class="lifecycle"><view v-for="(label, index) in lifecycleLabels" :key="label"><text class="count">{{ selected?.lifecycle[index] ?? '--' }}</text><text class="muted">{{ label }}</text></view></view>
              <view class="recent-history">
                <text class="detail-panel__timeline-title">最近设备履历详情</text>
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
                <view v-if="!recentLifecycle.length" class="recent-history__empty">暂无设备履历详情</view>
              </view>
            </view>
            </view>
          </view>
        </view>
        <view class="history-column">
          <view class="heading history-heading">
            <text class="history-heading__title">信息变更记录</text>
            <view class="history-heading__filters">
              <text class="muted small history-heading__count">{{ changes.length }} 条</text>
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
          <view v-else class="empty"><text>暂无变更记录</text></view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { getDeviceResumeDeptTree } from '@/services/report/device-resume';
import type { DepartmentNode, DeviceId } from '@/services/report/device-resume';
import { formatLedgerField, useDeviceLedgerData } from './useDeviceLedgerData';
import type { LedgerLifecycleRecord } from './useDeviceLedgerData';

const { devices, loading, listError, detailLoading, detailError, loadDevices, loadDeviceDetails, dispose } = useDeviceLedgerData();
const formatDetail = (key: string, value: string | number | undefined) => formatLedgerField(key, value, zh => zh);
const areas = ref<string[]>(['全部分区']);
const areaIds = ref<Array<DeviceId | undefined>>([undefined]);
const departmentsLoading = ref(false);
const departmentsFailed = ref(false);
let disposed = false;

type PartitionNode = Omit<DepartmentNode, 'children'> & {
  regionName?: string;
  children?: PartitionNode[];
};

async function loadDepartments() {
  if (departmentsLoading.value) return;
  departmentsLoading.value = true;
  departmentsFailed.value = false;
  try {
    const response = await getDeviceResumeDeptTree();
    if (response.code !== undefined && response.code !== 0 && response.code !== 200) {
      throw new Error(response.msg || 'Partition query failed');
    }
    if (!Array.isArray(response.data)) throw new Error('Invalid partition data');
    const options: Array<{ id: DeviceId; name: string }> = [];
    const visit = (nodes: PartitionNode[]) => {
      for (const node of nodes) {
        const name = node.regionName || node.deptName || node.name;
        if (name && node.id != null) options.push({ id: node.id, name });
        if (Array.isArray(node.children)) visit(node.children);
      }
    };
    visit(response.data);
    if (disposed) return;
    const currentArea = areas.value[areaIndex.value];
    const unique = options.filter((option, index) => options.findIndex(candidate => candidate.id === option.id) === index);
    areas.value = ['全部分区', ...unique.map(option => option.name)];
    areaIds.value = [undefined, ...unique.map(option => option.id)];
    areaIndex.value = Math.max(0, areas.value.indexOf(currentArea));
  } catch {
    if (!disposed) departmentsFailed.value = true;
  } finally {
    if (!disposed) departmentsLoading.value = false;
  }
}

onMounted(async () => { await loadDepartments(); if (!disposed) search(); });
onBeforeUnmount(() => { disposed = true; dispose(); });

const types = ['全部类型','基础信息变更', '拆装信息变更', '分区变更', '状态信息变更'];
const lifecycleLabels = ['安装', '拆卸', '维护', '巡检'];
const number = ref('');
const areaIndex = ref(0);
const deviceIndex = ref(0);
const typeIndex = ref(0);
const matches = computed(() => devices.value);
const selected = computed(() => matches.value[deviceIndex.value]);
const recentLifecycle = computed(() => [...(selected.value?.lifecycleRecords || [])]
  .sort((a, b) => b.eventTime.localeCompare(a.eventTime))
  .slice(0, 2));
const lifecycleFields: { key: keyof LedgerLifecycleRecord; label: string }[] = [
  { key: 'operatorName', label: '操作人' },
  { key: 'beforeStatus', label: '操作前状态' },
  { key: 'afterStatus', label: '操作后状态' },
  { key: 'address', label: '操作地址' },
  { key: 'description', label: '详情描述' },
];
const changes = computed(() => (selected.value?.changes || []).filter(change => !typeIndex.value || change.type === types[typeIndex.value]).slice().sort((a, b) => b.time.localeCompare(a.time)));
const activeTab = ref('overview');
const detailTabs = [
  { key: 'overview', title: '基础、状态与安装信息' },
  { key: 'extended', title: '通信与关联信息' },
];
// 字段名称与设备管理的设备信息面板一致；未接入接口时仅展示空值。
const detailSections = [
  { tab: 'base', title: '基础信息', fields: [
    ['deviceNumber', '设备编号'], ['deviceAlias', '设备别名'], ['deviceType', '产品型号'], ['nbNumber', 'NB编号'],
    ['hardwareVersion', '硬件版本'], ['softwareVersion', '软件版本'], ['algorithmType', '算法类型'], ['algorithmVersion', '算法版本'],
    ['pressureSensorModel', '压力传感器型号'], ['pressureSensorSerialNumber', '压力传感器序列号'],
  ] },
  { tab: 'status', title: '状态信息', fields: [['enableState', '启用状态'], ['onlineStatus', '在线状态'], ['leakStatus', '渗漏状态'], ['lastSamplingTime', '最后采样时间']] },
  { tab: 'install', title: '安装信息', fields: [['installState', '安装状态'], ['installMode', '安装模式'], ['installAddress', '安装地址'], ['installLongitude', '安装经度'], ['installLatitude', '安装纬度']] },
  { tab: 'communication', title: '通信信息', fields: [['wifiName', 'WIFI名称'], ['wifiMac', 'WIFI地址'], ['serverIp', '服务器IP'], ['serverPort', '服务器端口'], ['tcpSessionId', 'TCP会话ID'], ['tcpLastSeenAt', '最后通信时间'], ['aepProtocol', 'AEP协议']] },
  { tab: 'relation', title: '产品信息', fields: [['productName', '产品名称'], ['productCode', '产品编码'], ['protocolVersion', '协议版本'], ['aepProtocol', 'AEP协议']] },
  { tab: 'relation', title: '管网信息', fields: [['tubeName', '管网名称'], ['tubeMaterial', '管材'], ['tubeBore', '管径'], ['tubeNumber', '管道编号'], ['tubeAdministrator', '负责人']] },
  { tab: 'relation', title: '阀门信息', fields: [['valveNumber', '阀门编号'], ['valveName', '阀门名称']] },
  { tab: 'relation', title: '分区信息', fields: [['deptName', '所属分区'], ['deptAdministrator', '负责人'], ['description', '描述']] },
];
type LedgerSection = { title: string; fields: Array<{ key: string; label: string; value?: string | number }> };
const sectionColumns = computed<LedgerSection[][]>(() => {
  const groups = activeTab.value === 'overview'
    ? [['base'], ['status', 'install']]
    : [['communication'], ['relation']];
  return groups.map(tabs => detailSections.filter(section => tabs.includes(section.tab)).flatMap(section => {
    if (section.tab === 'relation' && section.fields[0]?.[0] === 'deptName' && selected.value?.partitions.length) {
      return selected.value.partitions.map((partition, index) => ({
        title: selected.value!.partitions.length > 1 ? `${section.title} ${index + 1}` : section.title,
        fields: section.fields.map(([key, label]) => ({
          key,
          label,
          value: partition[key as keyof typeof partition],
        })),
      }));
    }
    return [{ title: section.title, fields: section.fields.map(([key, label]) => ({ key, label })) }];
  }));
});
function selectDevice(event: { detail: { value: string | number } }) {
  deviceIndex.value = Number(event.detail.value);
  typeIndex.value = 0;
  const device = selected.value;
  if (device) void loadDeviceDetails(device);
}
function search() {
  deviceIndex.value = 0;
  typeIndex.value = 0;
  const areaById = new Map(areaIds.value.flatMap((id, index): Array<[string, string]> =>
    id == null ? [] : [[String(id), areas.value[index]]]));
  void loadDevices({ deviceNumber: number.value.trim() || undefined, deptId: areaIds.value[areaIndex.value] }, areaById);
}
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
  grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr);
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
  grid-template-columns: minmax(0, 132px) minmax(0, 1fr);
  gap: 4px;
}

.ledger-page .detail-panel__item-label {
  line-height: 1.4;
}

.ledger-page .detail-panel__item--base .detail-panel__item-value {
  text-align: right;
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
.partition-error {
  display: flex;
  align-items: center;
  flex: none;
  gap: 12px;
  margin-bottom: 14px;
  color: #b45309;
  font-size: 13px;
}
.detail-error {
  grid-column: 1 / -1;
  padding: 8px 10px;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 4px;
  font-size: 12px;
}
</style>
