import type { Metadata } from "next";
import PositionSizingCalc from "@/components/tools/PositionSizingCalc";

export const metadata: Metadata = {
  title: "포지션 사이징 계산기 | 호가창",
  description: "총자본·리스크%·진입가·손절가로 매수 수량 계산",
};

export default function PositionSizingPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        포지션 사이징 계산기
      </h1>
      <p className="mt-2 mb-6 text-muted">
        수량은 확신이 아니라 손절가가 정한다. 리스크부터 고정하고 거꾸로 계산한다.
      </p>
      <PositionSizingCalc />
    </div>
  );
}
