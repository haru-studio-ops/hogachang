import { describe, expect, it } from "vitest";
import { serialize } from "next-mdx-remote/serialize";
import { slugify } from "@/lib/slugify";
import { mdxRemoteOptions } from "@/lib/mdxOptions";
import {
  extractHeadings,
  getAllLessonIds,
  getLesson,
  getLessonsForLevel,
  getLevelContent,
} from "@/lib/content";
import glossary from "@/content/glossary.json";
import type { GlossaryEntry } from "@/types/content";

describe("slugify", () => {
  it("한글 제목을 그대로 유지하며 공백을 하이픈으로 바꾼다", () => {
    expect(slugify("한 줄로")).toBe("한-줄로");
    expect(slugify("왜 알아야 하나")).toBe("왜-알아야-하나");
  });

  it("특수문자를 제거한다", () => {
    expect(slugify("금리↑ → 채권가격↓ (역관계)")).toBe("금리-채권가격-역관계");
  });
});

describe("extractHeadings", () => {
  it("h2만 추출한다", () => {
    const md = "# 제목\n\n## 한 줄로\n\n본문\n\n### 소제목\n\n## 개념\n";
    expect(extractHeadings(md)).toEqual([
      { text: "한 줄로", slug: "한-줄로" },
      { text: "개념", slug: "개념" },
    ]);
  });
});

describe("CJK 인접 강조 (remark-cjk-friendly)", () => {
  const source = "송나라의 **교자(交子)**다.";

  it("닫는 ** 뒤에 한글이 바로 붙어도 strong으로 렌더링된다", async () => {
    const { compiledSource } = await serialize(source, mdxRemoteOptions);
    expect(compiledSource).toContain("strong");
    expect(compiledSource).not.toContain("**");
  });

  it("플러그인이 없으면 별표가 그대로 남는다 (회귀 대조군)", async () => {
    const { compiledSource } = await serialize(source, { blockJS: false });
    expect(compiledSource).not.toContain("strong");
    expect(compiledSource).toContain("**");
  });
});

describe("Level 0 콘텐츠", () => {
  it("샘플 레슨 3개가 존재하고 id 순서가 맞다", () => {
    const lessons = getLessonsForLevel(0);
    expect(lessons.map((l) => l.id)).toEqual(["0-1-1", "0-1-2", "0-1-3"]);
  });

  it("모든 레슨은 6섹션 골격을 순서대로 지킨다", () => {
    const expected = [
      "한 줄로",
      "왜 알아야 하나",
      "개념",
      "비유로 이해하기",
      "실제 시장에서는",
      "흔한 오해",
    ];
    for (const meta of getLessonsForLevel(0)) {
      const lesson = getLesson(0, meta.id);
      expect(lesson).not.toBeNull();
      const h2 = extractHeadings(lesson!.content).map((h) => h.text);
      expect(h2).toEqual(expected);
    }
  });

  it("모든 레슨 퀴즈는 3문항 이상이고 answer 인덱스가 유효하다", () => {
    for (const lesson of getLessonsForLevel(0)) {
      const quiz = lesson.quiz.filter((q) => !q.examOnly);
      expect(quiz.length).toBeGreaterThanOrEqual(3);
      for (const q of lesson.quiz) {
        if (q.kind !== "numeric") {
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.choices.length);
        }
        expect(q.explain.length).toBeGreaterThan(0);
      }
    }
  });

  it("레슨 프론트매터의 glossary 용어는 전부 glossary.json에 정의되어 있다", () => {
    const entries: Record<string, GlossaryEntry> = glossary;
    for (const lesson of getLessonsForLevel(0)) {
      for (const term of lesson.glossary) {
        expect(entries[term], `'${term}' 정의 누락`).toBeDefined();
        expect(entries[term].definition.length).toBeGreaterThan(10);
      }
    }
  });

  it("_level.mdx가 존재한다", () => {
    const level = getLevelContent(0);
    expect(level).not.toBeNull();
    expect(level!.title).toBe("돈이란 무엇인가");
  });

  it("getAllLessonIds는 존재하는 레슨만 담는다", () => {
    const ids = getAllLessonIds();
    expect(ids.has("0-1-1")).toBe(true);
    expect(ids.has("0-1-4")).toBe(false);
  });
});
