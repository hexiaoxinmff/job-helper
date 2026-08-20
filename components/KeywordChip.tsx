"use client";

import { useEffect, useRef, useState } from "react";
import { getKeywordDescription } from "@/lib/keywords";

interface Props {
  keyword: string;
  variant: "matched" | "missing";
}

const VARIANT_STYLES = {
  matched:
    "px-2.5 py-1 rounded-full bg-success-100 text-success-700 text-xs hover:bg-success-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2",
  missing:
    "px-2.5 py-1 rounded-full bg-danger-100 text-danger-700 text-xs hover:bg-danger-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2",
};

export default function KeywordChip({ keyword, variant }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const description = getKeywordDescription(keyword);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const title = description
    ? description
    : variant === "missing"
      ? "JD 要求但简历未包含的关键词"
      : "简历已包含的关键词";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => description && setOpen((o) => !o)}
        className={VARIANT_STYLES[variant]}
        title={title}
      >
        {keyword}
        {description && <span className="ml-1 opacity-60">ⓘ</span>}
      </button>
      {open && description && (
        <div
          className="absolute left-0 top-full mt-1.5 z-20 max-w-[260px] p-2.5 text-xs text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-md leading-relaxed"
          role="tooltip"
        >
          <span className="font-medium text-neutral-900">{keyword}</span>
          <span className="mx-1 text-neutral-300">·</span>
          {description}
        </div>
      )}
    </div>
  );
}
