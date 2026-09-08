<template>
  <view class="device-resume-view">
    <view class="toolbar-panel">
      <view class="dept-toolbar">
        <view class="filter-group">
          <text class="filter-label">设备编号</text>
          <input v-model="number" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" confirm-type="search" @confirm="search" />
        </view>
        <view class="filter-group">
          <text class="filter-label">所属分区</text>
          <picker :range="areas" range-key="name" :value="areaIndex" @change="changeArea">
            <view class="filter-select">
              <text class="filter-select__text">{{ areas[areaIndex]?.name }}</text>
              <text class="filter-select__arrow" />
            </view>
          </picker>
        </view>
        <view class="toolbar-actions">
          <button class="primary-button" :disabled="loading" @click="search">查询</button>
          <button class="secondary-button" @click="reset">重置</button>
          <button class="secondary-button" :disabled="loading" @click="refresh">更新</button>
        </view>
      </view>
    </view>
    <view class="resume-layout">
      <view class="panel device-layout">
        <view class="table-head">
          <text>设备列表</text>
          <text class="table-head__meta">共 {{ total }} 台</text>
        </view>
        <view class="table-scroll">
          <view v-if="departmentError" class="hint">{{ departmentError }}</view>
          <view class="table">
            <view class="table-row table-row--header device-table-row">
              <view class="table-cell table-header-cell col-index">序号</view>
              <view class="table-cell table-header-cell col-dept-name">所属分区</view>
              <view class="table-cell table-header-cell col-device-number">设备编号</view>
              <view class="table-cell table-header-cell col-device-alias">设备别名</view>
              <view class="table-cell table-header-cell col-state">在线状态</view>
            </view>
            <view
              v-for="(device, index) in pageDevices"
              :key="device.id"
              class="table-row device-table-row"
              :class="{ 'table-row--active': selectedId === device.id }"
              @click="select(device.id)"
            >
              <view class="table-cell col-index">{{ (page - 1) * size + index + 1 }}</view>
              <view class="table-cell col-dept-name" :title="device.deptNames">{{ device.deptNames || '—' }}</view>
              <view class="table-cell col-device-number" :title="device.deviceNumber">{{ device.deviceNumber }}</view>
              <view class="table-cell col-device-alias" :title="device.deviceAlias">{{ device.deviceAlias || '—' }}</view>
              <view class="table-cell col-state">
                <text class="status-pill" :class="device.onlineStatus === 1 ? 'success' : 'neutral'">
                  {{ getOnlineStatusText(device.onlineStatus) }}
                </text>
              </view>
            </view>
          </view>
          <view v-if="loading || listError || !pageDevices.length" class="table-state">
            <text>{{ loading ? '正在加载设备…' : listError || (connected ? '暂无设备数据' : ' ') }}</text>
            <text class="muted">{{ connected ? '可调整筛选条件或点击更新重试' : ' ' }}</text>
          </view>
        </view>
        <view class="pagination-bar">
          <button class="page-btn" :disabled="loading || page <= 1" @click="changePage(page - 1)">上一页</button>
          <text class="page-info">第 {{ page }} / {{ totalPages }} 页</text>
          <button class="page-btn" :disabled="loading || page >= totalPages" @click="changePage(page + 1)">下一页</button>
          <text class="page-info">到第</text>
          <input v-model="jumpPage" class="page-input" type="number" confirm-type="go" @confirm="handleJumpPage" @keyup.enter="handleJumpPage" />
          <text class="page-info">页</text>
          <button class="page-btn" :disabled="loading || !canJump" @click="handleJumpPage">跳转</button>
        </view>
      </view>
      <view class="panel detail-panel">
        <view class="table-head">
          <text>设备履历详情</text>
          <text class="table-head__meta">{{ selected?.deviceNumber || '未选择设备' }}</text>
        </view>
        <view v-if="selected" class="detail-scroll">
          <view class="summary">
            <view class="summary-title">
              <text>{{ selected.deviceAlias }}</text>
              <text class="status-pill" :class="tone(selected.status)">{{ selected.status || '—' }}</text>
            </view>
            <view class="info-grid">
              <view>
                <text class="muted">设备编号</text>
                <text>{{ selected.deviceNumber }}</text>
              </view>
              <view>
                <text class="muted">所属分区</text>
                <text>{{ selected.deptNames || '—' }}</text>
              </view>
              <view>
                <text class="muted">设备类型</text>
                <text>{{ selected.deviceType || '—' }}</text>
              </view>
              <view>
                <text class="muted">首次安装</text>
                <text>{{ selected.installTime || '—' }}</text>
              </view>
              <view class="wide">
                <text class="muted">安装地址</text>
                <text>{{ selected.installAddress || '—' }}</text>
              </view>
            </view>
          </view>
          <view class="history-heading">
            <view>
              <text class="section-title">设备履历详情记录</text>
              <text class="muted">共 {{ events.length }} 条</text>
            </view>
            <button class="table-action-btn" @click="ascending = !ascending">{{ ascending ? '时间正序 ↑' : '时间倒序 ↓' }}</button>
          </view>
          <view class="event-filters">
            <button class="event-filter" :class="{ active: !eventType }" @click="eventType = ''">全部</button>
            <button v-for="(label, value) in eventLabels" :key="value" class="event-filter" :class="{ active: eventType === value }" @click="eventType = value">{{ label }}</button>
          </view>
          <view v-if="detailLoading || detailError" class="table-state">
            <text>{{ detailLoading ? '正在加载履历…' : detailError }}</text>
            <button v-if="detailError" class="table-action-btn" @click="select(selected.id)">重新加载</button>
          </view>
          <view v-else-if="!visibleEvents.length" class="table-state">
            <text>暂无{{ eventType ? eventLabels[eventType] : '' }}记录</text>
            <text class="muted">可切换其他事件类型查看设备履历</text>
          </view>
          <view v-else class="timeline">
            <view v-for="event in visibleEvents" :key="event.id" class="timeline-item">
              <view class="dot" :class="event.eventType.toLowerCase()" />
              <view class="event-top">
                <text class="event-title">{{ event.eventName }}</text>
                <text class="muted">{{ event.eventTime }}</text>
              </view>
              <view class="event-card">
                <view class="transition">
                  <text class="status-pill neutral">{{ event.beforeStatus || '无' }}</text>
                  <text class="muted">→</text>
                  <text class="status-pill" :class="tone(event.afterStatus)">{{ event.afterStatus }}</text>
                </view>
                <text class="description">{{ event.description || '暂无事件描述' }}</text>
                <view class="event-meta">
                  <text>操作人：{{ event.operatorName || '—' }}</text>
                  <text>操作地址：{{ event.address || '—' }}</text>
                  <text>操作坐标：{{ event.coordinate || '—' }}</text>
                </view>
                <view v-if="event.remark" class="remark">备注：{{ event.remark }}</view>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="table-state detail-empty">
          <text>请选择设备查看履历</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import {
  getDeviceResumePage,
  getDeviceLifecycle,
  getDeviceResumeDeptTree,
} from '@/services/report/device-resume';
import type {
  DeviceResumeItem, DeviceId, LifecycleEvent,
  DepartmentNode, DeviceResumeQuery,
} from '@/services/report/device-resume';
import type { ApiResponse } from '@/types/api';

