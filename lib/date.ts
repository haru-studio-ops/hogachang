/** 로컬 기준 'YYYY-MM-DD' 키 (dailyTests, SRS 날짜 비교용) */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘(로컬)의 마지막 순간. dueAt <= 이 값이면 "오늘 복습" */
export function endOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}
