import katex from "katex";
import "katex/dist/katex.min.css";

type Props = {
  /** KaTeX 수식 문자열 (예: "FV = PV \\times (1+r)^n") */
  tex: string;
  /** 수식 아래 붙는 짧은 설명 */
  caption?: string;
  inline?: boolean;
};

export default function Formula({ tex, caption, inline = false }: Props) {
  const html = katex.renderToString(tex, {
    displayMode: !inline,
    throwOnError: false,
  });

  if (inline) {
    // 로컬에서 작성한 수식만 렌더링하므로 안전하다
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <figure className="my-6 overflow-x-auto rounded-md border border-line bg-surface p-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
