"use client";

import { useState } from "react";
import { monteCarlo } from "@/lib/finance/monteCarlo";
import CalcField from "@/components/tools/CalcField";
import LineChart from "@/components/tools/LineChart";

const HIST_W = 560;
const HIST_H = 120;
const BUCKETS = 10;

export default function MonteCarloCalc() {
  const [winRate, setWinRate] = useState("45");
  const [rr, setRr] = useState("2");
  const [risk, setRisk] = useState("2");
  const [trades, setTrades] = useState("100");
  const [runs, setRuns] = useState("500");
  const [seed, setSeed] = useState(1);

  const input = {
    winRatePct: Number(winRate),
    rr: Number(rr),
    riskPct: Number(risk),
    trades: Math.floor(Number(trades)),
    runs: Math.floor(Number(runs)),
    seed,
  };
  const valid =
    Object.values(input).every(Number.isFinite) &&
    input.winRatePct >= 0 &&
    input.winRatePct <= 100 &&
    input.rr > 0 &&
    input.riskPct > 0 &&
    input.riskPct < 100 &&
    input.trades >= 1 &&
    input.trades <= 1000 &&
    input.runs >= 10 &&
    input.runs <= 5000;

  // 50만 연산 수준이라 렌더마다 계산해도 충분히 싸다
  const result = valid ? monteCarlo(input) : null;

  // MDD 히스토그램 (10% 구간)
  const histogram = Array.from({ length: BUCKETS }, () => 0);
  if (result) {
    for (const mdd of result.maxDrawdowns) {
      histogram[Math.min(BUCKETS - 1, Math.floor(mdd * BUCKETS))]++;
    }
  }
  const maxCount = Math.max(1, ...histogram);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <CalcField label="승률" value={winRate} onChange={setWinRate} unit="%" min={0} max={100} step={1} />
        <CalcField label="손익비" value={rr} onChange={setRr} unit="R" min={0.1} step={0.1} />
        <CalcField label="리스크" value={risk} onChange={setRisk} unit="%" min={0.1} max={99} step={0.5} />
        <CalcField label="거래 수" value={trades} onChange={setTrades} unit="회" min={1} max={1000} step={10} />
        <CalcField label="시행 횟수" value={runs} onChange={setRuns} unit="회" min={10} max={5000} step={100} />
      </div>

      {result ? (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">중앙값 최종 자본</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">
                ×{result.finalPercentiles.p50.toFixed(2)}
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">하위 5% / 상위 5%</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">
                <span className="text-fall">×{result.finalPercentiles.p5.toFixed(2)}</span>
                <span className="text-muted"> / </span>
                <span className="text-rise">×{result.finalPercentiles.p95.toFixed(2)}</span>
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">파산 확률 (자본 −80%)</dt>
              <dd
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  result.ruinProbability > 0.05 ? "text-fall" : ""
                }`}
              >
                {(result.ruinProbability * 100).toFixed(1)}%
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">시행</dt>
              <dd className="mt-1 font-mono text-xl font-bold text-muted tabular-nums">
                {input.runs.toLocaleString("ko-KR")}회
              </dd>
            </div>
          </dl>

          <div className="rounded-md border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide uppercase">자본곡선 밴드 (초기 자본 = 1)</p>
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
              >
                다시 굴리기
              </button>
            </div>
            <LineChart
              formatY={(v) => `×${v.toFixed(1)}`}
              xLabels={["0회", `${input.trades}회`]}
              series={[
                { name: "상위 5%", values: result.band.p95, tone: "rise", dashed: true },
                { name: "중앙값", values: result.band.p50, tone: "ink" },
                { name: "하위 5%", values: result.band.p5, tone: "fall", dashed: true },
              ]}
            />
          </div>

          <div className="rounded-md border border-line bg-surface p-4">
            <p className="mb-2 text-xs font-bold tracking-wide uppercase">최대 낙폭(MDD) 분포</p>
            <svg viewBox={`0 0 ${HIST_W} ${HIST_H}`} className="w-full" role="img" aria-label="MDD 분포 히스토그램">
              {histogram.map((count, i) => {
                const barW = (HIST_W - 20) / BUCKETS;
                const h = (count / maxCount) * (HIST_H - 34);
                return (
                  <g key={i}>
                    <rect
                      x={10 + i * barW + 2}
                      y={HIST_H - 20 - h}
                      width={barW - 4}
                      height={Math.max(count > 0 ? 2 : 0, h)}
                      rx={1}
                      className={i >= 5 ? "fill-fall" : "fill-muted"}
                      opacity={0.85}
                    />
                    <text
                      x={10 + i * barW + barW / 2}
                      y={HIST_H - 6}
                      textAnchor="middle"
                      className="fill-muted font-mono text-[9px] tabular-nums"
                    >
                      {i * 10}~{(i + 1) * 10}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            같은 승률·손익비라도 승패의 &lsquo;순서&rsquo;는 운이라서 결과가 하나의 숫자가
            아니라 밴드로 퍼진다. 파산 확률{" "}
            <span className="font-mono tabular-nums">{(result.ruinProbability * 100).toFixed(1)}%</span>를
            움직이는 가장 큰 손잡이는 승률이 아니라 회당 리스크{" "}
            <span className="font-mono tabular-nums">{input.riskPct.toLocaleString("ko-KR")}%</span>다 —
            리스크를 반으로 줄이고 분포가 어떻게 좁아지는지 직접 확인해라.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">
          값을 확인해라 (거래 1~1,000회, 시행 10~5,000회, 리스크 0.1~99%).
        </p>
      )}
    </div>
  );
}
