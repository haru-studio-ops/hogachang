import type { QuizItem } from "@/types/content";
import type { LessonRecord, LessonStatus, ProgressStore } from "@/types/progress";

/** 완료(및 다음 레슨 잠금 해제)에 필요한 퀴즈 정답률 */
export const QUIZ_PASS_THRESHOLD = 0.8;
/** 완료에 필요한 자기 요약 최소 줄 수 */
export const MIN_SUMMARY_LINES = 3;

export function emptyLessonRecord(): LessonRecord {
  return {
    status: "available",
    quizScore: null,
    attempts: 0,
    practiceDone: false,
    mySummary: "",
    completedAt: null,
    note: "",
  };
}

/** 내용이 있는 줄 수를 센다 */
export function countSummaryLines(text: string): number {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

export function isSummaryValid(text: string): boolean {
  return countSummaryLines(text) >= MIN_SUMMARY_LINES;
}

/** 사용자 답: 객관식은 선택 인덱스, 계산형은 입력 숫자, 미응답은 null */
export type QuizAnswer = number | null;

export function gradeQuizItem(item: QuizItem, answer: QuizAnswer): boolean {
  if (answer === null) return false;
  if (item.kind === "numeric") {
    const tolerance = item.tolerance ?? 0;
    return Math.abs(answer - item.answerValue) <= tolerance;
  }
  return answer === item.answer;
}

/** 정답률 0~1. 문항이 없으면 1 (통과로 간주하지 않도록 호출부에서 걸러야 하지만, 0으로 나누기 방지) */
export function scoreQuiz(items: QuizItem[], answers: QuizAnswer[]): number {
  if (items.length === 0) return 1;
  const correct = items.filter((item, i) =>
    gradeQuizItem(item, answers[i] ?? null)
  ).length;
  return correct / items.length;
}

export function isQuizPassed(score: number | null): boolean {
  return score !== null && score >= QUIZ_PASS_THRESHOLD;
}

/** 선행 레슨이 전부 완료됐는가 */
export function prerequisitesMet(
  prerequisites: string[],
  lessons: ProgressStore["lessons"]
): boolean {
  return prerequisites.every(
    (id) => lessons[id]?.status === "completed"
  );
}

/**
 * 레슨의 현재 상태를 도출한다.
 * - 완료/복습필요 등 기록된 상태가 있으면 그대로 쓴다 (되돌아가기는 항상 자유 — 완료를 되돌리지 않는다)
 * - 기록이 없거나 미완료면 선행 레슨 충족 여부로 locked/available을 가른다
 */
export function deriveStatus(
  prerequisites: string[],
  store: ProgressStore,
  lessonId: string
): LessonStatus {
  const record = store.lessons[lessonId];
  if (record && (record.status === "completed" || record.status === "needs_review")) {
    return record.status;
  }
  if (!prerequisitesMet(prerequisites, store.lessons)) return "locked";
  if (record && record.status === "in_progress") return "in_progress";
  return "available";
}

/** 완료 버튼을 막는 이유 목록. 비어 있으면 완료 가능 */
export function completionBlockers(
  record: Pick<LessonRecord, "quizScore" | "mySummary">,
  prereqsMet: boolean
): string[] {
  const blockers: string[] = [];
  if (!prereqsMet) {
    blockers.push("선행 레슨을 먼저 완료해야 한다");
  }
  if (!isQuizPassed(record.quizScore)) {
    blockers.push(
      record.quizScore === null
        ? "퀴즈를 아직 풀지 않았다 (정답률 80% 이상 필요)"
        : `퀴즈 정답률이 ${Math.round(record.quizScore * 100)}%다 (80% 이상 필요, 재응시 가능)`
    );
  }
  if (!isSummaryValid(record.mySummary)) {
    blockers.push(
      `자기 요약이 ${countSummaryLines(record.mySummary)}줄이다 (3줄 이상 필요)`
    );
  }
  return blockers;
}

/** 레슨 레코드를 부분 갱신한 새 스토어를 돌려준다 (불변) */
export function updateLessonRecord(
  store: ProgressStore,
  lessonId: string,
  patch: Partial<LessonRecord>
): ProgressStore {
  const prev = store.lessons[lessonId] ?? emptyLessonRecord();
  return {
    ...store,
    lessons: { ...store.lessons, [lessonId]: { ...prev, ...patch } },
  };
}

/** 퀴즈 1회 응시 결과 반영. 시도 횟수 +1, 점수는 최고 기록 유지 */
export function applyQuizAttempt(
  store: ProgressStore,
  lessonId: string,
  score: number
): ProgressStore {
  const prev = store.lessons[lessonId] ?? emptyLessonRecord();
  return updateLessonRecord(store, lessonId, {
    attempts: prev.attempts + 1,
    quizScore: prev.quizScore === null ? score : Math.max(prev.quizScore, score),
    status: prev.status === "completed" ? "completed" : "in_progress",
  });
}

/**
 * 완료 처리. 조건 미충족이면 스토어를 그대로 돌려준다.
 * 통과 시 completedAt을 기록한다. 다음 레슨의 잠금 해제는 상태 저장이 아니라
 * deriveStatus가 선행 완료 여부에서 도출하므로 별도 갱신이 필요 없다.
 */
export function completeLesson(
  store: ProgressStore,
  lessonId: string,
  prereqsMet: boolean,
  now: Date = new Date()
): ProgressStore {
  const record = store.lessons[lessonId] ?? emptyLessonRecord();
  if (completionBlockers(record, prereqsMet).length > 0) return store;
  return updateLessonRecord(store, lessonId, {
    status: "completed",
    completedAt: now.toISOString(),
  });
}

export function completedLessonCount(store: ProgressStore): number {
  return Object.values(store.lessons).filter((l) => l.status === "completed")
    .length;
}
