import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Heading,
  Lesson,
  LessonFrontmatter,
  LessonMeta,
  Level,
  LevelFrontmatter,
  QuizItem,
} from "@/types/content";
import { CURRICULUM } from "@/lib/curriculum";
import { slugify } from "@/lib/slugify";

const LEVELS_DIR = path.join(process.cwd(), "content", "levels");

function levelSlugOf(level: number): string | null {
  return CURRICULUM.find((l) => l.level === level)?.slug ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringArray(value: unknown, field: string, file: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`${file}: 프론트매터 '${field}'는 문자열 배열이어야 한다`);
  }
  return value as string[];
}

function parseQuiz(value: unknown, file: string): QuizItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`${file}: 프론트매터 'quiz'가 없거나 배열이 아니다`);
  }
  return value.map((item, i) => {
    if (
      !isRecord(item) ||
      typeof item.q !== "string" ||
      !Array.isArray(item.choices) ||
      typeof item.answer !== "number" ||
      typeof item.explain !== "string"
    ) {
      throw new Error(`${file}: quiz[${i}] 형식이 잘못됐다 (q/choices/answer/explain 필수)`);
    }
    return {
      q: item.q,
      choices: item.choices.filter((c): c is string => typeof c === "string"),
      answer: item.answer,
      explain: item.explain,
      ...(item.examOnly === true ? { examOnly: true } : {}),
    };
  });
}

function parseLessonFrontmatter(data: unknown, file: string): LessonFrontmatter {
  if (!isRecord(data)) throw new Error(`${file}: 프론트매터가 없다`);
  const required = ["id", "level", "module", "title", "subtitle"] as const;
  for (const key of required) {
    if (data[key] === undefined) {
      throw new Error(`${file}: 프론트매터 '${key}'가 없다`);
    }
  }
  const quiz = parseQuiz(data.quiz, file);
  if (quiz.filter((q) => !q.examOnly).length < 3) {
    throw new Error(`${file}: 레슨 퀴즈는 최소 3문항이어야 한다`);
  }
  return {
    id: String(data.id),
    level: Number(data.level),
    module: String(data.module),
    title: String(data.title),
    subtitle: String(data.subtitle),
    estimatedMinutes: Number(data.estimatedMinutes ?? 15),
    difficulty: Number(data.difficulty ?? 1),
    prerequisites: asStringArray(data.prerequisites, "prerequisites", file),
    tags: asStringArray(data.tags, "tags", file),
    glossary: asStringArray(data.glossary, "glossary", file),
    quiz,
    practice: asStringArray(data.practice, "practice", file),
    checkpoint: String(data.checkpoint ?? ""),
  };
}

function lessonFiles(levelSlug: string): string[] {
  const dir = path.join(LEVELS_DIR, levelSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && f !== "_level.mdx")
    .sort();
}

/** 해당 레벨의 레슨 메타 목록 (파일명 순 = 학습 순서) */
export function getLessonsForLevel(level: number): LessonMeta[] {
  const slug = levelSlugOf(level);
  if (!slug) return [];
  return lessonFiles(slug).map((file) => {
    const fullPath = path.join(LEVELS_DIR, slug, file);
    const { data } = matter(fs.readFileSync(fullPath, "utf8"));
    return {
      ...parseLessonFrontmatter(data, file),
      levelSlug: slug,
      fileSlug: file.replace(/\.mdx$/, ""),
    };
  });
}

/** 레슨 id(예: "0-1-1")로 본문 포함 레슨 조회 */
export function getLesson(level: number, lessonId: string): Lesson | null {
  const slug = levelSlugOf(level);
  if (!slug) return null;
  for (const file of lessonFiles(slug)) {
    const fullPath = path.join(LEVELS_DIR, slug, file);
    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    const fm = parseLessonFrontmatter(data, file);
    if (fm.id === lessonId) {
      return {
        ...fm,
        levelSlug: slug,
        fileSlug: file.replace(/\.mdx$/, ""),
        content,
      };
    }
  }
  return null;
}

/** 콘텐츠(_level.mdx)가 있는 레벨의 개요 */
export function getLevelContent(level: number): Level | null {
  const slug = levelSlugOf(level);
  if (!slug) return null;
  const fullPath = path.join(LEVELS_DIR, slug, "_level.mdx");
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
  if (!isRecord(data)) return null;
  const fm: LevelFrontmatter = {
    level: Number(data.level ?? level),
    title: String(data.title ?? ""),
    goal: String(data.goal ?? ""),
    duration: String(data.duration ?? ""),
    checkpoint: String(data.checkpoint ?? ""),
  };
  return { ...fm, slug, content, lessons: getLessonsForLevel(level) };
}

/** 콘텐츠가 실제로 존재하는 모든 레슨 id */
export function getAllLessonIds(): Set<string> {
  const ids = new Set<string>();
  for (const cur of CURRICULUM) {
    for (const meta of getLessonsForLevel(cur.level)) {
      ids.add(meta.id);
    }
  }
  return ids;
}

/** 같은 레벨 안에서 이전/다음 레슨 */
export function getAdjacentLessons(
  level: number,
  lessonId: string
): { prev: LessonMeta | null; next: LessonMeta | null } {
  const lessons = getLessonsForLevel(level);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? lessons[idx - 1] : null,
    next: idx < lessons.length - 1 ? lessons[idx + 1] : null,
  };
}

/** 본문 h2에서 목차 추출 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /^## (.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const text = match[1].trim();
    headings.push({ text, slug: slugify(text) });
  }
  return headings;
}
