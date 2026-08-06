import type { Metadata } from "next";
import MonteCarloCalc from "@/components/tools/MonteCarloCalc";

export const metadata: Metadata = {
  title: "몬테카를로 시뮬레이터 | 호가창",
  description: "승률·손익비·리스크%로 자본곡선 밴드·MDD 분포·파산확률 시뮬레이션",
};

export default function MonteCarloPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        몬테카를로 시뮬레이터
      </h1>
      <p className="mt-2 mb-6 text-muted">
        같은 전략도 운의 배열에 따라 결과는 밴드다. 최악의 5%를 미리 본다.
      </p>
      <MonteCarloCalc />
    </div>
  );
}
