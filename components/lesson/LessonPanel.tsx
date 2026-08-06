"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { QuizItem } from "@/types/content";
import {
  completionBlockers,
  countSummaryLines,
  deriveStatus,
  emptyLessonRecord,
  MIN_SUMMARY_LINES,
  prerequisitesMet,
} from "@/lib/progress";
import { useProgress } from "@/hooks/useProgress";
import LessonQuiz from "@/components/quiz/LessonQuiz";

type Props = {
  lessonId: string;
  level: number;
  prerequisites: string[];
  quiz: QuizItem[];
};

export default function LessonPanel({ lessonId, level, prerequisites, quiz }: Props) {
  const { store, hydrated, hydrate } = useProgress();
  const startLearning = useProgress((s) => s.startLearning);
  const recordQuizAttempt = useProgress((s) => s.recordQuizAttempt);
  const setSummaryAction = useProgress((s) => s.setSummary);
  const setNoteAction = useProgress((s) => s.setNote);
  const setPracticeDone = useProgress((s) => s.setPracticeDone);
  const complete = useProgress((s) => s.complete);

  useEffect(() => hydrate(), [hydrate]);

  if (!hydrated) return null;

  // 방문자 모드: 쓰기 UI를 숨기고 안내만 (PROJECT_SPEC 11.6)
  if (!store) {
    return (
      <section className="mt-10 rounded-md border border-line bg-surface p-4 text-sm leading-relaxed">
        <p className="font-bold">지금은 읽기 모드다</p>
        <p className="mt-1 text-muted">
          모든 레슨은 자유롭게 읽을 수 있다. 학습 기록(퀴즈·자기 요약·진도)은 이
          브라우저의 저장소에만 남으며, 서버로 전송되지 않는다. 기록을 시작하면
          레슨은 <span className="text-ink">선행 레슨 완료 + 퀴즈 정답률 80% +
          자기 요약 3줄</span> 조건으로 순서대로 잠금 해제된다.
        </p>
        <button
          type="button"
          onClick={startLearning}
          className="mt-3 rounded-md bg-ink px-4 py-2 font-medium text-paper transition-colors hover:bg-ink/85"
        >
          이 브라우저에서 학습 기록 시작하기
        </button>
      </section>
    );
  }

  return (
    <OwnerPanel
      key={lessonId}
      lessonId={lessonId}
      level={level}
      prerequisites={prerequisites}
      quiz={quiz}
      record={store.lessons[lessonId] ?? emptyLessonRecord()}
      status={deriveStatus(prerequisites, store, lessonId)}
      prereqsMet={prerequisitesMet(prerequisites, store.lessons)}
      actions={{ recordQuizAttempt, setSummaryAction, setNoteAction, setPracticeDone, complete }}
    />
  );
}

type OwnerProps = Props & {
  record: ReturnType<typeof emptyLessonRecord>;
  status: ReturnType<typeof deriveStatus>;
  prereqsMet: boolean;
  actions: {
    recordQuizAttempt: (lessonId: string, score: number) => void;
    setSummaryAction: (lessonId: string, text: string) => void;
    setNoteAction: (lessonId: string, text: string) => void;
    setPracticeDone: (lessonId: string, done: boolean) => void;
    complete: (lessonId: string, prereqsMet: boolean) => boolean;
  };
};

