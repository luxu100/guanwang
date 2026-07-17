export type CommandExecutionType = "PARAM_SETTING" | "FIRMWARE_UPGRADE" | "AUDIO_REPAIR";

export type MockScenario = "NORMAL" | "PARTIAL_MISSING" | "NO_RESPONSE" | "FAILURE";

export type DeviceTaskStatus =
  | "WAITING_ONLINE"
  | "WAITING_DELAY"
  | "SENDING"
  | "WAITING_RESPONSE"
  | "WAITING_RECONNECT"
  | "PAUSED"
  | "SUCCESS"
  | "FAILED"
  | "ABANDONED";

export type CommandTaskStatus = "WAITING" | "RUNNING" | "PARTIAL" | "SUCCESS" | "FAILED" | "ABANDONED" | "PAUSED";

export interface MockCommandDefinition {
  id: number;
  name: string;
  commandCode: string;
  executionType: CommandExecutionType;
  category: string;
  description: string;
  enabled: boolean;
  requestFrame: string;
}

export interface MockDevice {
  id: number;
  deviceNumber: string;
  deviceType: string;
  firmwareVersion: string;
  onlineStatus: 0 | 1;
  installAddress: string;
}

export interface MockAudioRecord {
  id: number;
  deviceNumber: string;
  collectedAt: string;
  totalFrames: number;
  receivedFrames: number;
  missingFrames: number[];
}

export interface FirmwarePrototypeInfo {
  fileName: string;
  fileSize: number;
  frameSize: number;
  totalFrames: number;
  frameLengths: number[];
}

export interface AudioRepairPrototypeInfo {
  recordId: number;
  totalFrames: number;
  initialReceivedFrames: number;
  initialMissingFrames: number[];
}

export interface DeviceTaskTimelineItem {
  id: string;
  time: string;
  title: string;
  message: string;
  tone: "info" | "success" | "warning" | "danger";
}

export interface MockDeviceTask {
  id: string;
  deviceId: number;
  deviceNumber: string;
  deviceType: string;
  onlineStatus: 0 | 1;
  status: DeviceTaskStatus;
  phaseText: string;
  progress: number;
  round: number;
  maxRounds: number | null;
  totalFrames: number;
  completedFrames: number;
  missingFrames: number[];
  responseMessage: string;
  updatedAt: string;
  timeline: DeviceTaskTimelineItem[];
}

export interface MockCommandTask {
  id: string;
  taskNo: string;
  commandId: number;
  commandName: string;
  commandCode: string;
  executionType: CommandExecutionType;
  scenario: MockScenario;
  params: Record<string, string | number | boolean>;
  firmware?: FirmwarePrototypeInfo;
  audio?: AudioRepairPrototypeInfo;
  devices: MockDeviceTask[];
  status: CommandTaskStatus;
  progress: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

