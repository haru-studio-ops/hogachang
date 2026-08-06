import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CURRICULUM } from "@/lib/curriculum";
import {
  extractHeadings,
  getAdjacentLessons,
  getLesson,
  getLessonsForLevel,
} from "@/lib/content";
import { mdxComponents } from "@/components/mdx/mdxComponents";
import Checkpoint from "@/components/mdx/Checkpoint";

type Props = {
  params: Promise<{ level: string; lesson: string }>;
};

export function generateStaticParams(): { level: string; lesson: string }[] {
  return CURRICULUM.flatMap((cur) =>
    getLessonsForLevel(cur.level).map((l) => ({
      level: String(cur.level),
      lesson: l.id,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level, lesson } = await params;
  const data = getLesson(Number(level), lesson);
  if (!data) return {};
  return {
    title: `${data.title} | 호가창`,
    description: data.subtitle,
  };
}

export default async function LessonPage({ params }: Props) {
  const { level, lesson } = await params;
  const levelNum = Number(level);
  const data = getLesson(levelNum, lesson);
  if (!data) notFound();

  const headings = extractHeadings(data.content);
  const { prev, next } = getAdjacentLessons(levelNum, data.id);
  const quizCount = data.quiz.filter((q) => !q.examOnly).length;

  return (
    <div className="mx-auto flex w-full max-w-[984px] justify-center gap-6">
      <article className="w-full min-w-0 max-w-[720px]">
        <header>
          <p className="font-mono text-sm text-muted">
            <Link href={`/learn/${levelNum}`} className="hover:text-ink">
              Level {levelNum}
            </Link>
            <span className="mx-1.5">/</span>
            {data.id}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em]">
            {data.title}
          </h1>
          <p className="mt-2 text-lg text-muted">{data.subtitle}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-2 font-mono text-xs text-muted tabular-nums">
            <span>약 {data.estimatedMinutes}분</span>
            <span>난이도 {"●".repeat(data.difficulty)}{"○".repeat(5 - data.difficulty)}</span>
            {data.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </p>
        </header>

        <div className="mt-6">
          <MDXRemote
            source={data.content}
            components={mdxComponents}
            options={{ blockJS: false }}
          />
        </div>

        {data.practice.length > 0 && (
          <section className="mt-10 rounded-md border border-line bg-surface p-4">
            <h2 className="mb-2 text-xs font-bold tracking-wide uppercase">
              🧪 실습 과제
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
              {data.practice.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        )}

        {data.checkpoint && <Checkpoint items={[data.checkpoint]} />}

        <section className="mt-6 rounded-md border border-dashed border-line p-4 text-sm text-muted">
          이 레슨에는 확인 퀴즈 {quizCount}문항이 준비되어 있다. 퀴즈 풀이와 완료
          처리는 진도 시스템(M2)과 함께 열린다.
        </section>

        <nav className="mt-10 flex gap-3 border-t border-line pt-6 text-sm">
          {prev && (
            <Link
              href={`/learn/${levelNum}/${prev.id}`}
              className="flex-1 rounded-md border border-line bg-surface p-3 transition-colors hover:bg-ink/5"
            >
              <span className="block text-xs text-muted">← 이전 레슨</span>
              <span className="mt-1 block font-medium">{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link
              href={`/learn/${levelNum}/${next.id}`}
              className="flex-1 rounded-md border border-line bg-surface p-3 text-right transition-colors hover:bg-ink/5"
            >
              <span className="block text-xs text-muted">다음 레슨 →</span>
              <span className="mt-1 block font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      <aside className="hidden w-60 shrink-0 xl:block">
        <div className="sticky top-8">
          <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
            목차
          </p>
          <ul className="space-y-1 border-l border-line text-[13px]">
            {headings.map((h) => (
              <li key={h.slug}>
                <a
                  href={`#${h.slug}`}
                  className="block py-0.5 pl-3 text-muted transition-colors hover:text-ink"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
          {data.glossary.length > 0 && (
            <>
              <p className="mt-6 mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                이 레슨의 새 용어
              </p>
              <ul className="space-y-1 text-[13px] text-muted">
                {data.glossary.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
