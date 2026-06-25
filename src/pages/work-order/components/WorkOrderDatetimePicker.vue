<template>
  <view class="datetime-picker">
    <view class="datetime-picker__control" :class="{ 'datetime-picker__control--empty': !displayValue, 'datetime-picker__control--disabled': disabled }" @click="openPanel">
      <text class="datetime-picker__icon" aria-hidden="true"></text>
      <text class="datetime-picker__value">{{ displayValue || placeholder }}</text>
    </view>

    <view v-if="panelVisible" class="datetime-panel-mask" @click="closePanel">
      <view class="datetime-panel" @click.stop>
        <view class="datetime-panel__tabs">
          <button class="datetime-panel__tab" :class="{ 'datetime-panel__tab--active': activeTab === 'date' }" @click="activeTab = 'date'">日期</button>
          <button class="datetime-panel__tab" :class="{ 'datetime-panel__tab--active': activeTab === 'time' }" @click="activeTab = 'time'">时间</button>
        </view>

        <view v-if="activeTab === 'date'" class="calendar-panel">
          <view class="calendar-panel__month">
            <button class="calendar-panel__arrow" hover-class="calendar-panel__arrow--hover" @click="changeMonth(-1)">‹</button>
            <text class="calendar-panel__title">{{ draft.year }}年{{ padNumber(draft.month) }}月</text>
            <button class="calendar-panel__arrow" hover-class="calendar-panel__arrow--hover" @click="changeMonth(1)">›</button>
          </view>

          <view class="calendar-panel__week">
            <text v-for="item in weekLabels" :key="item">{{ item }}</text>
          </view>

          <view class="calendar-panel__days">
            <button
              v-for="item in calendarDays"
              :key="item.key"
              class="calendar-panel__day"
              :class="{
                'calendar-panel__day--muted': !item.currentMonth,
                'calendar-panel__day--selected': item.selected,
                'calendar-panel__day--today': item.today,
              }"
              hover-class="calendar-panel__day--hover"
              @click="selectDate(item)"
            >
              <text>{{ item.day }}</text>
            </button>
          </view>
        </view>

        <view v-else class="time-panel">
          <text class="time-panel__title">选择时间</text>
          <view class="time-panel__columns">
            <view class="time-wheel">
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('hour', -1)">{{ padNumber(wrap(draft.hour - 1, 0, 23)) }}</button>
              <view class="time-wheel__item time-wheel__item--active">{{ padNumber(draft.hour) }}</view>
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('hour', 1)">{{ padNumber(wrap(draft.hour + 1, 0, 23)) }}</button>
            </view>
            <text class="time-panel__colon">:</text>
            <view class="time-wheel">
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('minute', -1)">{{ padNumber(wrap(draft.minute - 1, 0, 59)) }}</button>
              <view class="time-wheel__item time-wheel__item--active">{{ padNumber(draft.minute) }}</view>
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('minute', 1)">{{ padNumber(wrap(draft.minute + 1, 0, 59)) }}</button>
            </view>
            <text class="time-panel__colon">:</text>
            <view class="time-wheel">
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('second', -1)">{{ padNumber(wrap(draft.second - 1, 0, 59)) }}</button>
              <view class="time-wheel__item time-wheel__item--active">{{ padNumber(draft.second) }}</view>
              <button class="time-wheel__item time-wheel__item--muted" @click="adjustTime('second', 1)">{{ padNumber(wrap(draft.second + 1, 0, 59)) }}</button>
            </view>
          </view>
        </view>

        <view class="datetime-panel__actions">
          <button v-if="clearable" class="datetime-panel__button datetime-panel__button--link" hover-class="datetime-panel__button--hover" @click="clearValue">清除</button>
          <view class="datetime-panel__spacer"></view>
          <button class="datetime-panel__button" hover-class="datetime-panel__button--hover" @click="closePanel">取消</button>
          <button class="datetime-panel__button datetime-panel__button--primary" hover-class="datetime-panel__button--primary-hover" @click="confirmValue">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type TimeKey = "hour" | "minute" | "second";

