import type { Metadata } from "next";
import { getQuestionBank } from "@/lib/questionBank";
import DailyTest from "@/components/daily/DailyTest";

export const metadata: Metadata = {
  title: "데일리 테스트 | 호가창",
  description: "매일 8문항 — 최근 레슨 + SRS 복습 + 랜덤 출제, 일괄 채점",
};

export default function DailyPage() {
  // 데일리 테스트에는 examOnly 문항을 내보내지 않는다
  const bank = getQuestionBank().filter((q) => !q.examOnly);
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">데일리 테스트</h1>
      <p className="mt-2 mb-6 text-muted">매일 8문항, 배운 것을 꺼내보는 시간.</p>
      <DailyTest bank={bank} />
    </div>
  );
}
