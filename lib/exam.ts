import type { BankQuestion, QuizItem } from "@/types/content";
import type { ProgressStore } from "@/types/progress";
import { gradeQuizItem, updateLessonRecord, type QuizAnswer } from "@/lib/progress";
import { dueQuestionIds, srsOnCorrect, srsOnWrong } from "@/lib/srs";
import { prevDateKey } from "@/lib/date";
import { mulberry32 } from "@/lib/finance/random";

/** 데일리 테스트 문항 수 */
export const DAILY_SIZE = 8;
/** 이 미만이면 테스트를 열지 않는다 */
export const DAILY_MIN = 4;
/** 최근 학습 레슨 몫 */
export const DAILY_RECENT = 3;
/** SRS 만기 카드 몫 */
export const DAILY_SRS = 3;
/** 졸업시험 문항 수 */
export const EXAM_SIZE = 25;
/** 졸업시험 합격선. 임의로 낮추지 않는다 */
export const EXAM_PASS_THRESHOLD = 0.8;
/** 불합격 후 재응시 대기 */
export const EXAM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** 문자열 → 32bit 시드 (FNV-1a). 같은 날짜키 = 같은 출제 */
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 오답률 가중 비복원 추출. weight = 1 + 2×(wrong/seen) — 많이 틀린 문항이 더 자주 나온다 */
export function weightedSample(
  candidates: BankQuestion[],
  count: number,
  stats: ProgressStore["questionStats"],
  rng: () => number
): BankQuestion[] {
  const pool = [...candidates];
  const picked: BankQuestion[] = [];
  while (picked.length < count && pool.length > 0) {
    const weights = pool.map((q) => {
      const s = stats[q.id];
      return s && s.seen > 0 ? 1 + 2 * (s.wrong / s.seen) : 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

/** 학습 이력이 있는 레슨 id (완료했거나 퀴즈를 풀어본 레슨) */
function studiedLessonIds(store: ProgressStore): Set<string> {
  return new Set(
    Object.entries(store.lessons)
      .filter(([, r]) => r.completedAt !== null || r.attempts > 0)
      .map(([id]) => id)
  );
}

/** 가장 최근 학습한 레슨 (completedAt 최신, 없으면 응시 이력 레슨) */
function mostRecentLessonId(store: ProgressStore): string | null {
  const completed = Object.entries(store.lessons).filter(([, r]) => r.completedAt !== null);
  if (completed.length > 0) {
    completed.sort((a, b) => (a[1].completedAt! < b[1].completedAt! ? 1 : -1));
    return completed[0][0];
  }
  const attempted = Object.entries(store.lessons).find(([, r]) => r.attempts > 0);
  return attempted ? attempted[0] : null;
}

/**
 * 데일리 테스트 출제 (PROJECT_SPEC 5.3).
 * 최근 학습 레슨 3 + SRS 만기 3 + 전체 이력 랜덤 2. SRS 부족분은 최근 레슨 비중 확대.
 * 출제 가능이 4문항 미만이면 null (테스트를 열지 않는다). examOnly 제외.
 * 시드는 dateKey에서 유도 — 같은 날은 같은 출제.
 */
export function composeDailyTest(
  bank: BankQuestion[],
  store: ProgressStore,
  dateKey: string,
  now: Date = new Date()
): string[] | null {
  const studied = studiedLessonIds(store);
  if (studied.size === 0) return null;
  const history = bank.filter((q) => !q.examOnly && studied.has(q.lessonId));
  if (history.length < DAILY_MIN) return null;

  const rng = mulberry32(seedFromString(`daily-${dateKey}`));
  const stats = store.questionStats;
  const due = new Set(dueQuestionIds(store.srs, now));
  const recentId = mostRecentLessonId(store);
  const recentPool = recentId ? history.filter((q) => q.lessonId === recentId) : [];

  const picked: BankQuestion[] = [];
  const pickedIds = new Set<string>();
  function take(candidates: BankQuestion[], n: number): void {
    if (n <= 0) return;
    const chosen = weightedSample(
      candidates.filter((q) => !pickedIds.has(q.id)),
      n,
      stats,
      rng
    );
    for (const q of chosen) {
      picked.push(q);
      pickedIds.add(q.id);
    }
  }

  take(recentPool, DAILY_RECENT);
  take(history.filter((q) => due.has(q.id)), DAILY_SRS);
  // SRS 몫이 부족하면 최근 레슨 비중 확대
  take(recentPool, DAILY_RECENT + DAILY_SRS - picked.length);
  // 나머지는 전체 이력에서 랜덤
  take(history, DAILY_SIZE - picked.length);

  if (picked.length < DAILY_MIN) return null;
  return picked.map((q) => q.id);
}

/** 일괄 채점 — 제출 전에는 어떤 문항의 정오답도 노출하지 않는다 */
export function gradeBatch(items: QuizItem[], answers: QuizAnswer[]): boolean[] {
  return items.map((item, i) => gradeQuizItem(item, answers[i] ?? null));
}

/** 스트릭은 레슨 진도가 아니라 데일리 테스트 완료 기준으로 센다 */
export function updateStreak(
  streak: ProgressStore["streak"],
  dateKey: string
): ProgressStore["streak"] {
  if (streak.lastTestAt === dateKey) return streak;
  const current = streak.lastTestAt === prevDateKey(dateKey) ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastTestAt: dateKey };
}

/** questionStats·SRS 공통 반영: 오답은 SRS 등록/리셋, 정답은 기존 카드만 간격 상승 */
function applyAnswerStats(
  store: ProgressStore,
  results: { id: string; correct: boolean }[],
  now: Date
): ProgressStore {
  const questionStats = { ...store.questionStats };
  const srs = { ...store.srs };
  for (const { id, correct } of results) {
    const prev = questionStats[id] ?? { seen: 0, wrong: 0 };
    questionStats[id] = { seen: prev.seen + 1, wrong: prev.wrong + (correct ? 0 : 1) };
    if (!correct) {
      srs[id] = srsOnWrong(srs[id], now);
    } else if (srs[id]) {
      srs[id] = srsOnCorrect(srs[id], now);
    }
  }
  return { ...store, questionStats, srs };
}

/** 데일리 테스트 결과 반영 (dailyTests·questionStats·srs·streak) */
export function applyDailyResult(
  store: ProgressStore,
  input: { dateKey: string; questionIds: string[]; corrects: boolean[]; now?: Date }
): ProgressStore {
  const now = input.now ?? new Date();
  const results = input.questionIds.map((id, i) => ({
    id,
    correct: input.corrects[i] === true,
  }));
  const wrongIds = results.filter((r) => !r.correct).map((r) => r.id);
  const next = applyAnswerStats(store, results, now);
  return {
    ...next,
    dailyTests: {
      ...next.dailyTests,
      [input.dateKey]: {
        score: results.length - wrongIds.length,
        total: results.length,
        questionIds: input.questionIds,
        wrongIds,
        completedAt: now.toISOString(),
      },
    },
    streak: updateStreak(next.streak, input.dateKey),
  };
}

/** 졸업시험 출제: 해당 레벨 전체(examOnly 포함)에서 25문항. 시드가 다르면 새 문항 */
export function composeExam(
  bank: BankQuestion[],
  level: number,
  store: ProgressStore,
  seed: number
): string[] {
  const pool = bank.filter((q) => q.level === level);
  const rng = mulberry32(seed);
  return weightedSample(pool, Math.min(EXAM_SIZE, pool.length), store.questionStats, rng).map(
    (q) => q.id
  );
}

export type ExamGate =
  | { ok: true }
  | { ok: false; reason: "already_passed" | "lessons_incomplete" | "cooldown"; retryAt?: string };

/** 응시 자격: 레벨 레슨 전부 완료(needs_review 포함) + 불합격 후 24시간 경과 */
export function canTakeExam(
  store: ProgressStore,
  level: number,
  levelLessonIds: string[],
  now: Date = new Date()
): ExamGate {
  const record = store.exams[String(level)];
  if (record?.passed) return { ok: false, reason: "already_passed" };
  const allDone =
    levelLessonIds.length > 0 &&
    levelLessonIds.every((id) => store.lessons[id]?.completedAt != null);
  if (!allDone) return { ok: false, reason: "lessons_incomplete" };
  const last = record?.attempts[record.attempts.length - 1];
  if (last && !last.passed) {
    const retry = new Date(last.at).getTime() + EXAM_COOLDOWN_MS;
    if (now.getTime() < retry) {
      return { ok: false, reason: "cooldown", retryAt: new Date(retry).toISOString() };
    }
  }
  return { ok: true };
}

/**
 * 졸업시험 결과 반영. 80% 이상 합격.
 * 불합격이면 오답 문항의 레슨을 needs_review로 표시한다 (completedAt은 유지 — 재응시 자격 보존).
 */
export function applyExamResult(
  store: ProgressStore,
  input: {
    level: number;
    questions: { id: string; lessonId: string }[];
    corrects: boolean[];
    now?: Date;
  }
): ProgressStore {
  const now = input.now ?? new Date();
  const results = input.questions.map((q, i) => ({
    id: q.id,
    correct: input.corrects[i] === true,
  }));
  const score = results.filter((r) => r.correct).length;
  const total = results.length;
  const passed = total > 0 && score / total >= EXAM_PASS_THRESHOLD;

  let next = applyAnswerStats(store, results, now);
  const key = String(input.level);
  const prev = next.exams[key] ?? { attempts: [], passed: false };
  next = {
    ...next,
    exams: {
      ...next.exams,
      [key]: {
        attempts: [...prev.attempts, { score, total, passed, at: now.toISOString() }],
        passed: prev.passed || passed,
      },
    },
  };

  if (!passed) {
    const wrongLessons = new Set(
      input.questions.filter((_, i) => input.corrects[i] !== true).map((q) => q.lessonId)
    );
    for (const lessonId of wrongLessons) {
      if (next.lessons[lessonId]?.status === "completed") {
        next = updateLessonRecord(next, lessonId, { status: "needs_review" });
      }
    }
  }
  return next;
}