interface CalendarDay {
  key: string;
  year: number;
  month: number;
  day: number;
  currentMonth: boolean;
  selected: boolean;
  today: boolean;
}

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  title?: string;
  minValue?: string;
  clearable?: boolean;
  disabled?: boolean;
}>(), {
  modelValue: "",
  placeholder: "请选择时间",
  title: "选择时间",
  minValue: "",
  clearable: true,
  disabled: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const weekLabels = ["日", "一", "二", "三", "四", "五", "六"];
const panelVisible = ref(false);
const activeTab = ref<"date" | "time">("date");
const draft = reactive({
  year: 2026,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
});

const displayValue = computed(() => formatDatetimeForDisplay(props.modelValue));
const calendarDays = computed(() => buildCalendarDays());

function openPanel() {
  if (props.disabled) {
    return;
  }

  setDraftFromValue(props.modelValue || toDatetimeValue(new Date()));
  activeTab.value = "date";
  panelVisible.value = true;
}

function closePanel() {
  panelVisible.value = false;
}

function changeMonth(step: number) {
  const nextDate = new Date(draft.year, draft.month - 1 + step, 1);
  draft.year = nextDate.getFullYear();
  draft.month = nextDate.getMonth() + 1;
  draft.day = Math.min(draft.day, getMaxDay());
}

function selectDate(item: CalendarDay) {
  draft.year = item.year;
  draft.month = item.month;
  draft.day = item.day;
  activeTab.value = "time";
}

function adjustTime(field: TimeKey, step: number) {
  const max = field === "hour" ? 23 : 59;
  draft[field] = wrap(draft[field] + step, 0, max);
}

function clearValue() {
  emit("update:modelValue", "");
  closePanel();
}

function confirmValue() {
  const nextValue = `${draft.year}-${padNumber(draft.month)}-${padNumber(draft.day)}T${padNumber(draft.hour)}:${padNumber(draft.minute)}:${padNumber(draft.second)}`;
  const minTimestamp = getTimestamp(props.minValue);
  const nextTimestamp = getTimestamp(nextValue);

  if (minTimestamp !== undefined && nextTimestamp !== undefined && nextTimestamp <= minTimestamp) {
    uni.showToast({ title: "截止时间必须大于发起时间", icon: "none" });
    return;
  }

  emit("update:modelValue", nextValue);
  closePanel();
}

function buildCalendarDays() {
  const today = new Date();
  const firstDate = new Date(draft.year, draft.month - 1, 1);
  const startDate = new Date(draft.year, draft.month - 1, 1 - firstDate.getDay());
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const itemDate = new Date(startDate);
    itemDate.setDate(startDate.getDate() + index);
    const year = itemDate.getFullYear();
    const month = itemDate.getMonth() + 1;
    const day = itemDate.getDate();

    days.push({
      key: `${year}-${month}-${day}`,
      year,
      month,
      day,
      currentMonth: month === draft.month,
      selected: year === draft.year && month === draft.month && day === draft.day,
      today: year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate(),
    });
  }

  return days;
}

function setDraftFromValue(value: string) {
  const normalizedValue = normalizeDatetime(value) || toDatetimeValue(new Date());
  const [datePart = "", timePart = ""] = normalizedValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  draft.year = Number.isFinite(year) ? year : new Date().getFullYear();
  draft.month = Number.isFinite(month) ? month : 1;
  draft.day = Number.isFinite(day) ? day : 1;
  draft.hour = Number.isFinite(hour) ? hour : 0;
  draft.minute = Number.isFinite(minute) ? minute : 0;
  draft.second = Number.isFinite(second) ? second : 0;
  draft.day = Math.min(draft.day, getMaxDay());
}

function getMaxDay() {
  return new Date(draft.year, draft.month, 0).getDate();
}

function formatDatetimeForDisplay(value: string) {
  const normalizedValue = normalizeDatetime(value);
  return normalizedValue ? normalizedValue.replace("T", " ") : "";
}

function normalizeDatetime(value: string | undefined) {
  const trimmedValue = value?.trim() || "";
  if (!trimmedValue) {
    return "";
  }

  const normalizedValue = trimmedValue.replace(/\s+/, "T");
  return normalizedValue.includes("T") && normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
}

