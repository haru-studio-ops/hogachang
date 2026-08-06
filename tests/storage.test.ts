import { afterEach, describe, expect, it } from "vitest";
import {
  clearStore,
  createDefaultStore,
  loadBackupMeta,
  loadStore,
  parseStore,
  saveBackupMeta,
  saveStore,
  serializeStore,
  setStorageBackend,
  type KeyValueBackend,
} from "@/lib/storage";

function memoryBackend(): KeyValueBackend & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: (k) => data.get(k) ?? null,
    set: (k, v) => void data.set(k, v),
    remove: (k) => void data.delete(k),
  };
}

afterEach(() => setStorageBackend(null));

describe("storage 백엔드", () => {
  it("SSR(백엔드 없음)에서는 null을 돌려주고 저장은 무시한다", () => {
    // Node 테스트 환경에는 window가 없다 = SSR과 동일
    expect(loadStore()).toBeNull();
    expect(() => saveStore(createDefaultStore())).not.toThrow();
    expect(() => clearStore()).not.toThrow();
  });

  it("저장·로드·삭제가 백엔드를 거친다", () => {
    const backend = memoryBackend();
    setStorageBackend(backend);
    expect(loadStore()).toBeNull(); // 데이터 없음 = 방문자
    const store = createDefaultStore();
    saveStore(store);
    expect(loadStore()).toEqual(store);
    clearStore();
    expect(loadStore()).toBeNull();
  });

  it("손상된 JSON은 null을 돌려주되 데이터를 지우지 않는다", () => {
    const backend = memoryBackend();
    setStorageBackend(backend);
    backend.set("hogachang.progress", "{broken");
    expect(loadStore()).toBeNull();
    expect(backend.get("hogachang.progress")).toBe("{broken");
  });
});

describe("parseStore (버전 체크·마이그레이션)", () => {
  it("현재 버전 스토어를 통과시킨다", () => {
    const store = createDefaultStore();
    expect(parseStore(JSON.parse(serializeStore(store)))).toEqual(store);
  });

  it("version 필드가 없으면 거부한다", () => {
    expect(() => parseStore({})).toThrow("version");
    expect(() => parseStore("문자열")).toThrow();
  });

  it("미래 버전은 거부한다", () => {
    expect(() => parseStore({ ...createDefaultStore(), version: 99 })).toThrow(
      "v99"
    );
  });

  it("필수 필드가 빠지면 거부한다", () => {
    const broken: Record<string, unknown> = { ...createDefaultStore() };
    delete broken.lessons;
    expect(() => parseStore(broken)).toThrow("lessons");
  });
});

describe("백업 메타", () => {
  it("없으면 기본값 0", () => {
    setStorageBackend(memoryBackend());
    expect(loadBackupMeta()).toEqual({ promptedAtCount: 0 });
  });

  it("저장·로드된다", () => {
    setStorageBackend(memoryBackend());
    saveBackupMeta({ promptedAtCount: 10 });
    expect(loadBackupMeta()).toEqual({ promptedAtCount: 10 });
  });
});
