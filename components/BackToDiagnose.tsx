import Link from "next/link";

/**
 * 底部回流区：把工具页用户引回核心「简历诊断」。
 * 统一文案与样式（与 Button primary 同视觉），链接回首页 "/"；
 * 文案保持中性，不做任何承诺。
 */
export default function BackToDiagnose() {
  return (
    <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50/60 p-6 text-center dark:border-primary-900 dark:bg-neutral-900">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        想看看简历与目标岗位的匹配度？
      </p>
      <Link
        href="/"
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary-500 via-primary-600 to-indigo-500 px-6 py-3 text-base font-medium text-white shadow-md transition-all select-none hover:shadow-lg hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        去做简历诊断 →
      </Link>
    </div>
  );
}
