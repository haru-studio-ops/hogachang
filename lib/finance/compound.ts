export type CompoundInput = {
  principal: number;
  monthlyContribution: number;
  /** 연 수익률 % */
  annualReturnPct: number;
  years: number;
  /** 연 물가상승률 % */
  inflationPct: number;
};

export type CompoundResult = {
  /** 명목 최종금액 */
  nominal: number;
  /** 물가 반영 실질 최종금액 */
  real: number;
  /** 0년차(원금)부터 연도별 스냅샷 */
  yearly: { year: number; nominal: number; real: number }[];
};

/** 월복리 + 월적립. 실질가치는 연 물가상승률로 할인한다 */
export function compound(input: CompoundInput): CompoundResult {
  const monthlyRate = input.annualReturnPct / 100 / 12;
  const yearly: CompoundResult["yearly"] = [
    { year: 0, nominal: input.principal, real: input.principal },
  ];
  let balance = input.principal;
  for (let year = 1; year <= input.years; year++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + input.monthlyContribution;
    }
    const deflator = (1 + input.inflationPct / 100) ** year;
    yearly.push({ year, nominal: balance, real: balance / deflator });
  }
  const last = yearly[yearly.length - 1];
  return { nominal: last.nominal, real: last.real, yearly };
}
