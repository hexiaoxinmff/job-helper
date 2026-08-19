"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EditorError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[editor error] 渲染异常：", error);
  }, [error]);

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-md py-20">
      <div className="rounded-2xl border border-neutral-200 bg-white p-xl text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-sm text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">编辑器出错了</h1>
        <p className="mt-xs text-sm text-neutral-600 dark:text-neutral-300">
          简历内容仍保存在本地浏览器，重试后不会丢失。
        </p>
        <div className="mt-lg flex justify-center gap-sm">
          <button
            onClick={retry}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            回到首页
          </Link>
        </div>
      </div>
    </main>
  );
}
