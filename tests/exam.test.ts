import { describe, expect, it } from "vitest";
import {
  DAILY_SIZE,
  EXAM_PASS_THRESHOLD,
  applyDailyResult,
  applyExamResult,
  canTakeExam,
  composeDailyTest,
  composeExam,
  gradeBatch,
  seedFromString,
  updateStreak,
  weightedSample,
} from "@/lib/exam";
import { createDefaultStore } from "@/lib/storage";
import { mulberry32 } from "@/lib/finance/random";
import type { BankQuestion, QuizItem } from "@/types/content";
import type { ProgressStore } from "@/types/progress";

const NOW = new Date("2026-08-07T10:00:00");

function q(lessonId: string, n: number, examOnly = false): BankQuestion {
  return {
    id: `${lessonId}#q${n}`,
    lessonId,
    level: Number(lessonId.split("-")[0]),
    module: lessonId.split("-").slice(0, 2).join("-"),
    difficulty: 1,
    tags: [],
    examOnly,
    item: { q: `${lessonId} 문제 ${n}`, choices: ["a", "b"], answer: 0, explain: "해설" },
  };
}

/** lessonId당 4문항(+1 examOnly)짜리 은행 */
function makeBank(lessonIds: string[]): BankQuestion[] {
  return lessonIds.flatMap((id) => [
    q(id, 1),
    q(id, 2),
    q(id, 3),
    q(id, 4),
    q(id, 5, true),
  ]);
}

function storeWithCompleted(lessonIds: string[], now = NOW): ProgressStore {
  const store = createDefaultStore();
  lessonIds.forEach((id, i) => {
    store.lessons[id] = {
      status: "completed",
      quizScore: 1,
      attempts: 1,
      practiceDone: false,
      mySummary: "a\nb\nc",
      completedAt: new Date(now.getTime() - (lessonIds.length - i) * 86_400_000).toISOString(),
      note: "",
    };
  });
  return store;
}

describe("composeDailyTest", () => {
  it("학습 이력이 없으면 null", () => {
    expect(composeDailyTest(makeBank(["0-1-1"]), createDefaultStore(), "2026-08-07", NOW)).toBeNull();
  });

  it("출제 가능 문항이 4개 미만이면 null", () => {
    const bank = [q("0-1-1", 1), q("0-1-1", 2), q("0-1-1", 3)];
    const store = storeWithCompleted(["0-1-1"]);
    expect(composeDailyTest(bank, store, "2026-08-07", NOW)).toBeNull();
  });

  it("이력이 충분하면 8문항, 중복 없음, examOnly 제외", () => {
    const bank = makeBank(["0-1-1", "0-1-2", "0-1-3"]);
    const store = storeWithCompleted(["0-1-1", "0-1-2", "0-1-3"]);
    const ids = composeDailyTest(bank, store, "2026-08-07", NOW);
    expect(ids).not.toBeNull();
    expect(ids!.length).toBe(DAILY_SIZE);
    expect(new Set(ids).size).toBe(DAILY_SIZE);
    expect(ids!.every((id) => !id.endsWith("#q5"))).toBe(true);
  });

  it("최근 학습 레슨(completedAt 최신)에서 최소 3문항 출제", () => {
    const bank = makeBank(["0-1-1", "0-1-2", "0-1-3"]);
    const store = storeWithCompleted(["0-1-1", "0-1-2", "0-1-3"]);
    // 0-1-3이 가장 최근
    const ids = composeDailyTest(bank, store, "2026-08-07", NOW)!;
    const recent = ids.filter((id) => id.startsWith("0-1-3#"));
    expect(recent.length).toBeGreaterThanOrEqual(3);
  });

  it("SRS 만기 카드가 있으면 포함된다", () => {
    const bank = makeBank(["0-1-1", "0-1-2", "0-1-3"]);
    const store = storeWithCompleted(["0-1-1", "0-1-2", "0-1-3"]);
    store.srs["0-1-1#q1"] = { interval: 1, dueAt: "2026-08-06T00:00:00.000Z", lapses: 1 };
    const ids = composeDailyTest(bank, store, "2026-08-07", NOW)!;
    expect(ids).toContain("0-1-1#q1");
  });

  it("같은 dateKey면 같은 출제 (결정적)", () => {
    const bank = makeBank(["0-1-1", "0-1-2", "0-1-3"]);
    const store = storeWithCompleted(["0-1-1", "0-1-2", "0-1-3"]);
    const a = composeDailyTest(bank, store, "2026-08-07", NOW);
    const b = composeDailyTest(bank, store, "2026-08-07", NOW);
    expect(a).toEqual(b);
  });

  it("이력이 4~7문항이면 그 수만큼만 출제한다", () => {
    const bank = [q("0-1-1", 1), q("0-1-1", 2), q("0-1-1", 3), q("0-1-1", 4)];
    const store = storeWithCompleted(["0-1-1"]);
    const ids = composeDailyTest(bank, store, "2026-08-07", NOW)!;
    expect(ids.length).toBe(4);
  });
});

