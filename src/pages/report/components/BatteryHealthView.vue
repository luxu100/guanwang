<template>
  <view class="battery-view">
    <view class="toolbar-panel">
      <view class="dept-toolbar">
        <view class="filter-group"><text class="filter-label">设备编号</text><input v-model="number" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" confirm-type="search" @confirm="search" /></view>
        <view class="filter-group"><text class="filter-label">健康状态</text><picker :range="statuses" :value="statusIndex" @change="statusIndex = Number($event.detail.value)"><view class="filter-select"><text class="filter-select__text">{{ statuses[statusIndex] }}</text><text class="filter-select__arrow" /></view></picker></view>
        <view class="toolbar-actions"><button class="primary-button" @click="search">查询</button><button class="secondary-button" @click="reset">重置</button></view>
      </view>
    </view>
    <view class="statistics">
      <view v-for="card in statistics" :key="card.label" class="stat-card" :class="card.tone">
        <text class="stat-label">{{ card.label }}</text>
        <text class="stat-value">{{ card.value }}</text>
      </view>
    </view>
    <view class="layout">
      <view class="panel list-panel">
        <view class="heading">
          <text>电池列表 <text class="muted small">共 {{ matches.length }} 块</text></text>
          <view class="battery-list-actions">
            <button class="delete-battery-button" :disabled="!selected" @click="removeBattery">删除电池</button>
            <button class="primary" @click="openBatteryEditor">＋ 新增电池</button>
          </view>
        </view>
        <view class="table-scroll">
          <view class="table">
            <view class="row table-header"><text>序号</text><text>电池编号</text><text>设备编号</text><text>电压 / V</text><text>容量 / mAh</text><text>健康度</text><text>剩余寿命</text><text>状态</text></view>
            <view v-for="(battery, index) in matches" :key="battery.id" class="row data-row" :class="{ active: selectedId === battery.id }" @click="selectedId = battery.id">
              <text>{{ index + 1 }}</text><text class="bold">{{ battery.id }}</text><text class="bold">{{ battery.number }}</text><text>{{ latest(battery)?.voltage ?? '—' }}</text><text>{{ latest(battery)?.capacity ?? '—' }}</text>
              <view class="health-cell"><view class="track mini"><view :class="tone(battery)" :style="{ width: (latest(battery)?.health || 0) + '%' }" /></view><text>{{ latest(battery)?.health != null ? latest(battery)?.health + '%' : '—' }}</text></view>
              <text>{{ latest(battery)?.days != null ? latest(battery)?.days + ' 天' : '—' }}</text><view><text class="badge" :class="tone(battery)">{{ status(battery) }}</text></view>
            </view>
          </view>
          <view v-if="!matches.length" class="empty">暂无符合条件的电池</view>
        </view>
      </view>
      <view class="right-column">
        <view class="panel summary">
          <view class="heading">当前电池<text v-if="selected" class="badge" :class="tone(selected)">{{ status(selected) }}</text></view>
          <view v-if="selected" class="summary-body">
            <view class="battery-title">{{ selected.id }}<text class="muted"> / 设备 {{ selected.number }}</text></view>
            <view class="metric"><text>健康度</text><text class="large">{{ current?.health != null ? current.health + '%' : '—' }}</text></view>
            <view class="track"><view :class="tone(selected)" :style="{ width: (current?.health || 0) + '%' }" /></view>
            <view class="prediction-row">
              <view class="prediction-item"><text class="muted">剩余寿命</text><text><text class="large">{{ current?.days ?? '—' }}</text> 天</text></view>
              <view class="prediction-item"><text class="muted">预计更换日期</text><text class="replacement-date">{{ replacementDate }}</text></view>
            </view>
            <view class="advice" :class="tone(selected)">{{ advice }}</view>
            <text class="note">健康度与剩余寿命由后端预测，未返回结果时显示待预测。</text>
          </view>
          <view v-else class="empty">请选择电池</view>
        </view>
        <view class="panel records-panel">
          <view class="heading"><text>检测记录 <text class="muted small">{{ records.length }} 条</text></text><button class="primary" :disabled="!selected" @click="openEditor()">＋ 新增检测</button></view>
          <view class="records-scroll">
            <view v-for="record in records" :key="record.id" class="record">
              <view class="record-title"><text>{{ record.date.replace('T', ' ') }}</text><text class="muted">{{ record.operator }}</text></view>
              <view class="record-grid"><text>电压 <text class="value">{{ record.voltage }} V</text></text><text>容量 <text class="value">{{ record.capacity }} mAh</text></text><text>电量 <text class="value">{{ record.charge != null ? record.charge + '%' : '—' }}</text></text><text>健康度 <text class="value">{{ record.health != null ? record.health + '%' : '待预测' }}</text></text><text>预测剩余寿命 <text class="value">{{ record.days != null ? record.days + ' 天' : '待预测' }}</text></text></view>
              <view v-if="record.remark" class="record-remark">备注：{{ record.remark }}</view>
              <view class="record-actions"><button class="link" @click="openEditor(record)">编辑</button><button class="link danger-text" @click="removeRecord(record)">删除</button></view>
            </view>
            <view v-if="!records.length" class="empty">{{ selected ? '暂无检测记录，点击新增检测录入数据' : '选择电池后查看检测记录' }}</view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="batteryEditorVisible" class="overlay" @click.self="batteryEditorVisible = false">
      <view class="dialog">
        <view class="heading">
          <text>新增电池</text>
          <button class="link" @click="batteryEditorVisible = false">关闭</button>
        </view>
        <view class="form">
          <view class="form-grid">
            <view class="field">
              <text class="required">电池编号</text>
              <input v-model="batteryForm.id" placeholder="请输入电池编号" maxlength="64" />
            </view>
            <view class="field">
              <text class="required">设备编号</text>
              <input v-model="batteryForm.number" placeholder="请输入设备编号" maxlength="64" />
            </view>
          </view>
          <text v-if="batteryError" class="error">{{ batteryError }}</text>
          <view class="form-actions">
            <button @click="batteryEditorVisible = false">取消</button>
            <button class="primary" @click="saveBattery">保存</button>
          </view>
        </view>
      </view>
    </view>
    <view v-if="editorVisible" class="overlay" @click.self="editorVisible = false">
      <view class="dialog">
        <view class="heading"><text>{{ editingId ? '编辑检测记录' : '新增检测记录' }}</text><button class="link" @click="editorVisible = false">关闭</button></view>
        <view class="form">
          <text class="muted">{{ selected?.id }} / 设备 {{ selected?.number }}</text>
          <view class="form-grid">
            <view class="field"><text class="required">检测时间</text><WorkOrderDatetimePicker v-model="form.date" title="选择检测时间" placeholder="请选择检测时间" /></view>
            <view class="field"><text class="required">检测人</text><input v-model="form.operator" placeholder="请输入检测人" maxlength="30" /></view>
            <view v-for="field in numericFields" :key="field.key" class="field"><text :class="{ required: field.required }">{{ field.label }}</text><input v-model="form[field.key]" type="digit" :placeholder="field.placeholder" /></view>
            <view class="field remark-field"><text>备注</text><textarea v-model="form.remark" placeholder="请输入备注" maxlength="500" /></view>
          </view>
          <text v-if="error" class="error">{{ error }}</text>
          <view class="form-actions"><button @click="editorVisible = false">取消</button><button class="primary" @click="saveRecord">保存</button></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import WorkOrderDatetimePicker from '@/pages/work-order/components/WorkOrderDatetimePicker.vue';
