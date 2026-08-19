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
  cachedTheme =
    cachedTheme ?? readStoredTheme() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  return cachedTheme;
}

function getThemeServerSnapshot(): Theme {
  return "light";
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

/** 首屏前同步执行的脚本：在 React 注水前设置 .dark，避免暗色模式闪烁（FOUC） */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}d.style.colorScheme=t;}catch(e){}})();`;
