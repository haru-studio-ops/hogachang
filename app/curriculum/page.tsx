import Link from "next/link";
import type { Metadata } from "next";
import { CURRICULUM } from "@/lib/curriculum";
import { getAllLessonIds } from "@/lib/content";

export const metadata: Metadata = {
  title: "커리큘럼 | 호가창",
  description: "돈이란 무엇인가부터 실전 진입까지, Level 0~10 전체 학습 경로",
};

export default function CurriculumPage() {
  const existingIds = getAllLessonIds();
  const totalLessons = CURRICULUM.reduce(
    (sum, l) => sum + l.modules.reduce((s, m) => s + m.lessons.length, 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">커리큘럼</h1>
      <p className="mt-2 text-muted">
        Level 0부터 10까지, 총{" "}
        <span className="font-mono tabular-nums">{totalLessons}</span>개 레슨.
        순서대로 간다 — 차트는 돈과 금리와 시장 구조를 알고 난 다음이다.
      </p>

      <div className="mt-8 space-y-10">
        {CURRICULUM.map((cur) => {
          const lessonCount = cur.modules.reduce(
            (s, m) => s + m.lessons.length,
            0
          );
          const doneCount = cur.modules.reduce(
            (s, m) =>
              s + m.lessons.filter((l) => existingIds.has(l.id)).length,
            0
          );
          return (
            <section key={cur.level}>
              <Link href={`/learn/${cur.level}`} className="group block">
                <p className="font-mono text-sm text-muted">
                  Level {cur.level}
                  <span className="ml-3 tabular-nums">
                    {doneCount}/{lessonCount} 레슨 공개
                  </span>
                </p>
                <h2 className="mt-0.5 text-xl font-extrabold tracking-[-0.035em] group-hover:underline">
                  {cur.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{cur.goal}</p>
              </Link>

              <div className="mt-3 space-y-3">
                {cur.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-md border border-line bg-surface"
                  >
                    <p className="border-b border-line px-4 py-2 text-sm font-bold">
                      <span className="mr-2 font-mono text-xs text-muted">
                        {mod.id}
                      </span>
                      {mod.title}
                    </p>
                    <ul className="divide-y divide-line">
                      {mod.lessons.map((lesson) => {
                        const exists = existingIds.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            {exists ? (
                              <Link
                                href={`/learn/${cur.level}/${lesson.id}`}
                                className="flex items-baseline gap-3 px-4 py-2 text-sm transition-colors hover:bg-ink/5"
                              >
                                <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                                  {lesson.id}
                                </span>
                                <span>{lesson.title}</span>
                              </Link>
                            ) : (
                              <div className="flex items-baseline gap-3 px-4 py-2 text-sm text-muted/70">
                                <span className="shrink-0 font-mono text-xs tabular-nums">
                                  {lesson.id}
                                </span>
                                <span>{lesson.title}</span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