interface Detection { id: string; date: string; operator: string; voltage: number; capacity: number; charge?: number; health?: number; days?: number; remark?: string }
interface Battery { id: string; number: string; records: Detection[] }
// 待接入电池检测接口。
const batteries = ref<Battery[]>([]);
const statuses = ['全部', '健康', '预警', '建议更换', '待检测', '待预测'];
const number = ref('');
const statusIndex = ref(0);
const query = reactive({ number: '', status: '全部' });
const selectedId = ref('');
const batteryEditorVisible = ref(false);
const batteryError = ref('');
const batteryForm = reactive({ id: '', number: '' });

function openBatteryEditor() {
  batteryForm.id = '';
  batteryForm.number = '';
  batteryError.value = '';
  batteryEditorVisible.value = true;
}

function saveBattery() {
  const id = batteryForm.id.trim();
  const deviceNumber = batteryForm.number.trim();
  if (!id || !deviceNumber) {
    batteryError.value = !id ? '请填写电池编号' : '请填写设备编号';
    return;
  }
  if (batteries.value.some(battery => battery.id === id)) {
    batteryError.value = '电池编号已存在，请勿重复添加';
    return;
  }
  batteries.value.unshift({ id, number: deviceNumber, records: [] });
  // 清除筛选，让新增电池可见并可立即录入检测记录。
  reset();
  selectedId.value = id;
  batteryEditorVisible.value = false;
  uni.showToast({ title: '新增成功', icon: 'success' });
}

