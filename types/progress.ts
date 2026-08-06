/** PROJECT_SPEC 12장 데이터 스키마 v1. 변경 시 version을 올리고 마이그레이션을 작성한다. */

export type LessonStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "needs_review";

export type LessonRecord = {
  status: LessonStatus;
  /** 0~1 */
  quizScore: number | null;
  attempts: number;
  practiceDone: boolean;
  /** 자기 요약. 3줄 미만이면 완료 불가 */
  mySummary: string;
  /** ISO */
  completedAt: string | null;
  note: string;
};

export type SrsCard = {
  interval: number;
  dueAt: string;
  lapses: number;
};

export type DailyTestResult = {
  score: number;
  total: number;
  questionIds: string[];
  wrongIds: string[];
  completedAt: string;
};

export type ExamRecord = {
  attempts: { score: number; total: number; passed: boolean; at: string }[];
  passed: boolean;
};

export type ProgressStore = {
  version: 1;
  lessons: Record<string, LessonRecord>;
  srs: Record<string, SrsCard>;
  /** key: 'YYYY-MM-DD' */
  dailyTests: Record<string, DailyTestResult>;
  /** key: level (예: '0') */
  exams: Record<string, ExamRecord>;
  questionStats: Record<string, { seen: number; wrong: number }>;
  streak: { current: number; longest: number; lastTestAt: string | null };
  settings: { theme: "light" | "dark" | "system" };
};
