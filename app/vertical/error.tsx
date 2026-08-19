"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function VerticalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[vertical error] 渲染异常：", error);
  }, [error]);

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">垂直人群模板出错了</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          页面渲染遇到问题，重试一下即可；你的内容不会被保存。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={retry}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            回到首页
          </Link>
        </div>
      </div>
    </main>
  );
}
