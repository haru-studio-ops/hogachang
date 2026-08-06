/** 레슨 퀴즈 문항 (프론트매터 `quiz` 항목) */
export type QuizItem = {
  q: string;
  choices: string[];
  /** 정답 인덱스 (0-based) */
  answer: number;
  explain: string;
  /** true면 레슨 퀴즈에는 안 나오고 졸업시험에만 출제 */
  examOnly?: boolean;
};

/** 레슨 MDX 프론트매터 (PROJECT_SPEC 4.2 고정 스키마) */
export type LessonFrontmatter = {
  id: string;
  level: number;
  module: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  /** 1~5 */
  difficulty: number;
  /** 선행 레슨 id 배열 */
  prerequisites: string[];
  tags: string[];
  /** 이 레슨에서 처음 나오는 용어 */
  glossary: string[];
  quiz: QuizItem[];
  practice: string[];
  checkpoint: string;
};

/** 본문 없이 목록에 쓰는 레슨 메타 */
export type LessonMeta = LessonFrontmatter & {
  /** 레벨 폴더명 (예: "00-money") */
  levelSlug: string;
  /** 파일명에서 확장자 뺀 것 (예: "01-01-barter-to-money") */
  fileSlug: string;
};

/** 본문 포함 레슨 */
export type Lesson = LessonMeta & {
  /** 프론트매터 제외한 MDX 원문 */
  content: string;
};

/** `_level.mdx` 프론트매터 */
export type LevelFrontmatter = {
  level: number;
  title: string;
  goal: string;
  duration: string;
  checkpoint: string;
};

/** 레벨 개요 (콘텐츠가 있는 레벨) */
export type Level = LevelFrontmatter & {
  slug: string;
  content: string;
  lessons: LessonMeta[];
};

/** 본문 h2에서 추출한 목차 항목 */
export type Heading = {
  text: string;
  slug: string;
};

/** 용어사전 항목 (content/glossary.json) */
export type GlossaryEntry = {
  /** 영문 표기 (없으면 생략) */
  en?: string;
  definition: string;
};

/** 커리큘럼 트리 (CURRICULUM.md 전체 설계, 콘텐츠 유무와 무관) */
export type CurriculumLesson = {
  id: string;
  title: string;
};

export type CurriculumModule = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

export type CurriculumLevel = {
  level: number;
  slug: string;
  title: string;
  goal: string;
  duration: string;
  checkpoint: string;
  modules: CurriculumModule[];
};
