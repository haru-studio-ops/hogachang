import { describe, expect, it } from "vitest";
import { compound } from "@/lib/finance/compound";
import { positionSizing } from "@/lib/finance/positionSizing";
import { expectancy, simulateTrades } from "@/lib/finance/expectancy";
import { drawdownRecovery, recoveryCurve } from "@/lib/finance/drawdown";
import { monteCarlo } from "@/lib/finance/monteCarlo";
import { leverageEtf } from "@/lib/finance/leverageEtf";
import { mulberry32 } from "@/lib/finance/random";

describe("compound (복리)", () => {
  it("적립 없이 연복리: 100만원 연10% 2년 → 121만원", () => {
    const r = compound({
      principal: 1_000_000,
      monthlyContribution: 0,
      annualReturnPct: 10,
      years: 2,
      inflationPct: 0,
    });
    // 월복리 환산이므로 연복리 121만원보다 약간 크다
    expect(r.nominal).toBeGreaterThan(1_210_000);
    expect(r.nominal).toBeLessThan(1_225_000);
    expect(r.yearly).toHaveLength(3); // 0년차 포함
    expect(r.yearly[0].nominal).toBe(1_000_000);
  });

  it("물가상승률만큼 실질 가치가 깎인다", () => {
    const r = compound({
      principal: 1_000_000,
      monthlyContribution: 0,
      annualReturnPct: 0,
      years: 10,
      inflationPct: 3,
    });
    expect(r.nominal).toBeCloseTo(1_000_000, 0);
    expect(r.real).toBeCloseTo(1_000_000 / 1.03 ** 10, 0);
    expect(r.real).toBeLessThan(r.nominal);
  });

  it("월적립이 누적된다: 원금 0, 수익률 0, 월 10만원 1년 → 120만원", () => {
    const r = compound({
      principal: 0,
      monthlyContribution: 100_000,
      annualReturnPct: 0,
      years: 1,
      inflationPct: 0,
    });
    expect(r.nominal).toBeCloseTo(1_200_000, 0);
  });
});

describe("positionSizing (포지션 사이징)", () => {
  it("1천만원, 리스크 1%, 진입 5만, 손절 4.5만 → 20주", () => {
    const r = positionSizing({
      capital: 10_000_000,
      riskPct: 1,
      entry: 50_000,
      stop: 45_000,
    });
    expect(r.riskAmount).toBe(100_000);
    expect(r.shares).toBe(20); // 100,000 / 5,000
    expect(r.totalCost).toBe(1_000_000);
    expect(r.lossAtStop).toBe(100_000);
  });

  it("수량은 내림 처리한다 (리스크 초과 금지)", () => {
    const r = positionSizing({
      capital: 1_000_000,
      riskPct: 1,
      entry: 30_000,
      stop: 27_000,
    });
    expect(r.shares).toBe(3); // 10,000/3,000 = 3.33 → 3
    expect(r.lossAtStop).toBeLessThanOrEqual(10_000);
  });

  it("진입가=손절가면 계산 불가 오류", () => {
    expect(() =>
      positionSizing({ capital: 1, riskPct: 1, entry: 100, stop: 100 })
    ).toThrow();
  });
});

describe("expectancy (손익비/기대값)", () => {
  it("승률 50%, 이익 20만, 손실 10만 → R:R 2, 기대값 +5만/거래", () => {
    const r = expectancy({
      winRatePct: 50,
      avgWin: 200_000,
      avgLoss: 100_000,
      trades: 100,
    });
    expect(r.rr).toBe(2);
    expect(r.expectedPerTrade).toBe(50_000);
    expect(r.expectedR).toBeCloseTo(0.5);
    expect(r.expectedTotal).toBe(5_000_000);
  });

  it("승률 40%, R:R 1 → 기대값 음수", () => {
    const r = expectancy({
      winRatePct: 40,
      avgWin: 100_000,
      avgLoss: 100_000,
      trades: 10,
    });
    expect(r.expectedPerTrade).toBeLessThan(0);
  });

  it("시뮬레이션은 시드가 같으면 결과가 같다 (거래횟수+1 길이, 0에서 시작)", () => {
    const input = {
      winRatePct: 50,
      avgWin: 2,
      avgLoss: 1,
      trades: 100,
      seed: 42,
    };
    const a = simulateTrades(input);
    const b = simulateTrades(input);
    expect(a).toEqual(b);
    expect(a).toHaveLength(101);
    expect(a[0]).toBe(0);
  });
});

