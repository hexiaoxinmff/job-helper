"use client";

import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/version";

export interface RemoteVersion {
  version: string;
  builtAt?: string;
  note?: string;
}

/**
 * 检测线上是否有新版本：fetch 同源 public/version.json（构建时由 scripts/make-version.mjs 生成），
 * 与当前构建内联的 APP_VERSION 比对，不一致即视为有更新。
 * - 仅客户端执行（静态导出无 SSR 依赖），加时间戳参数绕过静态托管对 version.json 的缓存。
 * - 离线 / 未部署 / 请求异常一律静默，不打扰正常浏览。
 */
export function useCheckUpdate(): { hasUpdate: boolean; latest: RemoteVersion | null } {
  const [latest, setLatest] = useState<RemoteVersion | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RemoteVersion | null) => {
        if (cancelled || !data || !data.version) return;
        if (data.version !== APP_VERSION) setLatest(data);
      })
      .catch(() => {
        /* 静默 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hasUpdate: latest !== null, latest };
}
