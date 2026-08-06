"use client";

import { useState } from "react";
import Link from "next/link";
import {
  hasDeadCross,
  movingAverage,
  type LessonCandle,
} from "@/lib/chart";

type Props = {
  candles: LessonCandle[];
  /** 데일리 테스트 정답률(0~1), 날짜 오름차순. M5 전에는 빈 배열 */
  dailyScores: number[];
};

// ── 기하 상수 ──────────────────────────────────────────────
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 26;
const PAD_B = 10;
const SLOT = 26; // 캔들 1개가 차지하는 가로폭
const BODY_W = 12;
const PLOT_H = 200;
const V_MAX = 1.14; // 위꼬리 여유
const V_MIN = -0.2; // 아래꼬리 여유
const MIN_PLOT_W = 420;

function y(v: number): number {
  return PAD_T + ((V_MAX - v) / (V_MAX - V_MIN)) * PLOT_H;
}

/**
 * 학습 캔들차트 (PROJECT_SPEC 6.4) — 이 사이트의 시그니처.
 * 캔들 1개 = 레슨 1개. 몸통=정답률, 위꼬리=실습 완료, 아래꼬리=재시도,
 * 색=한 번에 통과(rise)/재시도(fall). 데일리 테스트 MA5/MA20을 겹쳐 그린다.
 */
