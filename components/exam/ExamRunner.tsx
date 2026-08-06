"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BankQuestion } from "@/types/content";
import { useProgress } from "@/hooks/useProgress";
import {
  EXAM_PASS_THRESHOLD,
  canTakeExam,
  composeExam,
  gradeBatch,
  seedFromString,
} from "@/lib/exam";
import type { QuizAnswer } from "@/lib/progress";
import BatchQuiz from "@/components/exam/BatchQuiz";
import GradedReview from "@/components/exam/GradedReview";

type Props = {
  level: number;
  levelTitle: string;
  /** 해당 레벨 문제은행 (examOnly 포함, 서버에서 주입) */
  bank: BankQuestion[];
  /** 콘텐츠가 존재하는 레벨 레슨 id (응시 자격 판정용) */
  lessonIds: string[];
};

type LastResult = {
  entries: { question: BankQuestion; correct: boolean }[];
  score: number;
  total: number;
  passed: boolean;
};

function Badge({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-brass px-4 py-1.5 text-sm font-bold text-paper">
      Level {level} 졸업
    </span>
  );
}

export default function ExamRunner({ level, levelTitle, bank, lessonIds }: Props) {
  const { store, hydrated, hydrate, applyExam } = useProgress();
  useEffect(() => hydrate(), [hydrate]);
  const [questionIds, setQuestionIds] = useState<string[] | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  if (!hydrated) return null;

  if (!store) {
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          졸업시험은 레벨의 모든 레슨을 완료한 뒤 응시할 수 있다. 아직 이 브라우저에 학습
          기록이 없다.
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

  // 직전 제출 결과 (같은 세션에서만 해설 노출)
  if (lastResult) {
    const ratio = lastResult.total > 0 ? lastResult.score / lastResult.total : 0;
    return (
      <div className="space-y-5">
        <div className="rounded-md border border-line bg-surface p-5">
          {lastResult.passed && (
            <p className="mb-3">
              <Badge level={level} />
            </p>
          )}
          <p className="font-mono text-3xl font-bold tabular-nums">
            <span className={lastResult.passed ? "text-rise" : "text-fall"}>
              {lastResult.score}
            </span>
            <span className="text-muted"> / {lastResult.total}</span>
            <span className="ml-3 text-lg">({Math.round(ratio * 100)}%)</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {lastResult.passed
              ? "합격선 80%를 넘었다. 다음 레벨이 열렸다."
              : "합격선은 80%다. 틀린 문항의 레슨이 '복습 필요'로 표시됐고, 24시간 후 새 문항으로 재응시할 수 있다."}
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">문항별 해설</h2>
          <GradedReview entries={lastResult.entries} />
        </div>
      </div>
    );
  }

  const gate = canTakeExam(store, level, lessonIds);

  if (!gate.ok && gate.reason === "already_passed") {
    const record = store.exams[String(level)];
    const best = record?.attempts.find((a) => a.passed);
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <Badge level={level} />
        <p className="mt-3 leading-relaxed">
          이미 합격했다
          {best && (
            <span className="font-mono tabular-nums">
              {" "}
              ({best.score}/{best.total}, {Math.round((best.score / best.total) * 100)}%)
            </span>
          )}
          . 다음 레벨로 넘어가도 좋다.
        </p>
      </div>
    );
  }

  if (!gate.ok && gate.reason === "lessons_incomplete") {
    const doneCount = lessonIds.filter((id) => store.lessons[id]?.completedAt != null).length;
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          Level {level} 레슨을 전부 완료해야 응시할 수 있다. 현재{" "}
          <span className="font-mono tabular-nums">
            {doneCount} / {lessonIds.length}
          </span>
          개 완료.
        </p>
        <Link
          href="/curriculum"
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
        >
          남은 레슨 보러 가기 →
        </Link>
      </div>
    );
  }

  if (!gate.ok) {
    // cooldown
    const retry = gate.retryAt ? new Date(gate.retryAt) : null;
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          불합격 후 24시간이 지나야 재응시할 수 있다.
          {retry && (
            <>
              {" "}
              재응시 가능:{" "}
              <span className="font-mono tabular-nums">
                {retry.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-muted">
          그동안 &lsquo;복습 필요&rsquo;로 표시된 레슨을 다시 보는 것이 가장 빠른 길이다.
        </p>
        <Link
          href="/review"
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
        >
          오답노트로 가기 →
        </Link>
      </div>
    );
  }

  if (!questionIds) {
    const attempts = store.exams[String(level)]?.attempts.length ?? 0;
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          <span className="font-bold">{levelTitle}</span> 전 범위에서{" "}
          <span className="font-mono tabular-nums">25</span>문항이 출제된다. 시간 제한은 없고,
          전부 제출한 뒤 일괄 채점된다. 합격선은{" "}
          <span className="font-mono tabular-nums">
            {Math.round(EXAM_PASS_THRESHOLD * 100)}%
          </span>
          다. 불합격하면 24시간 후 새 문항으로 재응시한다.
        </p>
        {attempts > 0 && (
          <p className="mt-2 font-mono text-sm text-muted tabular-nums">
            지금까지 {attempts}회 응시.
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            setQuestionIds(
              composeExam(bank, level, store, seedFromString(`exam-${level}-${Date.now()}`))
            )
          }
          className="mt-4 rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
        >
          시험 시작
        </button>
      </div>
    );
  }

  const bankMap = new Map(bank.map((q) => [q.id, q]));
  const questions = questionIds
    .map((id) => bankMap.get(id))
    .filter((q): q is BankQuestion => q !== undefined);

  function submit(answers: QuizAnswer[]): void {
    const corrects = gradeBatch(questions.map((q) => q.item), answers);
    applyExam({
      level,
      questions: questions.map((q) => ({ id: q.id, lessonId: q.lessonId })),
      corrects,
    });
    const score = corrects.filter(Boolean).length;
    setLastResult({
      entries: questions.map((question, i) => ({ question, correct: corrects[i] })),
      score,
      total: questions.length,
      passed: questions.length > 0 && score / questions.length >= EXAM_PASS_THRESHOLD,
    });
    setQuestionIds(null);
  }

  return (
    <BatchQuiz
      questions={questions.map((q) => ({ id: q.id, item: q.item }))}
      submitLabel="제출하고 채점하기"
      onSubmit={submit}
    />
  );
}
