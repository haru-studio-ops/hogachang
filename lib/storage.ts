import type { ProgressStore } from "@/types/progress";

/**
 * 저장소 추상화 계층.
 * 컴포넌트는 localStorage를 직접 부르지 않고 반드시 이 모듈을 거친다.
 * 나중에 DB(SQLite + Prisma)로 옮길 때 이 파일의 백엔드만 교체한다.
 */

export const CURRENT_VERSION = 1 as const;

const STORE_KEY = "hogachang.progress";
const BACKUP_META_KEY = "hogachang.backupMeta";

/** 교체 가능한 key-value 백엔드 인터페이스 (localStorage → DB 이전 대비) */
export interface KeyValueBackend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function localStorageBackend(): KeyValueBackend | null {
  // SSR/빌드 환경 가드
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  return {
    get: (key) => window.localStorage.getItem(key),
    set: (key, value) => window.localStorage.setItem(key, value),
    remove: (key) => window.localStorage.removeItem(key),
  };
}

let backendOverride: KeyValueBackend | null = null;

/** 테스트·DB 이전용 백엔드 주입 */
export function setStorageBackend(backend: KeyValueBackend | null): void {
  backendOverride = backend;
}

function backend(): KeyValueBackend | null {
  return backendOverride ?? localStorageBackend();
}

export function createDefaultStore(): ProgressStore {
  return {
    version: CURRENT_VERSION,
    lessons: {},
    srs: {},
    dailyTests: {},
    exams: {},
    questionStats: {},
    streak: { current: 0, longest: 0, lastTestAt: null },
    settings: { theme: "system" },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * 버전별 마이그레이션. 스키마가 v2로 올라가면 여기에 `1: migrate1to2`를 추가한다.
 * 각 함수는 해당 버전의 데이터를 다음 버전으로 올린다. 기존 데이터를 덮어쓰지 않는다.
 */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

/**
 * 임의의 JSON 값을 검증·마이그레이션해서 현재 버전 스토어로 만든다.
 * 형식이 맞지 않으면 throw — 호출부가 사용자에게 알린다.
 */
export function parseStore(data: unknown): ProgressStore {
  if (!isRecord(data) || typeof data.version !== "number") {
    throw new Error("진도 데이터 형식이 아니다 (version 필드 없음)");
  }
  let current = data;
  let version = data.version;
  while (version < CURRENT_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      throw new Error(`버전 ${version} → ${version + 1} 마이그레이션이 없다`);
    }
    current = migrate(current);
    version = Number(current.version);
  }
  if (version !== CURRENT_VERSION) {
    throw new Error(
      `지원하지 않는 데이터 버전이다 (v${version}). 이 사이트는 v${CURRENT_VERSION}까지 안다`
    );
  }
  for (const key of ["lessons", "srs", "dailyTests", "exams", "questionStats"] as const) {
    if (!isRecord(current[key])) {
      throw new Error(`진도 데이터가 손상됐다 ('${key}' 없음)`);
    }
  }
  if (!isRecord(current.streak) || !isRecord(current.settings)) {
    throw new Error("진도 데이터가 손상됐다 (streak/settings 없음)");
  }
  return current as unknown as ProgressStore;
}

/** 저장된 스토어를 읽는다. 없거나(방문자) SSR이면 null */
export function loadStore(): ProgressStore | null {
  const b = backend();
  if (!b) return null;
  const raw = b.get(STORE_KEY);
  if (raw === null) return null;
  try {
    return parseStore(JSON.parse(raw));
  } catch {
    // 손상된 데이터를 지우지 않는다 — 백업 복원 기회를 남긴다
    return null;
  }
}

export function saveStore(store: ProgressStore): void {
  backend()?.set(STORE_KEY, JSON.stringify(store));
}

/** 전체 진도 삭제. 파괴적 동작이므로 호출부는 반드시 사용자 확인을 거친다 */
export function clearStore(): void {
  backend()?.remove(STORE_KEY);
}

/** 내보내기용 JSON 문자열 */
export function serializeStore(store: ProgressStore): string {
  return JSON.stringify(store, null, 2);
}

/** "백업하세요" 배너용 메타 (스키마 v1 바깥의 UI 상태) */
export type BackupMeta = {
  /** 마지막으로 배너를 보여줬거나 내보내기한 시점의 완료 레슨 수 */
  promptedAtCount: number;
};

export function loadBackupMeta(): BackupMeta {
  const raw = backend()?.get(BACKUP_META_KEY);
  if (!raw) return { promptedAtCount: 0 };
  try {
    const data: unknown = JSON.parse(raw);
    if (isRecord(data) && typeof data.promptedAtCount === "number") {
      return { promptedAtCount: data.promptedAtCount };
    }
  } catch {
    // 무시하고 기본값
  }
  return { promptedAtCount: 0 };
}

export function saveBackupMeta(meta: BackupMeta): void {
  backend()?.set(BACKUP_META_KEY, JSON.stringify(meta));
}
