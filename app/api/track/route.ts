import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * 轻量匿名埋点：只记录事件名与计数，不记录简历/JD 内容。
 * - POST /api/track  { event, meta? }  上报事件
 * - GET  /api/track                     查看当前实例统计（开发调试用）
 *
 * 存储说明：事件计数保存在进程内存（globalThis），Vercel serverless
 * 实例冷启动会清零，因此同时输出 console.log（Vercel 日志可查）。
 * 隐私：不落盘、不含任何用户简历/JD 数据。
 */

type TrackStore = {
  counts: Record<string, number>;
  recent: { event: string; t: string }[];
};

const globalStore = globalThis as unknown as { __trackStore?: TrackStore };

function getStore(): TrackStore {
  if (!globalStore.__trackStore) {
    globalStore.__trackStore = { counts: {}, recent: [] };
  }
  return globalStore.__trackStore;
}

const MAX_RECENT = 200;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { event?: string; meta?: Record<string, unknown> }
      | null;
    const event =
      typeof body?.event === "string" && body.event.trim()
        ? body.event.trim().slice(0, 64)
        : "unknown";

    const store = getStore();
    store.counts[event] = (store.counts[event] ?? 0) + 1;
    store.recent.push({ event, t: new Date().toISOString() });
    if (store.recent.length > MAX_RECENT) store.recent.shift();

    console.log(
      `[track] ${event}${body?.meta ? " " + JSON.stringify(body.meta) : ""}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  const store = getStore();
  const total = Object.values(store.counts).reduce((a, b) => a + b, 0);
  return NextResponse.json({
    total,
    counts: store.counts,
    recent: store.recent.slice(-20),
  });
}
