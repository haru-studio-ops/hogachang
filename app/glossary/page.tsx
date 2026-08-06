import type { Metadata } from "next";
import glossary from "@/content/glossary.json";
import type { GlossaryEntry } from "@/types/content";
import { CURRICULUM } from "@/lib/curriculum";
import { getLessonsForLevel } from "@/lib/content";
import GlossaryBrowser, { type GlossaryItem } from "@/components/glossary/GlossaryBrowser";

export const metadata: Metadata = {
  title: "용어사전 | 호가창",
  description: "레슨에 나온 모든 용어를 검색하고 레벨별로 찾아본다",
};

const GLOSSARY: Record<string, GlossaryEntry> = glossary;

export default function GlossaryPage() {
  // 용어 → 처음 등장하는 레슨 (레슨 프론트매터 glossary 배열 기준)
  const origin = new Map<string, { level: number; lessonId: string }>();
  for (const cur of CURRICULUM) {
    for (const meta of getLessonsForLevel(cur.level)) {
      for (const term of meta.glossary) {
        if (!origin.has(term)) origin.set(term, { level: meta.level, lessonId: meta.id });
      }
    }
  }

  const items: GlossaryItem[] = Object.entries(GLOSSARY)
    .map(([term, entry]) => ({
      term,
      ...(entry.en ? { en: entry.en } : {}),
      definition: entry.definition,
      level: origin.get(term)?.level ?? null,
      lessonId: origin.get(term)?.lessonId ?? null,
    }))
    .sort((a, b) => a.term.localeCompare(b.term, "ko"));

  const levels = [...new Set(items.map((i) => i.level).filter((l): l is number => l !== null))].sort(
    (a, b) => a - b
  );

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">용어사전</h1>
      <p className="mt-2 mb-6 text-muted">
        레슨 본문의 점선 밑줄 용어와 같은 사전이다. 레벨은 그 용어가 처음 나오는 레슨 기준.
      </p>
      <GlossaryBrowser items={items} levels={levels} />
    </div>
  );
}