describe("drawdownRecovery (낙폭 회복)", () => {
  it("-50% 손실은 +100% 수익이 필요하다", () => {
    expect(drawdownRecovery(50)).toBeCloseTo(100);
  });

  it("-10%는 약 +11.1%", () => {
    expect(drawdownRecovery(10)).toBeCloseTo(11.111, 2);
  });

  it("곡선은 손실률 오름차순이고 가파르게 발산한다", () => {
    const curve = recoveryCurve();
    expect(curve[0].lossPct).toBeLessThan(curve.at(-1)!.lossPct);
    const at90 = curve.find((p) => p.lossPct === 90)!;
    expect(at90.requiredGainPct).toBeCloseTo(900);
  });
});

describe("monteCarlo (몬테카를로)", () => {
  const input = {
    winRatePct: 50,
    rr: 2,
    riskPct: 2,
    trades: 50,
    runs: 200,
    seed: 7,
  };

  it("시드가 같으면 결과가 재현된다", () => {
    expect(monteCarlo(input)).toEqual(monteCarlo(input));
  });

  it("밴드 곡선 길이 = 거래수+1, 시작값 1, p95 >= p50 >= p5", () => {
    const r = monteCarlo(input);
    expect(r.band.p50).toHaveLength(51);
    expect(r.band.p50[0]).toBe(1);
    const last = r.band.p50.length - 1;
    expect(r.band.p95[last]).toBeGreaterThanOrEqual(r.band.p50[last]);
    expect(r.band.p50[last]).toBeGreaterThanOrEqual(r.band.p5[last]);
  });

  it("우위가 있는 전략은 파산확률이 낮고, 없는 전략은 높다", () => {
    const good = monteCarlo(input); // 기대값 +
    const bad = monteCarlo({
      winRatePct: 30,
      rr: 1,
      riskPct: 10,
      trades: 200,
      runs: 200,
      seed: 7,
    });
    expect(good.ruinProbability).toBeLessThan(bad.ruinProbability);
    expect(bad.ruinProbability).toBeGreaterThan(0.5);
  });

  it("MDD 분포는 run 수만큼, 0~1 범위", () => {
    const r = monteCarlo(input);
    expect(r.maxDrawdowns).toHaveLength(200);
    for (const mdd of r.maxDrawdowns) {
      expect(mdd).toBeGreaterThanOrEqual(0);
      expect(mdd).toBeLessThanOrEqual(1);
    }
  });
});

describe("leverageEtf (레버리지 ETF)", () => {
  it("+10% 후 -10%: 기초는 -1%, 2배는 -4%", () => {
    const r = leverageEtf({ dailyReturnsPct: [10, -10], leverage: 2 });
    expect(r.base.at(-1)).toBeCloseTo(0.99);
    expect(r.levered.at(-1)).toBeCloseTo(0.96);
  });

  it("횡보 변동장에서 레버리지는 볼드래그로 더 깎인다", () => {
    const seq = [5, -5, 5, -5, 5, -5];
    const r = leverageEtf({ dailyReturnsPct: seq, leverage: 3 });
    expect(r.levered.at(-1)!).toBeLessThan(r.base.at(-1)!);
  });

  it("일간 -34% × 3배는 -100%에서 바닥 (음수 가치 없음)", () => {
    const r = leverageEtf({ dailyReturnsPct: [-40], leverage: 3 });
    expect(r.levered.at(-1)).toBe(0);
  });

  it("곡선 길이는 일수+1, 시작 1", () => {
    const r = leverageEtf({ dailyReturnsPct: [1, 2, 3], leverage: 2 });
    expect(r.base).toHaveLength(4);
    expect(r.base[0]).toBe(1);
  });
});

describe("mulberry32 (시드 난수)", () => {
  it("같은 시드 → 같은 수열, 0~1 범위", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    for (let i = 0; i < 10; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
