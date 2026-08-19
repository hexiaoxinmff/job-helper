import type { ReactNode } from "react";

/**
 * 页脚隐私 / 诚实承诺说明：统一「🔒」样式与排版，避免多页面重复手写。
 * 用法：<PrivacyNote>你的承诺文案</PrivacyNote>
 */
export default function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-xl text-xs text-neutral-400 text-center dark:text-neutral-500">
      🔒 {children}
    </p>
  );
}
