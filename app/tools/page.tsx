import Link from "next/link";

const TOOLS = [
  { href: "/tools/compound", label: "복리 계산기" },
  { href: "/tools/position-sizing", label: "포지션 사이징 계산기" },
  { href: "/tools/risk-reward", label: "손익비 / 기대값 계산기" },
  { href: "/tools/drawdown", label: "낙폭 회복 시뮬레이터" },
  { href: "/tools/monte-carlo", label: "몬테카를로 시뮬레이터" },
  { href: "/tools/leverage-etf", label: "레버리지 ETF 시뮬레이터" },
] as const;

export default function ToolsPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">계산기</h1>
      <p className="mt-2 text-muted">배운 개념을 직접 숫자로 굴려보는 도구 모음.</p>
      <ul className="mt-6 space-y-2">
        {TOOLS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="block rounded-md border border-line bg-surface px-4 py-3 text-ink transition-colors hover:border-ink/20"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
