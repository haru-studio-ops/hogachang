"use client";

import { create } from "zustand";
import type { ProgressStore } from "@/types/progress";
import {
  applyQuizAttempt,
  completeLesson,
  updateLessonRecord,
} from "@/lib/progress";
import { applyDailyResult, applyExamResult } from "@/lib/exam";
import {
  clearStore,
  createDefaultStore,
  loadStore,
  saveStore,
} from "@/lib/storage";

/**
 * 진도·설정 전역 상태 (Zustand).
 * store === null 이면서 hydrated === true 면 방문자 모드다 (PROJECT_SPEC 11.6).
 * 모든 영속화는 lib/storage.ts를 거친다.
 */
type ProgressState = {
  store: ProgressStore | null;
  hydrated: boolean;
  hydrate: () => void;
  /** 방문자 → 본인 전환: 빈 스토어를 만들어 기록을 시작한다 */
  startLearning: () => void;
  recordQuizAttempt: (lessonId: string, score: number) => void;
  setSummary: (lessonId: string, text: string) => void;
  setNote: (lessonId: string, text: string) => void;
  setPracticeDone: (lessonId: string, done: boolean) => void;
  /** 조건 충족 시 완료 처리. 성공 여부를 돌려준다 */
  complete: (lessonId: string, prereqsMet: boolean) => boolean;
  /** 데일리 테스트 일괄 채점 결과 반영 (dailyTests·questionStats·srs·streak) */
  applyDaily: (input: { dateKey: string; questionIds: string[]; corrects: boolean[] }) => void;
  /** 졸업시험 일괄 채점 결과 반영 */
  applyExam: (input: {
    level: number;
    questions: { id: string; lessonId: string }[];
    corrects: boolean[];
  }) => void;
  /** 백업 복원 등 전체 교체 */
  replaceStore: (store: ProgressStore) => void;
  /** 전체 삭제. 호출부가 반드시 사용자 확인을 거친다 */
  reset: () => void;
};

export const useProgress = create<ProgressState>((set, get) => {
  function commit(next: ProgressStore): void {
    saveStore(next);
    set({ store: next });
  }

  function withStore(fn: (store: ProgressStore) => ProgressStore): void {
    const { store } = get();
    if (!store) return;
    commit(fn(store));
  }

  return {
    store: null,
    hydrated: false,
    hydrate: () => {
      if (get().hydrated) return;
      set({ store: loadStore(), hydrated: true });
    },
    startLearning: () => {
      if (get().store) return;
      commit(createDefaultStore());
    },
    recordQuizAttempt: (lessonId, score) =>
      withStore((s) => applyQuizAttempt(s, lessonId, score)),
    setSummary: (lessonId, text) =>
      withStore((s) => updateLessonRecord(s, lessonId, { mySummary: text })),
    setNote: (lessonId, text) =>
      withStore((s) => updateLessonRecord(s, lessonId, { note: text })),
    setPracticeDone: (lessonId, done) =>
      withStore((s) => updateLessonRecord(s, lessonId, { practiceDone: done })),
    complete: (lessonId, prereqsMet) => {
      const { store } = get();
      if (!store) return false;
      const next = completeLesson(store, lessonId, prereqsMet);
      if (next === store) return false;
      commit(next);
      return true;
    },
    applyDaily: (input) => withStore((s) => applyDailyResult(s, input)),
    applyExam: (input) => withStore((s) => applyExamResult(s, input)),
    replaceStore: (store) => commit(store),
    reset: () => {
      clearStore();
      set({ store: null });
    },
  };
});
