"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BankQuestion } from "@/types/content";
import { useProgress } from "@/hooks/useProgress";
import { dueQuestionIds } from "@/lib/srs";

type Props = {
  /** 전체 문제은행 (서버에서 주입) */
  bank: BankQuestion[];
};

function ReviewCard({
  question,
  meta,
}: {
  question: BankQuestion;
  meta: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const { item } = question;
  const answerText =
    item.kind === "numeric"
      ? `${item.answerValue}${item.unit ?? ""}`
      : `${item.answer + 1}. ${item.choices[item.answer]}`;
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="font-mono text-xs text-muted tabular-nums">{meta}</p>
      <p className="mt-1 font-medium leading-relaxed">{item.q}</p>
      {item.kind !== "numeric" && (
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {item.choices.map((c, i) => (
            <li key={c}>
              <span className="mr-1.5 font-mono text-xs">{i + 1}</span>
              {c}
            </li>
          ))}
        </ul>
      )}
      {revealed ? (
        <div className="mt-3 rounded-md border-l-4 border-rise bg-paper p-3 text-sm leading-relaxed">
          <p>
            <span className="font-bold">정답: </span>
            <span className="font-mono tabular-nums">{answerText}</span>
          </p>
          <p className="mt-1 text-muted">{item.explain}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
        >
          답 떠올린 뒤 확인하기
        </button>
      )}
      <Link
        href={`/learn/${question.level}/${question.lessonId}`}
        className="mt-2 block text-xs font-medium underline underline-offset-2 hover:text-fall"
      >
        레슨 {question.lessonId} 다시 보기 →
      </Link>
    </div>
  );
}

export default function ReviewList({ bank }: Props) {
  const { store, hydrated, hydrate } = useProgress();
  useEffect(() => hydrate(), [hydrate]);
  const bankMap = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);

  if (!hydrated) return null;

  if (!store) {
    return (
      <div className="rounded-md border border-line bg-surface p-5">
        <p className="leading-relaxed">
          오답노트는 데일리 테스트·시험에서 틀린 문항이 쌓이는 곳이다. 아직 이 브라우저에
          기록이 없다.
        </p>
      </div>
    );
  }

  const due = dueQuestionIds(store.srs)
    .map((id) => ({ id, card: store.srs[id], question: bankMap.get(id) }))
    .filter((e): e is { id: string; card: (typeof store.srs)[string]; question: BankQuestion } =>
      e.question !== undefined
    )
    .sort((a, b) => (a.card.dueAt < b.card.dueAt ? -1 : 1));

  const dueIds = new Set(due.map((e) => e.id));
  const wrongs = Object.entries(store.questionStats)
    .filter(([id, s]) => s.wrong > 0 && !dueIds.has(id))
    .map(([id, s]) => ({ id, stats: s, question: bankMap.get(id) }))
    .filter((e): e is { id: string; stats: { seen: number; wrong: number }; question: BankQuestion } =>
      e.question !== undefined
    )
    .sort((a, b) => b.stats.wrong / b.stats.seen - a.stats.wrong / a.stats.seen);

  const needsReview = Object.entries(store.lessons)
    .filter(([, r]) => r.status === "needs_review")
    .map(([id]) => id);

  const empty = due.length === 0 && wrongs.length === 0 && needsReview.length === 0;

  return (
    <div className="space-y-8">
      {empty && (
        <div className="rounded-md border border-line bg-surface p-5">
          <p className="leading-relaxed">
            복습할 것이 없다. 데일리 테스트에서 틀린 문항이 여기에 쌓이고, 간격을 두고
            (1·3·7·16·35일) 다시 나온다.
          </p>
          <Link
            href="/daily"
            className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
          >
            데일리 테스트 하러 가기 →
          </Link>
        </div>
      )}

      {needsReview.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">복습 필요로 표시된 레슨</h2>
          <ul className="space-y-1.5">
            {needsReview.map((id) => (
              <li key={id}>
                <Link
                  href={`/learn/${id.split("-")[0]}/${id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-ink/5"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-fall" aria-hidden />
                  레슨 {id} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {due.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-bold">
            오늘 복습 카드{" "}
            <span className="font-mono text-base text-muted tabular-nums">{due.length}장</span>
          </h2>
          <p className="mb-3 text-sm text-muted">
            만기된 카드는 다음 데일리 테스트에 우선 출제된다. 미리 답을 떠올려 보자.
          </p>
          <div className="space-y-3">
            {due.map(({ id, card, question }) => (
              <ReviewCard
                key={id}
                question={question}
                meta={`간격 ${card.interval}일 · 틀린 횟수 ${card.lapses}회`}
              />
            ))}
          </div>
        </section>
      )}

      {wrongs.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-bold">
            틀린 적 있는 문항{" "}
            <span className="font-mono text-base text-muted tabular-nums">{wrongs.length}개</span>
          </h2>
          <p className="mb-3 text-sm text-muted">오답률이 높은 순서. 출제 확률도 그만큼 높다.</p>
          <div className="space-y-3">
            {wrongs.map(({ id, stats, question }) => (
              <ReviewCard
                key={id}
                question={question}
                meta={`${stats.seen}회 중 ${stats.wrong}회 오답 (${Math.round(
                  (stats.wrong / stats.seen) * 100
                )}%)`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