describe("weightedSample", () => {
  it("오답률 높은 문항이 더 자주 뽑힌다", () => {
    const pool = [q("0-1-1", 1), q("0-1-1", 2)];
    const stats = {
      "0-1-1#q1": { seen: 10, wrong: 10 }, // weight 3
      "0-1-1#q2": { seen: 10, wrong: 0 }, // weight 1
    };
    let first = 0;
    for (let s = 0; s < 500; s++) {
      const picked = weightedSample(pool, 1, stats, mulberry32(s));
      if (picked[0].id === "0-1-1#q1") first++;
    }
    // 기대 비율 3/4 = 375회 근방
    expect(first).toBeGreaterThan(300);
  });

  it("후보보다 많이 요구해도 후보 수만큼만 돌려준다", () => {
    const picked = weightedSample([q("0-1-1", 1)], 5, {}, mulberry32(1));
    expect(picked.length).toBe(1);
  });
});

describe("gradeBatch / seedFromString", () => {
  it("일괄 채점: 정오답 배열", () => {
    const items: QuizItem[] = [
      { q: "a", choices: ["x", "y"], answer: 1, explain: "" },
      { kind: "numeric", q: "b", answerValue: 50, tolerance: 1, explain: "" },
    ];
    expect(gradeBatch(items, [1, 50.5])).toEqual([true, true]);
    expect(gradeBatch(items, [0, null])).toEqual([false, false]);
  });

  it("같은 문자열은 같은 시드", () => {
    expect(seedFromString("daily-2026-08-07")).toBe(seedFromString("daily-2026-08-07"));
    expect(seedFromString("a")).not.toBe(seedFromString("b"));
  });
});

describe("updateStreak", () => {
  it("첫 테스트면 1", () => {
    const s = updateStreak({ current: 0, longest: 0, lastTestAt: null }, "2026-08-07");
    expect(s).toEqual({ current: 1, longest: 1, lastTestAt: "2026-08-07" });
  });

  it("어제에 이어 하면 +1, longest 갱신", () => {
    const s = updateStreak({ current: 3, longest: 3, lastTestAt: "2026-08-06" }, "2026-08-07");
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });

  it("하루 건너뛰면 1로 리셋, longest 유지", () => {
    const s = updateStreak({ current: 5, longest: 5, lastTestAt: "2026-08-04" }, "2026-08-07");
    expect(s.current).toBe(1);
    expect(s.longest).toBe(5);
  });

  it("같은 날 중복 반영은 무시", () => {
    const prev = { current: 2, longest: 4, lastTestAt: "2026-08-07" };
    expect(updateStreak(prev, "2026-08-07")).toEqual(prev);
  });

  it("월 경계를 넘겨도 연속으로 계산한다", () => {
    const s = updateStreak({ current: 1, longest: 1, lastTestAt: "2026-07-31" }, "2026-08-01");
    expect(s.current).toBe(2);
  });
});

describe("applyDailyResult", () => {
  it("dailyTests·questionStats·srs·streak를 갱신한다", () => {
    const store = storeWithCompleted(["0-1-1"]);
    const next = applyDailyResult(store, {
      dateKey: "2026-08-07",
      questionIds: ["0-1-1#q1", "0-1-1#q2"],
      corrects: [true, false],
      now: NOW,
    });
    expect(next.dailyTests["2026-08-07"]).toMatchObject({
      score: 1,
      total: 2,
      wrongIds: ["0-1-1#q2"],
    });
    expect(next.questionStats["0-1-1#q1"]).toEqual({ seen: 1, wrong: 0 });
    expect(next.questionStats["0-1-1#q2"]).toEqual({ seen: 1, wrong: 1 });
    // 오답만 SRS 신규 등록
    expect(next.srs["0-1-1#q2"].interval).toBe(1);
    expect(next.srs["0-1-1#q1"]).toBeUndefined();
    expect(next.streak.current).toBe(1);
    // 원본 불변
    expect(store.dailyTests["2026-08-07"]).toBeUndefined();
  });

  it("기존 SRS 카드는 정답이면 다음 간격으로 올라간다", () => {
    const store = storeWithCompleted(["0-1-1"]);
    store.srs["0-1-1#q1"] = { interval: 1, dueAt: NOW.toISOString(), lapses: 1 };
    const next = applyDailyResult(store, {
      dateKey: "2026-08-07",
      questionIds: ["0-1-1#q1"],
      corrects: [true],
      now: NOW,
    });
    expect(next.srs["0-1-1#q1"].interval).toBe(3);
  });
});

