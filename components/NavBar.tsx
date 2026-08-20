"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_VERSION } from "@/lib/version";
import { useCheckUpdate, type RemoteVersion } from "@/lib/use-check-update";

interface NavItem {
  href: string;
  label: string;
  /** 24×24 stroke 图标 path d（currentColor 渲染） */
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "简历诊断", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/editor", label: "简历编辑器", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
  { href: "/interview", label: "AI 模拟面试", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/star", label: "STAR 生成器", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" },
  { href: "/tracker", label: "投递追踪", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.6 9h16.8M3.6 15h16.8M9 3.6v16.8M15 3.6v16.8" },
  { href: "/profile", label: "私人档案", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/vertical", label: "垂直模板", icon: "M12 2l10 6-10 6L2 8zM2 17l10 6 10-6M2 12l10 6 10-6" },
  { href: "/campus", label: "高校入口", icon: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" },
];

/** 侧栏分组（顺序即展示顺序） */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "核心工具", items: NAV_ITEMS.slice(0, 3) },
  { label: "求职工具", items: NAV_ITEMS.slice(3, 5) },
  { label: "数据与拓展", items: NAV_ITEMS.slice(5) },
];

/** 内联图标（统一 18×18，随字号/激活态变色） */
function NavIcon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

/** 截断过长更新说明（完整内容在 title 提示中） */
function clipNote(note?: string, max = 26): string {
  if (!note) return "";
  return note.length > max ? note.slice(0, max) + "…" : note;
}

/** 版本行：检测到新版本时变为可点击的更新提示，点击刷新加载新版本 */
function VersionLine({
  inMenu,
  hasUpdate,
  latest,
}: {
  inMenu?: boolean;
  hasUpdate: boolean;
  latest: RemoteVersion | null;
}) {
  const base = inMenu ? "px-3 py-2 text-[10px]" : "mt-3 text-[10px]";
  if (hasUpdate && latest) {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        title={`有新版本 ${latest.version}，点击刷新加载${latest.note ? `（${latest.note}）` : ""}`}
        className={`${base} block w-full rounded-lg bg-accent-50 text-left text-accent-700 transition-colors hover:bg-accent-100 dark:bg-accent-950 dark:text-accent-300 dark:hover:bg-accent-900`}
      >
        📦 新版本 {latest.version}
        {clipNote(latest.note) ? ` · ${clipNote(latest.note)}` : ""}
        <span className="opacity-70">（点击刷新）</span>
      </button>
    );
  }
  return (
    <p
      className={`${base} text-neutral-300 select-all dark:text-neutral-600`}
      title="当前线上版本（日期-时间-git提交号）"
    >
      版本 {APP_VERSION}
    </p>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hasUpdate, latest } = useCheckUpdate();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const itemClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive(href)
        ? "bg-linear-to-r from-primary-500/40 to-primary-600/25 text-primary-100 font-medium border border-primary-500/40"
        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-white/5"
    }`;

  return (
    <>
      {/* 移动端：汉堡按钮 + 折叠面板（<768px） */}
      <nav className="md:hidden sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur print:hidden pt-[env(safe-area-inset-top)] dark:border-neutral-800 dark:bg-neutral-900/90">
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
          <div className="border-t border-neutral-200 bg-white px-3 py-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 max-h-[70vh] overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-primary-50 text-primary-700 font-medium dark:bg-primary-950 dark:text-primary-300"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <NavIcon d={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <VersionLine inMenu hasUpdate={hasUpdate} latest={latest} />
          </div>
        )}
      </nav>

      {/* 桌面端：左侧固定导航栏（≥768px，方案 A：深色玻璃） */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-neutral-200 bg-white/80 backdrop-blur-xl z-30 print:hidden dark:border-white/10 dark:bg-[#0a0718]/85">
        <div className="px-5 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <Link href="/" className="font-semibold text-neutral-900 text-lg block dark:text-neutral-100">
            求职在线助手
          </Link>
          <p className="text-xs text-neutral-400 mt-1">AI 求职工具箱</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className={itemClass(item.href)}>
                    <NavIcon d={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-neutral-100 text-xs text-neutral-400 leading-relaxed dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <span>外观</span>
            <ThemeToggle className="h-8 w-8" />
          </div>
          <VersionLine hasUpdate={hasUpdate} latest={latest} />
        </div>
      </aside>
    </>
  );
}