const eventLabels = {
  CREATE: '建档',
  INSTALL: '安装',
  MAINTAIN: '维护',
  REMOVE: '拆卸',
  REPAIR: '维修',
  INSPECT: '巡检',
  SCRAP: '报废',
};
type ViewEventType = keyof typeof eventLabels;

interface DepartmentOption { id: DeviceId; name: string }

function unwrap<T>(response: ApiResponse<T>): T {
  if (response.code !== undefined && response.code !== 0 && response.code !== 200) {
    throw new Error(response.msg || '查询失败，请稍后重试');
  }
  if (response.data == null) throw new Error('接口未返回数据');
  return response.data;
}

function flattenDepartments(nodes: DepartmentNode[]): DepartmentOption[] {
  return nodes.flatMap(node => [
    { id: node.id, name: node.deptName || node.name || String(node.id) },
    ...flattenDepartments(node.children || []),
  ]);
}

// 后端就绪并核对响应字段后改为 true，启用真实接口请求。
const connected = false;
const areas = ref<Array<{ id?: DeviceId; name: string }>>([{ name: '全部分区' }]);
const number = ref('');
const areaIndex = ref(0);
const page = ref(1);
const size = ref(10);
const total = ref(0);
const jumpPage = ref('');
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)));
const canJump = computed(() => Number.isInteger(Number(jumpPage.value)) && Number(jumpPage.value) >= 1 && Number(jumpPage.value) <= totalPages.value);
function handleJumpPage() {
  if (canJump.value) changePage(Number(jumpPage.value));
}
const pageDevices = ref<DeviceResumeItem[]>([]);
const selectedId = ref<DeviceId | null>(null);
const events = ref<LifecycleEvent[]>([]);
const eventType = ref<ViewEventType | ''>('');
const ascending = ref(false);
const loading = ref(false);
const detailLoading = ref(false);
const listError = ref('');
const detailError = ref('');
const departmentError = ref('');
let appliedFilters: Pick<DeviceResumeQuery, 'deviceNumber' | 'deptId'> = {};
let listRequest = 0;
let detailRequest = 0;
let disposed = false;
const selected = computed(() => pageDevices.value.find(device => device.id === selectedId.value));
const visibleEvents = computed(() => events.value
  .filter(event => !eventType.value || event.eventType === eventType.value)
  .slice().sort((a, b) => ascending.value
    ? a.eventTime.localeCompare(b.eventTime) : b.eventTime.localeCompare(a.eventTime)));

