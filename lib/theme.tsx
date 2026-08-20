"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode, useCallback } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "job-helper:theme";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** 读取并校验本地主题值：非法值（损坏/手改）返回 null 走系统偏好，避免状态异常 */
function readStoredTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

// ===== 外部 store：localStorage 持久化 + 订阅，供 useSyncExternalStore 使用 =====
type Listener = () => void;
const themeListeners = new Set<Listener>();
let cachedTheme: Theme | null = null;

function getThemeSnapshot(): Theme {
  // 方案 A：默认深空极光（dark）。用户显式切换后以 localStorage 为准。
  cachedTheme = cachedTheme ?? readStoredTheme() ?? "dark";
  return cachedTheme;
}

function getThemeServerSnapshot(): Theme {
  return "dark";
}

function subscribeTheme(listener: Listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function commitTheme(t: Theme) {
  cachedTheme = t;
  applyTheme(t);
  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* 忽略 */
  }
  themeListeners.forEach((l) => l());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    useCallback((l: Listener) => subscribeTheme(l), []),
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const setTheme = (t: Theme) => commitTheme(t);
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme 必须在 ThemeProvider 内使用");
  return ctx;
}

/** 首屏前同步执行的脚本：在 React 注水前设置 .dark，避免暗色模式闪烁（FOUC）
 *  方案 A：默认即深空极光（dark），除非用户显式选择过 light */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t='dark';}var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}d.style.colorScheme=t;}catch(e){}})();`;

// ===== 根 CSS 变量注册表（与 app/globals.css 的 :root/.dark 定义一一对应） =====
// 组件禁止硬编码十六进制：CSS 一律写 var(--jh-*) / 语义工具类；
// JS 侧（图表、导出等）通过 resolveThemeVars() 读取当前主题下的实际值。
export const THEME_CSS_VARS = {
  bg: "--jh-bg",
  bgElevated: "--jh-bg-elevated",
  bgMuted: "--jh-bg-muted",
  fg: "--jh-fg",
  fgMuted: "--jh-fg-muted",
  fgFaint: "--jh-fg-faint",
  border: "--jh-border",
  borderStrong: "--jh-border-strong",
  overlay: "--jh-overlay",
  primary: "--jh-primary-600",
  success: "--jh-success-600",
  warning: "--jh-warning-600",
  danger: "--jh-danger-600",
  info: "--jh-info-600",
  accent: "--jh-accent-600",
  radius: {
    sm: "--jh-radius-sm",
    md: "--jh-radius-md",
    lg: "--jh-radius-lg",
    xl: "--jh-radius-xl",
    "2xl": "--jh-radius-2xl",
    "3xl": "--jh-radius-3xl",
    full: "--jh-radius-full",
  },
  chart: {
    axis: "--chart-axis",
    grid: "--chart-grid",
    stroke: "--chart-stroke",
    series1: "--chart-series-1",
    series2: "--chart-series-2",
    series3: "--chart-series-3",
    series4: "--chart-series-4",
    series5: "--chart-series-5",
    series6: "--chart-series-6",
  },
} as const;

export type ThemeVars = {
  bg: string;
  bgElevated: string;
  bgMuted: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  border: string;
  borderStrong: string;
  overlay: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  accent: string;
  chart: {
    axis: string;
    grid: string;
    stroke: string;
    series1: string;
    series2: string;
    series3: string;
    series4: string;
    series5: string;
    series6: string;
  };
};

/**
 * 浏览器端读取当前主题下 CSS 变量的实际值（图表 stroke/fill、报告导出背景等）。
 * 纯客户端函数，静态导出无 SSR 依赖；未挂载时返回空对象，调用方自行兜底。
 */
export function resolveThemeVars(): Partial<ThemeVars> {
  if (typeof window === "undefined") return {};
  const s = getComputedStyle(document.documentElement);
  const read = (v: string, fb = ""): string => s.getPropertyValue(v).trim() || fb;
  return {
    bg: read(THEME_CSS_VARS.bg, "#ffffff"),
    bgElevated: read(THEME_CSS_VARS.bgElevated, "#ffffff"),
    bgMuted: read(THEME_CSS_VARS.bgMuted, "#f1f5f9"),
    fg: read(THEME_CSS_VARS.fg, "#0f172a"),
    fgMuted: read(THEME_CSS_VARS.fgMuted, "#475569"),
    fgFaint: read(THEME_CSS_VARS.fgFaint, "#94a3b8"),
    border: read(THEME_CSS_VARS.border, "#e2e8f0"),
    borderStrong: read(THEME_CSS_VARS.borderStrong, "#cbd5e1"),
    overlay: read(THEME_CSS_VARS.overlay, "rgb(15 23 42 / 0.5)"),
    primary: read(THEME_CSS_VARS.primary, "#4f46e5"),
    success: read(THEME_CSS_VARS.success, "#059669"),
    warning: read(THEME_CSS_VARS.warning, "#d97706"),
    danger: read(THEME_CSS_VARS.danger, "#dc2626"),
    info: read(THEME_CSS_VARS.info, "#0284c7"),
    accent: read(THEME_CSS_VARS.accent, "#9333ea"),
    chart: {
      axis: read(THEME_CSS_VARS.chart.axis, "#475569"),
      grid: read(THEME_CSS_VARS.chart.grid, "#e2e8f0"),
      stroke: read(THEME_CSS_VARS.chart.stroke, "#4f46e5"),
      series1: read(THEME_CSS_VARS.chart.series1, "#4f46e5"),
      series2: read(THEME_CSS_VARS.chart.series2, "#059669"),
      series3: read(THEME_CSS_VARS.chart.series3, "#d97706"),
      series4: read(THEME_CSS_VARS.chart.series4, "#9333ea"),
      series5: read(THEME_CSS_VARS.chart.series5, "#db2777"),
      series6: read(THEME_CSS_VARS.chart.series6, "#0891b2"),
    },
  };
}
