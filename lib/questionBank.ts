import type { BankQuestion } from "@/types/content";
import { CURRICULUM } from "@/lib/curriculum";
import { getLessonsForLevel } from "@/lib/content";

/**
 * 문제은행 — 모든 레슨 MDX의 프론트매터 quiz를 빌드 시점에 수집한다.
 * 별도 문항 파일은 없다. 서버 전용 (fs 사용).
 */
export function getQuestionBank(): BankQuestion[] {
  const bank: BankQuestion[] = [];
  for (const cur of CURRICULUM) {
    for (const meta of getLessonsForLevel(cur.level)) {
      meta.quiz.forEach((item, i) => {
        bank.push({
          id: `${meta.id}#q${i + 1}`,
          lessonId: meta.id,
          level: meta.level,
          module: meta.module,
          difficulty: meta.difficulty,
          tags: meta.tags,
          examOnly: item.examOnly === true,
          item,
        });
      });
    }
  }
  return bank;
}
