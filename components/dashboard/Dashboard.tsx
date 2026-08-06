"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  buildLessonCandles,
  dailyScoreSeries,
  type LessonOrderItem,
} from "@/lib/chart";
import { countSummaryLines } from "@/lib/progress";
import { endOfToday, localDateKey } from "@/lib/date";
import { useProgress } from "@/hooks/useProgress";
import LearningCandleChart from "@/components/dashboard/LearningCandleChart";

type Props = {
  /** 콘텐츠가 존재하는 레슨의 커리큘럼 순서 (서버에서 주입) */
  lessonOrder: LessonOrderItem[];
};

export default function Dashboard({ lessonOrder }: Props) {
  const { store, hydrated, hydrate } = useProgress();
  const startLearning = useProgress((s) => s.startLearning);

  useEffect(() => hydrate(), [hydrate]);

  if (!hydrated) return null;

  if (!store) {
    return (
      <div className="space-y-6">
        <section className="rounded-md border border-line bg-surface p-5 text-sm leading-relaxed">
          <p className="font-bold">공부를 하면 내 차트가 그려진다</p>
          <p className="mt-1 text-muted">
            레슨을 하나 완료할 때마다 캔들이 하나 생긴다. 몸통은 퀴즈 정답률,
            아래꼬리는 재시도, 색은 한 번에 통과했는지다. 기록은 이 브라우저에만
            남는다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startLearning}
              className="rounded-md bg-ink px-4 py-2 font-medium text-paper transition-colors hover:bg-ink/85"
            >
              이 브라우저에서 학습 기록 시작하기
            </button>
            <Link
              href="/curriculum"
              className="rounded-md border border-line bg-paper px-4 py-2 font-medium transition-colors hover:bg-ink/5"
            >
              커리큘럼 둘러보기
            </Link>
          </div>
        </section>
        <LearningCandleChart candles={[]} dailyScores={[]} />
      </div>
    );
  }

  // ── 파생 지표 ──────────────────────────────────────────
  const candles = buildLessonCandles(lessonOrder, store);
  const dailyScores = dailyScoreSeries(store);

  const total = lessonOrder.length;
  const completedCount = candles.length;
  const progressPct = total === 0 ? 0 : (completedCount / total) * 100;

  const nextLesson = lessonOrder.find(
    (l) => store.lessons[l.id]?.status !== "completed"
  );
  const currentLevel = nextLesson?.level ?? lessonOrder.at(-1)?.level ?? 0;

  const dueCount = Object.values(store.srs).filter(
    (card) => new Date(card.dueAt) <= endOfToday()
  ).length;

  const todayResult = store.dailyTests[localDateKey()];

  const byId = new Map(lessonOrder.map((l) => [l.id, l]));
  const recentSummaries = Object.entries(store.lessons)
    .filter(([, r]) => countSummaryLines(r.mySummary) > 0)
    .sort(([, a], [, b]) =>
      (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 오늘의 테스트 (매일의 루틴 — 최상단 고정) */}
      <Link
        href="/daily"
        className={`block rounded-md border p-4 transition-colors ${
          todayResult
            ? "border-line bg-surface hover:bg-ink/5"
            : "border-rise/50 bg-rise/10 hover:bg-rise/15"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide uppercase">
              오늘의 테스트
            </p>
            {todayResult ? (
              <p className="mt-1 text-sm text-muted">
                오늘 몫은 끝냈다 —{" "}
                <span className="font-mono font-bold text-ink tabular-nums">
                  {todayResult.score}/{todayResult.total} (
                  {Math.round((todayResult.score / todayResult.total) * 100)}%)
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm font-medium text-rise">
                아직 풀지 않았다. 8문항, 3~5분이면 된다.
              </p>
            )}
          </div>
          <span aria-hidden className="text-xl text-muted">
            →
          </span>
        </div>
      </Link>

      {/* 핵심 지표 4 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="전체 진도"
          value={`${progressPct.toFixed(0)}%`}
          sub={`${completedCount.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}개 레슨`}
        />
        <StatCard label="현재 레벨" value={`L${currentLevel}`} sub="학습 중" />
        <StatCard
          label="연속 학습"
          value={`${store.streak.current.toLocaleString("ko-KR")}일`}
          sub={`최장 ${store.streak.longest.toLocaleString("ko-KR")}일 · 테스트 기준`}
        />
        <StatCard
          label="오늘 복습"
          value={`${dueCount.toLocaleString("ko-KR")}장`}
          sub="SRS 도래 카드"
          href={dueCount > 0 ? "/review" : undefined}
        />
      </div>

      {/* 시그니처: 학습 캔들차트 */}
      <LearningCandleChart candles={candles} dailyScores={dailyScores} />

      {/* 이어서 하기 */}
      {nextLesson && (
        <Link
          href={`/learn/${nextLesson.level}/${nextLesson.id}`}
          className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:bg-ink/5"
        >
          <div>
            <p className="text-xs font-bold tracking-wide uppercase">
              이어서 하기
            </p>
            <p className="mt-1 text-sm">
              <span className="mr-2 font-mono text-xs text-muted tabular-nums">
                {nextLesson.id}
              </span>
              <span className="font-medium">{nextLesson.title}</span>
            </p>
          </div>
          <span aria-hidden className="text-xl text-muted">
            →
          </span>
        </Link>
      )}

      {/* 최근 자기 요약 */}
      {recentSummaries.length > 0 && (
        <section className="rounded-md border border-line bg-surface p-4">
          <h2 className="text-xs font-bold tracking-wide uppercase">
            최근 자기 요약
          </h2>
          <ul className="mt-3 space-y-3">
            {recentSummaries.map(([lessonId, record]) => {
              const meta = byId.get(lessonId);
              return (
                <li key={lessonId} className="border-l-2 border-line pl-3">
                  {meta ? (
                    <Link
                      href={`/learn/${meta.level}/${lessonId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      <span className="mr-2 font-mono text-xs text-muted tabular-nums">
                        {lessonId}
                      </span>
                      {meta.title}
                    </Link>
                  ) : (
                    <span className="font-mono text-sm">{lessonId}</span>
                  )}
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted">
                    {record.mySummary
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("\n")}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-bold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="rounded-md border border-line bg-surface p-4 transition-colors hover:bg-ink/5"
    >
      {inner}
    </Link>
  ) : (
    <div className="rounded-md border border-line bg-surface p-4">{inner}</div>
  );
}
