/** 손실률 %에서 원금 회복에 필요한 수익률 %. -50% → +100% */
export function drawdownRecovery(lossPct: number): number {
  if (lossPct >= 100) return Infinity;
  if (lossPct <= 0) return 0;
  return (lossPct / (100 - lossPct)) * 100;
}

/** 손실률 1~95%의 필요 수익률 곡선 (차트용) */
export function recoveryCurve(): { lossPct: number; requiredGainPct: number }[] {
  const points: { lossPct: number; requiredGainPct: number }[] = [];
  for (let lossPct = 1; lossPct <= 95; lossPct++) {
    points.push({ lossPct, requiredGainPct: drawdownRecovery(lossPct) });
  }
  return points;
}
