"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import CompoundCalc from "@/components/tools/CompoundCalc";
import PositionSizingCalc from "@/components/tools/PositionSizingCalc";
import ExpectancyCalc from "@/components/tools/ExpectancyCalc";
import DrawdownCalc from "@/components/tools/DrawdownCalc";
import MonteCarloCalc from "@/components/tools/MonteCarloCalc";
import LeverageEtfCalc from "@/components/tools/LeverageEtfCalc";

const TOOLS: Record<string, { title: string; Calc: ComponentType }> = {
  compound: { title: "복리 계산기", Calc: CompoundCalc },
  "position-sizing": { title: "포지션 사이징 계산기", Calc: PositionSizingCalc },
  "risk-reward": { title: "손익비 / 기대값 계산기", Calc: ExpectancyCalc },
  drawdown: { title: "낙폭 회복 시뮬레이터", Calc: DrawdownCalc },
  "monte-carlo": { title: "몬테카를로 시뮬레이터", Calc: MonteCarloCalc },
  "leverage-etf": { title: "레버리지 ETF 시뮬레이터", Calc: LeverageEtfCalc },
};

type Props = {
  /** 계산기 slug (예: "position-sizing") */
  tool: string;
};

/** 레슨 본문에서 계산기를 바로 실행하는 MDX 컴포넌트: <TryIt tool="drawdown" /> */
export default function TryIt({ tool }: Props) {
  const entry = TOOLS[tool];
  if (!entry) return null;
  const { title, Calc } = entry;
  return (
    <section className="my-6 rounded-md border border-line bg-paper p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide uppercase">
          🧮 직접 굴려보기 — {title}
        </p>
        <Link
          href={`/tools/${tool}`}
          className="shrink-0 font-mono text-xs text-muted underline hover:text-ink"
        >
          전체 화면 →
        </Link>
      </div>
      <Calc />
    </section>
  );
}
