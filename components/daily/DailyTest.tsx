"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { BankQuestion } from "@/types/content";
import { useProgress } from "@/hooks/useProgress";
import { composeDailyTest, gradeBatch } from "@/lib/exam";
import { localDateKey } from "@/lib/date";
import type { QuizAnswer } from "@/lib/progress";
import BatchQuiz from "@/components/exam/BatchQuiz";
import GradedReview from "@/components/exam/GradedReview";

type Props = {
  /** examOnly 제외한 문제은행 (서버에서 주입) */
  bank: BankQuestion[];
};

export default function DailyTest({ bank }: Props) {
  const { store, hydrated, hydrate, applyDaily } = useProgress();
  useEffect(() => hydrate(), [hydrate]);

  const dateKey = localDateKey();
  const bankMap = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const questionIds = useMemo(
    () => (store ? composeDailyTest(bank, store, dateKey) : null),
    [bank, store, dateKey]
  );

  if (!hydrated) return null;

  if (!store) {
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          데일리 테스트는 학습 기록을 기반으로 출제된다. 아직 이 브라우저에 기록이 없다.
        </p>
        <Link
          href="/curriculum"
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
        >
          커리큘럼 보러 가기 →
        </Link>
      </div>
    );
  }

  const done = store.dailyTests[dateKey];
  if (done) {
    const ratio = done.total > 0 ? done.score / done.total : 0;
    const wrongSet = new Set(done.wrongIds);
    const entries = done.questionIds
      .map((id) => bankMap.get(id))
      .filter((q): q is BankQuestion => q !== undefined)
      .map((question) => ({ question, correct: !wrongSet.has(question.id) }));
    return (
      <div className="space-y-5">
        <div className="rounded-md border border-line bg-surface p-5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">오늘의 결과</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
            <span className={ratio >= 0.8 ? "text-rise" : "text-fall"}>{done.score}</span>
            <span className="text-muted"> / {done.total}</span>
            <span className="ml-3 text-lg">({Math.round(ratio * 100)}%)</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            연속 {store.streak.current.toLocaleString("ko-KR")}일째. 내일 다시 출제된다 — 틀린
            문항은 SRS에 등록돼 다시 나온다.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">문항별 해설</h2>
          <GradedReview entries={entries} />
        </div>
      </div>
    );
  }

  if (!questionIds) {
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          출제할 문항이 부족하다 (최소 4문항 필요). 레슨을 완료하면 그 레슨의 퀴즈가
          문제은행에 쌓이고, 여기서 매일 8문항이 출제된다.
        </p>
        <Link
          href="/curriculum"
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
        >
          레슨 학습하러 가기 →
        </Link>
      </div>
    );
  }

  const questions = questionIds
    .map((id) => bankMap.get(id))
    .filter((q): q is BankQuestion => q !== undefined)
    .map((q) => ({ id: q.id, item: q.item }));

  function submit(answers: QuizAnswer[]): void {
    const corrects = gradeBatch(questions.map((q) => q.item), answers);
    applyDaily({ dateKey, questionIds: questions.map((q) => q.id), corrects });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-line bg-surface p-3 text-sm leading-relaxed text-muted">
        오늘 {questions.length}문항. 해설은 전부 제출한 뒤에 한꺼번에 공개된다 — 중간에
        정답을 확인할 수 없다.
      </p>
      <BatchQuiz questions={questions} submitLabel="제출하고 채점하기" onSubmit={submit} />
    </div>
  );
}
