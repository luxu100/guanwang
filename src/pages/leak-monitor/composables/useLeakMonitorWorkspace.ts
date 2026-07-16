import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  fetchLeakMonitorDailyAudio,
  fetchLeakMonitorDeviceInfo,
  fetchLeakMonitorDevices,
  fetchLeakMonitorLatestAudio,
  fetchLeakMonitorMaintenance,
  fetchLeakMonitorSidebar,
  fetchLeakMonitorTrend,
  fetchLeakMonitorWav,
} from "@/services/leak-monitor/device-query";
import { analyzeWavArrayBuffer } from "../audioAnalysis";
import type {
  DateRangeValue,
  DeviceDetailState,
  LeakMonitorDevice,
  LeakMonitorFilters,
  LeakMonitorMetric,
  MapDevicePoint,
  PageState,
} from "../types";

function emptyDetail(): DeviceDetailState {
  return {
    info: {},
    latestAudio: null,
    audioUrl: "",
    audioAnalysis: null,
    trend: [],
    dailyAudio: [],
    maintenance: [],
    analysisLoading: false,
    historyLoading: false,
    maintenanceLoading: false,
    errorMessage: "",
  };
}

function formatRate(value: unknown) {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
}

function readCount(source: Record<string, unknown>, key: string) {
  const counts = source.leakStatusCounts;
  if (!counts || typeof counts !== "object") return 0;
  const value = (counts as Record<string, unknown>)[key];
  return Number(value ?? 0) || 0;
}

function toIsoRange(range: DateRangeValue) {
  return {
    startTime: new Date(range.start + "T00:00:00").toISOString(),
    endTime: new Date(range.end + "T23:59:59.999").toISOString(),
  };
}

function revokeAudioUrl(detail: DeviceDetailState) {
  if (detail.audioUrl && typeof URL !== "undefined") {
    URL.revokeObjectURL(detail.audioUrl);
  }
  detail.audioUrl = "";
}

export function createRecentDateRange(days: number): DateRangeValue {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(0, days - 1));
  const format = (date: Date) => {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
  };
  return { start: format(start), end: format(end) };
}

