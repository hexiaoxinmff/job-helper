// 轻量云同步（P3）：账号体系（CloudBase 匿名登录）+ 仅同步脱敏数据到 CloudBase PostgreSQL。
// 隐私红线：简历正文永不上云；只同步投递台账 / 诊断历史 / 档案快照（岗位摘要/分数/时间，均无敏感正文）；
// 数据按用户 uid 隔离（表 jh_sync，owner_id = auth.uid()，RLS 仅本人可读写）；用户可随时清除云端数据。
//
// 依赖：NEXT_PUBLIC_CLOUDBASE_ENV_ID（环境 id）未配置时同步功能自动不可用（UI 灰态提示）。
// 使用 CloudBase JS SDK v3 PG API：app.rdb()（postgREST 风格）+ auth.getSession() + auth.signInAnonymously()。
import type { ApplicationItem } from "./tracker-store";
import type { DiagnosisHistoryItem } from "./diagnosis-history";
import type { PrivateProfile, ProfileSnapshot } from "./profile";

export interface SyncBundle {
  tracker: ApplicationItem[];
  history: DiagnosisHistoryItem[];
  profile: PrivateProfile | null;
  updatedAt: number;
}

const ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || "";
const TABLE = "jh_sync";

// 类型约束（postgREST 返回结构）
interface SessionLike {
  session?: { user?: { id?: string; is_anonymous?: boolean } } | null;
}
interface AuthLike {
  getSession: () => Promise<{ data: SessionLike; error?: unknown }>;
  signInAnonymously: () => Promise<unknown>;
}
interface RdbLike {
  from: (table: string) => {
    select: (cols: string, opts?: unknown) => { eq: (k: string, v: unknown) => Promise<{ data: unknown; error?: unknown }> };
    upsert: (row: Record<string, unknown>) => Promise<{ error?: unknown }>;
    delete: () => { eq: (k: string, v: unknown) => Promise<{ error?: unknown }> };
  };
}
interface AppLike {
  auth: AuthLike;
  rdb: () => RdbLike;
}

let appPromise: Promise<AppLike | null> | null = null;

function getApp(): Promise<AppLike | null> {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    if (!ENV_ID) return null;
    try {
      const mod = (await import("@cloudbase/js-sdk")) as { default: unknown };
      const tcb = (mod.default ?? mod) as (opts: { env: string }) => AppLike;
      return tcb({ env: ENV_ID });
    } catch {
      return null;
    }
  })();
  return appPromise;
}

export function isCloudSyncConfigured(): boolean {
  return !!ENV_ID;
}

/** 确保已匿名登录，返回用户 id；失败返回 null */
async function ensureUser(app: AppLike): Promise<{ uid: string } | null> {
  let { data } = await app.auth.getSession();
  if (!data?.session) {
    await app.auth.signInAnonymously();
    const retry = await app.auth.getSession();
    data = retry.data;
  }
  const uid = data?.session?.user?.id;
  if (!uid) return null;
  return { uid };
}

// ===== 合并策略（条目级 last-write-wins） =====
function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  getTime: (it: T) => number
): T[] {
  const map = new Map<string, T>();
  for (const it of [...local, ...remote]) {
    const prev = map.get(it.id);
    if (!prev || getTime(it) >= getTime(prev)) map.set(it.id, it);
  }
  return Array.from(map.values());
}

function mergeProfile(local: PrivateProfile | null, remote: PrivateProfile | null): PrivateProfile | null {
  if (!local) return remote;
  if (!remote) return local;
  const histories = mergeById<ProfileSnapshot>(local.histories, remote.histories, (h) => h.ts ?? 0)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 50);
  // 本地为准（enabled/targetRole/targetScore 是用户当前设置），云端仅合并历史
  return { ...local, histories };
}

export interface SyncResult {
  ok: boolean;
  /** 合并后的完整数据（写回本地用） */
  merged: SyncBundle | null;
  error?: string;
}

/** 同步：拉取云端 → 与本地合并 → upsert 回云端 → 返回合并结果（调用方写回本地 store） */
export async function syncNow(local: SyncBundle): Promise<SyncResult> {
  const app = await getApp();
  if (!app) {
    return { ok: false, merged: null, error: "未配置云端同步（缺少 NEXT_PUBLIC_CLOUDBASE_ENV_ID）" };
  }
  const user = await ensureUser(app);
  if (!user) return { ok: false, merged: null, error: "匿名登录失败" };

  const db = app.rdb();
  let remote: SyncBundle | null = null;
  try {
    const { data } = await db
      .from(TABLE)
      .select("*")
      .eq("owner_id", user.uid);
    const row = (Array.isArray(data) ? data[0] : undefined) as Partial<SyncBundle> | undefined;
    if (row && typeof row === "object") {
      remote = {
        tracker: Array.isArray(row.tracker) ? (row.tracker as ApplicationItem[]) : [],
        history: Array.isArray(row.history) ? (row.history as DiagnosisHistoryItem[]) : [],
        profile: row.profile && typeof row.profile === "object" ? (row.profile as PrivateProfile) : null,
        updatedAt: Number(row.updatedAt) || 0,
      };
    }
  } catch {
    /* 无行 / 首次同步 */
  }

  const merged: SyncBundle = {
    tracker: mergeById(local.tracker, remote?.tracker ?? [], (it) => it.updatedAt ?? 0),
    history: mergeById(local.history, remote?.history ?? [], (it) => it.ts ?? 0).sort(
      (a, b) => b.ts - a.ts
    ),
    profile: mergeProfile(local.profile, remote?.profile ?? null),
    updatedAt: Date.now(),
  };

  try {
    const { error } = await db.from(TABLE).upsert({
      owner_id: user.uid,
      tracker: merged.tracker,
      history: merged.history,
      profile: merged.profile,
      updated_at: merged.updatedAt,
    });
    if (error) return { ok: false, merged: null, error: String(error) };
    return { ok: true, merged };
  } catch (e) {
    return { ok: false, merged: null, error: (e as Error)?.message ?? "写入云端失败" };
  }
}

/** 清除云端数据（保留本地） */
export async function clearRemote(): Promise<{ ok: boolean; error?: string }> {
  const app = await getApp();
  if (!app) return { ok: false, error: "未配置云端同步" };
  const user = await ensureUser(app);
  if (!user) return { ok: false, error: "匿名登录失败" };
  try {
    const { error } = await app.rdb().from(TABLE).delete().eq("owner_id", user.uid);
    if (error) return { ok: false, error: String(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message ?? "清除失败" };
  }
}
