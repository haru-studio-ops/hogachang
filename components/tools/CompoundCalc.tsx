"use client";

import { useState } from "react";
import { compound } from "@/lib/finance/compound";
import CalcField from "@/components/tools/CalcField";
import LineChart from "@/components/tools/LineChart";

function won(v: number): string {
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

function wonCompact(v: number): string {
  if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(1)}억`;
  if (Math.abs(v) >= 1e4) return `${Math.round(v / 1e4).toLocaleString("ko-KR")}만`;
  return Math.round(v).toLocaleString("ko-KR");
}

export default function CompoundCalc() {
  const [principal, setPrincipal] = useState("10000000");
  const [monthly, setMonthly] = useState("500000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("20");
  const [inflation, setInflation] = useState("3");

  const input = {
    principal: Number(principal),
    monthlyContribution: Number(monthly),
    annualReturnPct: Number(rate),
    years: Math.floor(Number(years)),
    inflationPct: Number(inflation),
  };
  const valid =
    Object.values(input).every(Number.isFinite) &&
    input.years >= 1 &&
    input.years <= 60 &&
    input.principal >= 0 &&
    input.monthlyContribution >= 0;

  const result = valid ? compound(input) : null;
  const totalPaid = valid
    ? input.principal + input.monthlyContribution * 12 * input.years
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <CalcField label="원금" value={principal} onChange={setPrincipal} unit="원" min={0} step={1000000} />
        <CalcField label="월 적립" value={monthly} onChange={setMonthly} unit="원" min={0} step={100000} />
        <CalcField label="연 수익률" value={rate} onChange={setRate} unit="%" step={0.5} />
        <CalcField label="기간" value={years} onChange={setYears} unit="년" min={1} max={60} step={1} />
        <CalcField label="물가상승률" value={inflation} onChange={setInflation} unit="%" step={0.5} />
      </div>

      {result ? (
        <>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">명목 최종금액</dt>
              <dd className="mt-1 font-mono text-xl font-bold text-rise tabular-nums">{won(result.nominal)}</dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">실질 최종금액 (물가 반영)</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">{won(result.real)}</dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">총 납입액</dt>
              <dd className="mt-1 font-mono text-xl font-bold text-muted tabular-nums">{won(totalPaid)}</dd>
            </div>
          </dl>

          <div className="rounded-md border border-line bg-surface p-4">
            <LineChart
              formatY={wonCompact}
              xLabels={["0년", `${input.years}년`]}
              series={[
                { name: "명목", values: result.yearly.map((p) => p.nominal), tone: "rise" },
                { name: "실질", values: result.yearly.map((p) => p.real), tone: "fall", dashed: true },
              ]}
            />
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            매달 수익이 원금에 합쳐져 다음 달 수익의 밑천이 되기 때문에 곡선이
            갈수록 가팔라진다. 다만 물가 {input.inflationPct.toLocaleString("ko-KR")}%가
            매년 구매력을 깎아서, 실질 가치는 명목보다{" "}
            <span className="font-mono text-ink tabular-nums">
              {won(result.nominal - result.real)}
            </span>{" "}
            작다.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">모든 값을 올바르게 입력하면 결과가 나온다 (기간 1~60년).</p>
      )}
    </div>
  );
}
