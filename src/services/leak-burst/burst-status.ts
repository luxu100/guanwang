import type { BurstStatus } from './types';

/** 可供 GIS 标记与识别列表共用。BURST 只能来自确认结果。 */
export const burstStatuses = {
  NORMAL: { label: '正常', color: '#16a34a', tagClass: 'status-tag--success' },
  SUSPECTED_BURST: { label: '疑似爆管', color: '#f59e0b', tagClass: 'status-tag--warning' },
  BURST: { label: '已确认爆管', color: '#dc2626', tagClass: 'status-tag--danger' },
} as const;

export function burstStatusInfo(status?: BurstStatus, suspected?: boolean) {
  if (status && burstStatuses[status]) return burstStatuses[status];
  if (suspected === true) return burstStatuses.SUSPECTED_BURST;
  if (suspected === false) return burstStatuses.NORMAL;
  return { label: '未知', color: '#94a3b8', tagClass: 'status-tag--default' };
}
