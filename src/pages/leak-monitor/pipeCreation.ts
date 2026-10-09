import { computed, reactive, ref, watch, type Ref } from "vue";
import {
  createTubeNetwork,
  type TubeNetworkCreatePayload,
  type TubeNetworkRecord,
} from "@/services/leak-monitor/tube-network";
import {
  createFacility as createFacilityRequest,
  type FacilityCreatePayload,
} from "@/services/leak-monitor/facility";
import type { FacilityType } from "./types";
import { useLeakMonitorI18n } from "./i18n";
import { parseCoordinate, getDraftPointCoordinates, getFacilityCoordinate, findPipeCrossings, projectToSegment, findNearestPipeSegment } from "./pipeGeometry";

export type PipeCreationMode = "pipe" | "facility";
export type FacilityPositionMode = "line" | "manual";

type Point = { lng: number; lat: number };

export interface PipeCreationPoint {
  id: string;
  lng: string;
  lat: string;
}

export interface PipeCreationFacility {
  id: string;
  facilityType: FacilityType;
  facilityNumber: string;
  facilityName: string;
  diameterMm: string;
  status: number;
  mode: FacilityPositionMode;
  segmentIndex: number;
  positionRatio: number;
  longitude: string;
  latitude: string;
  error: string;
  submitted: boolean;
  submitting: boolean;
  outsidePipe: boolean;
}

export interface PipeCreationDraft {
  active: boolean;
  mode: PipeCreationMode;
  tubeName: string;
  tubeType: number;
  tubeShape: number;
  status: number;
  deptId: string;
  countryCode: string;
  coordinateSystem: "WGS84";
  material: string;
  diameterMm: string;
  points: PipeCreationPoint[];
  facilities: PipeCreationFacility[];
  firstPointFocused: boolean;
  submitting: boolean;
  submitError: string;
  successMessage: string;
  pipeCreatedId: number | null;
  pipeSubmitted: boolean;
  drawingActive: boolean;
  placementType: FacilityType | "";
}

export interface PipeCreationController {
  draft: PipeCreationDraft;
  crossingErrors: Readonly<Ref<string[]>>;
  validPointCount: Readonly<Ref<number>>;
  canSubmit: Readonly<Ref<boolean>>;
  start: (mode: PipeCreationMode) => void;
  cancel: () => void;
  setPoint: (index: number, field: "lng" | "lat", value: string) => void;
  removePoint: (index: number) => void;
  addFacility: (segmentIndex?: number) => void;
  removeFacility: (facilityId: string) => void;
  setFacilityField: <K extends keyof PipeCreationFacility>(
    facilityId: string,
    field: K,
    value: PipeCreationFacility[K],
  ) => void;
  updateFacilityRatio: (facilityId: string, ratio: number) => void;
  moveFacilityFromMap: (facilityId: string, longitude: number, latitude: number) => void;
  submit: (options?: { confirmOutside?: boolean }) => Promise<boolean>;
  retryFacility: (facilityId: string) => Promise<void>;
  hasUnsavedChanges: Readonly<Ref<boolean>>;
  discard: () => void;
  addMapPoint: (coordinate: Point) => void;
  undoLastPoint: () => void;
  clearPoints: () => void;
  completeDrawing: () => void;
  selectPlacementType: (type: FacilityType | "") => void;
  placeFacilityAt: (coordinate: Point) => void;
  switchMode: (mode: PipeCreationMode) => void;
  confirming: Readonly<Ref<boolean>>;
}

const MAX_POINT_COUNT = 100;
const NEAR_PIPE_METERS = 20;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPoint(): PipeCreationPoint {
  return { id: createId("point"), lng: "", lat: "" };
}

function createFacility(segmentIndex = 0, mode: FacilityPositionMode = "line"): PipeCreationFacility {
  const id = createId("facility");
  return {
    id,
    facilityType: "VALVE",
    facilityNumber: "MANUAL_VALVE_" + id.slice("facility-".length).replace(/-/g, "_"),
    facilityName: "",
    diameterMm: "0",
    status: 1,
    mode,
    segmentIndex,
    positionRatio: 0.5,
    longitude: "",
    latitude: "",
    error: "",
    submitted: false,
    submitting: false,
    outsidePipe: false,
  };
}

