import type { ReactNode } from "react";

type CalloutType = "warn" | "tip" | "money";

const STYLES: Record<CalloutType, { label: string; border: string; text: string }> = {
  warn: { label: "주의", border: "border-l-rise", text: "text-rise" },
  tip: { label: "팁", border: "border-l-fall", text: "text-fall" },
  money: { label: "돈의 감각", border: "border-l-brass", text: "text-brass" },
};

type Props = {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
};

export default function Callout({ type = "tip", title, children }: Props) {
  const style = STYLES[type];
  return (
    <div
      className={`my-6 rounded-r-md border border-line border-l-4 bg-surface p-4 ${style.border}`}
    >
      <p className={`mb-1 text-xs font-bold tracking-wide uppercase ${style.text}`}>
        {title ?? style.label}
      </p>
      <div className="text-[15px] leading-relaxed [&>p]:my-0">{children}</div>
    </div>
  );
}
