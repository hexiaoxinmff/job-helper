"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive(href)
        ? "bg-primary-50 text-primary-700 font-medium dark:bg-primary-950 dark:text-primary-300"
        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
    }`;

  return (
    <>
      {/* 移动端：汉堡按钮 + 折叠面板（<768px） */}
      <nav className="md:hidden sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur print:hidden dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="font-semibold text-neutral-900 text-base dark:text-neutral-100">
            求职在线助手
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle className="h-9 w-9" />
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <>
                    <path d="M5 5l10 10" />
                    <path d="M15 5L5 15" />
                  </>
                ) : (
                  <>
                    <path d="M3 5h14" />
                    <path d="M3 10h14" />
                    <path d="M3 15h14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-neutral-200 bg-white px-3 py-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-50 text-primary-700 font-medium dark:bg-primary-950 dark:text-primary-300"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* 桌面端：左侧固定导航栏（≥768px） */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-neutral-200 bg-white z-30 print:hidden dark:border-neutral-800 dark:bg-neutral-900">
        <div className="px-5 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <Link href="/" className="font-semibold text-neutral-900 text-lg block dark:text-neutral-100">
            求职在线助手
          </Link>
          <p className="text-xs text-neutral-400 mt-1">AI 求职工具箱</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-neutral-100 text-xs text-neutral-400 leading-relaxed dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <span>外观</span>
            <ThemeToggle className="h-8 w-8" />
          </div>
        </div>
      </aside>
    </>
  );
}