function removeBattery() {
  const battery = selected.value;
  if (!battery) return;
  uni.showModal({
    title: '删除电池',
    content: `确定删除电池 ${battery.id}（设备 ${battery.number}）？该电池的 ${battery.records.length} 条检测记录也将一并删除。`,
    success: result => {
      if (!result.confirm) return;
      batteries.value = batteries.value.filter(item => item.id !== battery.id);
      uni.showToast({ title: '删除成功', icon: 'success' });
    },
  });
}

function sorted(battery: Battery) { return [...battery.records].sort((a, b) => b.date.localeCompare(a.date)); }
function latest(battery: Battery) { return sorted(battery)[0]; }
function status(battery: Battery) {
  const record = latest(battery);
  if (!record) return '待检测';
  if (record.health == null || record.days == null) return '待预测';
  if (record.health < 60 || record.days <= 30) return '建议更换';
  return record.health < 80 || record.days <= 90 ? '预警' : '健康';
}
function tone(battery: Battery) { return ({ '健康': 'success', '预警': 'warning', '建议更换': 'danger', '待检测': 'neutral', '待预测': 'neutral' })[status(battery)]; }
const matches = computed(() => batteries.value.filter(b => b.number.includes(query.number) && (query.status === '全部' || status(b) === query.status)));
watch(matches, list => { if (!list.some(b => b.id === selectedId.value)) selectedId.value = list[0]?.id || ''; });
// 统计随已应用的筛选条件更新。
const statistics = computed(() => [
  { label: '电池总数', value: matches.value.length, tone: 'stat-total' },
  { label: '健康', value: matches.value.filter(b => status(b) === '健康').length, tone: 'stat-healthy' },
  { label: '预警', value: matches.value.filter(b => status(b) === '预警').length, tone: 'stat-warning' },
  { label: '建议更换', value: matches.value.filter(b => status(b) === '建议更换').length, tone: 'stat-danger' },
]);
const selected = computed(() => matches.value.find(b => b.id === selectedId.value));
const records = computed(() => selected.value ? sorted(selected.value) : []);
const current = computed(() => records.value[0]);
const replacementDate = computed(() => {
  if (current.value?.days == null) return '—';
  const date = new Date(current.value.date.length === 10 ? current.value.date + 'T00:00:00' : current.value.date);
  date.setDate(date.getDate() + current.value.days);
  return formatDate(date);
});
const advice = computed(() => !selected.value || !current.value ? '请录入检测数据后评估' : status(selected.value) === '待预测' ? '检测数据已录入，等待后端预测结果' : status(selected.value) === '建议更换' ? '建议尽快更换电池，安排维护检查' : status(selected.value) === '预警' ? '建议增加检测频次，提前安排更换' : '暂无需更换，建议定期检测');
function search() { query.number = number.value.trim(); query.status = statuses[statusIndex.value]; }
function reset() { number.value = ''; statusIndex.value = 0; search(); }
function formatDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function now() { const date = new Date(); return `${formatDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`; }
const numericFields = [
  { key: 'voltage', label: '检测电压（V）', placeholder: '请输入大于 0 的电压', required: true },
  { key: 'capacity', label: '检测容量（mAh）', placeholder: '请输入大于 0 的容量', required: true },
  { key: 'charge', label: '电量（%）', placeholder: '0–100（选填）', required: false },
] as const;
const editorVisible = ref(false);
const editingId = ref('');
const error = ref('');
const form = reactive({ date: now(), operator: '', voltage: '', capacity: '', charge: '', remark: '' });
function openEditor(record?: Detection) {
  if (!selected.value) return;
  editingId.value = record?.id || '';
  form.date = record ? (record.date.length === 10 ? record.date + 'T00:00:00' : record.date) : now(); form.operator = record?.operator || '';
  form.remark = record?.remark || '';
  numericFields.forEach(field => { form[field.key] = record?.[field.key] != null ? String(record[field.key]) : ''; });
  error.value = ''; editorVisible.value = true;
}
function saveRecord() {
  if (!selected.value) return;
  const date = new Date(form.date);
  if (!form.operator.trim()) { error.value = '请填写检测人'; return; }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(form.date) || !Number.isFinite(date.getTime()) || formatDate(date) !== form.date.slice(0, 10) || date.getTime() > Date.now()) { error.value = '请选择有效的检测时间，不能晚于当前时间'; return; }
  for (const field of numericFields) {
    if (!field.required && !form[field.key].trim()) continue;
    const value = Number(form[field.key]);
    if (!form[field.key].trim() || !Number.isFinite(value) || (field.required ? value <= 0 : value < 0 || value > 100)) {
      error.value = '请填写有效的' + field.label; return;
    }
  }
  // 检测数据变更后等待后端重新预测，不提交或沿用旧的健康度、寿命结果。
  const record: Detection = { id: editingId.value || 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), date: form.date, operator: form.operator.trim(), voltage: Number(form.voltage), capacity: Number(form.capacity), charge: form.charge.trim() ? Number(form.charge) : undefined, remark: form.remark.trim() };
  const index = selected.value.records.findIndex(r => r.id === editingId.value);
  if (index >= 0) selected.value.records.splice(index, 1, record);
  else selected.value.records.unshift(record);
  editorVisible.value = false;
  uni.showToast({ title: '保存成功', icon: 'success' });
}
function removeRecord(record: Detection) {
  const battery = selected.value;
  if (!battery) return;
  uni.showModal({ title: '删除检测记录', content: `确定删除 ${battery.id} 在 ${record.date} 的检测记录？`, success: result => {
    if (result.confirm) battery.records = battery.records.filter(r => r.id !== record.id);
  } });
}
</script>

