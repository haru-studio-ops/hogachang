"use client";

import { useState } from "react";
import { leverageEtf } from "@/lib/finance/leverageEtf";
import CalcField from "@/components/tools/CalcField";
import LineChart from "@/components/tools/LineChart";

const PRESETS: { name: string; seq: number[] }[] = [
  { name: "횡보 변동장 (+5/−5 반복)", seq: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 5 : -5)) },
  { name: "꾸준한 상승 (+1 × 20일)", seq: Array.from({ length: 20 }, () => 1) },
  { name: "급락 후 반등 (−20 후 +25)", seq: [-20, 25] },
];

export default function LeverageEtfCalc() {
  const [seqText, setSeqText] = useState(PRESETS[0].seq.join(", "));
  const [leverage, setLeverage] = useState("2");

  const seq = seqText
    .split(/[,\s]+/)
    .filter((s) => s.length > 0)
    .map(Number);
  const lev = Number(leverage);
  const valid =
    seq.length >= 1 &&
    seq.length <= 500 &&
    seq.every((v) => Number.isFinite(v) && v > -100 && v < 100) &&
    Number.isFinite(lev) &&
    lev >= -3 &&
    lev <= 5 &&
    lev !== 0;

  const result = valid ? leverageEtf({ dailyReturnsPct: seq, leverage: lev }) : null;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            기초자산 일간 수익률 시퀀스 (%, 쉼표 구분)
          </span>
          <textarea
            value={seqText}
            onChange={(e) => setSeqText(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-line bg-surface p-3 font-mono text-sm tabular-nums focus:outline-2 focus:outline-fall"
          />
        </label>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setSeqText(p.seq.join(", "))}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
            >
              {p.name}
            </button>
          ))}
          <div className="ml-auto w-28">
            <CalcField label="배수" value={leverage} onChange={setLeverage} unit="×" min={-3} max={5} step={1} />
          </div>
        </div>
      </div>

      {result ? (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">기초자산 누적</dt>
              <dd
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  result.baseFinal >= 1 ? "text-rise" : "text-fall"
                }`}
              >
                {((result.baseFinal - 1) * 100).toFixed(2)}%
              </dd>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">
                {lev.toLocaleString("ko-KR")}배 레버리지 누적
              </dt>
              <dd
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  result.leveredFinal >= 1 ? "text-rise" : "text-fall"
                }`}
              >
                {((result.leveredFinal - 1) * 100).toFixed(2)}%
              </dd>
              <dd className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                단순 {lev.toLocaleString("ko-KR")}배 기대치:{" "}
                {((result.baseFinal - 1) * 100 * lev).toFixed(2)}%
              </dd>
            </div>
          </dl>

          <div className="rounded-md border border-line bg-surface p-4">
            <LineChart
              formatY={(v) => `×${v.toFixed(2)}`}
              xLabels={["0일", `${seq.length}일`]}
              series={[
                { name: "기초자산", values: result.base, tone: "ink" },
                { name: `${lev}배 레버리지`, values: result.levered, tone: "fall" },
              ]}
            />
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            레버리지 ETF는 &lsquo;기간&rsquo;이 아니라 &lsquo;하루&rsquo; 수익률의{" "}
            {lev.toLocaleString("ko-KR")}배를 매일 복리로 쌓는다. +5% 다음 −5%는
            제자리가 아니라 −0.25%이고, 배수가 곱해지면 이 흠집이{" "}
            {lev * lev}배로 커진다(변동성 끌림). 그래서 횡보 변동장에서는 기초자산이
            멀쩡해도 레버리지는 녹는다.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">
          수익률은 -100 초과 100 미만의 숫자를 쉼표로, 배수는 -3~5 (0 제외).
        </p>
      )}
    </div>
  );
}
