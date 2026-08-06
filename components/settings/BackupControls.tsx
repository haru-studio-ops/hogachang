"use client";

import { useEffect, useRef, useState } from "react";
import { completedLessonCount } from "@/lib/progress";
import { parseStore, saveBackupMeta, serializeStore } from "@/lib/storage";
import { useProgress } from "@/hooks/useProgress";

export default function BackupControls() {
  const { store, hydrated, hydrate } = useProgress();
  const replaceStore = useProgress((s) => s.replaceStore);
  const reset = useProgress((s) => s.reset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => hydrate(), [hydrate]);

  if (!hydrated) return null;

  function handleExport(): void {
    if (!store) return;
    const blob = new Blob([serializeStore(store)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `hogachang-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // 내보낸 시점을 기준으로 다음 백업 배너를 미룬다
    saveBackupMeta({ promptedAtCount: completedLessonCount(store) });
    setMessage({ kind: "ok", text: "백업 파일을 내려받았다." });
  }

  async function handleImport(file: File): Promise<void> {
    try {
      const parsed = parseStore(JSON.parse(await file.text()));
      if (store) {
        const ok = window.confirm(
          "이 브라우저에 이미 학습 기록이 있다. 백업 파일 내용으로 완전히 덮어쓸까? 이 작업은 되돌릴 수 없다."
        );
        if (!ok) return;
      }
      replaceStore(parsed);
      setMessage({
        kind: "ok",
        text: `백업을 불러왔다. 완료 레슨 ${completedLessonCount(parsed)}개.`,
      });
    } catch (e) {
      setMessage({
        kind: "error",
        text: `불러오기 실패: ${e instanceof Error ? e.message : "올바른 백업 파일이 아니다."}`,
      });
    }
  }

  function handleReset(): void {
    if (!store) return;
    const ok = window.confirm(
      "모든 학습 기록(진도·퀴즈·요약·메모)을 삭제한다. 백업 없이 삭제하면 복구할 수 없다. 계속할까?"
    );
    if (!ok) return;
    reset();
    setMessage({ kind: "ok", text: "모든 기록을 삭제했다." });
  }

  return (
    <div className="space-y-6">
      {!store && (
        <p className="rounded-md border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
          이 브라우저에는 학습 기록이 없다. 다른 기기에서 만든 백업 파일이
          있다면 아래에서 불러올 수 있다.
        </p>
      )}

      <section className="rounded-md border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">내보내기</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          현재 진도 전체를 JSON 파일로 내려받는다. 기록은 이 브라우저에만
          저장되므로 주기적으로 백업해 두는 것이 안전하다.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!store}
          className="mt-3 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          백업 파일 내려받기
        </button>
      </section>

      <section className="rounded-md border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">불러오기</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          내보내기로 받은 JSON 파일을 올리면 기록을 복원한다. 버전이 다르면
          자동으로 마이그레이션하며, 기존 기록이 있으면 덮어쓰기 전에 한 번 더
          확인한다.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 rounded-md border border-line bg-paper px-4 py-2 text-sm font-medium transition-colors hover:bg-ink/5"
        >
          백업 파일 선택
        </button>
      </section>

      <section className="rounded-md border border-fall/40 bg-surface p-4">
        <h2 className="text-sm font-bold text-fall">전체 삭제</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          이 브라우저의 모든 학습 기록을 지운다. 삭제 후에는 방문자 모드로
          돌아간다.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={!store}
          className="mt-3 rounded-md border border-fall/60 px-4 py-2 text-sm font-medium text-fall transition-colors hover:bg-fall/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          모든 기록 삭제
        </button>
      </section>

      {message && (
        <p
          role="status"
          className={`text-sm font-medium ${message.kind === "ok" ? "text-rise" : "text-fall"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
