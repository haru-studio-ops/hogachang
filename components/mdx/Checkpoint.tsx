type Props = {
  /** 자가진단 문항. 스스로 답할 수 있으면 통과다. */
  items: string[];
  title?: string;
};

export default function Checkpoint({ items, title = "자가진단" }: Props) {
  return (
    <div className="my-6 rounded-md border-2 border-ink/80 bg-surface p-4">
      <p className="mb-2 text-xs font-bold tracking-wide uppercase">✅ {title}</p>
      <ul className="space-y-2 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className="mt-1 inline-block size-3.5 shrink-0 rounded-xs border border-muted"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        소리 내서 답해보고, 막히면 해당 섹션으로 돌아간다.
      </p>
    </div>
  );
}
