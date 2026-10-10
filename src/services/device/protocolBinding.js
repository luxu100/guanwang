export const REALTIME_BINDING_RULES = Object.freeze({
  afn: "08", taskType: "TASK_1", contentPrefix: "0000810F",
});

export function bindingSceneOptions(english = false, query = false) {
  const options = [
    { value: "CLOUD", label: english ? "Cloud / remote reporting" : "云平台 / 远程上报" },
    { value: "APP_REALTIME_SINGLE", label: english ? "APP Bluetooth real-time sampling" : "APP 蓝牙实时采样" },
  ];
  return query ? [{ value: "ALL", label: english ? "All scenes" : "全部场景" }, ...options] : options;
}

export function bindingSceneLabel(value, english = false) {
  return bindingSceneOptions(english).find(option => option.value === value)?.label
    || (value ? String(value) : english ? "Missing scene" : "未返回场景");
}

export function assertProtocolResponse(response, requireTrue = false) {
  if (response?.code !== 200 || (requireTrue && response.data !== true)) {
    throw new Error(response?.msg || "协议操作失败");
  }
  return response;
}

export function buildBindingPayload(data, creating = false) {
  if (!["CLOUD", "APP_REALTIME_SINGLE"].includes(data?.scene)) {
    throw new Error("请选择使用场景 / Select a usage scene");
  }
  if (creating && (!data.deviceId || !data.protocolId)) {
    throw new Error("请选择当前环境的设备和协议 / Select a device and protocol");
  }
  const payload = Object.fromEntries(
    ["deviceId", "protocolId", "scene", "afn", "taskType", "contentPrefix", "priority", "enabled"]
      .filter(key => data[key] !== undefined && data[key] !== null)
      .map(key => [key, data[key]]),
  );
  for (const key of ["deviceId", "protocolId", "priority"]) {
    if (payload[key] === undefined) continue;
    const value = Number(payload[key]);
    if (payload[key] === "" || !Number.isSafeInteger(value) || (key !== "priority" && value <= 0)) {
      throw new Error(`无效字段 / Invalid field: ${key}`);
    }
    payload[key] = value;
  }
  if (payload.enabled !== undefined && typeof payload.enabled !== "boolean") throw new Error("enabled 必须为布尔值");
  if (payload.scene === "APP_REALTIME_SINGLE") Object.assign(payload, REALTIME_BINDING_RULES);
  return payload;
}
