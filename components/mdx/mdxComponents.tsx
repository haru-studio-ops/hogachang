import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { slugify } from "@/lib/slugify";
import Term from "./Term";
import Callout from "./Callout";
import Formula from "./Formula";
import Compare from "./Compare";
import Checkpoint from "./Checkpoint";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

export const mdxComponents = {
  Term,
  Callout,
  Formula,
  Compare,
  Checkpoint,
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      id={slugify(textOf(children))}
      className="mt-10 mb-4 scroll-mt-20 border-b border-line pb-2 text-xl font-extrabold tracking-[-0.035em]"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 mb-3 text-lg font-bold tracking-[-0.02em]" {...props}>
      {children}
    </h3>
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="my-4 leading-[1.8]" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-4 list-disc space-y-1.5 pl-5 leading-[1.8]" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-4 list-decimal space-y-1.5 pl-5 leading-[1.8]" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-6 border-l-2 border-ink/60 pl-4 font-serif text-ink/80 italic"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-bold" {...props} />
  ),
  hr: () => <hr className="my-8 border-line" />,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-[15px]" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      className="border-y-2 border-ink/80 px-3 py-2 text-left font-bold"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-line px-3 py-2 align-top" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded-xs bg-ink/8 px-1.5 py-0.5 font-mono text-[0.9em]"
      {...props}
    />
  ),
};
