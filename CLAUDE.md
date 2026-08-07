# CLAUDE.md — 이 프로젝트에서 지킬 것

프로젝트: **호가창(Hogachang)** — 개인용 트레이딩 학습 사이트
읽어야 할 문서: `PROJECT_SPEC.md`(설계), `CURRICULUM.md`(콘텐츠 뼈대)

---

## 프로젝트 한 줄 요약
완전 초보가 "돈이란 무엇인가"부터 Level 0~10 순서로 공부해서 스스로 판단하는 트레이더가 되도록 돕는 학습 웹앱. Next.js + TypeScript + Tailwind + MDX.

**이 사이트는 커스텀 도메인으로 인터넷에 공개 배포된다.** 기록은 본인 브라우저(localStorage)에만 저장되고, 방문자는 읽기만 가능하다. 공개 사이트라는 전제를 항상 염두에 둔다 — SEO 메타데이터, OG 이미지, 개인정보 노출 방지가 기본 요구사항이다.

---

## 명령어
```bash
pnpm dev            # 개발 서버
pnpm build          # 빌드
pnpm test           # Vitest
pnpm test:watch
pnpm lint
pnpm typecheck
```

---

## 작업 방식 (중요)

1. **한 번에 하나만 한다.** 마일스톤 하나, 또는 레슨 모듈 하나. 여러 개를 동시에 건드리지 않는다.
2. **작업 시작 전에 무엇을 할지 3줄로 먼저 말한다.** 승인 없이 대규모 리팩터링 금지.
3. **금융 계산 함수는 테스트를 먼저 쓴다.** `lib/finance/*`는 예외 없이 TDD.
4. **커밋은 작게.** 한 커밋 = 한 가지 변경. 메시지는 한국어로 `feat: 포지션 사이징 계산기 추가` 형식.
5. **작업이 끝나면 `pnpm typecheck && pnpm test`를 돌려서 통과를 확인하고 보고한다.**
6. 새 의존성을 추가하기 전에 먼저 물어본다.

---

## 코드 컨벤션

- TypeScript strict. `any` 금지. 불가피하면 `unknown` + 좁히기.
- 컴포넌트는 함수 선언형, 파일당 1개 export default.
- 파일명: 컴포넌트 `PascalCase.tsx`, 그 외 `camelCase.ts`
- Tailwind만 사용. 인라인 style, CSS-in-JS 금지. 색은 반드시 CSS 변수 토큰 경유 (`--ink`, `--rise` 등) — 하드코딩된 hex 금지.
- 순수 로직(`lib/`)에는 React import가 들어가지 않는다.
- 저장소 접근은 항상 `lib/storage.ts`를 통해서만. 컴포넌트에서 `localStorage`를 직접 부르지 않는다. (나중에 DB로 교체할 것이므로)
- 모든 숫자 표시는 `tabular-nums` + 천단위 구분 + 소수점 자릿수 명시.

---

## 절대 하지 말 것

- ❌ 실시간 시세 API 붙이기 (요청 전까지)
- ❌ 회원가입·인증·결제 추가 (localStorage 유무로 본인/방문자를 구분한다)
- ❌ 콘텐츠에 특정 종목 매수/매도 권유 문구 넣기
- ❌ 레슨 본문에 현재 주가·현재 금리 같은 실시간 수치 하드코딩
- ❌ 진도 데이터를 지우는 마이그레이션을 확인 없이 실행
- ❌ 데일리 테스트·졸업시험에서 문항별 정답을 제출 전에 노출 (반드시 일괄 채점)
- ❌ 졸업시험 합격선(80%)을 임의로 낮추기
- ❌ **실명·계좌번호·증권사 계정·실제 자산 총액을 코드나 콘텐츠에 넣기** (공개 사이트다)
- ❌ 비공개 데이터를 CSS `display:none`으로만 가리기 (서버에서 아예 내보내지 않는다)
- ❌ `/notes`, `/principles`, `/stats`를 `robots.txt`에서 빼먹기
- ❌ **매매일지·투자원칙서·성과통계를 지금 만들기.** PROJECT_SPEC 13장 보류 항목이다. 라우트도 폴더도 만들지 않는다. 요청받으면 "13장 보류 항목입니다"라고 알리고 확인받는다.
- ❌ `PROJECT_SPEC.md`의 레슨 6섹션 골격 임의 변경
- ❌ 디자인 시안을 "무난하게" 바꾸기 — 학습 캔들차트는 이 프로젝트의 정체성이다

---

## 콘텐츠 작성 규칙 (레슨 MDX를 쓸 때)

레슨은 반드시 이 순서:
`## 한 줄로` → `## 왜 알아야 하나` → `## 개념` → `## 비유로 이해하기` → `## 실제 시장에서는` → `## 흔한 오해`

- 분량: 15~20분 (약 1,200~1,800자 본문)
- 사례에는 **연도·숫자·사건명**을 넣는다
- 새 용어는 `<Term>` 으로 감싸고 `content/glossary.json`에 정의 추가
- **프론트매터의 `quiz`는 최소 3문항** (문제은행의 재료다. 이 기준 미달인 레슨은 완성으로 치지 않는다)
- 퀴즈 문항은 단순 암기가 아니라 **적용·판단**을 묻는다. "PER의 정의는?" ❌ / "A사 PER 8배, B사 40배. 더 싼 쪽은?" ⭕
- 각 문항의 `explain`은 정답 이유뿐 아니라 **왜 오답이 매력적으로 보이는지**까지 쓴다
- 한국 사례 우선, 미국 사례 병기
- 문체: 반말 아닌 평서체("~이다"). 과장 없이. 겁주지도 부추기지도 않는다.

---

## 진도 데이터 스키마 (변경 시 버전 올릴 것)

```ts
type ProgressStore = {
  version: 1;
  lessons: Record<string, {
    status: 'locked' | 'available' | 'in_progress' | 'completed' | 'needs_review';
    quizScore: number | null;      // 0~1
    attempts: number;
    practiceDone: boolean;
    mySummary: string;             // 자기 요약. 3줄 미만이면 완료 불가
    completedAt: string | null;    // ISO
    note: string;
  }>;
  srs: Record<string, { interval: number; dueAt: string; lapses: number }>;
  dailyTests: Record<string, { score: number; total: number; questionIds: string[]; wrongIds: string[]; completedAt: string }>;
  exams: Record<string, { attempts: { score: number; total: number; passed: boolean; at: string }[]; passed: boolean }>;
  questionStats: Record<string, { seen: number; wrong: number }>;
  streak: { current: number; longest: number; lastTestAt: string | null };
  settings: { theme: 'light' | 'dark' | 'system' };
};
```

---

## 현재 상태

- [x] M0 뼈대 + AWS EC2 배포(pm2 3400) + hoga.allinground.com + HTTPS
- [x] M1 콘텐츠 파이프라인
- [x] M2 진도 + 퀴즈 + 자기요약 + 백업 내보내기/불러오기
- [x] M3 대시보드 + 학습 캔들차트
- [x] M4 계산기 6종
- [x] M5 시험 시스템 (데일리 테스트 + 졸업시험 + SRS)
- [x] M5.5 용어사전
- [x] M6 콘텐츠 (Level 0~7 완료: L0 20개 + L1 28개 + L2 13개 + L3 28개 + L4 27개 + L5 23개 + L6 21개 + L7 16개 = 176개 레슨)

> 작업을 끝낼 때마다 이 체크리스트를 갱신한다.
