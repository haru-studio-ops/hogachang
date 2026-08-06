import type { Metadata } from "next";
import CompoundCalc from "@/components/tools/CompoundCalc";

export const metadata: Metadata = {
  title: "복리 계산기 | 호가창",
  description: "원금·월적립·수익률·기간·물가상승률로 명목/실질 최종금액 계산",
};

export default function CompoundPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">복리 계산기</h1>
      <p className="mt-2 mb-6 text-muted">
        복리는 시간이 만들고, 인플레이션이 깎는다. 명목과 실질을 같이 본다.
      </p>
      <CompoundCalc />
    </div>
  );
}