describe("졸업시험", () => {
  const lessonIds = ["0-1-1", "0-1-2", "0-1-3", "0-1-4", "0-1-5", "0-2-1"];
  const bank = makeBank(lessonIds); // 30문항 (examOnly 포함)

  it("composeExam: 25문항, 중복 없음, examOnly 포함 가능, 해당 레벨만", () => {
    const store = storeWithCompleted(lessonIds);
    const ids = composeExam(bank, 0, store, 42);
    expect(ids.length).toBe(25);
    expect(new Set(ids).size).toBe(25);
    expect(ids.every((id) => id.startsWith("0-"))).toBe(true);
  });

  it("composeExam: 풀이 25 미만이면 있는 만큼", () => {
    const store = storeWithCompleted(["0-1-1"]);
    expect(composeExam(makeBank(["0-1-1"]), 0, store, 1).length).toBe(5);
  });

  it("시드가 다르면 다른 출제 (재응시 새 문항)", () => {
    const store = storeWithCompleted(lessonIds);
    const a = composeExam(bank, 0, store, 1);
    const b = composeExam(bank, 0, store, 2);
    expect(a).not.toEqual(b);
  });

  it("canTakeExam: 레벨 레슨 미완료면 불가", () => {
    const store = storeWithCompleted(["0-1-1"]);
    const gate = canTakeExam(store, 0, lessonIds, NOW);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe("lessons_incomplete");
  });

  it("canTakeExam: 전부 완료면 가능", () => {
    const store = storeWithCompleted(lessonIds);
    expect(canTakeExam(store, 0, lessonIds, NOW).ok).toBe(true);
  });

  it("canTakeExam: 불합격 후 24시간 이내는 불가, 이후 가능", () => {
    const store = storeWithCompleted(lessonIds);
    store.exams["0"] = {
      attempts: [{ score: 10, total: 25, passed: false, at: NOW.toISOString() }],
      passed: false,
    };
    const soon = new Date(NOW.getTime() + 3 * 3_600_000);
    const later = new Date(NOW.getTime() + 25 * 3_600_000);
    const blocked = canTakeExam(store, 0, lessonIds, soon);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("cooldown");
    expect(canTakeExam(store, 0, lessonIds, later).ok).toBe(true);
  });

  it("canTakeExam: 이미 합격이면 불가(already_passed)", () => {
    const store = storeWithCompleted(lessonIds);
    store.exams["0"] = { attempts: [], passed: true };
    const gate = canTakeExam(store, 0, lessonIds, NOW);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe("already_passed");
  });

  it("합격선은 80%다: 20/25 합격, 19/25 불합격", () => {
    expect(EXAM_PASS_THRESHOLD).toBe(0.8);
    const store = storeWithCompleted(lessonIds);
    const questions = composeExam(bank, 0, store, 7).map((id) => ({
      id,
      lessonId: id.split("#")[0],
    }));
    const pass = applyExamResult(store, {
      level: 0,
      questions,
      corrects: questions.map((_, i) => i < 20),
      now: NOW,
    });
    expect(pass.exams["0"].passed).toBe(true);
    const fail = applyExamResult(store, {
      level: 0,
      questions,
      corrects: questions.map((_, i) => i < 19),
      now: NOW,
    });
    expect(fail.exams["0"].passed).toBe(false);
    expect(fail.exams["0"].attempts[0]).toMatchObject({ score: 19, total: 25, passed: false });
  });

  it("불합격 시 오답 문항의 레슨이 needs_review로 표시된다", () => {
    const store = storeWithCompleted(lessonIds);
    const questions = [
      { id: "0-1-1#q1", lessonId: "0-1-1" },
      { id: "0-1-2#q1", lessonId: "0-1-2" },
    ];
    const next = applyExamResult(store, {
      level: 0,
      questions,
      corrects: [true, false],
      now: NOW,
    });
    expect(next.lessons["0-1-1"].status).toBe("completed");
    expect(next.lessons["0-1-2"].status).toBe("needs_review");
    // completedAt은 유지 (재응시 자격 유지)
    expect(next.lessons["0-1-2"].completedAt).not.toBeNull();
  });

  it("합격 시 needs_review 표시는 하지 않는다", () => {
    const store = storeWithCompleted(lessonIds);
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `0-1-1#q${i}`,
      lessonId: "0-1-1",
    }));
    const next = applyExamResult(store, {
      level: 0,
      questions,
      corrects: questions.map((_, i) => i < 9), // 90%
      now: NOW,
    });
    expect(next.exams["0"].passed).toBe(true);
    expect(next.lessons["0-1-1"].status).toBe("completed");
  });
});
