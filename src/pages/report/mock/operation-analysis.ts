// 接口就绪后关闭示例数据开关，并用接口返回值填充页面 records。
export const USE_OPERATION_ANALYSIS_MOCK = true;

// 覆盖最近 400 天，支持跨月、跨年的趋势预览。同一天的数据保持稳定。
export function createMockOperationAnalysisRecords(end = new Date()) {
  const today = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Array.from({ length: 400 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 399 + offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

    return ['示例分区 A', '示例分区 B'].map((partition, index) => {
      const seed = day + index * 17;
      const totalAlarms = 28 + seed % 19 + Math.round((Math.sin(day / 6) + 1) * 9);
      const alarms = seed % 11 === 0 ? 0 : 2 + seed % 6;
      const repairs = 4 + seed % 7;
      const unfinished = seed % 4;
      const completed = repairs - unfinished;
      const leaks = 1 + seed % 4;
      const bursts = seed % 6 === 0 ? 2 : seed % 3 === 0 ? 1 : 0;
      const counts = [0, 0, 0, 0, 0];
      // 与页面原因顺序一致，每起事件只计入一个原因。
      const causePattern = [0, 0, 1, 0, 2, 1, 0, 3, 2, 4];
      for (let event = 0; event < leaks + bursts; event++) {
        counts[causePattern[(seed + event) % causePattern.length]]++;
      }

      return {
        date: `${key}T00:00:00`,
        partition,
        totalAlarms,
        alarms,
        deviceIds: Array.from({ length: Math.min(alarms, 4) }, (_, i) => `DEMO-DEVICE-${index + 1}-${(seed + i) % 12 + 1}`),
        valveIds: Array.from({ length: Math.min(alarms, 2) }, (_, i) => `DEMO-VALVE-${index + 1}-${(seed + i) % 8 + 1}`),
        repairs,
        completed,
        overdueRepairs: unfinished ? seed % (unfinished + 1) : 0,
        totalRepairHours: Number((completed * (2.5 + seed % 9 * 0.6)).toFixed(2)),
        leaks,
        bursts,
        counts,
      };
    });
  }).flat();
}
