import { describe, expect, it } from "vitest";
import { SRS_INTERVALS, dueQuestionIds, srsOnCorrect, srsOnWrong } from "@/lib/srs";
import type { SrsCard } from "@/types/progress";

const NOW = new Date("2026-08-07T10:00:00");

function daysBetween(from: Date, iso: string): number {
  return Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);
}

describe("SRS 간격 사다리", () => {
  it("간격은 1→3→7→16→35일이다", () => {
    expect(SRS_INTERVALS).toEqual([1, 3, 7, 16, 35]);
  });

  it("오답: 미등록 문항은 1일 간격으로 신규 등록, lapses 1", () => {
    const card = srsOnWrong(undefined, NOW);
    expect(card.interval).toBe(1);
    expect(card.lapses).toBe(1);
    expect(daysBetween(NOW, card.dueAt)).toBe(1);
  });

  it("오답: 기존 카드는 1일로 리셋되고 lapses가 +1 된다", () => {
    const prev: SrsCard = { interval: 16, dueAt: NOW.toISOString(), lapses: 2 };
    const card = srsOnWrong(prev, NOW);
    expect(card.interval).toBe(1);
    expect(card.lapses).toBe(3);
    expect(daysBetween(NOW, card.dueAt)).toBe(1);
  });

  it("정답: 다음 간격으로 올라간다 (1→3, 7→16)", () => {
    const a = srsOnCorrect({ interval: 1, dueAt: NOW.toISOString(), lapses: 0 }, NOW);
    expect(a.interval).toBe(3);
    expect(daysBetween(NOW, a.dueAt)).toBe(3);
    const b = srsOnCorrect({ interval: 7, dueAt: NOW.toISOString(), lapses: 1 }, NOW);
    expect(b.interval).toBe(16);
    expect(b.lapses).toBe(1);
  });

  it("정답: 최대 간격 35일에서 더 올라가지 않는다", () => {
    const card = srsOnCorrect({ interval: 35, dueAt: NOW.toISOString(), lapses: 0 }, NOW);
    expect(card.interval).toBe(35);
    expect(daysBetween(NOW, card.dueAt)).toBe(35);
  });
});

describe("dueQuestionIds", () => {
  it("오늘 자정까지 만기인 카드만 돌려준다", () => {
    const srs = {
      "0-1-1#q1": { interval: 1, dueAt: "2026-08-07T09:00:00.000Z", lapses: 1 },
      "0-1-1#q2": { interval: 3, dueAt: "2026-08-01T00:00:00.000Z", lapses: 0 },
      "0-1-2#q1": { interval: 7, dueAt: "2026-09-01T00:00:00.000Z", lapses: 0 },
    };
    const due = dueQuestionIds(srs, NOW);
    expect(due.sort()).toEqual(["0-1-1#q1", "0-1-1#q2"]);
  });

  it("빈 srs면 빈 배열", () => {
    expect(dueQuestionIds({}, NOW)).toEqual([]);
  });
});
