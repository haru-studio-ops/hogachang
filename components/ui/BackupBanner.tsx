"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completedLessonCount } from "@/lib/progress";
import { loadBackupMeta, saveBackupMeta } from "@/lib/storage";
import { useProgress } from "@/hooks/useProgress";

const PROMPT_INTERVAL = 10;

/**
 * 완료 레슨이 10개 늘 때마다 "백업하세요" 배너를 1회 노출한다 (M2 항목 8).
 * 닫으면 현재 완료 수를 기준점으로 저장해 다음 10개까지 다시 뜨지 않는다.
 */
export default function BackupBanner() {
  const { store, hydrated, hydrate } = useProgress();
  const [promptedAtCount, setPromptedAtCount] = useState<number | null>(null);

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (hydrated) setPromptedAtCount(loadBackupMeta().promptedAtCount);
  }, [hydrated]);

  if (!hydrated || !store || promptedAtCount === null) return null;

  const completed = completedLessonCount(store);
  if (completed < promptedAtCount + PROMPT_INTERVAL) return null;

  function dismiss(): void {
    saveBackupMeta({ promptedAtCount: completed });
    setPromptedAtCount(completed);
  }

  return (
    <div className="mx-auto mb-6 flex w-full max-w-[720px] items-center gap-3 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm">
      <p className="flex-1 leading-relaxed">
        완료한 레슨이 <span className="font-mono font-bold tabular-nums">{completed}개</span>가
        됐다. 기록은 이 브라우저에만 있으니{" "}
        <Link href="/settings" className="font-medium underline">
          설정에서 백업 파일을 내려받아
        </Link>{" "}
        두는 것이 안전하다.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="배너 닫기"
        className="shrink-0 rounded-md px-2 py-1 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
