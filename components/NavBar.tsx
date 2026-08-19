"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "简历诊断" },
  { href: "/editor", label: "简历编辑器" },
  { href: "/star", label: "STAR 生成器" },
  { href: "/profile", label: "私人档案" },
  { href: "/vertical", label: "垂直模板" },
  { href: "/campus", label: "高校入口" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive(href)
        ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-950 dark:text-blue-300"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <>
      {/* 移动端：顶部横条（<768px） */}
      <nav className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="font-semibold text-slate-900 text-base dark:text-slate-100">
            求职在线助手
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-950 dark:text-blue-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </nav>

      {/* 桌面端：左侧固定导航栏（≥768px） */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-slate-200 bg-white z-30 print:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="font-semibold text-slate-900 text-lg block dark:text-slate-100">
            求职在线助手
          </Link>
          <p className="text-xs text-slate-400 mt-1">AI 求职工具箱</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span>外观</span>
            <ThemeToggle className="h-8 w-8" />
          </div>
        </div>
      </aside>
    </>
  );
}