<style scoped lang="scss">
.battery-list-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

button.delete-battery-button {
  color: #cf5d58;
  background: #fff;
  border-color: #edc5c2;
}

.battery-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 0 14px 14px;
  gap: 14px;
  background: #eef4f8;
  color: #24445f;
  font-size: 14px;
  overflow: auto;
}

.panel {
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  flex-shrink: 0;
}

.filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 8px;
}

.filter > text {
  white-space: nowrap;
}

input,
.select {
  box-sizing: border-box;
  height: 36px;
  border: 1px solid #d8e3ed;
  border-radius: 4px;
  background: #fff;
  padding: 0 12px;
  font-size: 14px;
}

.filter input {
  width: 220px;
}

.select {
  display: flex;
  align-items: center;
  min-width: 150px;
  cursor: pointer;
}

button {
  margin: 0;
  padding: 0 18px;
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

button[disabled] {
  opacity: .45;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 1fr);
  flex: 1;
  min-height: 0;
  gap: 14px;
}

.heading {
  min-height: 56px;
  box-sizing: border-box;
  padding: 12px 20px;
  border-bottom: 1px solid #e4edf4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.muted {
  color: #8798a8;
  font-weight: 400;
}

.small {
  font-size: 12px;
  font-weight: 400;
}

.bold {
  font-weight: 600;
}

