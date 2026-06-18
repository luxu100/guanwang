export function buildDateTimeValue(date: string, time: string, fallbackTime?: string): string;
export function splitDateTimeValue(value?: string): {
  date: string;
  time: string;
};
export function getTodayDate(): string;
