const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

export function buildDateTimeValue(date, time, fallbackTime = "00:00:00") {
  if (!DATE_PATTERN.test(String(date || ""))) {
    return "";
  }

  const nextTime = TIME_PATTERN.test(String(time || "")) ? String(time) : fallbackTime;
  const normalizedTime = nextTime.length === 5 ? `${nextTime}:00` : nextTime;

  return `${date} ${normalizedTime}`;
}

export function splitDateTimeValue(value) {
  const [date = "", rawTime = ""] = String(value || "").trim().split(/\s+/);
  const time = rawTime.slice(0, 5);

  return {
    date: DATE_PATTERN.test(date) ? date : "",
    time: /^\d{2}:\d{2}$/.test(time) ? time : "",
  };
}

export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
