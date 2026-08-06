"use client";

import { useState } from "react";
import Link from "next/link";

export type GlossaryItem = {
  term: string;
  en?: string;
  definition: string;
  /** 이 용어가 처음 나오는 레슨의 레벨 (아직 레슨에 안 나왔으면 null) */
  level: number | null;
  lessonId: string | null;
};

type Props = {
  items: GlossaryItem[];
  /** 용어가 존재하는 레벨 목록 (오름차순) */
  levels: number[];
};

export default function GlossaryBrowser({ items, levels }: Props) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<number | "all">("all");

  const q = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (level !== "all" && item.level !== level) return false;
    if (q === "") return true;
    return (
      item.term.toLowerCase().includes(q) ||
      (item.en ?? "").toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q)
    );
  });

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:bg-ink/5"
    }`;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="용어·영문·설명 검색"
        aria-label="용어 검색"
        className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-[15px] focus:outline-2 focus:outline-fall"
      />

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="레벨 필터">
        <button type="button" onClick={() => setLevel("all")} className={chipClass(level === "all")}>
          전체
        </button>
        {levels.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            className={chipClass(level === lv)}
          >
            Level {lv}
          </button>
        ))}
      </div>

      <p className="font-mono text-xs text-muted tabular-nums">
        {filtered.length.toLocaleString("ko-KR")}개 용어
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-line bg-surface p-5 text-sm text-muted">
          조건에 맞는 용어가 없다.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.term}
              id={`term-${item.term}`}
              className="rounded-md border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-base font-bold">{item.term}</h2>
                {item.en && <span className="font-mono text-xs text-muted">{item.en}</span>}
                {item.level !== null && (
                  <span className="ml-auto rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-muted tabular-nums">
                    L{item.level}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{item.definition}</p>
              {item.lessonId && item.level !== null && (
                <Link
                  href={`/learn/${item.level}/${item.lessonId}`}
                  className="mt-2 inline-block text-xs font-medium underline underline-offset-2 hover:text-fall"
                >
                  처음 나오는 레슨 {item.lessonId} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
