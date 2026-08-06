"use client";

import { useState } from "react";
import { drawdownRecovery, recoveryCurve } from "@/lib/finance/drawdown";
import CalcField from "@/components/tools/CalcField";
import LineChart from "@/components/tools/LineChart";

export default function DrawdownCalc() {
  const [loss, setLoss] = useState("30");

  const lossPct = Number(loss);
  const valid = Number.isFinite(lossPct) && lossPct > 0 && lossPct < 100;
  const required = valid ? drawdownRecovery(lossPct) : null;
  const curve = recoveryCurve();

  return (
    <div className="space-y-5">
      <div className="max-w-52">
        <CalcField label="손실률" value={loss} onChange={setLoss} unit="%" min={1} max={99} step={1} />
      </div>

      {required !== null ? (
        <>
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="text-sm">
              <span className="font-mono font-bold text-fall tabular-nums">
                −{lossPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%
              </span>
              <span className="text-muted"> 손실을 원금까지 되돌리려면 </span>
              <span className="font-mono text-2xl font-bold text-rise tabular-nums">
                +{required.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%
              </span>
              <span className="text-muted"> 수익이 필요하다</span>
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface p-4">
            <p className="mb-2 text-xs font-bold tracking-wide uppercase">
              손실률별 필요 수익률 곡선
            </p>
            <LineChart
              formatY={(v) => `${Math.round(v).toLocaleString("ko-KR")}%`}
              xLabels={["-1%", "-95%"]}
              series={[
                {
                  name: "필요 수익률",
                  values: curve.map((p) => p.requiredGainPct),
                  tone: "fall",
                },
              ]}
            />
          </div>

          <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">왜 이렇게 나오나 — </span>
            수익률의 분모가 줄어든 자본이기 때문이다. 100에서 30을 잃으면 70이
            남고, 70에서 원래 100으로 돌아가려면 30이 아니라 30/70 ≈ 42.9%를
            벌어야 한다. 손실이 커질수록 곡선이 발산하는 이유이고, 손절이 빠를수록
            싼 이유다.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">손실률은 1~99% 사이로 입력한다.</p>
      )}
    </div>
  );
}
