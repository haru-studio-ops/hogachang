import type { ProgressStore, SrsCard } from "@/types/progress";
import { endOfToday } from "@/lib/date";

/** 간격 반복 사다리 (일). PROJECT_SPEC 5.4 */
export const SRS_INTERVALS = [1, 3, 7, 16, 35];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** 오답: 1일로 리셋 (미등록이면 신규 등록), lapses +1 */
export function srsOnWrong(card: SrsCard | undefined, now: Date = new Date()): SrsCard {
  return {
    interval: 1,
    dueAt: addDays(now, 1).toISOString(),
    lapses: (card?.lapses ?? 0) + 1,
  };
}

/** 정답: 사다리의 다음 간격으로. 최대 35일 유지 */
export function srsOnCorrect(card: SrsCard, now: Date = new Date()): SrsCard {
  const next = SRS_INTERVALS.find((i) => i > card.interval);
  const interval = next ?? SRS_INTERVALS[SRS_INTERVALS.length - 1];
  return { interval, dueAt: addDays(now, interval).toISOString(), lapses: card.lapses };
}

/** 오늘(로컬 자정)까지 만기인 카드의 문항 id */
export function dueQuestionIds(
  srs: ProgressStore["srs"],
  now: Date = new Date()
): string[] {
  const cutoff = endOfToday(now).getTime();
  return Object.entries(srs)
    .filter(([, card]) => new Date(card.dueAt).getTime() <= cutoff)
    .map(([id]) => id);
}
