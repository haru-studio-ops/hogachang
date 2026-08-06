import { describe, expect, it } from "vitest";
import {
  buildLessonCandles,
  dailyScoreSeries,
  hasDeadCross,
  movingAverage,
} from "@/lib/chart";
import { emptyLessonRecord } from "@/lib/progress";
import { createDefaultStore } from "@/lib/storage";
import type { ProgressStore } from "@/types/progress";

const ORDER = [
  { id: "0-1-1", title: "물물교환", level: 0 },
  { id: "0-1-2", title: "세 기능", level: 0 },
  { id: "0-1-3", title: "금본위제", level: 0 },
];

function storeWith(lessons: ProgressStore["lessons"]): ProgressStore {
  return { ...createDefaultStore(), lessons };
}

describe("buildLessonCandles", () => {
  it("완료 레슨만, completedAt 순서로 캔들이 된다", () => {
    const store = storeWith({
      "0-1-2": {
        ...emptyLessonRecord(),
        status: "completed",
        quizScore: 1,
        attempts: 1,
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      "0-1-1": {
        ...emptyLessonRecord(),
        status: "completed",
        quizScore: 0.8,
        attempts: 3,
        practiceDone: true,
        completedAt: "2026-01-02T00:00:00.000Z",
      },
      "0-1-3": { ...emptyLessonRecord(), status: "in_progress", attempts: 1 },
    });
    const candles = buildLessonCandles(ORDER, store);
    expect(candles.map((c) => c.lessonId)).toEqual(["0-1-2", "0-1-1"]);
  });

  it("몸통=정답률, 아래꼬리=재시도, 위꼬리=실습, 색=첫 시도 통과 여부", () => {
    const store = storeWith({
      "0-1-1": {
        ...emptyLessonRecord(),
        status: "completed",
        quizScore: 0.8,
        attempts: 3,
        practiceDone: true,
        completedAt: "2026-01-02T00:00:00.000Z",
      },
    });
    const [c] = buildLessonCandles(ORDER, store);
    expect(c.score).toBe(0.8);
    expect(c.retries).toBe(2);
    expect(c.practiceDone).toBe(true);
    expect(c.passedFirstTry).toBe(false);
  });

  it("기록이 없으면 빈 배열", () => {
    expect(buildLessonCandles(ORDER, createDefaultStore())).toEqual([]);
  });
});

describe("movingAverage", () => {
  it("창이 차기 전에는 null, 이후엔 평균", () => {
    expect(movingAverage([1, 2, 3, 4], 3)).toEqual([null, null, 2, 3]);
  });

  it("빈 배열은 빈 배열", () => {
    expect(movingAverage([], 5)).toEqual([]);
  });
});

describe("hasDeadCross", () => {
  it("MA5가 위에 있다가 아래로 내려오면 true", () => {
    const ma5 = [null, 0.9, 0.9, 0.7, 0.6];
    const ma20 = [null, 0.8, 0.8, 0.8, 0.8];
    expect(hasDeadCross(ma5, ma20)).toBe(true);
  });

  it("한 번도 위에 있었던 적이 없으면 돌파가 아니므로 false", () => {
    expect(hasDeadCross([0.5, 0.5], [0.8, 0.8])).toBe(false);
  });

  it("아래로 갔다가 다시 위로 회복하면 false", () => {
    const ma5 = [0.9, 0.6, 0.9];
    const ma20 = [0.8, 0.8, 0.8];
    expect(hasDeadCross(ma5, ma20)).toBe(false);
  });

  it("MA20이 아직 없으면(데이터 부족) false", () => {
    expect(hasDeadCross([0.9, 0.6], [null, null])).toBe(false);
  });
});

describe("dailyScoreSeries", () => {
  it("날짜 오름차순 정답률 배열", () => {
    const store = createDefaultStore();
    store.dailyTests = {
      "2026-01-02": { score: 4, total: 8, questionIds: [], wrongIds: [], completedAt: "" },
      "2026-01-01": { score: 8, total: 8, questionIds: [], wrongIds: [], completedAt: "" },
    };
    expect(dailyScoreSeries(store)).toEqual([1, 0.5]);
  });
});
