"use client";

import Link from "next/link";
import type { BankQuestion } from "@/types/content";

type Props = {
  entries: { question: BankQuestion; correct: boolean }[];
};

function correctAnswerText(question: BankQuestion): string {
  const { item } = question;
  if (item.kind === "numeric") return `${item.answerValue}${item.unit ?? ""}`;
  return `${item.answer + 1}. ${item.choices[item.answer]}`;
}

/** 일괄 채점 후 문항별 정오답·해설 리뷰 (제출 완료 후에만 렌더링할 것) */
export default function GradedReview({ entries }: Props) {
  return (
    <div className="space-y-3">
      {entries.map(({ question, correct }, i) => (
        <div
          key={question.id}
          className={`rounded-md border-l-4 bg-surface p-4 ${
            correct ? "border-rise" : "border-fall"
          }`}
        >
          <p className="flex items-baseline gap-2">
            <span className={`font-bold ${correct ? "text-rise" : "text-fall"}`}>
              {correct ? "정답" : "오답"}
            </span>
            <span className="font-mono text-xs text-muted tabular-nums">{i + 1}번</span>
          </p>
          <p className="mt-1 font-medium leading-relaxed">{question.item.q}</p>
          <p className="mt-2 text-sm">
            <span className="font-bold">정답: </span>
            <span className="font-mono tabular-nums">{correctAnswerText(question)}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{question.item.explain}</p>
          <Link
            href={`/learn/${question.level}/${question.lessonId}`}
            className="mt-2 inline-block text-xs font-medium underline underline-offset-2 hover:text-fall"
          >
            레슨 {question.lessonId} 다시 보기 →
          </Link>
        </div>
      ))}
    </div>
  );
}
