export type PositionSizingInput = {
  /** 총자본 (원) */
  capital: number;
  /** 1회 거래 리스크 % */
  riskPct: number;
  entry: number;
  stop: number;
};

export type PositionSizingResult = {
  /** 허용 손실 금액 = 총자본 × 리스크% */
  riskAmount: number;
  /** 매수 수량 (내림 — 리스크 초과 금지) */
  shares: number;
  /** 총 투입금액 */
  totalCost: number;
  /** 손절 시 실제 손실 금액 */
  lossAtStop: number;
};

export function positionSizing(
  input: PositionSizingInput
): PositionSizingResult {
  const perShareRisk = Math.abs(input.entry - input.stop);
  if (perShareRisk === 0) {
    throw new Error("진입가와 손절가가 같으면 리스크를 계산할 수 없다");
  }
  const riskAmount = (input.capital * input.riskPct) / 100;
  const shares = Math.floor(riskAmount / perShareRisk);
  return {
    riskAmount,
    shares,
    totalCost: shares * input.entry,
    lossAtStop: shares * perShareRisk,
  };
}
