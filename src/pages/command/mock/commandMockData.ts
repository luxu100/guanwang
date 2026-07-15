import type { MockAudioRecord, MockCommandDefinition, MockDevice } from "../commandManage.types";

export const prototypeCommands: MockCommandDefinition[] = [
  {
    id: 10001,
    name: "设备参数设置",
    commandCode: "0xA1",
    executionType: "PARAM_SETTING",
    category: "参数设置",
    description: "模拟设备上线后等待 1 秒，并在 10 秒窗口内下发参数。",
    enabled: true,
    requestFrame: "AA 55 {deviceId} A1 {sampleInterval} {uploadInterval} CRC16",
  },
  {
    id: 10002,
    name: "固件升级",
    commandCode: "0xF1",
    executionType: "FIRMWARE_UPGRADE",
    category: "固件维护",
    description: "读取本地 TXT，按原始字节拆成 500 字节数据帧并模拟断点续传。",
    enabled: true,
    requestFrame: "7E {deviceId} F1 {frameIndex} {frameTotal} {payload} CRC16 7E",
  },
  {
    id: 10003,
    name: "音频补帧",
    commandCode: "0xD8",
    executionType: "AUDIO_REPAIR",
    category: "数据补传",
    description: "根据缺失帧清单模拟补传，最多执行四轮。",
    enabled: true,
    requestFrame: "AA 55 {deviceId} D8 {recordId} {missingBitmap} CRC16",
  },
];

const deviceTypes = ["管网采集终端", "压力采集器", "声学记录仪"];
const addresses = ["城北供水干线", "滨江路 DMA 分区", "东湖路支线", "高新区管廊", "老城区监测井"];

export const prototypeDevices: MockDevice[] = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  deviceNumber: `GW-${String(index + 1).padStart(4, "0")}`,
  deviceType: deviceTypes[index % deviceTypes.length],
  firmwareVersion: `V2.${Math.floor(index / 6)}.${index % 6}`,
  onlineStatus: index % 4 === 0 ? 0 : 1,
  installAddress: addresses[index % addresses.length],
}));

function createMissingFrames(total: number, received: number, seed: number) {
  const missingCount = Math.max(0, total - received);
  const candidates = Array.from({ length: total }, (_, index) => index + 1).filter(
    (frame) => (frame * 7 + seed * 11) % 13 < 6,
  );
  return candidates.slice(0, missingCount);
}

export const prototypeAudioRecords: MockAudioRecord[] = [
  {
    id: 501,
    deviceNumber: "GW-0001",
    collectedAt: "2026-07-12 02:00:18",
    totalFrames: 183,
    receivedFrames: 100,
    missingFrames: createMissingFrames(183, 100, 1),
  },
  {
    id: 502,
    deviceNumber: "GW-0006",
    collectedAt: "2026-07-12 03:15:42",
    totalFrames: 183,
    receivedFrames: 147,
    missingFrames: createMissingFrames(183, 147, 2),
  },
  {
    id: 503,
    deviceNumber: "GW-0011",
    collectedAt: "2026-07-11 23:46:09",
    totalFrames: 183,
    receivedFrames: 178,
    missingFrames: createMissingFrames(183, 178, 3),
  },
  {
    id: 504,
    deviceNumber: "GW-0014",
    collectedAt: "2026-07-11 22:10:31",
    totalFrames: 183,
    receivedFrames: 183,
    missingFrames: [],
  },
];

export const scenarioOptions = [
  { label: "正常完成", value: "NORMAL" },
  { label: "部分帧缺失", value: "PARTIAL_MISSING" },
  { label: "设备无响应", value: "NO_RESPONSE" },
  { label: "最终失败", value: "FAILURE" },
] as const;

