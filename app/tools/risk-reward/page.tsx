import type { Metadata } from "next";
import ExpectancyCalc from "@/components/tools/ExpectancyCalc";

export const metadata: Metadata = {
  title: "손익비 / 기대값 계산기 | 호가창",
  description: "승률·평균이익·평균손실로 R:R과 기대값, 거래 시뮬레이션",
};

export default function RiskRewardPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        손익비 / 기대값 계산기
      </h1>
      <p className="mt-2 mb-6 text-muted">
        계좌의 방향은 승률이 아니라 기대값의 부호가 정한다.
      </p>
      <ExpectancyCalc />
    </div>
  );
}
