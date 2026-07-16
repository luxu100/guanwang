export type LeakDeviceStatus = "normal" | "suspect" | "leak" | "unknown";

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
  lat: number;
  lng: number;
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
  spectrum: number[];
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
  analysisLoading: boolean;
  historyLoading: boolean;
  maintenanceLoading: boolean;
  errorMessage: string;
}

export interface DateRangeValue {
  start: string;
  end: string;
}