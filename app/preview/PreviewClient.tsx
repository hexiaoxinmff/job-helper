"use client";

import Link from "next/link";
import { useRef } from "react";
import { useResume } from "@/lib/resume-store";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/Button";

/** A4 内容可用高度（@96dpi：297mm≈1123px，减去页边距留余量） */
const A4_FIT_PX = 1123 - 40;

export default function PreviewClient() {
  const { resume, reset } = useResume();
  const docRef = useRef<HTMLDivElement>(null);

  /** 打印前把简历容器缩放到一页内（zoom 会同步影响布局高度，Chrome/Edge 打印分页正确） */
  const handlePrint = () => {
    const el = docRef.current;
    if (el) {
      let zoom = 1;
      for (let i = 0; i < 10; i++) {
        el.style.zoom = String(zoom);
        if (el.scrollHeight <= A4_FIT_PX * zoom) break;
        zoom = Math.max(0.62, zoom * (A4_FIT_PX / el.scrollHeight));
      }
      el.style.zoom = String(zoom);
      try {
        window.print();
      } finally {
        el.style.zoom = "";
      }
    } else {
      window.print();
    }
  };

  return (
    <main className="flex-1 w-full mx-auto px-4 py-10 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6 print:hidden">
        <Link href="/editor" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
          ← 返回编辑
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reset}>
            清空
          </Button>
          <Button onClick={handlePrint}>导出 PDF（打印）</Button>
        </div>
      </div>

      {/* 简历容器：白底「纸张」外观（兜住所有透明根模板，暗色下也清晰可读）
     打印时 @media print 强制 bg-white + 解 max-w，保证纸面正确 */}
      <div className="rounded-xl bg-white shadow-lg ring-1 ring-neutral-200/70 print:shadow-none print:ring-0 dark:shadow-neutral-950/50 dark:ring-neutral-700/40">
        <div ref={docRef} style={{ zoom: 1 }}>
          <ResumeDocument resume={resume} />
        </div>
      </div>

      <p className="text-xs text-neutral-400 text-center mt-6 print:hidden dark:text-neutral-500">
        点击「导出 PDF」后选择「另存为 PDF」即可保存简历；内容超一页时会自动压缩到一页内
      </p>
    </main>
  );
}
