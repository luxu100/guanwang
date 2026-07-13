import { computed, onMounted, reactive, ref } from "vue";
import {
  fetchLeakMonitorDeviceDetail,
  fetchLeakMonitorDevices,
  fetchLeakMonitorSidebar,
} from "@/services/leak-monitor/device-query";
import type {
  DeviceDetailState,
  LeakDeviceSource,
  LeakMonitorDevice,
  LeakMonitorFilters,
  LeakMonitorMetric,
  MapDevicePoint,
  PageState,
} from "../types";

function toMetricValue(value: unknown, fallback: number | string = "--") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value as number | string;
}

function readCount(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return Number(value) || 0;
    }
  }

  return 0;
}

export function useLeakMonitorWorkspace() {
  const loading = ref(false);
  const sidebarLoading = ref(false);
  const detailLoading = ref(false);
  const errorMessage = ref("");
  const source = ref<LeakDeviceSource>("device-info");
  const sidebarCollapsed = ref(false);
  const detailVisible = ref(false);
  const selectedDevice = ref<LeakMonitorDevice | null>(null);
  const detail = ref<DeviceDetailState>({});
  const filters = reactive<LeakMonitorFilters>({
    leakLocatePeriod: "1周",
    deviceStatus: "",
    todayNew: "",
    latestInstall: "",
    deviceModel: "",
    keyword: "",
  });
  const page = reactive<PageState>({
    current: 1,
    size: 10,
    total: 0,
  });
  const devices = ref<LeakMonitorDevice[]>([]);
  const sidebarData = ref<Record<string, unknown>>({});
  const onlineRate = ref<number | string>("--");
  const tcpOnlineRate = ref<number | string>("--");
  const communicationRate = ref<number | string>("--");
  let listRequestId = 0;
  let sidebarRequestId = 0;
  let detailRequestId = 0;

  const metrics = computed<LeakMonitorMetric[]>(() => [
    { key: "communication", label: "通讯成功率", value: toMetricValue(communicationRate.value), suffix: "%", tone: "success" },
    { key: "audioOnline", label: "音频上线率", value: toMetricValue(onlineRate.value), suffix: "%", tone: "primary" },
    { key: "normal", label: "正常", value: readCount(sidebarData.value, ["normal", "normalCount", "normalNum"]), tone: "success" },
    { key: "suspect", label: "疑似", value: readCount(sidebarData.value, ["suspect", "suspected", "suspectCount"]), tone: "warning" },
    { key: "leak", label: "渗漏", value: readCount(sidebarData.value, ["leak", "leakage", "leakCount"]), tone: "danger" },
    { key: "unread", label: "未抄", value: readCount(sidebarData.value, ["unread", "notRead", "unreadCount"]), tone: "muted" },
    { key: "newInstall", label: "新装", value: readCount(sidebarData.value, ["newInstall", "install", "newInstallCount"]), tone: "primary" },
    { key: "focus", label: "关注点", value: readCount(sidebarData.value, ["focus", "attention", "focusCount"]), tone: "primary" },
  ]);

  const mapPoints = computed<MapDevicePoint[]>(() =>
    devices.value
      .filter((device) => typeof device.lat === "number" && typeof device.lng === "number")
      .map((device) => ({
        id: device.id,
        deviceNumber: device.deviceNumber,
        title: device.name || device.deviceNumber,
        status: device.status,
        lat: device.lat as number,
        lng: device.lng as number,
      })),
  );

  async function refreshSidebar() {
    const requestId = ++sidebarRequestId;
    sidebarLoading.value = true;

    try {
      const result = await fetchLeakMonitorSidebar(filters);
      if (requestId !== sidebarRequestId) return;
      sidebarData.value = result.sidebar;
      onlineRate.value = result.onlineRate;
      tcpOnlineRate.value = result.tcpOnlineRate;
      communicationRate.value = result.communicationRate;
    } catch (error) {
      if (requestId === sidebarRequestId) {
        console.error(error);
      }
    } finally {
      if (requestId === sidebarRequestId) {
        sidebarLoading.value = false;
      }
    }
  }

  async function refreshDevices(resetPage = false, targetPage = page.current) {
    const requestId = ++listRequestId;
    const requestedPage = resetPage ? 1 : targetPage;
    loading.value = true;
    errorMessage.value = "";

    try {
      const result = await fetchLeakMonitorDevices(
        filters,
        { current: requestedPage, size: page.size },
        source.value,
      );
      if (requestId !== listRequestId) return;
      devices.value = result.records;
      page.current = requestedPage;
      page.total = result.total;
    } catch (error: any) {
      if (requestId !== listRequestId) return;
      devices.value = [];
      page.total = 0;
      errorMessage.value = error?.msg || "设备列表加载失败";
    } finally {
      if (requestId === listRequestId) {
        loading.value = false;
      }
    }
  }

  async function refreshAll(resetPage = false) {
    await Promise.all([refreshSidebar(), refreshDevices(resetPage)]);
  }

  async function openDevice(device: LeakMonitorDevice | MapDevicePoint) {
    const sourceDevice = "raw" in device
      ? device
      : devices.value.find((item) => item.deviceNumber === device.deviceNumber || item.id === device.id);

    if (!sourceDevice) {
      return;
    }

    const requestId = ++detailRequestId;
    selectedDevice.value = sourceDevice;
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = {};

    try {
      const result = await fetchLeakMonitorDeviceDetail(sourceDevice);
      if (requestId !== detailRequestId) return;
      detail.value = result;
    } catch (error) {
      if (requestId === detailRequestId) {
        detail.value = { info: sourceDevice.raw };
        console.error(error);
      }
    } finally {
      if (requestId === detailRequestId) {
        detailLoading.value = false;
      }
    }
  }

  function closeDetail() {
    detailVisible.value = false;
  }

  function updatePage(nextPage: number) {
    if (loading.value) return;

    const totalPages = Math.max(1, Math.ceil(page.total / page.size));
    const requestedPage = Math.min(totalPages, Math.max(1, nextPage));
    if (requestedPage === page.current) return;

    refreshDevices(false, requestedPage);
  }

  function updatePageSize(nextSize: number) {
    page.size = nextSize;
    refreshDevices(true);
  }

  function updateSource(nextSource: LeakDeviceSource) {
    source.value = nextSource;
    refreshDevices(true);
  }

  function resetFilters() {
    filters.leakLocatePeriod = "1周";
    filters.deviceStatus = "";
    filters.todayNew = "";
    filters.latestInstall = "";
    filters.deviceModel = "";
    filters.keyword = "";
    refreshAll(true);
  }

  onMounted(() => {
    refreshAll(true);
  });

  return {
    loading,
    sidebarLoading,
    detailLoading,
    errorMessage,
    source,
    sidebarCollapsed,
    detailVisible,
    selectedDevice,
    detail,
    filters,
    page,
    devices,
    metrics,
    mapPoints,
    closeDetail,
    openDevice,
    refreshAll,
    refreshDevices,
    resetFilters,
    updatePage,
    updatePageSize,
    updateSource,
  };
}
