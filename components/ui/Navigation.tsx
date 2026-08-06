"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/curriculum", label: "커리큘럼" },
  { href: "/daily", label: "데일리 테스트" },
  { href: "/review", label: "오답노트" },
  { href: "/glossary", label: "용어사전" },
  { href: "/tools", label: "계산기" },
] as const;

export type NavLevel = {
  level: number;
  title: string;
  lessons: { id: string; title: string }[];
};

type Props = {
  levelTree: NavLevel[];
};

export default function Navigation({ levelTree }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      <Link
        href="/"
        className="mb-4 text-xl font-extrabold tracking-[-0.035em] text-ink"
      >
        호가창
      </Link>

      {NAV_ITEMS.map(({ href, label }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-ink/10 font-medium text-ink"
                : "text-muted hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}

      <p className="mt-6 mb-1 px-3 text-xs font-bold tracking-wide text-muted uppercase">
        레벨
      </p>
      {levelTree.map(({ level, title, lessons }) => {
        const levelHref = `/learn/${level}`;
        const isLevelActive = pathname.startsWith(`${levelHref}/`) || pathname === levelHref;
        const hasContent = lessons.length > 0;
        return (
          <div key={level}>
            <Link
              href={levelHref}
              className={`flex items-baseline gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isLevelActive
                  ? "bg-ink/10 font-medium text-ink"
                  : hasContent
                    ? "text-ink/80 hover:bg-ink/5 hover:text-ink"
                    : "text-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span className="shrink-0 font-mono text-xs tabular-nums">
                L{level}
              </span>
              <span className="truncate">{title}</span>
            </Link>
            {isLevelActive && hasContent && (
              <ul className="mt-0.5 mb-1 border-l border-line pl-3 ml-4">
                {lessons.map((lesson) => {
                  const href = `/learn/${level}/${lesson.id}`;
                  const active = pathname === href;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={href}
                        className={`block rounded-md px-2 py-1 text-[13px] leading-snug transition-colors ${
                          active
                            ? "font-medium text-rise"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        <span className="mr-1.5 font-mono text-xs tabular-nums">
                          {lesson.id}
                        </span>
                        {lesson.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