export default function LearningCandleChart({ candles, dailyScores }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const ma5 = movingAverage(dailyScores, 5);
  const ma20 = movingAverage(dailyScores, 20);
  const needsReview = hasDeadCross(ma5, ma20);

  const plotW = Math.max(MIN_PLOT_W, candles.length * SLOT);
  const width = PAD_L + plotW + PAD_R;
  const height = PAD_T + PLOT_H + PAD_B;
  const baseline = y(0);

  const maX = (i: number, total: number): number =>
    PAD_L + ((i + 0.5) / total) * plotW;

  function maPoints(series: (number | null)[]): string {
    return series
      .flatMap((v, i) => (v === null ? [] : [`${maX(i, series.length).toFixed(1)},${y(v).toFixed(1)}`]))
      .join(" ");
  }

  const hovered = hover !== null ? candles[hover] : null;

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold tracking-wide uppercase">
          나의 학습 차트
        </h2>
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block size-2 bg-rise" /> 한 번에
            통과
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block size-2 bg-fall" /> 재시도
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block h-px w-4 bg-ink" /> MA5
          </span>
          <span className="flex items-center gap-1">
            <span
              aria-hidden
              className="inline-block h-px w-4 border-t border-dashed border-muted"
            />{" "}
            MA20
          </span>
        </div>
      </div>

      {needsReview && (
        <Link
          href="/review"
          className="mt-3 flex items-center gap-2 rounded-md border border-fall/50 bg-fall/10 px-3 py-2 text-sm font-medium text-fall transition-colors hover:bg-fall/15"
        >
          <span className="rounded-sm bg-fall px-1.5 py-0.5 font-mono text-[11px] font-bold text-surface">
            데드크로스
          </span>
          정답률 MA5가 MA20 아래로 내려왔다 — 복습이 필요하다 →
        </Link>
      )}

      {candles.length === 0 ? (
        <div className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-line text-sm text-muted">
          레슨을 완료할 때마다 여기에 캔들이 하나씩 그려진다. 공부가 곧 차트다.
        </div>
      ) : (
        <div className="relative mt-4">
          <div className="overflow-x-auto">
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`학습 캔들차트: 완료 레슨 ${candles.length}개`}
              className="block"
            >
              {/* 수평 그리드 + y 라벨 */}
              {[0, 0.5, 0.8, 1].map((v) => (
                <g key={v}>
                  <line
                    x1={PAD_L}
                    x2={PAD_L + plotW}
                    y1={y(v)}
                    y2={y(v)}
                    className={v === 0.8 ? "stroke-muted" : "stroke-line"}
                    strokeDasharray={v === 0.8 ? "4 3" : undefined}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_L - 6}
                    y={y(v) + 3.5}
                    textAnchor="end"
                    className="fill-muted font-mono text-[10px] tabular-nums"
                  >
                    {Math.round(v * 100)}%
                  </text>
                </g>
              ))}

              {/* 레벨 경계선 + 라벨 */}
              {candles.map((c, i) => {
                const isBoundary = i === 0 || candles[i - 1].level !== c.level;
                if (!isBoundary) return null;
                const x = PAD_L + i * SLOT;
                return (
                  <g key={`lv-${i}`}>
                    {i > 0 && (
                      <line
                        x1={x}
                        x2={x}
                        y1={PAD_T - 4}
                        y2={PAD_T + PLOT_H}
                        className="stroke-line"
                        strokeDasharray="2 3"
                        strokeWidth={1}
                      />
                    )}
                    <text
                      x={x + 3}
                      y={PAD_T - 10}
                      className="fill-muted font-mono text-[10px] font-bold"
                    >
                      L{c.level}
                    </text>
                  </g>
                );
              })}

              {/* 캔들 (등장 애니메이션: 바닥 기준 성장, 모션 최소화 존중) */}
              <g className="origin-bottom animate-candle motion-reduce:animate-none [transform-box:fill-box]">
                {candles.map((c, i) => {
                  const cx = PAD_L + i * SLOT + SLOT / 2;
                  const bodyTop = y(Math.max(c.score, 0.02));
                  const tone = c.passedFirstTry ? "fill-rise" : "fill-fall";
                  const stroke = c.passedFirstTry
                    ? "stroke-rise"
                    : "stroke-fall";
                  const lowerLen = Math.min(0.05 * c.retries, 0.16);
                  return (
                    <g
                      key={c.lessonId}
                      tabIndex={0}
                      role="graphics-symbol"
                      aria-label={`${c.lessonId} ${c.title}: 정답률 ${Math.round(c.score * 100)}%, 재시도 ${c.retries}회${c.practiceDone ? ", 실습 완료" : ""}`}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="cursor-pointer outline-none focus-visible:opacity-80"
                    >
                      {/* 위꼬리: 실습 완료 */}
                      {c.practiceDone && (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={bodyTop}
                          y2={y(c.score + 0.08)}
                          className={stroke}
                          strokeWidth={1.5}
                        />
                      )}
                      {/* 아래꼬리: 재시도 횟수 */}
                      {c.retries > 0 && (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={baseline}
                          y2={y(-lowerLen)}
                          className={stroke}
                          strokeWidth={1.5}
                        />
                      )}
                      {/* 몸통: 퀴즈 정답률 */}
                      <rect
                        x={cx - BODY_W / 2}
                        y={bodyTop}
                        width={BODY_W}
                        height={Math.max(2, baseline - bodyTop)}
                        rx={1}
                        className={`${tone} ${hover === i ? "opacity-100" : "opacity-90"}`}
                      />
                    </g>
                  );
                })}
              </g>

              {/* 정답률 이동평균선 (데일리 테스트) */}
              {ma5.some((v) => v !== null) && (
                <polyline
                  points={maPoints(ma5)}
                  fill="none"
                  className="stroke-ink"
                  strokeWidth={1.5}
                />
              )}
              {ma20.some((v) => v !== null) && (
                <polyline
                  points={maPoints(ma20)}
                  fill="none"
                  className="stroke-muted"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              )}
            </svg>
          </div>

          {/* 호버 툴팁 (스크롤과 무관하게 우상단 고정) */}
          {hovered && (
              <div
                role="tooltip"
                className="pointer-events-none absolute top-1 right-1 z-10 w-48 rounded-md border border-line bg-paper p-2.5 text-xs leading-relaxed shadow-sm"
              >
                <p className="font-mono text-[11px] text-muted">
                  {hovered.lessonId}
                </p>
                <p className="font-bold">{hovered.title}</p>
                <dl className="mt-1 space-y-0.5 font-mono text-[11px] tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-muted">퀴즈 정답률</dt>
                    <dd>{Math.round(hovered.score * 100)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">재시도</dt>
                    <dd>{hovered.retries}회</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">실습</dt>
                    <dd>{hovered.practiceDone ? "완료" : "미완"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">완료일</dt>
                    <dd>
                      {new Date(hovered.completedAt).toLocaleDateString("ko-KR")}
                    </dd>
                  </div>
                </dl>
              </div>
          )}
        </div>
      )}

      {dailyScores.length === 0 && candles.length > 0 && (
        <p className="mt-2 font-mono text-[11px] text-muted">
          이동평균선은 데일리 테스트를 쌓으면 그려진다.
        </p>
      )}
    </section>
  );
}
