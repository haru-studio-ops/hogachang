export type LeverageEtfInput = {
  /** 기초자산 일간 수익률 시퀀스 (%) */
  dailyReturnsPct: number[];
  /** 레버리지 배수 (예: 2, 3) */
  leverage: number;
};

export type LeverageEtfResult = {
  /** 기초자산 누적가치 (시작 1, 길이 = 일수+1) */
  base: number[];
  /** 레버리지 누적가치 */
  levered: number[];
  baseFinal: number;
  leveredFinal: number;
};

/**
 * 일간 리밸런싱 레버리지 ETF의 누적 성과.
 * 일간 수익률에 배수를 곱해 매일 복리 — 변동성 끌림(vol drag)이 그대로 드러난다.
 * 하루 -100% 아래로는 내려가지 않는다 (가치는 0에서 바닥).
 */
export function leverageEtf(input: LeverageEtfInput): LeverageEtfResult {
  const base = [1];
  const levered = [1];
  for (const r of input.dailyReturnsPct) {
    base.push(base[base.length - 1] * (1 + r / 100));
    const leveredDaily = Math.max(-1, (r / 100) * input.leverage);
    levered.push(levered[levered.length - 1] * (1 + leveredDaily));
  }
  return {
    base,
    levered,
    baseFinal: base[base.length - 1],
    leveredFinal: levered[levered.length - 1],
  };
}
