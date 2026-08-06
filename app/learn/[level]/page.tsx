import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CURRICULUM, getCurriculumLevel } from "@/lib/curriculum";
import { getAllLessonIds, getLevelContent } from "@/lib/content";
import { mdxComponents } from "@/components/mdx/mdxComponents";
import Checkpoint from "@/components/mdx/Checkpoint";

type Props = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams(): { level: string }[] {
  return CURRICULUM.map((l) => ({ level: String(l.level) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level } = await params;
  const cur = getCurriculumLevel(Number(level));
  if (!cur) return {};
  return {
    title: `Level ${cur.level} — ${cur.title} | 호가창`,
    description: cur.goal,
  };
}

export default async function LevelPage({ params }: Props) {
  const { level } = await params;
  const levelNum = Number(level);
  const cur = getCurriculumLevel(levelNum);
  if (!cur) notFound();

  const content = getLevelContent(levelNum);
  const existingIds = getAllLessonIds();

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <p className="font-mono text-sm text-muted">Level {cur.level}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em]">
        {cur.title}
      </h1>

      <dl className="mt-4 space-y-1 border-y border-line py-3 text-[15px]">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 font-bold">목표</dt>
          <dd>{cur.goal}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 font-bold">소요</dt>
          <dd>{cur.duration}</dd>
        </div>
      </dl>

      {content && content.content.trim() !== "" && (
        <div className="mt-6">
          <MDXRemote
            source={content.content}
            components={mdxComponents}
            options={{ blockJS: false }}
          />
        </div>
      )}

      <h2 className="mt-10 mb-4 border-b border-line pb-2 text-xl font-extrabold tracking-[-0.035em]">
        모듈
      </h2>
      <div className="space-y-6">
        {cur.modules.map((mod) => (
          <section key={mod.id}>
            <h3 className="mb-2 font-bold">
              <span className="mr-2 font-mono text-sm text-muted">{mod.id}</span>
              {mod.title}
            </h3>
            <ul className="divide-y divide-line rounded-md border border-line bg-surface">
              {mod.lessons.map((lesson) => {
                const exists = existingIds.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    {exists ? (
                      <Link
                        href={`/learn/${cur.level}/${lesson.id}`}
                        className="flex items-baseline gap-3 px-4 py-2.5 text-[15px] transition-colors hover:bg-ink/5"
                      >
                        <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                          {lesson.id}
                        </span>
                        <span>{lesson.title}</span>
                      </Link>
                    ) : (
                      <div className="flex items-baseline gap-3 px-4 py-2.5 text-[15px] text-muted">
                        <span className="shrink-0 font-mono text-xs tabular-nums">
                          {lesson.id}
                        </span>
                        <span>{lesson.title}</span>
                        <span className="ml-auto shrink-0 text-xs">준비 중</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Checkpoint title="레벨 체크포인트" items={[cur.checkpoint]} />
      </div>
    </div>
  );
}
