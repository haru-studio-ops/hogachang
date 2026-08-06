"use client";

import { useState } from "react";
import type { QuizItem } from "@/types/content";
import { gradeQuizItem, scoreQuiz, type QuizAnswer } from "@/lib/progress";

type Props = {
  items: QuizItem[];
  /** 마지막 문항까지 풀면 정답률(0~1)과 함께 호출된다 */
  onFinish: (score: number) => void;
};

/**
 * 레슨 퀴즈. 문항별로 답 → 즉시 채점·해설 노출 (레슨 퀴즈에만 허용되는 방식.
 * 데일리 테스트·졸업시험은 일괄 채점이며 M5에서 별도 구현한다.)
 */
export default function LessonQuiz({ items, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const item = items[index];
  const isNumeric = item.kind === "numeric";
  const currentAnswer: QuizAnswer = isNumeric
    ? numericInput.trim() === "" || Number.isNaN(Number(numericInput))
      ? null
      : Number(numericInput)
    : selected;
  const correct = revealed && gradeQuizItem(item, currentAnswer);

  function reset(): void {
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setNumericInput("");
    setRevealed(false);
    setFinished(false);
  }

  function check(): void {
    if (currentAnswer === null) return;
    setRevealed(true);
  }

  function nextQuestion(): void {
    const nextAnswers = [...answers, currentAnswer];
    setAnswers(nextAnswers);
    setSelected(null);
    setNumericInput("");
    setRevealed(false);
    if (index + 1 < items.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      onFinish(scoreQuiz(items, nextAnswers));
    }
  }

  if (finished) {
    const score = scoreQuiz(items, answers);
    const correctCount = Math.round(score * items.length);
    const passed = score >= 0.8;
    return (
      <div className="rounded-md border border-line bg-surface p-4">
        <p className="font-mono text-2xl font-bold tabular-nums">
          <span className={passed ? "text-rise" : "text-fall"}>
            {correctCount}
          </span>
          <span className="text-muted"> / {items.length}</span>
          <span className="ml-3 text-base">({Math.round(score * 100)}%)</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {passed
            ? "통과 기준(80%)을 넘었다."
            : "통과 기준은 80%다. 본문을 다시 보고 재응시할 수 있다."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-3 rounded-md border border-line bg-paper px-4 py-2 text-sm font-medium transition-colors hover:bg-ink/5"
        >
          재응시
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="font-mono text-xs text-muted tabular-nums">
        {index + 1} / {items.length}
      </p>
      <p className="mt-2 font-medium leading-relaxed">{item.q}</p>

      {isNumeric ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={numericInput}
            onChange={(e) => setNumericInput(e.target.value)}
            disabled={revealed}
            className="w-40 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm tabular-nums focus:outline-2 focus:outline-fall"
            aria-label="답 입력"
          />
          {item.unit && <span className="text-sm text-muted">{item.unit}</span>}
        </div>
      ) : (
        <div className="mt-3 space-y-1.5" role="radiogroup">
          {item.choices.map((choice, i) => {
            const isSelected = selected === i;
            const showAsCorrect = revealed && i === item.answer;
            const showAsWrong = revealed && isSelected && i !== item.answer;
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={revealed}
                onClick={() => setSelected(i)}
                className={`block w-full rounded-md border px-3 py-2 text-left text-[15px] transition-colors ${
                  showAsCorrect
                    ? "border-rise bg-rise/10 font-medium"
                    : showAsWrong
                      ? "border-fall bg-fall/10"
                      : isSelected
                        ? "border-ink bg-ink/5 font-medium"
                        : "border-line hover:bg-ink/5"
                } ${revealed ? "cursor-default" : ""}`}
              >
                <span className="mr-2 font-mono text-xs text-muted">
                  {i + 1}
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {revealed && (
        <div
          className={`mt-3 rounded-md border-l-4 bg-paper p-3 text-sm leading-relaxed ${
            correct ? "border-rise" : "border-fall"
          }`}
        >
          <p className={`font-bold ${correct ? "text-rise" : "text-fall"}`}>
            {correct ? "정답" : "오답"}
            {item.kind === "numeric" && !correct && (
              <span className="ml-2 font-mono tabular-nums">
                정답: {item.answerValue}
                {item.unit ?? ""}
              </span>
            )}
          </p>
          <p className="mt-1">{item.explain}</p>
        </div>
      )}

      <div className="mt-3">
        {revealed ? (
          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
          >
            {index + 1 < items.length ? "다음 문항" : "결과 보기"}
          </button>
        ) : (
          <button
            type="button"
            onClick={check}
            disabled={currentAnswer === null}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            정답 확인
          </button>
        )}
      </div>
    </div>
  );
}