function OwnerPanel({
  lessonId,
  level,
  prerequisites,
  quiz,
  record,
  status,
  prereqsMet,
  actions,
}: OwnerProps) {
  const [summary, setSummary] = useState(record.mySummary);
  const [note, setNote] = useState(record.note);

  const summaryLines = countSummaryLines(summary);
  const blockers = completionBlockers(
    { quizScore: record.quizScore, mySummary: summary },
    prereqsMet
  );
  const isCompleted = status === "completed";

  if (status === "locked") {
    return (
      <section className="mt-10 rounded-md border border-line border-l-4 border-l-fall bg-surface p-4 text-sm leading-relaxed">
        <p className="font-bold text-fall">이 레슨은 아직 잠겨 있다</p>
        <p className="mt-1 text-muted">
          선행 레슨{" "}
          {prerequisites.map((id, i) => (
            <span key={id}>
              {i > 0 && ", "}
              <Link
                href={`/learn/${level}/${id}`}
                className="font-mono text-ink underline"
              >
                {id}
              </Link>
            </span>
          ))}
          을(를) 완료하면 열린다. 읽어보는 것은 자유지만, 퀴즈와 완료 처리는
          순서를 지킨다.
        </p>
      </section>
    );
  }

  function handleComplete(): void {
    actions.setSummaryAction(lessonId, summary);
    actions.complete(lessonId, prereqsMet);
  }

  return (
    <div className="mt-10 space-y-6">
      {isCompleted && (
        <p className="rounded-md border border-rise/40 bg-rise/10 px-4 py-2 text-sm font-medium text-rise">
          완료한 레슨이다
          {record.completedAt && (
            <span className="ml-2 font-mono text-xs tabular-nums">
              {new Date(record.completedAt).toLocaleDateString("ko-KR")}
            </span>
          )}{" "}
          — 복습은 언제나 자유다.
        </p>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold tracking-wide uppercase">
          확인 퀴즈
        </h2>
        {record.attempts > 0 && (
          <p className="mb-2 font-mono text-xs text-muted tabular-nums">
            시도 {record.attempts}회 · 최고 정답률{" "}
            {record.quizScore !== null ? Math.round(record.quizScore * 100) : 0}%
          </p>
        )}
        <LessonQuiz
          items={quiz}
          onFinish={(score) => actions.recordQuizAttempt(lessonId, score)}
        />
      </section>

      <section>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={record.practiceDone}
            onChange={(e) => actions.setPracticeDone(lessonId, e.target.checked)}
            className="size-4 accent-[var(--rise)]"
          />
          실습 과제를 직접 해봤다
        </label>
      </section>

      <section>
        <h2 className="mb-1 text-xs font-bold tracking-wide uppercase">
          자기 요약 <span className="text-rise">*</span>
        </h2>
        <p className="mb-2 text-sm text-muted">
          이 레슨을 처음 듣는 사람에게 설명한다면? ({MIN_SUMMARY_LINES}줄 이상)
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onBlur={() => actions.setSummaryAction(lessonId, summary)}
          rows={5}
          placeholder={"예)\n돈은 실물이 아니라 사회적 합의다\n물물교환은 욕망의 이중일치 문제로 규모가 못 커진다\n..."}
          className="w-full rounded-md border border-line bg-surface p-3 text-sm leading-relaxed focus:outline-2 focus:outline-fall"
        />
        <p
          className={`mt-1 font-mono text-xs tabular-nums ${
            summaryLines >= MIN_SUMMARY_LINES ? "text-rise" : "text-muted"
          }`}
        >
          {summaryLines} / {MIN_SUMMARY_LINES}줄
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold tracking-wide uppercase">메모</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => actions.setNoteAction(lessonId, note)}
          rows={3}
          placeholder="레슨을 보며 남기고 싶은 메모 (선택)"
          className="w-full rounded-md border border-line bg-surface p-3 text-sm leading-relaxed focus:outline-2 focus:outline-fall"
        />
      </section>

      {!isCompleted && (
        <section className="rounded-md border border-line bg-surface p-4">
          <button
            type="button"
            onClick={handleComplete}
            disabled={blockers.length > 0}
            className="rounded-md bg-rise px-5 py-2.5 text-sm font-bold text-surface transition-colors hover:bg-rise/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            레슨 완료
          </button>
          {blockers.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {blockers.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="text-fall" aria-hidden>
                    ✕
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
          {blockers.length === 0 && (
            <p className="mt-2 text-sm text-muted">
              조건을 모두 충족했다. 완료하면 다음 레슨이 열린다.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
