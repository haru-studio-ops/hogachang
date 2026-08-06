type Props = {
  /** 왼쪽 카드 제목 */
  a: string;
  /** 오른쪽 카드 제목 */
  b: string;
  aItems: string[];
  bItems: string[];
};

export default function Compare({ a, b, aItems, bItems }: Props) {
  return (
    <div className="my-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-line bg-surface p-4">
        <p className="mb-2 border-b border-line pb-2 font-bold text-rise">{a}</p>
        <ul className="space-y-1.5 text-[15px] leading-relaxed">
          {aItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-muted" aria-hidden>
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-line bg-surface p-4">
        <p className="mb-2 border-b border-line pb-2 font-bold text-fall">{b}</p>
        <ul className="space-y-1.5 text-[15px] leading-relaxed">
          {bItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-muted" aria-hidden>
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
