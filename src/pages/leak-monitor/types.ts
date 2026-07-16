export type LeakDeviceStatus = "normal" | "suspect" | "leak" | "unknown";
export type CoordinateSystem = "WGS84" | "GCJ02";

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface LeakMonitorFilters {
  deviceNumber: string;
  deviceType: string;
  onlineStatus: "" | "0" | "1";
  leakStatus: "" | "0" | "1" | "2" | "3";
  todayNew: "" | "true" | "false";
  latestInstalled: "" | "true" | "false";
}

export interface LeakMonitorMetric {
  key: string;
  label: string;
  value: number | string;
  suffix?: string;
  tone: "success" | "primary" | "warning" | "danger" | "muted";
}

export interface LeakMonitorDevice {
  id: string | number;
  deviceNumber: string;
  model: string;
  status: LeakDeviceStatus;
  statusText: string;
  manualStatus: LeakDeviceStatus;
  manualStatusText: string;
  algorithmStatus: LeakDeviceStatus;
  algorithmStatusText: string;
  leakProperty: number | null;
  onlineStatus: number | null;
  regionId: string | number | null;
  coordinateSystem: CoordinateSystem;
  lat?: number;
  lng?: number;
  raw: Record<string, unknown>;
}

export interface MapDevicePoint {
  id: string | number;
  deviceNumber: string;
  title: string;
  status: LeakDeviceStatus;
  leakProperty: number | null;
  regionId: string | number | null;
  coordinateSystem: CoordinateSystem;
  lat: number;
  lng: number;
}

export interface MapRegion {
  id: string | number;
  name: string;
  color: string;
  center: MapCoordinate | null;
  boundary: MapCoordinate[];
  coordinateSystem: CoordinateSystem;
  visible: boolean;
  minZoom?: number;
  maxZoom?: number;
  raw: Record<string, unknown>;
}

export interface PageState {
  current: number;
  size: number;
  total: number;
}

export interface FeatureTrendPoint {
  date: string;
  leakEsa: number | null;
  parseTime?: string;
}

export interface AudioRecord {
  audioId: number;
  deviceNumber?: string;
  time?: string;
  samplingRate?: number;
  [key: string]: unknown;
}

export interface AudioAnalysisData {
  duration: number;
  sampleRate: number;
  waveform: number[];
  spectrum: number[];
  spectrogram: number[][];
}

export interface DailyAudioRecord {
  audioId: number;
  audioTime?: string;
  date: string;
}

export interface DailyAudioAnalysis extends DailyAudioRecord {
  sampleRate: number;
  spectrum: number[];
}

export interface ManualAnalysisPayload {
  deviceId: string | number;
  deviceNumber: string;
  audioId?: number;
  manualAnalysis: string;
  manualAnalysisStatus: number;
  troubleshootingFeedback: string;
  reasonAnalysis: string;
  resetDate: string;
  dispatchRequested?: boolean;
}

export interface ManualAnalysisRecord {
  id?: string | number;
  manualAnalysis?: string;
  troubleshootingFeedback?: string;
  reasonAnalysis?: string;
  resetDate?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface MaintenanceRecord {
  id?: string | number;
  maintainType: number;
  operationTime?: string;
  installAddress?: string;
  [key: string]: unknown;
}

export interface DeviceDetailState {
  info: Record<string, unknown>;
  latestAudio: AudioRecord | null;
  audioUrl: string;
  audioAnalysis: AudioAnalysisData | null;
  trend: FeatureTrendPoint[];
  dailyAudio: DailyAudioAnalysis[];
  maintenance: MaintenanceRecord[];
  manualRecords: ManualAnalysisRecord[];
  analysisLoading: boolean;
  historyLoading: boolean;
  maintenanceLoading: boolean;
  manualLoading: boolean;
  manualSubmitting: boolean;
  manualLoaded: boolean;
  analysisError: string;
  historyError: string;
  detailError: string;
  maintenanceError: string;
  manualError: string;
  errorMessage: string;
}

export interface DateRangeValue {
  start: string;
  end: string;
}
