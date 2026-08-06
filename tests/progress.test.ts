import { describe, expect, it } from "vitest";
import {
  applyQuizAttempt,
  completedLessonCount,
  completeLesson,
  completionBlockers,
  countSummaryLines,
  deriveStatus,
  emptyLessonRecord,
  gradeQuizItem,
  isQuizPassed,
  isSummaryValid,
  prerequisitesMet,
  scoreQuiz,
} from "@/lib/progress";
import { createDefaultStore } from "@/lib/storage";
import type { QuizItem } from "@/types/content";
import type { ProgressStore } from "@/types/progress";

const choice: QuizItem = {
  q: "Q",
  choices: ["a", "b", "c", "d"],
  answer: 2,
  explain: "E",
};
const ox: QuizItem = { q: "Q", choices: ["O", "X"], answer: 0, explain: "E" };
const numeric: QuizItem = {
  kind: "numeric",
  q: "몇 주?",
  answerValue: 4,
  explain: "E",
};

function storeWith(lessons: ProgressStore["lessons"]): ProgressStore {
  return { ...createDefaultStore(), lessons };
}

describe("자기 요약 줄 수", () => {
  it("빈 줄과 공백 줄은 세지 않는다", () => {
    expect(countSummaryLines("한 줄\n\n  \n두 줄")).toBe(2);
    expect(countSummaryLines("")).toBe(0);
  });

  it("3줄 이상이어야 유효하다", () => {
    expect(isSummaryValid("일\n이")).toBe(false);
    expect(isSummaryValid("일\n이\n삼")).toBe(true);
  });
});

describe("퀴즈 채점", () => {
  it("객관식은 인덱스 일치로 채점한다", () => {
    expect(gradeQuizItem(choice, 2)).toBe(true);
    expect(gradeQuizItem(choice, 0)).toBe(false);
    expect(gradeQuizItem(choice, null)).toBe(false);
  });

  it("O/X도 객관식과 동일하게 처리한다", () => {
    expect(gradeQuizItem(ox, 0)).toBe(true);
    expect(gradeQuizItem(ox, 1)).toBe(false);
  });

  it("계산형은 숫자 일치(허용 오차 포함)로 채점한다", () => {
    expect(gradeQuizItem(numeric, 4)).toBe(true);
    expect(gradeQuizItem(numeric, 5)).toBe(false);
    expect(
      gradeQuizItem({ ...numeric, tolerance: 0.5 }, 4.4)
    ).toBe(true);
  });

  it("정답률을 0~1로 계산한다", () => {
    expect(scoreQuiz([choice, ox, numeric, choice], [2, 0, 4, 0])).toBe(0.75);
    expect(scoreQuiz([choice], [null])).toBe(0);
  });

  it("80% 이상이 통과다", () => {
    expect(isQuizPassed(0.8)).toBe(true);
    expect(isQuizPassed(0.75)).toBe(false);
    expect(isQuizPassed(null)).toBe(false);
  });
});

describe("잠금 해제 규칙 (PROJECT_SPEC 5.1)", () => {
  const completed = { ...emptyLessonRecord(), status: "completed" as const };

  it("선행 레슨이 없으면 available", () => {
    expect(deriveStatus([], storeWith({}), "0-1-1")).toBe("available");
  });

  it("선행 레슨이 미완료면 locked", () => {
    expect(prerequisitesMet(["0-1-1"], {})).toBe(false);
    expect(deriveStatus(["0-1-1"], storeWith({}), "0-1-2")).toBe("locked");
  });

  it("선행 레슨을 완료하면 다음 레슨이 열린다", () => {
    const store = storeWith({ "0-1-1": completed });
    expect(deriveStatus(["0-1-1"], store, "0-1-2")).toBe("available");
  });

  it("완료된 레슨은 완료 상태를 유지한다 (복습에 잠금 없음)", () => {
    const store = storeWith({ "0-1-1": completed });
    expect(deriveStatus([], store, "0-1-1")).toBe("completed");
  });
});

describe("완료 조건: 퀴즈 80% + 자기 요약 3줄", () => {
  const good = {
    quizScore: 1,
    mySummary: "돈은 합의다\n물물교환은 비효율적이다\n장부가 본질이다",
  };

  it("조건 충족 시 막는 사유가 없다", () => {
    expect(completionBlockers(good, true)).toEqual([]);
  });

  it("퀴즈 미응시·미달이면 막힌다", () => {
    expect(completionBlockers({ ...good, quizScore: null }, true)).toHaveLength(1);
    expect(completionBlockers({ ...good, quizScore: 0.75 }, true)).toHaveLength(1);
  });

  it("요약이 3줄 미만이면 막힌다", () => {
    const blockers = completionBlockers({ ...good, mySummary: "한 줄" }, true);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain("3줄");
  });

  it("선행 레슨 미완료면 막힌다", () => {
    expect(completionBlockers(good, false)).toHaveLength(1);
  });
});

describe("스토어 전이 (불변)", () => {
  it("퀴즈 응시는 시도 횟수를 늘리고 최고 점수를 유지한다", () => {
    let store = storeWith({});
    store = applyQuizAttempt(store, "0-1-1", 0.5);
    store = applyQuizAttempt(store, "0-1-1", 1);
    store = applyQuizAttempt(store, "0-1-1", 0.75);
    const record = store.lessons["0-1-1"];
    expect(record.attempts).toBe(3);
    expect(record.quizScore).toBe(1);
    expect(record.status).toBe("in_progress");
  });

  it("완료 처리 시 completedAt을 기록한다", () => {
    let store = storeWith({});
    store = applyQuizAttempt(store, "0-1-1", 1);
    store = {
      ...store,
      lessons: {
        ...store.lessons,
        "0-1-1": {
          ...store.lessons["0-1-1"],
          mySummary: "일\n이\n삼",
        },
      },
    };
    const now = new Date("2026-08-06T12:00:00Z");
    store = completeLesson(store, "0-1-1", true, now);
    expect(store.lessons["0-1-1"].status).toBe("completed");
    expect(store.lessons["0-1-1"].completedAt).toBe(now.toISOString());
    expect(completedLessonCount(store)).toBe(1);
  });

  it("조건 미충족이면 완료 처리를 거부한다", () => {
    let store = storeWith({});
    store = applyQuizAttempt(store, "0-1-1", 0.5);
    const after = completeLesson(store, "0-1-1", true);
    expect(after).toBe(store);
    expect(after.lessons["0-1-1"].status).toBe("in_progress");
  });

  it("원본 스토어를 변경하지 않는다", () => {
    const store = storeWith({});
    applyQuizAttempt(store, "0-1-1", 1);
    expect(store.lessons["0-1-1"]).toBeUndefined();
  });
});
