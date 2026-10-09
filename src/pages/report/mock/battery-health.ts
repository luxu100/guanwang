export interface Detection { id: string; date: string; operator: string; voltage: number; capacity: number; charge?: number; health?: number; days?: number; remark?: string }
export interface Battery { id: string; number: string; records: Detection[] }

// 临时 mock 数据入口；接口就绪后，用接口返回值替换初始化数据。
// 每次创建独立数据，页面内增删改不会修改 mock 源数据。
export function createMockBatteries(localeText: (zh: string, en: string) => string = zh => zh): Battery[] {
  return [
    {
      id: 'BAT001', number: '260001', records: [
        { id: 'mock-001-2', date: '2026-10-08T09:30:00', operator: localeText("张三", "Zhang San"), voltage: 11.8, capacity: 8200, charge: 82, health: 86, days: 182, remark: localeText("例行巡检，电池外观及接线正常。", "Routine inspection: battery casing and wiring are normal.") },
        { id: 'mock-001-1', date: '2026-09-15T10:20:00', operator: localeText("李四", "Li Si"), voltage: 12.0, capacity: 8400, charge: 90, health: 89, days: 205, remark: localeText("首次检测，运行正常。", "Initial inspection: operating normally.") },
      ],
    },
    {
      id: 'BAT002', number: '260002', records: [
        { id: 'mock-002-2', date: '2026-10-08T10:15:00', operator: localeText("李四", "Li Si"), voltage: 10.6, capacity: 6100, charge: 61, health: 65, days: 72, remark: localeText("容量下降，建议增加检测频次。", "Capacity has declined. Increase inspection frequency.") },
        { id: 'mock-002-1', date: '2026-09-16T14:00:00', operator: localeText("张三", "Zhang San"), voltage: 11.0, capacity: 6800, charge: 73, health: 73, days: 95, remark: localeText("持续观察电压变化。", "Continue monitoring voltage changes.") },
      ],
    },
    {
      id: 'BAT003', number: '260003', records: [
        { id: 'mock-003-1', date: '2026-10-07T15:40:00', operator: localeText("王五", "Wang Wu"), voltage: 9.4, capacity: 4300, charge: 35, health: 35, days: 18, remark: localeText("电池衰减明显，建议安排更换。", "Significant battery degradation. Schedule replacement.") },
      ],
    },
    {
      id: 'BAT004', number: '260004', records: [
        { id: 'mock-004-1', date: '2026-10-08T11:00:00', operator: localeText("张三", "Zhang San"), voltage: 11.7, capacity: 8100, charge: 80, health: 84, days: 176, remark: localeText("检测正常。", "Inspection normal.") },
      ],
    },
    {
      id: 'BAT005', number: '260005', records: [
        { id: 'mock-005-1', date: '2026-10-08T13:30:00', operator: localeText("王五", "Wang Wu"), voltage: 11.2, capacity: 7200, charge: 70, health: 78, days: 88, remark: localeText("接近预警阈值，持续跟踪。", "Near the warning threshold. Continue monitoring.") },
      ],
    },
    {
      id: 'BAT006', number: '260006', records: [
        { id: 'mock-006-1', date: '2026-10-08T14:10:00', operator: localeText("李四", "Li Si"), voltage: 9.8, capacity: 4900, charge: 42, health: 52, days: 25, remark: localeText("已提交更换建议。", "Replacement recommendation submitted.") },
      ],
    },
    {
      id: 'BAT007', number: '260007', records: [
        { id: 'mock-007-1', date: '2026-10-08T16:00:00', operator: localeText("张三", "Zhang San"), voltage: 11.9, capacity: 8300, charge: 85, remark: localeText("检测数据已录入，等待预测结果。", "Inspection data recorded. Awaiting prediction results.") },
      ],
    },
    { id: 'BAT008', number: '260008', records: [] },
  ];
}
