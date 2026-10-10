import type { ActiveMapAlarm } from '@/pages/leak-monitor/activeMapAlarms';
import { normalizeActiveMapAlarms } from '@/pages/leak-monitor/activeMapAlarms';

export interface AlarmLocation extends ActiveMapAlarm {
  key: string;
  label: string;
  address: string;
  ratio: number;
  tone: 'red' | 'orange' | 'blue';
}

type AlarmPageResponse = { code?: number; msg?: string; data?: unknown };

// The map endpoint has no date filter. Read every page before publishing period statistics.
export async function loadPeriodAlarms(
  request: (query: Record<string, unknown>) => Promise<AlarmPageResponse>,
  dates: { start: string; end: string },
  isActive: () => boolean = () => true,
): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  const ids = new Set<string>();
  let total: number | null = null;
  for (let pageNum = 1; pageNum <= 100; pageNum++) {
    if (!isActive()) throw new Error('Alarm query cancelled');
    const response = await request({
      startTime: `${dates.start}T00:00:00`, endTime: `${dates.end}T23:59:59`,
      pageNum, pageSize: 200, sortOrder: 'desc', sortField: 'firstTriggeredAt',
    });
    if (response.code !== 200) throw new Error(response.msg || 'Alarm request failed');
    const data = response.data as { records?: Record<string, unknown>[]; total?: number } | undefined;
    if (!data || !Array.isArray(data.records) || !Number.isSafeInteger(data.total) || data.total! < 0) {
      throw new Error('Invalid alarm pagination response');
    }
    if (data.total! > 20000) throw new Error('Too many alarms for distribution; select a shorter period');
    if (total !== null && total !== data.total) throw new Error('Alarm records changed during query; refresh to retry');
    total = data.total!;
    for (const row of data.records) {
      if (!row || row.id == null || ids.has(String(row.id))) throw new Error('Invalid or repeated alarm page; refresh to retry');
      ids.add(String(row.id)); records.push(row);
    }
    if (records.length === total) return records;
    if (!data.records.length || records.length > total) throw new Error('Incomplete alarm pagination response');
  }
  throw new Error('Alarm page limit reached; select a shorter period');
}

export function alarmLocations(items: Record<string, unknown>[]): AlarmLocation[] {
  const alarms = normalizeActiveMapAlarms({ code: 200, data: { items } });
  const max = Math.max(1, ...alarms.map((alarm) => alarm.count));
  return alarms.map((alarm) => {
    const record = items.find((row) => String(row.deviceNumber || '').trim() === alarm.deviceNumber)!;
    return {
      ...alarm,
      key: alarm.deviceNumber,
      label: String(record.deviceAlias || record.deviceName || alarm.deviceNumber),
      address: String(record.installAddress || record.address || ''),
      ratio: Math.round(alarm.count / max * 100),
      tone: alarm.level === 'CRITICAL' ? 'red' as const : alarm.level === 'WARNING' ? 'orange' as const : 'blue' as const,
    };
  }).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