.list-panel,
.records-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-scroll,
.records-scroll {
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.table {
  min-width: 820px;
}

.row {
  display: grid;
  width: 100%;
  min-height: 42px;
  grid-template-columns: 54px 1fr 1fr .8fr 1fr 1.2fr 1fr 1fr;
  border-bottom: 1px solid #edf1f5;
  transition: background .18s ease, box-shadow .18s ease;
}

.row > text,
.row > view {
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

.row > :last-child {
  border-right: 0;
}

.row > :first-child {
  color: #64748b;
}

.row .bold {
  font-weight: 400;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-header > text {
  color: #415a73;
  font-size: 12px;
}

.data-row {
  cursor: pointer;
}

.data-row:nth-child(odd) {
  background: #fff;
}

.data-row:nth-child(even) {
  background: #fbfdff;
}

.data-row:hover {
  background: #edf7ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.data-row.active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.data-row.active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: '';
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.health-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.track {
  height: 10px;
  background: #eaf0f5;
  border-radius: 8px;
  overflow: hidden;
}

.track > view {
  height: 100%;
  border-radius: inherit;
  transition: width .2s;
}

.track.mini {
  width: 42px;
  height: 6px;
}

.track > .success {
  background: #30ad88;
}

.track > .warning {
  background: #e5a43b;
}

.track > .danger {
  background: #e06b69;
}

.badge {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
}

.success {
  color: #219776;
  background: #eaf7f1;
}

.warning {
  color: #b58023;
  background: #fff6e6;
}

.danger {
  color: #cf5d58;
  background: #fff0ee;
}

.neutral {
  color: #8798a8;
  background: #f1f4f7;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow: auto;
}

.summary {
  flex-shrink: 0;
}

.summary-body {
  padding: 20px;
}

.battery-title {
  font-size: 17px;
  font-weight: 600;
}

.battery-title .muted {
  font-size: 14px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 0 10px;
}

.large {
  font-size: 26px;
  font-weight: 600;
}

.advice {
  margin-top: 18px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.note {
  display: block;
  margin-top: 10px;
  color: #93a1ae;
  font-size: 12px;
  line-height: 1.6;
}

.records-panel {
  flex: 1;
  min-height: 240px;
}

.record {
  padding: 18px 20px;
  border-bottom: 1px solid #e4edf4;
}

.record-title {
  display: flex;
  gap: 18px;
  font-weight: 600;
}

.record-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
  color: #8798a8;
  font-size: 13px;
}

.record-grid > text:last-child {
  grid-column: 1 / -1;
}

.value {
  color: #24445f;
  margin-left: 8px;
}

.record-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 10px;
}

button.link {
  border: 0;
  background: transparent;
  color: #2878d0;
  padding: 0;
  height: 28px;
  line-height: 28px;
}

button.danger-text {
  color: #cf5d58;
}

.empty {
  padding: 48px 20px;
  color: #93a1ae;
  text-align: center;
  line-height: 1.8;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(22, 43, 65, .4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dialog {
  width: 560px;
  max-width: 100%;
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 16px 60px #18334c33;
}

.form {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field input {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.error {
  display: block;
  color: #cf5d58;
  margin-top: 16px;
}

@media (max-width: 800px) {
  .layout {
    display: flex;
    flex-direction: column;
    flex: none;
  }

  .list-panel {
    min-height: 300px;
  }

  .right-column {
    overflow: visible;
  }

  .records-scroll {
    max-height: 450px;
  }

  .filter input {
    width: 180px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

.toolbar-panel {
  flex: none;
  display: flex;
  padding: 14px;
  margin-bottom: 0;
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

.required::before {
  content: '*';
  color: #e05b55;
  margin-right: 4px;
}

.remark-field {
  grid-column: 1 / -1;
}

.remark-field textarea {
  box-sizing: border-box;
  width: 100%;
  height: 90px;
  padding: 10px 12px;
  border: 1px solid #d8e3ed;
  border-radius: 4px;
  font-size: 14px;
}

.record-remark {
  margin-top: 12px;
  color: #8798a8;
  font-size: 13px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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

.statistics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #d8e5ef;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(33, 72, 108, .06);
  transition: transform .18s ease, box-shadow .18s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(33, 72, 108, .1);
}

.stat-card.stat-healthy {
  border-left-color: #22c55e;
}

.stat-card.stat-warning {
  border-left-color: #f59e0b;
}

.stat-card.stat-danger {
  border-left-color: #ef4444;
}

.stat-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .3px;
}

.stat-value {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  font-family: "DIN Alternate", "Arial", sans-serif;
  line-height: 1.2;
}

.summary .heading {
  min-height: 44px;
  padding: 8px 16px;
}

.summary-body {
  padding: 12px 16px;
}

.battery-title {
  font-size: 15px;
}

.summary .metric {
  margin: 10px 0 6px;
}

.summary .large {
  font-size: 22px;
}

.summary .track {
  height: 8px;
}

.prediction-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.prediction-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  font-size: 13px;
}

.prediction-item + .prediction-item {
  border-left: 1px solid #e4edf4;
  padding-left: 12px;
}

.replacement-date {
  font-size: 16px;
  line-height: 26px;
  font-weight: 600;
  white-space: nowrap;
}

.summary .advice {
  margin-top: 10px;
  padding: 8px 10px;
}

.summary .note {
  margin-top: 6px;
}

@media (max-width: 600px) {
  .statistics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
}
</style>
