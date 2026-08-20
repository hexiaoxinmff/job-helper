// 轻量/完整云同步（P3）：账号标识（本地随机 uid）+ 同步数据到云端 PostgreSQL。
// 默认仅同步脱敏数据（投递台账 / 诊断历史 / 档案快照，无敏感正文）；
// 开启「同步简历（加密）」后，简历全文在浏览器端 AES-GCM 加密（密钥仅存本地）才上云——服务端与第三方不可读。
// 实现：浏览器不直连数据库，经 ai-proxy 云函数 sync action（复用共享密钥 x-api-key 鉴权 + Origin 白名单 + 限流），
// 云函数内用 service 身份读写 jh_sync 表并按 owner_id=uid 隔离。
// 依赖：NEXT_PUBLIC_AI_PROXY_URL / NEXT_PUBLIC_AI_PROXY_KEY（与 AI 诊断同一套鉴权）。
import type { ApplicationItem } from "./tracker-store";
import type { DiagnosisHistoryItem } from "./diagnosis-history";
import type { PrivateProfile, ProfileSnapshot } from "./profile";

/** 加密简历条目：enc 为 AES-GCM 密文（服务端不可读），name/updatedAt 为明文元数据（仅用于版本合并） */
export interface SyncResume {
  id: string;
  name: string;
  updatedAt: number;
  enc: string;
}

export interface SyncBundle {
  tracker: ApplicationItem[];
  history: DiagnosisHistoryItem[];
  profile: PrivateProfile | null;
  /** 加密简历（完整云同步，可选；未开启则为空数组） */
  resumes: SyncResume[];
  updatedAt: number;
}

const PROXY_URL =
  process.env.NEXT_PUBLIC_AI_PROXY_URL ||
  "https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.ap-shanghai.app.tcloudbase.com/ai-proxy";
const PROXY_KEY = process.env.NEXT_PUBLIC_AI_PROXY_KEY || "";
const UID_KEY = "job-helper:sync-uid";
const SYNC_TIMEOUT_MS = 15000;

/** 云同步是否已配置（有 AI 代理地址即可用；密钥未配置时线上会 401，属于环境问题） */
export function isCloudSyncConfigured(): boolean {
  return !!PROXY_URL;
}

/** 本地持久化匿名身份标识（跨设备同步按此 uid 分桶；密钥鉴权兜底） */
export function getSyncUid(): string {
  try {
    let u = window.localStorage.getItem(UID_KEY);
    if (!u) {
      u =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(UID_KEY, u);
    }
    return u;
  } catch {
    return `u-${Date.now()}`;
  }
}

async function callSyncApi(action: "sync" | "syncClear", body: Record<string, unknown>): Promise<{
  ok: boolean;
  merged?: SyncBundle | null;
  error?: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (PROXY_KEY) headers["x-api-key"] = PROXY_KEY;
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...body }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) {
      return { ok: false, error: (data && data.error) || `同步失败（HTTP ${res.status}）` };
    }
    if (action === "sync") {
      const remote = data.data && data.data.remote ? (data.data.remote as SyncBundle) : null;
      return remote ? { ok: true, merged: remote } : { ok: false, error: "云端返回异常" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message ?? "网络错误" };
  } finally {
    clearTimeout(timer);
  }
}

export interface SyncResult {
  ok: boolean;
  /** 合并后的完整数据（写回本地用） */
  merged: SyncBundle | null;
  error?: string;
}

/** 同步：本地数据 → 云函数合并并写回 → 返回最终一致数据（调用方写回本地 store） */
export async function syncNow(local: SyncBundle): Promise<SyncResult> {
  if (!isCloudSyncConfigured()) {
    return { ok: false, merged: null, error: "未配置云端同步（缺少 NEXT_PUBLIC_AI_PROXY_URL）" };
  }
  const r = await callSyncApi("sync", { uid: getSyncUid(), local });
  return { ok: r.ok, merged: r.merged ?? null, error: r.error };
}

/** 清除云端数据（保留本地） */
export async function clearRemote(): Promise<{ ok: boolean; error?: string }> {
  if (!isCloudSyncConfigured()) return { ok: false, error: "未配置云端同步" };
  const r = await callSyncApi("syncClear", { uid: getSyncUid() });
  return { ok: r.ok, error: r.error };
}

// ===== 简历加密同步的开关与密钥管理（localStorage） =====
const RESUME_SYNC_KEY = "job-helper:resume-sync-enabled";
const RESUME_ENC_KEY = "job-helper:resume-enc-key";

/** 是否开启「同步简历（加密）」 */
export function isResumeSyncEnabled(): boolean {
  try {
    return window.localStorage.getItem(RESUME_SYNC_KEY) === "on";
  } catch {
    return false;
  }
}

export function setResumeSyncEnabled(v: boolean): void {
  try {
    if (v) window.localStorage.setItem(RESUME_SYNC_KEY, "on");
    else window.localStorage.removeItem(RESUME_SYNC_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 读取加密密钥（无则 null） */
export function getResumeEncKey(): string | null {
  try {
    return window.localStorage.getItem(RESUME_ENC_KEY);
  } catch {
    return null;
  }
}

export function setResumeEncKey(key: string): void {
  try {
    window.localStorage.setItem(RESUME_ENC_KEY, key);
  } catch {
    /* 忽略 */
  }
}

// ===== 类型引用保留（供云端返回数据对齐） =====
export type { ApplicationItem, DiagnosisHistoryItem, PrivateProfile, ProfileSnapshot };
