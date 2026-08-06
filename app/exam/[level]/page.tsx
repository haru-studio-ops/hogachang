import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRICULUM } from "@/lib/curriculum";
import { getLessonsForLevel } from "@/lib/content";
import { getQuestionBank } from "@/lib/questionBank";
import ExamRunner from "@/components/exam/ExamRunner";

type Props = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams(): { level: string }[] {
  return CURRICULUM.map((l) => ({ level: String(l.level) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level } = await params;
  return {
    title: `Level ${level} 졸업시험 | 호가창`,
    description: "25문항 일괄 채점, 80% 이상 합격",
  };
}

export default async function ExamPage({ params }: Props) {
  const { level: levelParam } = await params;
  const level = Number(levelParam);
  const cur = CURRICULUM.find((l) => l.level === level);
  if (!cur) notFound();

  const lessons = getLessonsForLevel(level);
  const bank = getQuestionBank().filter((q) => q.level === level);

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        Level {level} 졸업시험
      </h1>
      <p className="mt-2 mb-6 text-muted">25문항, 80% 이상 통과해야 다음 레벨로.</p>
      {lessons.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-5">
          <p className="leading-relaxed text-muted">
            이 레벨의 콘텐츠가 아직 준비되지 않았다. 레슨이 열리면 시험도 함께 열린다.
          </p>
        </div>
      ) : (
        <ExamRunner
          level={level}
          levelTitle={cur.title}
          bank={bank}
          lessonIds={lessons.map((l) => l.id)}
        />
      )}
    </div>
  );
}