function toDatetimeValue(value: Date) {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}T${padNumber(value.getHours())}:${padNumber(value.getMinutes())}:${padNumber(value.getSeconds())}`;
}

function getTimestamp(value: string | undefined) {
  const normalizedValue = normalizeDatetime(value);
  if (!normalizedValue) {
    return undefined;
  }

  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function wrap(value: number, min: number, max: number) {
  if (value > max) {
    return min;
  }

  if (value < min) {
    return max;
  }

  return value;
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}
</script>

<style scoped lang="scss">
.datetime-picker {
  position: relative;
}

.datetime-picker__control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  line-height: 38px;
  cursor: pointer;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.datetime-picker__control--empty {
  color: #7f8fa3;
}

.datetime-picker__control--disabled {
  color: #a8b4c2;
  cursor: not-allowed;
  background: #f1f5f9;
  border-color: #d8e1ea;
}

.datetime-picker__value {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datetime-picker__icon {
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: 17px;
  height: 17px;
  border: 2px solid currentColor;
  border-radius: 4px;
}

.datetime-picker__icon::before,
.datetime-picker__icon::after {
  position: absolute;
  content: "";
}

.datetime-picker__icon::before {
  top: -5px;
  left: 3px;
  width: 7px;
  height: 6px;
  border-right: 2px solid currentColor;
  border-left: 2px solid currentColor;
}

.datetime-picker__icon::after {
  top: 4px;
  left: 0;
  width: 13px;
  height: 0;
  border-top: 2px solid currentColor;
  transform: none;
}

.datetime-panel-mask {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.datetime-panel {
  width: min(420px, calc(100vw - 24px));
  overflow: hidden;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 18px 42px rgba(15, 35, 55, 0.2);
}

.datetime-panel__tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 48px;
  border-bottom: 1px solid #f0f0f0;
}

.datetime-panel__tab {
  height: 48px;
  margin: 0;
  padding: 0;
  color: #8a8a8a;
  font-size: 16px;
  font-weight: 500;
  line-height: 48px;
  background: #ffffff;
  border: 0;
  border-radius: 0;
}

.datetime-panel__tab::after,
.calendar-panel__arrow::after,
.calendar-panel__day::after,
.time-wheel__item::after,
.datetime-panel__button::after {
  border: 0;
}

.datetime-panel__tab--active {
  color: #172033;
}

.calendar-panel {
  padding-top: 16px;
}

.calendar-panel__month {
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  padding: 0 52px;
}

.calendar-panel__title {
  color: #666666;
  font-size: 20px;
  line-height: 34px;
  text-align: center;
}

.calendar-panel__arrow {
  width: 34px;
  height: 34px;
  margin: 0 auto;
  padding: 0;
  color: #777777;
  font-size: 30px;
  font-weight: 300;
  line-height: 30px;
  background: #ffffff;
  border: 0;
  border-radius: 50%;
}

.calendar-panel__arrow--hover {
  color: #1677ff;
  background: #f2f7ff;
}

.calendar-panel__week,
.calendar-panel__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-panel__week {
  margin-top: 16px;
  padding: 0 22px 12px;
  color: #a7a7a7;
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid #f4f4f4;
}

.calendar-panel__days {
  padding: 14px 18px 16px;
  row-gap: 8px;
}

.calendar-panel__day {
  position: relative;
  width: 34px;
  height: 34px;
  margin: 0 auto;
  padding: 0;
  color: #082b64;
  font-size: 17px;
  font-weight: 800;
  line-height: 34px;
  background: #ffffff;
  border: 0;
  border-radius: 50%;
}

.calendar-panel__day--hover {
  background: #edf5ff;
}

.calendar-panel__day--muted {
  color: #cfcfcf;
}

.calendar-panel__day--selected {
  color: #ffffff;
  background: #1677ff;
}

.calendar-panel__day--today::after {
  position: absolute;
  top: 4px;
  right: 1px;
  width: 7px;
  height: 7px;
  content: "";
  background: #e35151;
  border-radius: 50%;
}

.calendar-panel__day--selected::after {
  background: #ffffff;
}

.time-panel {
  min-height: 286px;
  padding: 42px 44px 0;
}

.time-panel__title {
  display: block;
  color: #172033;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
}

.time-panel__columns {
  display: grid;
  grid-template-columns: 1fr 18px 1fr 18px 1fr;
  align-items: center;
  margin-top: 54px;
}

.time-wheel {
  display: grid;
  grid-template-rows: repeat(3, 42px);
  align-items: center;
}

.time-wheel__item {
  height: 42px;
  margin: 0;
  padding: 0;
  color: #333333;
  font-size: 18px;
  line-height: 42px;
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.time-wheel__item--active {
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.time-wheel__item--muted {
  color: #d5d5d5;
}

.time-panel__colon {
  color: #9a9a9a;
  font-size: 20px;
  text-align: center;
}

.datetime-panel__actions {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 52px;
  padding: 0 20px 14px;
}

.datetime-panel__spacer {
  flex: 1;
}

.datetime-panel__button {
  min-width: 44px;
  height: 34px;
  margin: 0;
  padding: 0;
  color: #1677ff;
  font-size: 16px;
  line-height: 34px;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.datetime-panel__button--hover {
  background: #edf5ff;
}

.datetime-panel__button--primary {
  font-weight: 500;
}

.datetime-panel__button--primary-hover {
  background: #edf5ff;
}

@media (max-width: 640px) {
  .datetime-panel__tab {
    font-size: 15px;
  }

  .calendar-panel__month {
    padding: 0 28px;
  }

  .calendar-panel__title {
    font-size: 18px;
  }

  .calendar-panel__week {
    font-size: 15px;
  }

  .calendar-panel__day {
    width: 32px;
    height: 32px;
    font-size: 16px;
    line-height: 32px;
  }

  .time-panel {
    padding-right: 28px;
    padding-left: 28px;
  }
}
</style>
