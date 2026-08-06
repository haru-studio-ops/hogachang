import type { ProgressStore } from "@/types/progress";

/** 학습 캔들차트의 캔들 1개 = 완료한 레슨 1개 (PROJECT_SPEC 6.4) */
export type LessonCandle = {
  lessonId: string;
  title: string;
  level: number;
  /** 퀴즈 정답률 0~1 = 몸통 길이 */
  score: number;
  /** 재시도 횟수 (attempts - 1) = 아래꼬리 */
  retries: number;
  /** 실습 완료 = 위꼬리 */
  practiceDone: boolean;
  /** 한 번에 통과 = rise, 재시도 = fall */
  passedFirstTry: boolean;
  completedAt: string;
};

export type LessonOrderItem = {
  id: string;
  title: string;
  level: number;
};

/**
 * 완료한 레슨을 학습 순서(completedAt 오름차순)로 캔들 배열로 만든다.
 * 동시각이면 커리큘럼 순서를 유지한다.
 */
export function buildLessonCandles(
  order: LessonOrderItem[],
  store: ProgressStore
): LessonCandle[] {
  return order
    .flatMap((item, curriculumIndex) => {
      const rec = store.lessons[item.id];
      if (!rec || rec.status !== "completed" || rec.completedAt === null) {
        return [];
      }
      return [
        {
          candle: {
            lessonId: item.id,
            title: item.title,
            level: item.level,
            score: rec.quizScore ?? 0,
            retries: Math.max(0, rec.attempts - 1),
            practiceDone: rec.practiceDone,
            passedFirstTry: rec.attempts <= 1,
            completedAt: rec.completedAt,
          },
          curriculumIndex,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.candle.completedAt.localeCompare(b.candle.completedAt) ||
        a.curriculumIndex - b.curriculumIndex
    )
    .map((x) => x.candle);
}

/**
 * 단순 이동평균. 창이 다 차기 전 구간은 null (실제 차트의 MA와 동일한 규칙).
 */
export function movingAverage(
  values: number[],
  window: number
): (number | null)[] {
  return values.map((_, i) => {
    if (i + 1 < window) return null;
    const slice = values.slice(i + 1 - window, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / window;
  });
}

/**
 * MA5가 MA20을 하향 돌파한 상태인가 (데드크로스 → "복습 필요").
 * 두 값이 모두 존재하는 마지막 지점에서 MA5 < MA20 이고,
 * 그 이전에 MA5 >= MA20 인 지점이 실제로 있었을 때만 true (돌파의 정의).
 */
export function hasDeadCross(
  ma5: (number | null)[],
  ma20: (number | null)[]
): boolean {
  let wasAbove = false;
  let lastBelow = false;
  for (let i = 0; i < ma5.length; i++) {
    const a = ma5[i];
    const b = ma20[i];
    if (a === null || b === null || b === undefined) continue;
    if (a >= b) {
      wasAbove = true;
      lastBelow = false;
    } else {
      lastBelow = true;
    }
  }
  return wasAbove && lastBelow;
}

/** 데일리 테스트 결과를 날짜 오름차순 점수(0~1) 배열로 */
export function dailyScoreSeries(store: ProgressStore): number[] {
  return Object.entries(store.dailyTests)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, r]) => (r.total === 0 ? 0 : r.score / r.total));
}