async function select(id: DeviceId) {
  selectedId.value = id;
  eventType.value = '';
  events.value = [];
  detailError.value = '';
  const request = ++detailRequest;
  if (!connected) return;
  detailLoading.value = true;
  try {
    const result = unwrap(await getDeviceLifecycle(id));
    if (request === detailRequest) events.value = result;
  } catch (error) {
    if (request === detailRequest) detailError.value = error instanceof Error ? error.message : '履历加载失败';
  } finally {
    if (request === detailRequest) detailLoading.value = false;
  }
}

async function loadDevices() {
  if (!connected) return;
  const request = ++listRequest;
  ++detailRequest;
  selectedId.value = null;
  pageDevices.value = [];
  events.value = [];
  total.value = 0;
  detailLoading.value = false;
  detailError.value = '';
  listError.value = '';
  loading.value = true;
  try {
    const result = unwrap(await getDeviceResumePage({ ...appliedFilters, pageNum: page.value, pageSize: size.value }));
    if (request !== listRequest) return;
    const records = result.records || [];
    const resultTotal = result.total || 0;
    const lastPage = Math.max(1, Math.ceil(resultTotal / size.value));
    if (page.value > lastPage) {
      page.value = lastPage;
      await loadDevices();
      return;
    }
    pageDevices.value = records;
    total.value = resultTotal;
    // 初次加载、查询和翻页后默认展示当前页第一台设备的履历。
    const next = records[0];
    if (next) void select(next.id);
  } catch (error) {
    if (request === listRequest) listError.value = error instanceof Error ? error.message : '设备加载失败';
  } finally {
    if (request === listRequest) loading.value = false;
  }
}
async function loadDepartments() {
  if (!connected) return;
  departmentError.value = '';
  try {
    const options = flattenDepartments(unwrap(await getDeviceResumeDeptTree()));
    if (disposed) return;
    const selectedDeptId = areas.value[areaIndex.value]?.id;
    areas.value = [{ name: '全部分区' }, ...options];
    areaIndex.value = Math.max(0, areas.value.findIndex(area => area.id === selectedDeptId));
  } catch (error) {
    if (!disposed) departmentError.value = '分区加载失败，请点击更新重试';
  }
}
function search() {
  appliedFilters = { deviceNumber: number.value.trim() || undefined, deptId: areas.value[areaIndex.value]?.id };
  page.value = 1;
  void loadDevices();
}
function reset() { number.value = ''; areaIndex.value = 0; search(); }
function refresh() { void loadDepartments(); void loadDevices(); }
function changeArea(event: { detail: { value: string | number } }) { areaIndex.value = Number(event.detail.value); }
function changePage(value: number) {
  if (loading.value || !Number.isInteger(value) || value < 1 || value > totalPages.value) return;
  page.value = value;
  void loadDevices();
}
function getOnlineStatusText(status?: number | null): string {
  if (status === 1) return '在线';
  if (status === 0) return '离线';
  return '—';
}
function tone(status?: string) { return status === '在用' ? 'success' : status === '维修中' ? 'warning' : 'neutral'; }
onMounted(() => { void loadDepartments(); void loadDevices(); });
onBeforeUnmount(() => { disposed = true; ++listRequest; ++detailRequest; });
</script>

