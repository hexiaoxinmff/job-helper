"use client";

import Link from "next/link";
import { useResume } from "@/lib/resume-store";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/Button";

export default function PreviewPage() {
  const { resume, reset } = useResume();

  return (
    <main className="flex-1 w-full mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6 print:hidden">
        <Link href="/editor" className="text-sm text-blue-600 hover:underline">
          ← 返回编辑
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reset}>
            清空
          </Button>
          <Button onClick={() => window.print()}>导出 PDF（打印）</Button>
        </div>
      </div>

      <div className="print:shadow-none">
        <ResumeDocument resume={resume} />
      </div>

      <p className="text-xs text-slate-400 text-center mt-6 print:hidden">
        点击「导出 PDF」后选择「另存为 PDF」即可保存简历
      </p>
    </main>
  );
}
