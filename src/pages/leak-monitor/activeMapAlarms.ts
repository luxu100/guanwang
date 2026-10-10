export interface ActiveMapAlarm {
  deviceNumber: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  count: number;
  longitude: number | null;
  latitude: number | null;
  countryCode: string | null;
}

function coordinate(value: unknown, limit: number) {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export function normalizeActiveMapAlarms(response: { code?: number; msg?: string; data?: unknown }): ActiveMapAlarm[] {
  if (response.code !== 200) throw new Error(response.msg || 'Alarm request failed');
  const data = response.data as { items?: Record<string, unknown>[] } | undefined;
  if (!data || !Array.isArray(data.items)) throw new Error('Invalid alarm response');
  const groups = new Map<string, ActiveMapAlarm>();
  const severity = { INFO: 0, WARNING: 1, CRITICAL: 2 };
  for (const row of data.items) {
    if (!row || typeof row !== 'object') throw new Error('Invalid alarm record');
    const deviceNumber = String(row.deviceNumber || '').trim();
    if (!deviceNumber) continue;
    const rawLevel = String(row.alarmLevel || '').toUpperCase();
    const level = rawLevel === 'CRITICAL' || rawLevel === 'WARNING' ? rawLevel : 'INFO';
    const prior = groups.get(deviceNumber);
    if (prior) {
      prior.count++;
      if (severity[level] > severity[prior.level]) prior.level = level;
    } else groups.set(deviceNumber, {
      deviceNumber, level, count: 1,
      longitude: coordinate(row.longitude, 180), latitude: coordinate(row.latitude, 90),
      countryCode: /^[A-Z]{2}$/.test(String(row.countryCode || '').trim().toUpperCase()) ? String(row.countryCode).trim().toUpperCase() : null,
    });
  }
  return [...groups.values()];
}
