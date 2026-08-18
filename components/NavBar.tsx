"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "简历诊断" },
  { href: "/star", label: "STAR 生成器" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive(href)
        ? "bg-blue-50 text-blue-700 font-medium"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <>
      {/* 移动端：顶部横条（<768px） */}
      <nav className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="font-semibold text-slate-900 text-base">
            求职在线助手
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 桌面端：左侧固定导航栏（≥768px） */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-slate-200 bg-white z-30">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <Link href="/" className="font-semibold text-slate-900 text-lg block">
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

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
          🔒 简历仅在内存中处理
          <br />
          分析完立即删除
        </div>
      </aside>
    </>
  );
}
