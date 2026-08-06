import { mulberry32 } from "@/lib/finance/random";

export type ExpectancyInput = {
  /** 승률 % */
  winRatePct: number;
  /** 평균 이익 (원) */
  avgWin: number;
  /** 평균 손실 (원, 양수로 입력) */
  avgLoss: number;
  trades: number;
};

export type ExpectancyResult = {
  /** 손익비 R:R = 평균이익 / 평균손실 */
  rr: number;
  /** 거래당 기대값 (원) */
  expectedPerTrade: number;
  /** R 단위 기대값 = p×RR − (1−p) */
  expectedR: number;
  /** 전체 거래 기대 손익 (원) */
  expectedTotal: number;
};

export function expectancy(input: ExpectancyInput): ExpectancyResult {
  const p = input.winRatePct / 100;
  const rr = input.avgLoss === 0 ? Infinity : input.avgWin / input.avgLoss;
  const expectedPerTrade = p * input.avgWin - (1 - p) * input.avgLoss;
  return {
    rr,
    expectedPerTrade,
    expectedR: p * rr - (1 - p),
    expectedTotal: expectedPerTrade * input.trades,
  };
}

/**
 * 거래 시뮬레이션 1회. 누적 손익 곡선(길이 trades+1, 0에서 시작)을 돌려준다.
 * 시드가 같으면 항상 같은 결과 — UI의 "다시 굴리기"는 시드를 바꾼다.
 */
export function simulateTrades(
  input: ExpectancyInput & { seed: number }
): number[] {
  const rand = mulberry32(input.seed);
  const p = input.winRatePct / 100;
  const curve = [0];
  let sum = 0;
  for (let i = 0; i < input.trades; i++) {
    sum += rand() < p ? input.avgWin : -input.avgLoss;
    curve.push(sum);
  }
  return curve;
}
