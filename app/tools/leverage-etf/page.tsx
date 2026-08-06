import type { Metadata } from "next";
import LeverageEtfCalc from "@/components/tools/LeverageEtfCalc";

export const metadata: Metadata = {
  title: "레버리지 ETF 시뮬레이터 | 호가창",
  description: "일간 수익률 시퀀스와 배수로 기초 vs 레버리지 누적 비교",
};

export default function LeverageEtfPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        레버리지 ETF 시뮬레이터
      </h1>
      <p className="mt-2 mb-6 text-muted">
        레버리지는 기간 수익률이 아니라 하루 수익률의 배수다. 변동성 끌림을 직접 본다.
      </p>
      <LeverageEtfCalc />
    </div>
  );
}
