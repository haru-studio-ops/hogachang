import type { Metadata } from "next";
import { getQuestionBank } from "@/lib/questionBank";
import ReviewList from "@/components/review/ReviewList";

export const metadata: Metadata = {
  title: "오답노트 | 호가창",
  description: "틀린 문항과 오늘 만기된 SRS 복습 카드",
};

export default function ReviewPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">오답노트</h1>
      <p className="mt-2 mb-6 text-muted">틀린 문제와 오늘 복습할 카드.</p>
      <ReviewList bank={getQuestionBank()} />
    </div>
  );
}
