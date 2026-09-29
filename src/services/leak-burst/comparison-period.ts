/** 同比固定为去年同期，环比固定为上月同期。月末、闰日按目标月末截断。 */
export function dateLabel(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftMonths(date: Date, count: number) {
  const shifted = new Date(date.getFullYear(), date.getMonth() + count, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return shifted;
}

export function comparisonWindows(period: string, periodValue: string, asOfDate?: string) {
  const start = new Date((periodValue.length === 7 ? `${periodValue}-01` : periodValue).replace(/-/g, '/'));
  const end = period === 'MONTH' ? new Date(start.getFullYear(), start.getMonth() + 1, 0) : new Date(start);
  if (period === 'MONTH' && asOfDate && asOfDate.slice(0, 7) === periodValue) {
    end.setDate(Number(asOfDate.slice(8, 10)));
  }
  const range = (months: number) => {
    const from = shiftMonths(start, months);
    const to = shiftMonths(end, months);
    if (period === 'MONTH' && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()) {
      to.setMonth(to.getMonth() + 1, 0);
    }
    const label = dateLabel(from) === dateLabel(to) ? dateLabel(from) : `${dateLabel(from)} ～ ${dateLabel(to)}`;
    return { start: from, end: to, label };
  };
  return { current: range(0), yoy: range(-12), mom: range(-1) };
}
