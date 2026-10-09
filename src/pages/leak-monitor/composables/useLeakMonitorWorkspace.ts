import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { Ref } from "vue";
import { useI18n } from "@/i18n";
import {
  fetchLeakMonitorDailyAudio,
  fetchLeakMonitorDeviceInfo,
  fetchLeakMonitorDevices,
  fetchLeakMonitorLatestAudio,
  fetchLeakMonitorMapData,
  fetchLeakMonitorMaintenance,
  fetchLeakMonitorManualAnalysis,
  fetchLeakMonitorSidebar,
  fetchLeakMonitorTrend,
  fetchLeakMonitorWav,
  createLeakMonitorManualWorkOrder,
  submitLeakMonitorManualAnalysis,
} from "@/services/leak-monitor/device-query";
import { analyzeWavArrayBuffer } from "../audioAnalysis";
import {
  fetchFormalTubeNetworks,
  type RejectedTubeRecord,
  type TubeNetworkRecord,
} from "@/services/leak-monitor/tube-network";
import {
  fetchFormalFacilities,
  type FormalFacilityLoadResult,
} from "@/services/leak-monitor/facility";
import { buildW84TubeRecords } from "../components/w84-gis-data";
import type {
  DateRangeValue,
  DeviceDetailState,
  LeakMonitorDevice,
  LeakMonitorFilters,
  LeakMonitorMetric,
  MapDevicePoint,
  MapRegion,
  ManualAnalysisPayload,
  ManualWorkOrderPayload,
  PageState,
  FacilityType,
  LeakMonitorFacility,
} from "../types";
import { useLeakMonitorI18n } from "../i18n";