<style scoped lang="scss">
.primary-button,
.secondary-button,
.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 64px;
  height: 36px;
  padding: 0 12px;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  border-radius: 4px;
  max-width: 100px;
}

.primary-button::after,
.secondary-button::after,
.danger-button::after {
  border: 0;
}

.primary-button {
  color: #ffffff;
  line-height: 36px;
  background: #0d82ee;
  border: 1px solid #0d82ee;
}

.primary-button:hover {
  background: #0674d8;
  border-color: #0674d8;
}

.primary-button[disabled] {
  color: #dbeafe;
  background: #82b9ec;
  border-color: #82b9ec;
}

.secondary-button {
  color: #31506d;
  line-height: 36px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.secondary-button:hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex: none;
  height: 50px;
  padding: 0 20px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3ed;
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.toolbar-panel {
  flex: none;
  display: flex;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  justify-content: space-between;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.toolbar-panel,
.dept-layout,
.device-layout {
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.dept-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  flex-wrap: wrap;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
  overflow: hidden;
}

.filter-group picker,
.filter-group uni-picker {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.dept-toolbar .filter-group:first-child {
  flex-basis: 236px;
}

.dept-toolbar .filter-group:nth-child(2) {
  flex-basis: 236px;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 13px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  height: 27px;
  padding: 0 10px;
  line-height: 27px;
}

.filter-input,
.filter-select {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input,
.filter-select {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.filter-input,
.filter-select {
  height: 30px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.dept-toolbar .filter-input,
.dept-toolbar .filter-select {
  height: 28px;
  line-height: 28px;
}

.dept-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  min-width: 0;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.filter-select__text {
  display: block;
  flex: 1;
  width: 0;
  min-width: 0;
  max-width: 100%;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-actions {
  align-self: end;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view),
.detail-body :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar),
.detail-body::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track),
.detail-body::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb),
.detail-body::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb:hover),
.detail-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.table {
  width: 100%;
  background: #ffffff;
  font-size: 12px;
}

.table-row {
  display: grid;
  width: 100%;
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  transition: background 0.18s ease,
	  box-shadow 0.18s ease;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #20384f;
  min-height: 44px;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row:not(.table-row--header):nth-child(odd) {
  background: #ffffff;
}

.table-row:not(.table-row--header):nth-child(even) {
  background: #fbfdff;
}

.table-row:not(.table-row--header):hover {
  background: #edf7ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.table-row--active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.table-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.table-cell {
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
}

.table-row--header .table-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.table-cell:last-child {
  border-right: 0;
}

.table-header-cell {
  gap: 5px;
  user-select: none;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.table-action-btn {
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  margin: 0;
  color: #0d82ee;
  font-size: 12px;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 4px;
}

.table-action-btn::after {
  border: 0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
  flex-shrink: 0;
}

.page-info {
  color: #64748b;
  font-size: 13px;
  padding: 10px;
}

.page-input {
  width: 40px;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
}

.page-btn {
  height: 30px;
  color: #31506d;
  font-size: 13px;
  margin: 0;
  padding: 0 12px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-btn::after {
  border: none;
}

.page-btn[disabled] {
  opacity: 0.5;
}

.device-resume-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
  color: #34495e;
  font-size: 13px;
}

.resume-layout {
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
}

.device-layout,.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35,72,104,.09);
}

.toolbar-panel {
  border-radius: 6px;
}

.table-scroll {
  overflow: auto;
}

.table {
  min-width: 590px;
}

.device-table-row {
  min-width: 590px;
  grid-template-columns: 54px minmax(120px, 1fr) minmax(150px, 1.2fr) minmax(160px, 1.2fr) 90px;
  cursor: pointer;
}

.col-index {
  color: #64748b;
}

.hint {
  padding: 12px 20px;
  color: #7c8da1;
}

.status-pill {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.success {
  color: #1c9563;
  background: #eaf8f0;
}

.warning {
  color: #c18522;
  background: #fff5e5;
}

.neutral {
  color: #728294;
  background: #f0f3f6;
}

.pagination-bar {
  padding: 10px 0;
  overflow-x: auto;
}

.page-btn,.page-info,.page-input {
  flex-shrink: 0;
  white-space: nowrap;
}

.input-placeholder {
  color: #94a3b8;
}

.detail-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.summary {
  background: #f8fbfe;
  border: 1px solid #e3edf5;
  border-radius: 5px;
  padding: 16px;
}

.summary-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #24445f;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
  margin-top: 18px;
}

.info-grid > view {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-wrap: anywhere;
}

.info-grid .wide {
  grid-column: 1 / -1;
}

.muted {
  color: #8493a3;
  font-size: 12px;
  font-weight: 400;
}

.history-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
}

.history-heading > view {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #24445f;
}

.event-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 14px 0 22px;
}

.event-filter {
  font-size: 12px;
  padding: 0 10px;
  line-height: 28px;
  color: #6a7f94;
  background: #f5f8fb;
  border: 1px solid #e3ebf2;
  border-radius: 4px;
  cursor: pointer;
}

.event-filter.active {
  color: #0d82ee;
  background: #edf6ff;
  border-color: #a9d7ff;
}

.timeline {
  padding-left: 6px;
}

.timeline-item {
  position: relative;
  border-left: 1px solid #dbe7f0;
  padding: 0 0 22px 22px;
}

.timeline-item:last-child {
  border-color: transparent;
  padding-bottom: 0;
}

.dot {
  position: absolute;
  left: -5px;
  top: 5px;
  width: 9px;
  height: 9px;
  background: #0d82ee;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #eef6fd;
}

.dot.repair {
  background: #dba039;
}

.dot.scrap,.dot.remove {
  background: #93a2b1;
}

.dot.maintain {
  background: #33a97b;
}

.event-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.event-title {
  font-size: 14px;
  font-weight: 700;
}

.event-card {
  padding: 12px 14px;
  border: 1px solid #e3ebf2;
  border-radius: 5px;
}

.transition {
  display: flex;
  align-items: center;
  gap: 10px;
}

.description {
  display: block;
  margin: 10px 0;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #7c8da1;
  overflow-wrap: anywhere;
}

.remark {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e3ebf2;
  color: #7c8da1;
  font-size: 12px;
  line-height: 1.6;
}

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 190px;
  padding: 20px;
  text-align: center;
}

.detail-empty {
  flex: 1;
}

.table-state {
  height: auto;
  line-height: normal;
  box-sizing: border-box;
}

@media (max-width:1150px) {
  .dept-toolbar {
    gap: 10px;
  }
  .pagination-bar {
    justify-content: flex-start;
  }
}

@media (max-width:820px) {
  .device-resume-view {
    overflow-y: auto;
  }
  .resume-layout {
    display: flex;
    flex-direction: column;
    flex: none;
  }
  .device-layout {
    height: 420px;
    flex-shrink: 0;
  }
  .detail-panel {
    min-height: 400px;
    overflow: visible;
  }
  .detail-scroll {
    overflow: visible;
  }
  .toolbar-panel {
    padding: 12px;
  }
  .dept-toolbar {
    padding: 0;
    width: 100%;
  }
  .dept-toolbar .filter-group {
    flex: 1 1 180px;
  }
  .toolbar-actions {
    flex-wrap: wrap;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
