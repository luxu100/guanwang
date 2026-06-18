<template>
  <AppShell>
    <WorkOrderCreateView />
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
<<<<<<< HEAD
import WorkOrderCreateView from "@/pages/work-order/components/WorkOrderCreateView.vue";
=======
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { createWorksheet } from "@/services/work-order/create";

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
}

interface SelectOption {
  label: string;
  value: number;
}

interface CreateForm {
  worksheetNumber: string;
  worksheetType: number;
  riseAccount: string;
  executeAccount: string;
  deviceReference: string;
  urgencyLevel: number;
  riseTime: string;
  finishTime: string;
  deadlineTime: string;
  worksheetStatus: number;
  worksheetFeedback: string;
  worksheetInstruction: string;
  remark: string;
  address: string;
  coordinate: string;
  pictureIds: string;
  leakageId: string;
}

const worksheetTypeOptions: SelectOption[] = [
  { label: "巡检", value: 0 },
  { label: "检漏", value: 1 },
  { label: "拆装", value: 2 },
  { label: "维护", value: 3 },
];

const worksheetStatusOptions: SelectOption[] = [
  { label: "待处理", value: 0 },
  { label: "处理中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已取消", value: 3 },
];

const urgencyOptions: SelectOption[] = [
  { label: "一般", value: 0 },
  { label: "紧急", value: 1 },
];

const tableViewRef = ref<InstanceType<typeof WorksheetTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const createForm = reactive<CreateForm>(getDefaultCreateForm());

const currentTypeLabel = computed(() => getOptionLabel(worksheetTypeOptions, createForm.worksheetType, "巡检"));
const currentStatusLabel = computed(() => getOptionLabel(worksheetStatusOptions, createForm.worksheetStatus, "待处理"));
const currentUrgencyLabel = computed(() => getOptionLabel(urgencyOptions, createForm.urgencyLevel, "一般"));

function getDefaultCreateForm(): CreateForm {
  return {
    worksheetNumber: "",
    worksheetType: getDefaultOptionValue(worksheetTypeOptions),
    riseAccount: "",
    executeAccount: "",
    deviceReference: "",
    urgencyLevel: getDefaultOptionValue(urgencyOptions),
    riseTime: toDatetimeLocal(new Date()),
    finishTime: "",
    deadlineTime: "",
    worksheetStatus: getDefaultOptionValue(worksheetStatusOptions),
    worksheetFeedback: "",
    worksheetInstruction: "",
    remark: "",
    address: "",
    coordinate: "",
    pictureIds: "",
    leakageId: "",
  };
}

function openCreateDialog() {
  Object.assign(createForm, getDefaultCreateForm());
  dialogVisible.value = true;
}

function closeCreateDialog() {
  if (submitting.value) {
    return;
  }

  dialogVisible.value = false;
}

function resetCreateForm() {
  Object.assign(createForm, getDefaultCreateForm());
}

function handleTypeChange(event: { detail: { value: number } }) {
  createForm.worksheetType = worksheetTypeOptions[event.detail.value]?.value ?? getDefaultOptionValue(worksheetTypeOptions);
}

function handleStatusChange(event: { detail: { value: number } }) {
  createForm.worksheetStatus = worksheetStatusOptions[event.detail.value]?.value ?? getDefaultOptionValue(worksheetStatusOptions);
}

function handleUrgencyChange(event: { detail: { value: number } }) {
  createForm.urgencyLevel = urgencyOptions[event.detail.value]?.value ?? getDefaultOptionValue(urgencyOptions);
}

async function submitCreate() {
  if (!validateCreateForm()) {
    return;
  }

  submitting.value = true;

  try {
    const response = await createWorksheet(buildCreatePayload()) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "工单创建成功", icon: "success" });
    dialogVisible.value = false;
    resetCreateForm();
    await tableViewRef.value?.resetFiltersAndFetch();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "工单创建失败",
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
}

function validateCreateForm() {
  if (!createForm.riseAccount.trim()) {
    uni.showToast({ title: "请输入发起人账号", icon: "none" });
    return false;
  }

  if (!createForm.executeAccount.trim()) {
    uni.showToast({ title: "请输入执行人账号", icon: "none" });
    return false;
  }

  if (!createForm.worksheetInstruction.trim()) {
    uni.showToast({ title: "请输入工单说明", icon: "none" });
    return false;
  }

  if (createForm.deadlineTime && !isDeadlineAfterRiseTime()) {
    uni.showToast({ title: "截止时间必须大于发起时间", icon: "none" });
    return false;
  }

  return true;
}

function buildCreatePayload() {
  return removeEmptyFields({
    worksheetNumber: createForm.worksheetNumber.trim() || generateWorksheetNumber(),
    worksheetType: createForm.worksheetType,
    riseAccount: createForm.riseAccount.trim(),
    executeAccount: createForm.executeAccount.trim(),
    deviceReference: createForm.deviceReference.trim(),
    urgencyLevel: createForm.urgencyLevel,
    riseTime: normalizeDatetimeForApi(createForm.riseTime),
    finishTime: normalizeDatetimeForApi(createForm.finishTime),
    deadlineTime: normalizeDatetimeForApi(createForm.deadlineTime),
    worksheetStatus: createForm.worksheetStatus,
    worksheetFeedback: createForm.worksheetFeedback.trim(),
    worksheetInstruction: createForm.worksheetInstruction.trim(),
    remark: createForm.remark.trim(),
    address: createForm.address.trim(),
    coordinate: createForm.coordinate.trim(),
    pictureIds: createForm.pictureIds.trim(),
    leakageId: createForm.leakageId ? Number(createForm.leakageId) : undefined,
  });
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }

  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

function getDefaultOptionValue(options: SelectOption[]) {
  return options[0]?.value ?? 0;
}

function getOptionLabel(options: SelectOption[], value: number, fallback: string) {
  return options.find((item) => item.value === value)?.label || fallback;
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeDisplayDatetime(value);
  return normalizedValue.includes("T") ? `${normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue}` : normalizedValue;
}

function normalizeDisplayDatetime(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.replace(/\s+/, "T");
}

function isDeadlineAfterRiseTime() {
  const riseTimestamp = getDatetimeTimestamp(createForm.riseTime);
  const deadlineTimestamp = getDatetimeTimestamp(createForm.deadlineTime);
  return riseTimestamp !== undefined && deadlineTimestamp !== undefined && deadlineTimestamp > riseTimestamp;
}

function getDatetimeTimestamp(value: string) {
  const normalizedValue = normalizeDatetimeForApi(value);
  if (!normalizedValue) {
    return undefined;
  }

  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function toDatetimeLocal(value: Date) {
  return `${toDatePart(value)}T${padNumber(value.getHours())}:${padNumber(value.getMinutes())}:${padNumber(value.getSeconds())}`;
}

function toDatePart(value: Date) {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`;
}

function padNumber(number: number) {
  return String(number).padStart(2, "0");
}

function generateWorksheetNumber() {
  const now = new Date();
  return `WO${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`;
}
>>>>>>> 3e78c87e70c970ce43e8305dedf1076e83636ff9
</script>
