"use client";

import { useState } from "react";
import { expectancy, simulateTrades } from "@/lib/finance/expectancy";
import CalcField from "@/components/tools/CalcField";
import LineChart from "@/components/tools/LineChart";

function won(v: number): string {
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

function wonCompact(v: number): string {
  if (Math.abs(v) >= 1e4) return `${Math.round(v / 1e4).toLocaleString("ko-KR")}만`;
  return Math.round(v).toLocaleString("ko-KR");
}

export default function ExpectancyCalc() {
  const [winRate, setWinRate] = useState("45");
  const [avgWin, setAvgWin] = useState("150000");
  const [avgLoss, setAvgLoss] = useState("100000");
  const [trades, setTrades] = useState("100");
  const [seed, setSeed] = useState(1);

  const input = {
    winRatePct: Number(winRate),
    avgWin: Number(avgWin),
    avgLoss: Number(avgLoss),
    trades: Math.floor(Number(trades)),
  };
  const valid =
    Object.values(input).every(Number.isFinite) &&
    input.winRatePct >= 0 &&
    input.winRatePct <= 100 &&
    input.avgWin >= 0 &&
    input.avgLoss > 0 &&
    input.trades >= 1 &&
    input.trades <= 1000;

  const result = valid ? expectancy(input) : null;
  const simulated = valid ? simulateTrades({ ...input, seed }) : [];
  const expectedLine = result
    ? Array.from({ length: input.trades + 1 }, (_, i) => i * result.expectedPerTrade)
    : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CalcField label="승률" value={winRate} onChange={setWinRate} unit="%" min={0} max={100} step={1} />
        <CalcField label="평균 이익" value={avgWin} onChange={setAvgWin} unit="원" min={0} step={10000} />
        <CalcField label="평균 손실" value={avgLoss} onChange={setAvgLoss} unit="원" min={0} step={10000} />
        <CalcField label="거래 횟수" value={trades} onChange={setTrades} unit="회" min={1} max={1000} step={10} />
      </div>

      {result ? (
        <>
          <dl className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">손익비 (R:R)</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">{result.rr.toFixed(2)}</dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">거래당 기대값</dt>
              <dd
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  result.expectedPerTrade >= 0 ? "text-rise" : "text-fall"
                }`}
              >
                {won(result.expectedPerTrade)}
              </dd>
              <dd className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                {result.expectedR >= 0 ? "+" : ""}
                {result.expectedR.toFixed(2)}R
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">
                {input.trades.toLocaleString("ko-KR")}거래 기대 손익
              </dt>
              <dd
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  result.expectedTotal >= 0 ? "text-rise" : "text-fall"
                }`}
              >
                {won(result.expectedTotal)}
              </dd>
            </div>
          </dl>

          <div className="rounded-md border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide uppercase">
                {input.trades.toLocaleString("ko-KR")}거래 시뮬레이션
              </p>
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
              >
                다시 굴리기
              </button>
            </div>
            <LineChart
              formatY={wonCompact}
              xLabels={["0회", `${input.trades}회`]}
              series={[
                { name: "시뮬레이션 1회", values: simulated, tone: "ink" },
                { name: "기대 경로", values: expectedLine, tone: "muted", dashed: true },
              ]}
            />
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            기대값 = 승률×평균이익 − 패률×평균손실 ={" "}
            <span className={`font-mono tabular-nums ${result.expectedPerTrade >= 0 ? "text-rise" : "text-fall"}`}>
              {won(result.expectedPerTrade)}
            </span>
            . 계좌의 방향을 정하는 것은 승률이 아니라 이 값의 부호다. 실선이
            점선에서 벗어나는 만큼이 &lsquo;운&rsquo;의 몫이다 — 다시 굴려보면 매번 다르다.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">평균 손실은 0보다 커야 한다 (양수로 입력).</p>
      )}
    </div>
  );
}
