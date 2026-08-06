import type { Metadata } from "next";
import DrawdownCalc from "@/components/tools/DrawdownCalc";

export const metadata: Metadata = {
  title: "낙폭 회복 시뮬레이터 | 호가창",
  description: "손실률별 원금 회복에 필요한 수익률 계산",
};

export default function DrawdownPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        낙폭 회복 시뮬레이터
      </h1>
      <p className="mt-2 mb-6 text-muted">
        -50%는 +50%로 돌아오지 않는다. 회복은 항상 손실보다 비싸다.
      </p>
      <DrawdownCalc />
    </div>
  );
}