export function useLeakMonitorWorkspace() {
  const loading = ref(false);
  const sidebarLoading = ref(false);
  const detailLoading = ref(false);
  const errorMessage = ref("");
  const sidebarCollapsed = ref(false);
  const detailVisible = ref(false);
  const selectedDevice = ref<LeakMonitorDevice | null>(null);
  const detail = ref<DeviceDetailState>(emptyDetail());
  const filters = reactive<LeakMonitorFilters>({
    deviceNumber: "",
    deviceType: "",
    onlineStatus: "",
    leakStatus: "",
    todayNew: "",
    latestInstalled: "",
  });
  const page = reactive<PageState>({ current: 1, size: 10, total: 0 });
  const devices = ref<LeakMonitorDevice[]>([]);
  const mapDevices = ref<LeakMonitorDevice[]>([]);
  const sidebarData = ref<Record<string, unknown>>({});
  const onlineRate = ref<number | string>("--");
  const communicationRate = ref<number | string>("--");
  let listRequestId = 0;
  let sidebarRequestId = 0;
  let detailRequestId = 0;

  const metrics = computed<LeakMonitorMetric[]>(() => [
    { key: "communication", label: "通讯成功率", value: formatRate(communicationRate.value), suffix: "%", tone: "success" },
    { key: "online", label: "设备上线率", value: formatRate(onlineRate.value), suffix: "%", tone: "primary" },
    { key: "normal", label: "正常", value: readCount(sidebarData.value, "normalCount"), tone: "success" },
    { key: "suspect", label: "疑似", value: readCount(sidebarData.value, "suspectedCount"), tone: "warning" },
    { key: "leak", label: "渗漏", value: readCount(sidebarData.value, "leakCount"), tone: "danger" },
    { key: "unknown", label: "未知", value: readCount(sidebarData.value, "unknownCount"), tone: "muted" },
  ]);

  const mapPoints = computed<MapDevicePoint[]>(() =>
    mapDevices.value
      .filter((device) => typeof device.lat === "number" && typeof device.lng === "number")
      .map((device) => ({
        id: device.id,
        deviceNumber: device.deviceNumber,
        title: device.model || device.deviceNumber,
        status: device.status,
        leakProperty: device.leakProperty,
        lat: device.lat as number,
        lng: device.lng as number,
      })),
  );

  async function refreshSidebar() {
    const requestId = ++sidebarRequestId;
    sidebarLoading.value = true;
    try {
      const result = await fetchLeakMonitorSidebar();
      if (requestId !== sidebarRequestId) return;
      sidebarData.value = result.data;
      mapDevices.value = result.devices;
      onlineRate.value = result.onlineRate;
      communicationRate.value = result.communicationRate;
    } catch (error) {
      if (requestId === sidebarRequestId) console.error(error);
    } finally {
      if (requestId === sidebarRequestId) sidebarLoading.value = false;
    }
  }

  async function refreshDevices(resetPage = false, targetPage = page.current) {
    const requestId = ++listRequestId;
    const requestedPage = resetPage ? 1 : targetPage;
    loading.value = true;
    errorMessage.value = "";

    try {
      const result = await fetchLeakMonitorDevices(filters, {
        current: requestedPage,
        size: page.size,
      });
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
      if (requestId === listRequestId) loading.value = false;
    }
  }

  async function refreshAll(resetPage = false) {
    await Promise.all([refreshSidebar(), refreshDevices(resetPage)]);
  }

  async function refreshDeviceAnalysis(range: DateRangeValue) {
    const device = selectedDevice.value;
    if (!device) return;
    const requestId = detailRequestId;
    detail.value.analysisLoading = true;
    detail.value.errorMessage = "";
    const isoRange = toIsoRange(range);

    try {
      const [latestAudio, trend] = await Promise.all([
        fetchLeakMonitorLatestAudio(device.deviceNumber, isoRange.startTime, isoRange.endTime),
        fetchLeakMonitorTrend(device.deviceNumber, range.start, range.end),
      ]);
      if (requestId !== detailRequestId) return;

      revokeAudioUrl(detail.value);
      detail.value.latestAudio = latestAudio;
      detail.value.trend = trend;
      detail.value.audioAnalysis = null;

      if (latestAudio?.audioId) {
        const wav = await fetchLeakMonitorWav(latestAudio.audioId);
        if (requestId !== detailRequestId) return;
        detail.value.audioAnalysis = await analyzeWavArrayBuffer(wav);
        if (typeof URL !== "undefined" && typeof Blob !== "undefined") {
          detail.value.audioUrl = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
        }
      }
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.errorMessage = error?.msg || error?.message || "音频分析数据加载失败";
      }
    } finally {
      if (requestId === detailRequestId) detail.value.analysisLoading = false;
    }
  }

  async function loadHistory(range: DateRangeValue) {
    const device = selectedDevice.value;
    if (!device) return;
    const requestId = detailRequestId;
    detail.value.historyLoading = true;

    try {
      const [trend, dailyRecords] = await Promise.all([
        fetchLeakMonitorTrend(device.deviceNumber, range.start, range.end),
        fetchLeakMonitorDailyAudio(device.deviceNumber, range.start, range.end),
      ]);
      const dailyAudio = await Promise.all(
        dailyRecords.slice(-14).map(async (record) => {
          const wav = await fetchLeakMonitorWav(record.audioId);
          const analysis = await analyzeWavArrayBuffer(wav);
          return { ...record, spectrum: analysis.spectrum };
        }),
      );
      if (requestId !== detailRequestId) return;
      detail.value.trend = trend;
      detail.value.dailyAudio = dailyAudio;
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.errorMessage = error?.msg || error?.message || "历史音频加载失败";
      }
    } finally {
      if (requestId === detailRequestId) detail.value.historyLoading = false;
    }
  }

  async function loadMaintenance(device: LeakMonitorDevice, requestId: number) {
    detail.value.maintenanceLoading = true;
    try {
      const records = await fetchLeakMonitorMaintenance(device.deviceNumber);
      if (requestId === detailRequestId) detail.value.maintenance = records;
    } catch (error) {
      if (requestId === detailRequestId) console.error(error);
    } finally {
      if (requestId === detailRequestId) detail.value.maintenanceLoading = false;
    }
  }

  async function openDevice(device: LeakMonitorDevice | MapDevicePoint) {
    const sourceDevice = "raw" in device
      ? device
      : [...mapDevices.value, ...devices.value].find(
        (item) => item.deviceNumber === device.deviceNumber || item.id === device.id,
      );
    if (!sourceDevice) return;

    const requestId = ++detailRequestId;
    revokeAudioUrl(detail.value);
    selectedDevice.value = sourceDevice;
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = { ...emptyDetail(), info: sourceDevice.raw };

    void loadMaintenance(sourceDevice, requestId);
    void refreshDeviceAnalysis(createRecentDateRange(3));

    try {
      const info = await fetchLeakMonitorDeviceInfo(sourceDevice);
      if (requestId === detailRequestId) detail.value.info = info;
    } catch (error) {
      if (requestId === detailRequestId) console.error(error);
    } finally {
      if (requestId === detailRequestId) detailLoading.value = false;
    }
  }

  async function downloadLatestAudio() {
    const audioId = detail.value.latestAudio?.audioId;
    if (!audioId) return;
    try {
      const wav = await fetchLeakMonitorWav(audioId);
      const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedDevice.value?.deviceNumber + "_" + audioId + ".wav";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error: any) {
      detail.value.errorMessage = error?.msg || error?.message || "音频下载失败";
    }
  }

  function closeDetail() {
    detailRequestId += 1;
    detailVisible.value = false;
    revokeAudioUrl(detail.value);
  }

  function updatePage(nextPage: number) {
    if (loading.value) return;
    const totalPages = Math.max(1, Math.ceil(page.total / page.size));
    const requestedPage = Math.min(totalPages, Math.max(1, nextPage));
    if (requestedPage !== page.current) void refreshDevices(false, requestedPage);
  }

  function resetFilters() {
    Object.assign(filters, {
      deviceNumber: "",
      deviceType: "",
      onlineStatus: "",
      leakStatus: "",
      todayNew: "",
      latestInstalled: "",
    } satisfies LeakMonitorFilters);
    void refreshAll(true);
  }

  onMounted(() => void refreshAll(true));
  onBeforeUnmount(() => revokeAudioUrl(detail.value));

  return {
    loading,
    sidebarLoading,
    detailLoading,
    errorMessage,
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
    downloadLatestAudio,
    loadHistory,
    openDevice,
    refreshAll,
    refreshDeviceAnalysis,
    resetFilters,
    updatePage,
  };
}