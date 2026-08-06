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
  { href: "/notes", label: "학습 노트" },
  { href: "/stats", label: "통계" },
] as const;

export default function Navigation() {
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
    </nav>
  );
}