function createDraft(): PipeCreationDraft {
  return {
    active: false,
    mode: "pipe",
    tubeName: `MANUAL_${Date.now()}`,
    tubeType: 2,
    tubeShape: 1,
    status: 1,
    deptId: "2",
    countryCode: "MY",
    coordinateSystem: "WGS84",
    material: "MS",
    diameterMm: "150",
    points: [createPoint()],
    facilities: [],
    firstPointFocused: false,
    submitting: false,
    submitError: "",
    successMessage: "",
    pipeCreatedId: null,
    pipeSubmitted: false,
    drawingActive: false,
    placementType: "",
  };
}

export { parseCoordinate, coordinateError, getDraftPointCoordinates, getFacilityCoordinate, findPipeCrossings, properSegmentsCross } from "./pipeGeometry";

export function usePipeCreation(
  existingTubes: Readonly<Ref<TubeNetworkRecord[]>>,
  options: {
    focusCoordinate: (coordinate: Point, countryCode: string) => void;
    onSaved: () => Promise<void> | void;
  },
): PipeCreationController {
  const { language } = useLeakMonitorI18n();
  const draft = reactive(createDraft());
  const confirming = ref(false);
  function baseSignature() {
    return JSON.stringify([draft.mode, draft.tubeName, draft.tubeType, draft.tubeShape, draft.status, draft.deptId, draft.countryCode, draft.material, draft.diameterMm]);
  }
  let initialBaseSignature = baseSignature();
  const validPointCount = computed(() => getDraftPointCoordinates(draft).length);
  const coordinateRowsValid = computed(() => {
    const lastFilled = draft.points.reduce((last, point, index) =>
      point.lng.trim() || point.lat.trim() ? index : last, -1);
    return lastFilled < 0 || draft.points.slice(0, lastFilled + 1).every((point) => parseCoordinate(point));
  });
  const crossingErrors = computed(() => draft.mode === "pipe" && !draft.pipeSubmitted
    ? findPipeCrossings(getDraftPointCoordinates(draft), existingTubes.value).map((message) =>
      language.value === "zh-CN" ? message : message.startsWith("相邻坐标")
        ? "Consecutive coordinates must be different"
        : message.startsWith("新管线自身")
          ? "The new pipe crosses or overlaps itself"
          : "The new pipe crosses or overlaps an existing pipe")
    : []);
  const facilitiesValid = computed(() => draft.facilities.every((facility) => {
    const coordinate = getFacilityCoordinate(facility, getDraftPointCoordinates(draft));
    return Boolean(facility.facilityNumber.trim()) && coordinate !== null &&
      facility.diameterMm.trim() !== "" && Number.isFinite(Number(facility.diameterMm)) && Number(facility.diameterMm) >= 0;
  }));
  const hasUnsavedChanges = computed(() => draft.active && (
    draft.pipeSubmitted || draft.facilities.length > 0 || draft.points.some((point) => point.lng.trim() || point.lat.trim()) || baseSignature() !== initialBaseSignature
  ));
  const baseFieldsValid = computed(() => draft.tubeName.trim() !== "" && /^[A-Z]{2}$/.test(draft.countryCode.trim().toUpperCase()) &&
    Number.isInteger(Number(draft.deptId)) && Number(draft.deptId) > 0 && draft.deptId.trim() !== "" &&
    Number.isInteger(Number(draft.tubeType)) && Number(draft.tubeType) >= 0 &&
    Number.isInteger(Number(draft.tubeShape)) && Number(draft.tubeShape) >= 0 &&
    draft.diameterMm.trim() !== "" && Number.isFinite(Number(draft.diameterMm)) && Number(draft.diameterMm) >= 0);
  const canSubmit = computed(() => {
    if (draft.submitting || confirming.value) return false;
    if (draft.mode === "facility") return Number.isInteger(Number(draft.deptId)) && Number(draft.deptId) > 0 &&
      draft.deptId.trim() !== "" && /^[A-Z]{2}$/.test(draft.countryCode.trim().toUpperCase()) && draft.facilities.length > 0 && facilitiesValid.value;
    const pipeReady = draft.pipeSubmitted || (
      validPointCount.value >= 2 && coordinateRowsValid.value && crossingErrors.value.length === 0 && baseFieldsValid.value
    );
    return pipeReady && facilitiesValid.value;
  });

  function reset(mode: PipeCreationMode = "pipe") {
    const next = createDraft();
    next.mode = mode;
    next.active = true;
    next.drawingActive = mode === "pipe";
    if (mode === "facility") next.points = [];
    Object.assign(draft, next);
    initialBaseSignature = baseSignature();
  }

  function start(mode: PipeCreationMode) {
    if (!draft.submitting && !draft.active) reset(mode);
  }

  function switchMode(mode: PipeCreationMode) {
    if (draft.submitting || draft.pipeSubmitted || draft.points.some((point) => point.lng.trim() || point.lat.trim())) return;
    draft.facilities.forEach((facility) => { facility.mode = "manual"; });
    draft.mode = mode;
    draft.drawingActive = mode === "pipe";
    draft.placementType = "";
  }

  function cancel() {
    if (draft.submitting || confirming.value) return;
    const discard = () => Object.assign(draft, createDraft());
    if (!draft.pipeSubmitted && !draft.facilities.length && !draft.points.some((point) => point.lng.trim() || point.lat.trim())) {
      discard();
      return;
    }
    uni.showModal({
      title: language.value === "zh-CN" ? "放弃草稿？" : "Discard draft?",
      content: language.value === "zh-CN" ? "有内容未保存，是否关闭？" : "You have unsaved changes. Close the editor?",
      success: (result) => { if (result.confirm) discard(); },
    });
  }

  function discardDraft() {
    if (!draft.submitting && !confirming.value) Object.assign(draft, createDraft());
  }

  function syncFacilities() {
    const points = getDraftPointCoordinates(draft);
    draft.facilities.forEach((facility) => {
      if (facility.mode !== "line") return;
      const coordinate = getFacilityCoordinate(facility, points);
      if (coordinate) {
        facility.longitude = coordinate.lng.toFixed(7);
        facility.latitude = coordinate.lat.toFixed(7);
        facility.outsidePipe = false;
      } else {
        facility.longitude = "";
        facility.latitude = "";
      }
    });
  }

  function updateOutsidePipeState(facility: PipeCreationFacility) {
    if (facility.mode !== "manual") {
      facility.outsidePipe = false;
      return;
    }
    const coordinate = getFacilityCoordinate(facility, getDraftPointCoordinates(draft));
    const points = getDraftPointCoordinates(draft);
    if (!coordinate) {
      facility.outsidePipe = false;
      return;
    }
    const paths = points.length >= 2 ? [points] : existingTubes.value.flatMap((tube) =>
      (tube.lineCoords || []).map((path) => path.map(([lng, lat]) => ({ lng, lat }))));
    const nearest = findNearestPipeSegment(coordinate, paths);
    facility.outsidePipe = !nearest || nearest.distanceM > NEAR_PIPE_METERS;
  }

  function updateAllOutsidePipeStates() {
    draft.facilities.forEach(updateOutsidePipeState);
  }

  function setPoint(index: number, field: "lng" | "lat", value: string) {
    if (draft.pipeSubmitted || draft.submitting) return;
    const point = draft.points[index];
    if (!point) return;
    point[field] = value;
    const coordinate = parseCoordinate(point);
    if (coordinate && index === 0 && !draft.firstPointFocused) {
      draft.firstPointFocused = true;
      options.focusCoordinate(coordinate, draft.countryCode);
    }
    if (coordinate && index === draft.points.length - 1 && draft.points.length < MAX_POINT_COUNT) {
      draft.points.push(createPoint());
    }
    syncFacilities();
    updateAllOutsidePipeStates();
  }

  function removePoint(index: number) {
    if (draft.pipeSubmitted || draft.submitting || index < 0 || index >= draft.points.length) return;
    draft.points.splice(index, 1);
    draft.facilities = draft.facilities.filter((facility) => facility.mode === "manual" ||
      facility.segmentIndex !== index && facility.segmentIndex !== index - 1);
    draft.facilities.forEach((facility) => {
      if (facility.segmentIndex > index) facility.segmentIndex -= 1;
    });
    if (!draft.points.length || parseCoordinate(draft.points[draft.points.length - 1])) draft.points.push(createPoint());
    syncFacilities();
    updateAllOutsidePipeStates();
  }

  function addFacility(segmentIndex = 0) {
    if (draft.submitting || confirming.value) return;
    const facility = draft.mode === "facility"
      ? createFacility(0, "manual")
      : createFacility(Math.max(0, segmentIndex), "line");
    draft.facilities.push(facility);
    syncFacilities();
  }

  function facilityById(id: string) {
    return draft.facilities.find((facility) => facility.id === id);
  }

  function removeFacility(facilityId: string) {
    if (draft.submitting || confirming.value) return;
    const index = draft.facilities.findIndex((facility) => facility.id === facilityId);
    if (index >= 0) draft.facilities.splice(index, 1);
  }

  function setFacilityField<K extends keyof PipeCreationFacility>(
    facilityId: string,
    field: K,
    value: PipeCreationFacility[K],
  ) {
    const facility = facilityById(facilityId);
    if (!facility || draft.submitting || confirming.value) return;
    const previousType = facility.facilityType;
    facility[field] = value;
    if (field === "mode") syncFacilities();
    if (field === "facilityType" && (facility.facilityNumber.startsWith("MANUAL_" + previousType + "_") || !facility.facilityNumber.trim())) {
      facility.facilityNumber = "MANUAL_" + String(value) + "_" + facility.id.slice("facility-".length).replace(/-/g, "_");
    }
    updateOutsidePipeState(facility);
  }

  function updateFacilityRatio(facilityId: string, ratio: number) {
    const facility = facilityById(facilityId);
    if (!facility || draft.submitting || confirming.value) return;
    facility.mode = "line";
    facility.positionRatio = Math.min(1, Math.max(0, ratio));
    syncFacilities();
  }

  function moveFacilityFromMap(facilityId: string, longitude: number, latitude: number) {
    const facility = facilityById(facilityId);
    if (!facility || draft.submitting || confirming.value) return;
    if (facility.mode === "manual") {
      if (Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90) {
        facility.longitude = longitude.toFixed(7);
        facility.latitude = latitude.toFixed(7);
        updateOutsidePipeState(facility);
      }
      return;
    }
    const points = getDraftPointCoordinates(draft);
    const start = points[facility.segmentIndex];
    const end = points[facility.segmentIndex + 1];
    if (!start || !end) return;
    facility.mode = "line";
    facility.positionRatio = projectToSegment({ lng: longitude, lat: latitude }, start, end);
    syncFacilities();
  }

  function addMapPoint(coordinate: Point) {
    if (!draft.active || draft.mode !== "pipe" || draft.pipeSubmitted || draft.submitting || confirming.value || !draft.drawingActive) return;
    const lastIndex = draft.points.length - 1;
    const last = draft.points[lastIndex];
    if (last && (last.lng.trim() || last.lat.trim()) && !parseCoordinate(last)) return;
    if (last && !last.lng.trim() && !last.lat.trim()) {
      setPoint(lastIndex, "lng", String(coordinate.lng));
      setPoint(lastIndex, "lat", String(coordinate.lat));
      return;
    }
    if (draft.points.length < MAX_POINT_COUNT) {
      draft.points.push({ id: createId("point"), lng: String(coordinate.lng), lat: String(coordinate.lat) });
      if (draft.points.length === 1) {
        draft.firstPointFocused = true;
        options.focusCoordinate(coordinate, draft.countryCode);
      }
      syncFacilities();
    }
  }

  function undoLastPoint() {
    if (draft.submitting || draft.pipeSubmitted) return;
    const index = draft.points.reduce((last, point, i) => point.lng.trim() || point.lat.trim() ? i : last, -1);
    if (index >= 0) removePoint(index);
  }

  function clearPoints() {
    if (draft.pipeSubmitted || draft.submitting) return;
    draft.points = [createPoint()];
    draft.facilities.forEach((facility) => { facility.mode = "manual"; });
    draft.drawingActive = true;
    updateAllOutsidePipeStates();
  }

  function completeDrawing() {
    draft.drawingActive = false;
  }

  function selectPlacementType(type: FacilityType | "") {
    if (draft.submitting) return;
    draft.placementType = type;
    if (type) draft.drawingActive = false;
  }

  function placeFacilityAt(coordinate: Point) {
    if (!draft.active || !draft.placementType || draft.submitting || confirming.value) return;
    const facility = createFacility(0, "manual");
    facility.facilityType = draft.placementType;
    facility.facilityNumber = "MANUAL_" + draft.placementType + "_" + facility.id.slice("facility-".length).replace(/-/g, "_");
    facility.longitude = coordinate.lng.toFixed(7);
    facility.latitude = coordinate.lat.toFixed(7);
    const points = getDraftPointCoordinates(draft);
    const nearest = findNearestPipeSegment(coordinate, [points]);
    if (nearest && nearest.distanceM <= NEAR_PIPE_METERS) {
      facility.mode = "line";
      facility.segmentIndex = nearest.segmentIndex;
      facility.positionRatio = nearest.ratio;
    }
    updateOutsidePipeState(facility);
    draft.facilities.push(facility);
    syncFacilities();
  }

  function buildTubePayload(): TubeNetworkCreatePayload {
    const points = getDraftPointCoordinates(draft);
    return {
      tubeName: draft.tubeName.trim(),
      tubeType: Number(draft.tubeType),
      tubeShape: Number(draft.tubeShape),
      status: Number(draft.status),
      deptId: Number(draft.deptId),
      lineCoords: [points.map(({ lng, lat }) => [lng, lat])],
      coordinateSystem: "WGS84",
      countryCode: draft.countryCode.trim().toUpperCase() || "MY",
      material: draft.material.trim() || undefined,
      diameterMm: Number(draft.diameterMm) > 0 ? Number(draft.diameterMm) : undefined,
    };
  }

  function buildFacilityPayload(facility: PipeCreationFacility): FacilityCreatePayload | null {
    const coordinate = getFacilityCoordinate(facility, getDraftPointCoordinates(draft));
    if (!coordinate || !facility.facilityNumber.trim()) return null;
    return {
      facilityType: facility.facilityType,
      facilityNumber: facility.facilityNumber.trim(),
      facilityName: facility.facilityName.trim() || undefined,
      longitude: coordinate.lng,
      latitude: coordinate.lat,
      coordinateSystem: "WGS84",
      countryCode: draft.countryCode.trim().toUpperCase() || "MY",
      deptId: Number(draft.deptId),
      status: Number(facility.status),
      diameterMm: Number(facility.diameterMm) > 0 ? Number(facility.diameterMm) : undefined,
    };
  }

  async function submitOneFacility(facility: PipeCreationFacility) {
    const payload = buildFacilityPayload(facility);
    if (!payload) {
      facility.error = "设施编号或坐标无效";
      return false;
    }
    facility.submitting = true;
    facility.error = "";
    try {
      await createFacilityRequest(payload);
      facility.submitted = true;
      return true;
    } catch (error) {
      facility.error = error instanceof Error ? error.message : String(error || "设施创建失败");
      return false;
    } finally {
      facility.submitting = false;
    }
  }

  async function submitFacilities() {
    let successCount = 0;
    for (const facility of [...draft.facilities]) {
      if (facility.submitted) continue;
      if (await submitOneFacility(facility)) successCount += 1;
    }
    for (let index = draft.facilities.length - 1; index >= 0; index -= 1) {
      if (draft.facilities[index].submitted) draft.facilities.splice(index, 1);
    }
    return successCount;
  }

  async function submit(submitOptions: { confirmOutside?: boolean } = {}) {
    if (!canSubmit.value) {
      if (!draft.submitting && !confirming.value) draft.submitError = language.value === "zh-CN" ? "请补齐必填项并修正坐标或交叉错误后保存" : "Complete required fields and fix coordinate or crossing errors before saving.";
      return false;
    }
    if (submitOptions.confirmOutside !== false && draft.facilities.some((facility) => facility.outsidePipe)) {
      confirming.value = true;
      const confirmed = await new Promise<boolean>((resolve) => {
        uni.showModal({
          title: language.value === "zh-CN" ? "设施位于管线外" : "Facility outside pipe",
          content: language.value === "zh-CN" ? "仍然提交这些设施吗？" : "Submit these facilities anyway?",
          confirmText: language.value === "zh-CN" ? "确定提交" : "Submit",
          cancelText: language.value === "zh-CN" ? "取消" : "Cancel",
          success: (result) => resolve(Boolean(result.confirm)),
          fail: () => resolve(false),
        });
      });
      confirming.value = false;
      if (!confirmed) return false;
    }
    draft.submitting = true;
    draft.submitError = "";
    draft.successMessage = "";
    try {
      if (draft.mode === "pipe" && !draft.pipeSubmitted) {
        const result = await createTubeNetwork(buildTubePayload());
        const id = Number(result?.id);
        draft.pipeCreatedId = Number.isFinite(id) ? id : null;
        draft.pipeSubmitted = true;
        draft.successMessage = "管线已创建，正在提交设施";
      }
      const successCount = await submitFacilities();
      try { await options.onSaved(); } catch (error) {
        draft.submitError = error instanceof Error ? error.message : String(error);
      }
      if (draft.facilities.length === 0) {
        Object.assign(draft, createDraft());
      } else {
        draft.submitError = language.value === "zh-CN" ? "部分设施创建失败，请检查错误后重试" : "Some facilities failed. Review the errors and retry.";
        if (successCount > 0) draft.successMessage = "部分设施已创建";
      }
    } catch (error) {
      draft.submitError = error instanceof Error ? error.message : String(error || "提交失败");
    } finally {
      draft.submitting = false;
    }
    return !draft.active;
  }

  async function retryFacility(facilityId: string) {
    const facility = facilityById(facilityId);
    if (!facility || draft.submitting || confirming.value || (draft.mode === "pipe" && !draft.pipeSubmitted)) return;
    if (facility.outsidePipe) {
      await submit();
      return;
    }
    draft.submitting = true;
    try {
      if (await submitOneFacility(facility)) {
        removeFacility(facilityId);
        try { await options.onSaved(); } catch (error) {
          draft.submitError = error instanceof Error ? error.message : String(error);
        }
        if (!draft.facilities.length) Object.assign(draft, createDraft());
      }
    } finally {
      draft.submitting = false;
    }
  }

  watch(() => existingTubes.value, updateAllOutsidePipeStates);

  return {
    draft,
    crossingErrors,
    validPointCount,
    canSubmit,
    start,
    cancel,
    setPoint,
    removePoint,
    addFacility,
    removeFacility,
    setFacilityField,
    updateFacilityRatio,
    moveFacilityFromMap,
    submit,
    retryFacility,
    switchMode,
    confirming,
    hasUnsavedChanges,
    discard: discardDraft,
    addMapPoint,
    undoLastPoint,
    clearPoints,
    completeDrawing,
    selectPlacementType,
    placeFacilityAt,
  };
}
