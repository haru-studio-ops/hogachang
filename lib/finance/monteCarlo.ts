import { mulberry32 } from "@/lib/finance/random";

export type MonteCarloInput = {
  /** 승률 % */
  winRatePct: number;
  /** 손익비 (이익 R / 손실 1R) */
  rr: number;
  /** 1회 거래 리스크 % (자본 대비) */
  riskPct: number;
  /** 시행당 거래 수 */
  trades: number;
  /** 시행 횟수 */
  runs: number;
  seed: number;
};

/** 자본이 이 비율 아래로 내려가면 파산으로 간주한다 (초기 자본의 20%) */
export const RUIN_THRESHOLD = 0.2;

export type MonteCarloResult = {
  /** 거래 진행별 자본 밴드 (초기 자본 = 1) */
  band: { p5: number[]; p50: number[]; p95: number[] };
  /** 시행별 최대 낙폭 (0~1) */
  maxDrawdowns: number[];
  /** 최종 자본 백분위 */
  finalPercentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  /** 자본이 20% 미만으로 떨어진 시행 비율 */
  ruinProbability: number;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1)))
  );
  return sorted[idx];
}

/**
 * 고정 리스크 % 복리 베팅 몬테카를로.
 * 승리: 자본 × (1 + risk×rr), 패배: 자본 × (1 − risk)
 */
export function monteCarlo(input: MonteCarloInput): MonteCarloResult {
  const rand = mulberry32(input.seed);
  const p = input.winRatePct / 100;
  const winMul = 1 + (input.riskPct / 100) * input.rr;
  const loseMul = 1 - input.riskPct / 100;

  // paths[trade][run]
  const paths: number[][] = Array.from({ length: input.trades + 1 }, () => []);
  const maxDrawdowns: number[] = [];
  const finals: number[] = [];
  let ruined = 0;

  for (let run = 0; run < input.runs; run++) {
    let equity = 1;
    let peak = 1;
    let mdd = 0;
    let isRuined = false;
    paths[0].push(1);
    for (let t = 1; t <= input.trades; t++) {
      equity *= rand() < p ? winMul : loseMul;
      peak = Math.max(peak, equity);
      mdd = Math.max(mdd, (peak - equity) / peak);
      if (equity < RUIN_THRESHOLD) isRuined = true;
      paths[t].push(equity);
    }
    maxDrawdowns.push(mdd);
    finals.push(equity);
    if (isRuined) ruined++;
  }

  const band = { p5: [] as number[], p50: [] as number[], p95: [] as number[] };
  for (const atTrade of paths) {
    const sorted = [...atTrade].sort((a, b) => a - b);
    band.p5.push(percentile(sorted, 5));
    band.p50.push(percentile(sorted, 50));
    band.p95.push(percentile(sorted, 95));
  }

  const sortedFinals = [...finals].sort((a, b) => a - b);
  return {
    band,
    maxDrawdowns,
    finalPercentiles: {
      p5: percentile(sortedFinals, 5),
      p25: percentile(sortedFinals, 25),
      p50: percentile(sortedFinals, 50),
      p75: percentile(sortedFinals, 75),
      p95: percentile(sortedFinals, 95),
    },
    ruinProbability: input.runs === 0 ? 0 : ruined / input.runs,
  };
}
