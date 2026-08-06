"use client";

export type ChartSeries = {
  name: string;
  values: number[];
  tone: "rise" | "fall" | "ink" | "muted";
  dashed?: boolean;
};

type Props = {
  series: ChartSeries[];
  formatY: (v: number) => string;
  /** x축 왼쪽/오른쪽 끝 라벨 */
  xLabels?: [string, string];
};

const STROKE: Record<ChartSeries["tone"], string> = {
  rise: "stroke-rise",
  fall: "stroke-fall",
  ink: "stroke-ink",
  muted: "stroke-muted",
};

const SWATCH: Record<ChartSeries["tone"], string> = {
  rise: "bg-rise",
  fall: "bg-fall",
  ink: "bg-ink",
  muted: "bg-muted",
};

const W = 560;
const H = 210;
const PAD_L = 58;
const PAD_R = 10;
const PAD_T = 10;
const PAD_B = 22;

/** 계산기 공용 멀티 시리즈 라인차트 (SVG) */
export default function LineChart({ series, formatY, xLabels }: Props) {
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  if (all.length === 0) return null;
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.05;
  lo -= pad;
  hi += pad;

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const y = (v: number): number => PAD_T + ((hi - v) / (hi - lo)) * plotH;
  const x = (i: number, n: number): number =>
    PAD_L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  const ticks = [lo + pad, (lo + hi) / 2, hi - pad];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(t)}
              y2={y(t)}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-muted font-mono text-[10px] tabular-nums"
            >
              {formatY(t)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            className={STROKE[s.tone]}
            strokeWidth={1.5}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            points={s.values
              .map((v, i) => `${x(i, s.values.length).toFixed(1)},${y(v).toFixed(1)}`)
              .join(" ")}
          />
        ))}
        {xLabels && (
          <>
            <text
              x={PAD_L}
              y={H - 6}
              className="fill-muted font-mono text-[10px]"
            >
              {xLabels[0]}
            </text>
            <text
              x={W - PAD_R}
              y={H - 6}
              textAnchor="end"
              className="fill-muted font-mono text-[10px]"
            >
              {xLabels[1]}
            </text>
          </>
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] text-muted">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span aria-hidden className={`inline-block h-0.5 w-4 ${SWATCH[s.tone]}`} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