function emptyDetail(): DeviceDetailState {
  return {
    info: {},
    latestAudio: null,
    audioUrl: "",
    audioAnalysis: null,
    trend: [],
    dailyAudio: [],
    maintenance: [],
    manualRecords: [],
    analysisLoading: false,
    historyLoading: false,
    maintenanceLoading: false,
    manualLoading: false,
    manualSubmitting: false,
    manualLoaded: false,
    analysisError: "",
    historyError: "",
    detailError: "",
    maintenanceError: "",
    manualError: "",
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

export function useLeakMonitorWorkspace(localized?: Readonly<Ref<boolean>>) {
  const { locale } = useI18n();
  const { t } = useLeakMonitorI18n(localized);
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
    manualAnalysis: "",
    algorithmAnalysisStatus: "",
    onlineStatus: "",
    leakStatus: "",
    deptId: "",
    todayNew: "",
    latestInstalled: "",
  });
  const page = reactive<PageState>({ current: 1, size: 10, total: 0 });
  const devices = ref<LeakMonitorDevice[]>([]);
  const sidebarDevices = ref<LeakMonitorDevice[]>([]);
  const mapDevices = ref<LeakMonitorDevice[]>([]);
  const mapRegions = ref<MapRegion[]>([]);
  const sidebarData = ref<Record<string, unknown>>({});
  const onlineRate = ref<number | string>("--");
  const communicationRate = ref<number | string>("--");
  // 正式管线（后端 /api/tube-network/list）：失败显式呈现，绝不回退本地演示 JSON
  const formalTubes = ref<TubeNetworkRecord[]>([]);
  const formalTubesRejected = ref<RejectedTubeRecord[]>([]);
  const formalTubesError = ref("");
  const formalTubesLoading = ref(false);
  const formalFacilities = ref<LeakMonitorFacility[]>([]);
  const formalFacilitiesRejected = ref<FormalFacilityLoadResult["rejected"]>([]);
  const formalFacilitiesError = ref("");
  const formalFacilitiesLoading = ref(false);
  // 当前先使用 W84 本地解析结果预览管线；正式接口状态保留，待后端字段稳定后恢复。
  const previewTubes = ref<TubeNetworkRecord[]>(buildW84TubeRecords());
  const previewFacilities = ref<LeakMonitorFacility[]>([]);
  const facilityVisibility = reactive<Record<FacilityType, boolean>>({
    VALVE: true,
    HYDRANT: true,
    PUMP: true,
  });
  let formalTubesRequestId = 0;
  let formalFacilitiesRequestId = 0;
  let listRequestId = 0;
  let sidebarRequestId = 0;
  let detailRequestId = 0;

  const metrics = computed<LeakMonitorMetric[]>(() => [
    // 通讯成功率、设备上线率、正常、疑似、渗漏、未知.
    { key: "communication", label: t("communicationRate"), value: formatRate(communicationRate.value), suffix: "%", tone: "success" },
    { key: "online", label: t("onlineRate"), value: formatRate(onlineRate.value), suffix: "%", tone: "primary" },
    { key: "normal", label: t("normal"), value: readCount(sidebarData.value, "normalCount"), tone: "success" },
    { key: "suspect", label: t("suspect"), value: readCount(sidebarData.value, "suspectedCount"), tone: "warning" },
    { key: "leak", label: t("leak"), value: readCount(sidebarData.value, "leakCount"), tone: "danger" },
    { key: "unknown", label: t("unknown"), value: readCount(sidebarData.value, "unknownCount"), tone: "muted" },
  ]);

  const mapPoints = computed<MapDevicePoint[]>(() => {
    const filteredDeviceNumbers = new Set(
      sidebarDevices.value.map((device) => device.deviceNumber),
    );

    return mapDevices.value
      .filter((device) => filteredDeviceNumbers.has(device.deviceNumber))
      .filter((device) =>
        typeof device.lat === "number" &&
        typeof device.lng === "number" &&
        Number.isFinite(device.lat) &&
        Number.isFinite(device.lng) &&
        device.lat >= -90 &&
        device.lat <= 90 &&
        device.lng >= -180 &&
        device.lng <= 180)
      .map((device) => {
        const monitorDevice = sidebarDevices.value.find((item) =>
          item.deviceNumber === device.deviceNumber) ??
          devices.value.find((item) => item.deviceNumber === device.deviceNumber);
        return {
          id: device.id,
          deviceNumber: device.deviceNumber,
          title: device.model || device.deviceNumber,
          status: monitorDevice?.status ?? device.status,
          manualStatus: monitorDevice?.manualStatus ?? device.manualStatus,
          algorithmStatus: monitorDevice?.algorithmStatus ?? device.algorithmStatus,
          leakProperty: monitorDevice?.leakProperty ?? device.leakProperty,
          onlineStatus: monitorDevice?.onlineStatus ?? device.onlineStatus,
          installAddress: String(
            monitorDevice?.raw.installAddress ??
            device.raw.installAddress ??
            "",
          ),
          model: monitorDevice?.model ?? device.model,
          regionId: device.regionId,
          coordinateSystem: device.coordinateSystem,
          lat: device.lat as number,
          lng: device.lng as number,
          facilityId: monitorDevice?.facilityId ?? device.facilityId ?? null,
          facilityType: monitorDevice?.facilityType ?? device.facilityType ?? null,
          facilityNumber: monitorDevice?.facilityNumber ?? device.facilityNumber ?? null,
          facilityName: monitorDevice?.facilityName ?? device.facilityName ?? null,
        };
      });
  });

  async function refreshSidebar() {
    const requestId = ++sidebarRequestId;
    sidebarLoading.value = true;
    try {
      const result = await fetchLeakMonitorSidebar(filters);
      if (requestId !== sidebarRequestId) return;
      sidebarData.value = result.data;
      sidebarDevices.value = result.devices;
      onlineRate.value = result.onlineRate;
      communicationRate.value = result.communicationRate;
    } catch (error) {
      if (requestId === sidebarRequestId) {
        sidebarDevices.value = [];
        console.error(error);
      }
    } finally {
      if (requestId === sidebarRequestId) sidebarLoading.value = false;
    }
  }

  async function refreshMapData() {
    try {
      const result = await fetchLeakMonitorMapData();
      mapDevices.value = result.devices;
      mapRegions.value = result.regions;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 正式管线加载：业务 code !== 200 / HTTP 失败 → formalTubesError 显式记录；
   * 元数据非法的记录进入 rejected 由图层组件显式提示并跳过渲染。
   * 不做任何演示数据回退。
   */
  async function refreshFormalTubes() {
    const requestId = ++formalTubesRequestId;
    formalTubesLoading.value = true;
    formalTubesError.value = "";
    try {
      const result = await fetchFormalTubeNetworks();
      if (requestId !== formalTubesRequestId) return;
      formalTubes.value = result.tubes;
      formalTubesRejected.value = result.rejected;
    } catch (error: any) {
      if (requestId !== formalTubesRequestId) return;
      formalTubes.value = [];
      formalTubesRejected.value = [];
      formalTubesError.value = error?.message || String(error || "管线数据加载失败");
    } finally {
      if (requestId === formalTubesRequestId) formalTubesLoading.value = false;
    }
  }

  async function refreshFormalFacilities() {
    const requestId = ++formalFacilitiesRequestId;
    formalFacilitiesLoading.value = true;
    formalFacilitiesError.value = "";
    try {
      const result = await fetchFormalFacilities();
      if (requestId !== formalFacilitiesRequestId) return;
      formalFacilities.value = result.facilities;
      formalFacilitiesRejected.value = result.rejected;
    } catch (error: any) {
      if (requestId !== formalFacilitiesRequestId) return;
      formalFacilities.value = [];
      formalFacilitiesRejected.value = [];
      formalFacilitiesError.value = error?.message || String(error || "设施数据加载失败");
    } finally {
      if (requestId === formalFacilitiesRequestId) formalFacilitiesLoading.value = false;
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
      errorMessage.value = error?.msg || t("deviceListLoadFailed");
    } finally {
      if (requestId === listRequestId) loading.value = false;
    }
  }

  async function refreshAll(resetPage = false) {
    await Promise.all([
      refreshSidebar(),
      refreshDevices(resetPage),
      refreshMapData(),
      // 后端接口已恢复，重新使用正式管线与设施数据；W84 本地预览仍保留在 previewTubes 中，供回退调试。
      refreshFormalTubes(),
      refreshFormalFacilities(),
    ]);
  }

  async function refreshDeviceAnalysis(range: DateRangeValue) {
    const device = selectedDevice.value;
    if (!device) return;
    const requestId = detailRequestId;
    detail.value.analysisLoading = true;
    detail.value.analysisError = "";
    const isoRange = toIsoRange(range);

    try {
      const [latestAudio, trend] = await Promise.all([
        fetchLeakMonitorLatestAudio(device.deviceNumber, isoRange.startTime, isoRange.endTime),
        fetchLeakMonitorTrend(
          device.deviceNumber,
          createRecentDateRange(7).start,
          range.end,
        ),
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
        detail.value.analysisError = error?.msg || error?.message || t("audioAnalysisLoadFailed");
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
    detail.value.historyError = "";

    try {
      const [trend, dailyRecords] = await Promise.all([
        fetchLeakMonitorTrend(device.deviceNumber, range.start, range.end),
        fetchLeakMonitorDailyAudio(device.deviceNumber, range.start, range.end),
      ]);
      const dailyAudioResults = await Promise.allSettled(
        dailyRecords.slice(-14).map(async (record) => {
          const wav = await fetchLeakMonitorWav(record.audioId);
          const analysis = await analyzeWavArrayBuffer(wav);
          return {
            ...record,
            sampleRate: analysis.sampleRate,
            spectrum: analysis.spectrum,
          };
        }),
      );
      const dailyAudio = dailyAudioResults
        .flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (requestId !== detailRequestId) return;
      detail.value.trend = trend;
      detail.value.dailyAudio = dailyAudio;
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.historyError = error?.msg || error?.message || t("historyAudioLoadFailed");
      }
    } finally {
      if (requestId === detailRequestId) detail.value.historyLoading = false;
    }
  }

  async function loadMaintenance(device: LeakMonitorDevice, requestId: number) {
    detail.value.maintenanceLoading = true;
    detail.value.maintenanceError = "";
    try {
      const records = await fetchLeakMonitorMaintenance(device.deviceNumber);
      if (requestId === detailRequestId) detail.value.maintenance = records;
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.maintenanceError = error?.msg || error?.message || t("maintenanceLoadFailed");
      }
    } finally {
      if (requestId === detailRequestId) detail.value.maintenanceLoading = false;
    }
  }

  async function loadManualAnalysis(device = selectedDevice.value) {
    if (!device) return;
    const requestId = detailRequestId;
    detail.value.manualLoading = true;
    detail.value.manualError = "";
    try {
      const records = await fetchLeakMonitorManualAnalysis(device.deviceNumber);
      if (requestId === detailRequestId) {
        detail.value.manualRecords = records;
        detail.value.manualLoaded = true;
      }
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.manualError = error?.msg || error?.message || t("manualAnalysisLoadFailed");
      }
    } finally {
      if (requestId === detailRequestId) detail.value.manualLoading = false;
    }
  }

  async function submitManualAnalysis(payload: ManualAnalysisPayload) {
    if (!selectedDevice.value) return;
    const requestId = detailRequestId;
    detail.value.manualSubmitting = true;
    detail.value.manualError = "";
    try {
      if (payload.dispatchRequested) {
        await createLeakMonitorManualWorkOrder(buildManualWorkOrderPayload(payload));
      } else {
        await submitLeakMonitorManualAnalysis(payload);
      }
      if (requestId !== detailRequestId) return;
      await loadManualAnalysis(selectedDevice.value);
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.manualError = error?.msg || error?.message ||
          (payload.dispatchRequested ? t("manualDispatchFailed") : t("manualAnalysisSaveFailed"));
      }
    } finally {
      if (requestId === detailRequestId) detail.value.manualSubmitting = false;
    }
  }

  function buildManualWorkOrderPayload(payload: ManualAnalysisPayload): ManualWorkOrderPayload {
    const device = selectedDevice.value;
    const raw = device?.raw || {};
    const deviceId = Number(payload.deviceId);
    const regionName = String(
      raw.deptNames ??
      raw.deptName ??
      detail.value.info?.deptNames ??
      detail.value.info?.deptName ??
      "",
    ).trim();
    const matchedRegion = regionName
      ? mapRegions.value.find((region) => region.name === regionName)
      : undefined;
    const deptId = Number(
      payload.deptId ??
      device?.regionId ??
      raw.deptId ??
      raw.departmentId ??
      matchedRegion?.id,
    );
    const sourceId = Number(device?.id ?? payload.deviceId);
    if (!Number.isFinite(deviceId) || !Number.isFinite(deptId) || !Number.isFinite(sourceId)) {
      throw new Error("人工派单缺少有效的设备 ID 或分区 ID");
    }

    const expectedTime = new Date(`${payload.resetDate}T23:59:59`).toISOString();
    return {
      workOrderNo: `LEAK-${payload.deviceNumber}-${Date.now()}`,
      expectedTime,
      urgencyLevel: payload.manualAnalysisStatus === 0 ? "HIGH" : "NORMAL",
      workOrderCategory: "LEAK_MONITOR",
      flowType: "MANUAL_ANALYSIS",
      processFlow: payload.troubleshootingFeedback,
      handler: "",
      remark: payload.reasonAnalysis,
      deviceNo: payload.deviceNumber,
      deviceId,
      deptId,
      leakageStatus: payload.manualAnalysis,
      installImage: payload.installImage || String(raw.installImage ?? ""),
      installAddress: payload.installAddress || String(raw.installAddress ?? ""),
      detail: payload.reasonAnalysis,
      sourceType: "LEAK_MONITOR_DEVICE",
      sourceId,
    };
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
    } catch (error: any) {
      if (requestId === detailRequestId) {
        detail.value.detailError = error?.msg || error?.message || t("deviceDetailLoadFailed");
      }
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
      detail.value.analysisError = error?.msg || error?.message || t("audioDownloadFailed");
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
      manualAnalysis: "",
      algorithmAnalysisStatus: "",
      onlineStatus: "",
      leakStatus: "",
      deptId: "",
      todayNew: "",
      latestInstalled: "",
    } satisfies LeakMonitorFilters);
    void refreshAll(true);
  }

  onMounted(() => {
    void refreshAll(true);
  });
  watch(locale, () => void refreshAll(true));
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
    mapDevices,
    mapPoints,
    mapRegions,
    formalTubes,
    formalTubesRejected,
    formalTubesError,
    formalTubesLoading,
    refreshFormalTubes,
    formalFacilities,
    formalFacilitiesRejected,
    formalFacilitiesError,
    formalFacilitiesLoading,
    refreshFormalFacilities,
    previewTubes,
    previewFacilities,
    facilityVisibility,
    closeDetail,
    downloadLatestAudio,
    loadHistory,
    loadManualAnalysis,
    openDevice,
    refreshAll,
    refreshDeviceAnalysis,
    resetFilters,
    submitManualAnalysis,
    updatePage,
  };
}
