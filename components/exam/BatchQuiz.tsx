"use client";

import { useState } from "react";
import type { QuizItem } from "@/types/content";
import type { QuizAnswer } from "@/lib/progress";

type Props = {
  questions: { id: string; item: QuizItem }[];
  submitLabel: string;
  /** 전 문항 응답 후 제출 시 답 배열과 함께 호출 */
  onSubmit: (answers: QuizAnswer[]) => void;
};

/**
 * 일괄 채점 퀴즈 (데일리 테스트·졸업시험 공용).
 * 제출 전에는 어떤 문항의 정답·해설도 절대 노출하지 않는다.
 */
export default function BatchQuiz({ questions, submitLabel, onSubmit }: Props) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [numerics, setNumerics] = useState<Record<number, string>>({});

  const answers: QuizAnswer[] = questions.map(({ item }, i) => {
    if (item.kind === "numeric") {
      const raw = (numerics[i] ?? "").trim();
      return raw === "" || Number.isNaN(Number(raw)) ? null : Number(raw);
    }
    return choices[i] ?? null;
  });
  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="space-y-4">
      {questions.map(({ id, item }, i) => (
        <div key={id} className="rounded-md border border-line bg-surface p-4">
          <p className="font-mono text-xs text-muted tabular-nums">
            {i + 1} / {questions.length}
          </p>
          <p className="mt-2 font-medium leading-relaxed">{item.q}</p>

          {item.kind === "numeric" ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={numerics[i] ?? ""}
                onChange={(e) => setNumerics((prev) => ({ ...prev, [i]: e.target.value }))}
                className="w-40 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm tabular-nums focus:outline-2 focus:outline-fall"
                aria-label={`${i + 1}번 답 입력`}
              />
              {item.unit && <span className="text-sm text-muted">{item.unit}</span>}
            </div>
          ) : (
            <div className="mt-3 space-y-1.5" role="radiogroup" aria-label={`${i + 1}번 보기`}>
              {item.choices.map((choice, ci) => {
                const isSelected = choices[i] === ci;
                return (
                  <button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setChoices((prev) => ({ ...prev, [i]: ci }))}
                    className={`block w-full rounded-md border px-3 py-2 text-left text-[15px] transition-colors ${
                      isSelected
                        ? "border-ink bg-ink/5 font-medium"
                        : "border-line hover:bg-ink/5"
                    }`}
                  >
                    <span className="mr-2 font-mono text-xs text-muted">{ci + 1}</span>
                    {choice}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="sticky bottom-4 flex items-center justify-between rounded-md border border-line bg-paper p-4 shadow-sm">
        <p className="font-mono text-sm text-muted tabular-nums">
          {answeredCount} / {questions.length} 응답
        </p>
        <button
          type="button"
          onClick={() => onSubmit(answers)}
          disabled={!allAnswered}
          className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
