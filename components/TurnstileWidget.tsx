"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Public site key by Cloudflare design; only TURNSTILE_SECRET_KEY is secret.
const SITE_KEY = "0x4AAAAAAAFaPP-y13X-H03y6";
const LOCAL_TEST_SITE_KEY = "1x00000000000000000000AA";
const TOKEN_REFRESH_MS = 4 * 60 * 1000; // Cloudflare tokens expire after five minutes.

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    appearance: "interaction-only";
    callback: (token: string) => void;
    "error-callback": () => void;
    "expired-callback": () => void;
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let container: HTMLDivElement | null = null;
let widgetId: string | null = null;
let scriptPromise: Promise<void> | null = null;
let currentToken = "";
let tokenIssuedAt = 0;
let pendingToken: Promise<string> | null = null;
let resolvePending: ((token: string) => void) | null = null;
let rejectPending: ((error: Error) => void) | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

function clearPending(): void {
  if (pendingTimeout) clearTimeout(pendingTimeout);
  pendingTimeout = null;
  pendingToken = null;
  resolvePending = null;
  rejectPending = null;
}

function failPending(message: string): void {
  const reject = rejectPending;
  clearPending();
  reject?.(new Error(message));
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => window.turnstile ? resolve() : reject(new Error("Turnstile API 未就绪"));
    script.onerror = () => {
      script.remove();
      reject(new Error("Turnstile 脚本加载失败"));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

/** Obtain one token for each proxy POST; force resets the widget after a 403. */
export async function getTurnstileToken(force = false): Promise<string> {
  if (!force && currentToken && Date.now() - tokenIssuedAt < TOKEN_REFRESH_MS) return currentToken;
  await loadScript();
  if (!container || !window.turnstile) throw new Error("Turnstile widget 未就绪");
  if (pendingToken) {
    if (!force) return pendingToken;
    await pendingToken.catch(() => undefined);
  }

  currentToken = "";
  const waiting = new Promise<string>((resolve, reject) => {
    resolvePending = resolve;
    rejectPending = reject;
    pendingTimeout = setTimeout(() => failPending("Turnstile 验证超时"), 120000);
  });
  pendingToken = waiting;

  try {
    if (widgetId) {
      window.turnstile.reset(widgetId);
    } else {
      const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      widgetId = window.turnstile.render(container, {
        sitekey: local ? LOCAL_TEST_SITE_KEY : SITE_KEY,
        appearance: "interaction-only",
        callback: (token) => {
          currentToken = token;
          tokenIssuedAt = Date.now();
          const resolve = resolvePending;
          clearPending();
          resolve?.(token);
        },
        "error-callback": () => failPending("Turnstile 验证失败"),
        "expired-callback": () => {
          currentToken = "";
          tokenIssuedAt = 0;
          if (pendingToken) failPending("Turnstile token 已过期");
        },
      });
    }
  } catch (error) {
    failPending("Turnstile widget 渲染失败");
    throw error;
  }
  return waiting;
}

export default function TurnstileWidget() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (container && container !== element && widgetId) {
      window.turnstile?.remove(widgetId);
      widgetId = null;
      currentToken = "";
    }
    container = element;
    return () => {
      if (container === element) container = null;
    };
  }, []);

  useEffect(() => {
    if (pathname === "/") {
      // The diagnosis entry warms up on mount; other routes load only on demand.
      void getTurnstileToken().catch((error) => console.warn("[turnstile] 初始化失败", error));
    }
  }, [pathname]);

  return <div ref={ref} aria-label="人机验证" className="fixed bottom-4 right-4 z-[70]" />;
}
