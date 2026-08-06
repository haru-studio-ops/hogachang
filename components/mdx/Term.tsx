"use client";

import { useState } from "react";
import glossary from "@/content/glossary.json";
import type { GlossaryEntry } from "@/types/content";

const GLOSSARY: Record<string, GlossaryEntry> = glossary;

type Props = {
  children: string;
  /** 표시 텍스트와 사전 표제어가 다를 때 (예: <Term word="양적완화">QE</Term>) */
  word?: string;
};

export default function Term({ children, word }: Props) {
  const [open, setOpen] = useState(false);
  const key = word ?? children;
  const entry = GLOSSARY[key];

  if (!entry) {
    return <span>{children}</span>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-muted font-medium text-ink focus:outline-2 focus:outline-offset-2 focus:outline-fall"
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-md border border-line bg-surface p-3 text-left text-sm leading-relaxed shadow-lg"
        >
          <span className="block font-bold">{key}</span>
          {entry.en && (
            <span className="block font-mono text-xs text-muted">{entry.en}</span>
          )}
          <span className="mt-1 block text-ink/90">{entry.definition}</span>
        </span>
      )}
    </span>
  );
}
