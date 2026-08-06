"use client";

import { useState } from "react";
import { positionSizing } from "@/lib/finance/positionSizing";
import CalcField from "@/components/tools/CalcField";

function won(v: number): string {
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

export default function PositionSizingCalc() {
  const [capital, setCapital] = useState("10000000");
  const [risk, setRisk] = useState("1");
  const [entry, setEntry] = useState("50000");
  const [stop, setStop] = useState("47000");

  const input = {
    capital: Number(capital),
    riskPct: Number(risk),
    entry: Number(entry),
    stop: Number(stop),
  };
  const valid =
    Object.values(input).every(Number.isFinite) &&
    input.capital > 0 &&
    input.riskPct > 0 &&
    input.entry > 0 &&
    input.stop >= 0 &&
    input.entry !== input.stop;

  const result = valid ? positionSizing(input) : null;
  const exposurePct = result && input.capital > 0 ? (result.totalCost / input.capital) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CalcField label="총자본" value={capital} onChange={setCapital} unit="원" min={0} step={1000000} />
        <CalcField label="리스크" value={risk} onChange={setRisk} unit="%" min={0} max={100} step={0.5} />
        <CalcField label="진입가" value={entry} onChange={setEntry} unit="원" min={0} step={100} />
        <CalcField label="손절가" value={stop} onChange={setStop} unit="원" min={0} step={100} />
      </div>

      {result ? (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">매수 수량</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">
                {result.shares.toLocaleString("ko-KR")}주
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">총 투입금액</dt>
              <dd className="mt-1 font-mono text-xl font-bold tabular-nums">{won(result.totalCost)}</dd>
              <dd className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                자본의 {exposurePct.toFixed(1)}%
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">손절 시 손실</dt>
              <dd className="mt-1 font-mono text-xl font-bold text-fall tabular-nums">{won(result.lossAtStop)}</dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">허용 손실 한도</dt>
              <dd className="mt-1 font-mono text-xl font-bold text-muted tabular-nums">{won(result.riskAmount)}</dd>
            </div>
          </dl>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            허용 손실 {won(result.riskAmount)} ÷ 주당 리스크{" "}
            {won(Math.abs(input.entry - input.stop))} ={" "}
            {result.shares.toLocaleString("ko-KR")}주(내림). 수량은 확신의 크기가
            아니라 손절가와의 거리가 정한다. 손절이 멀수록 수량은 준다.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">
          진입가와 손절가가 같으면 리스크를 계산할 수 없다. 값을 확인해라.
        </p>
      )}
    </div>
  );
}
