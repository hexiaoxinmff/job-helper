"use client";

import { useMemo, useState } from "react";
import type { ProfileSnapshot } from "@/lib/profile";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { ErrorBoundary } from "./ErrorBoundary";

// 维度顺序与 lib/scoring.ts 保持一致：技能匹配 / 关键词覆盖 / 经历与成果 / 教育背景 / 表达规范
const DIM_NAMES = ["技能匹配", "关键词覆盖", "经历与成果", "教育背景", "表达规范"];
// 折线图系列：总分 + 五维，对应 globals.css 的 --chart-series-1..6
const SERIES = [
  { key: "overall", label: "总分", color: "var(--chart-series-1)" },
  { key: "技能匹配", label: "技能匹配", color: "var(--chart-series-2)" },
  { key: "关键词覆盖", label: "关键词覆盖", color: "var(--chart-series-3)" },
  { key: "经历与成果", label: "经历与成果", color: "var(--chart-series-4)" },
  { key: "教育背景", label: "教育背景", color: "var(--chart-series-5)" },
  { key: "表达规范", label: "表达规范", color: "var(--chart-series-6)" },
];

function dimScoreOf(snap: ProfileSnapshot | undefined, name: string): number {
  return snap?.dimensions.find((d) => d.name === name)?.score ?? 0;
}

/** 长期职业建模对比图：成长趋势 + 任选两次快照雷达对比 + 目标线 + 摘要 */
export default function CareerModelChart({
  histories,
  targetScore,
  onTargetScoreChange,
}: {
  histories: ProfileSnapshot[];
  /** 理想岗位目标总分（0-100）；undefined 表示未设定目标线 */
  targetScore?: number;
  onTargetScoreChange?: (v: number | undefined) => void;
}) {
  // histories 默认最新在前，这里转成时间正序用于趋势展示
  const chrono = useMemo(() => [...histories].reverse(), [histories]);

  // 任选两次快照对比：A = 基准前（默认最早），B = 基准后（默认最新）
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(() => Math.max(0, chrono.length - 1));
  // 快照数量变化时在渲染期夹紧索引（避免越界），无需 effect 副作用
  const last = Math.max(0, chrono.length - 1);
  const effA = Math.min(aIdx, last);
  const effB = Math.min(Math.max(bIdx, 0), last);

  const aSnap = chrono[effA];
  const bSnap = chrono[effB];

  const trendData = useMemo(
    () =>
      chrono.map((h, i) => ({
        label: `#${i + 1}`,
        date: new Date(h.ts).toLocaleDateString(),
        overall: h.overallScore,
        技能匹配: dimScoreOf(h, "技能匹配"),
        关键词覆盖: dimScoreOf(h, "关键词覆盖"),
        经历与成果: dimScoreOf(h, "经历与成果"),
        教育背景: dimScoreOf(h, "教育背景"),
        表达规范: dimScoreOf(h, "表达规范"),
      })),
    [chrono]
  );

  const radarData = useMemo(() => {
    const base = DIM_NAMES.map((name) => ({
      dimension: name,
      对比A: dimScoreOf(aSnap, name),
      对比B: dimScoreOf(bSnap, name),
    }));
    if (targetScore != null) {
      return base.map((d) => ({ ...d, 目标: targetScore }));
    }
    return base;
  }, [aSnap, bSnap, targetScore]);

  const summary = useMemo(() => {
    // 索引越界防御：aSnap/bSnap 理论上非空（父组件保证 ≥2 条且索引已夹紧），此处兜底
    const a = aSnap ?? chrono[0];
    const b = bSnap ?? chrono[chrono.length - 1];
    if (!a || !b) return null;
    const delta = b.overallScore - a.overallScore;
    const dimDeltas = DIM_NAMES.map((name) => ({
      name,
      delta: dimScoreOf(b, name) - dimScoreOf(a, name),
    }));
    const best = dimDeltas.reduce((p, c) => (c.delta > p.delta ? c : p));
    const worst = dimDeltas.reduce((p, c) => (c.delta < p.delta ? c : p));
    const toTarget = targetScore != null ? targetScore - b.overallScore : null;
    return { delta, best, worst, toTarget };
  }, [aSnap, bSnap, targetScore, chrono]);

  // 数据不足（<2 条）时兜底不渲染；父组件已条件渲染，此处防索引越界
  if (!aSnap || !bSnap) return null;
  // 上面的兜底保证 summary 非空（其 null 条件与 aSnap/bSnap 相同）
  const s = summary!;

  const tooltipStyle = {
    contentStyle: {
      background: "var(--background)",
      border: "1px solid var(--chart-grid)",
      borderRadius: 12,
      color: "var(--foreground)",
      fontSize: 12,
    },
    labelStyle: { color: "var(--foreground)" },
  } as const;

  const selectCls =
    "mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

  return (
    <div className="space-y-6">
      {/* 对比设置：任选两次快照 + 目标线 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">对比设置</h3>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          选择任意两次诊断快照对比前后变化，并可选填「理想岗位目标总分」作为对照基准线。
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              对比 A（基准前）
            </label>
            <select value={effA} onChange={(e) => setAIdx(Number(e.target.value))} className={selectCls}>
              {chrono.map((h, i) => (
                <option key={h.id} value={i}>
                  #{i + 1} · {new Date(h.ts).toLocaleDateString()} · {h.targetRole || "--"} · {h.overallScore}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              对比 B（基准后）
            </label>
            <select value={effB} onChange={(e) => setBIdx(Number(e.target.value))} className={selectCls}>
              {chrono.map((h, i) => (
                <option key={h.id} value={i}>
                  #{i + 1} · {new Date(h.ts).toLocaleDateString()} · {h.targetRole || "--"} · {h.overallScore}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              理想岗位目标总分
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={targetScore ?? ""}
              placeholder="可选（0-100）"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onTargetScoreChange?.(undefined);
                  return;
                }
                const n = Number(raw);
                if (!Number.isNaN(n)) {
                  onTargetScoreChange?.(Math.max(0, Math.min(100, Math.round(n))));
                }
              }}
              className={selectCls}
            />
          </div>
        </div>
      </div>

      {/* 摘要 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryTile
          label="A 总分"
          value={aSnap.overallScore}
          sub={`#${effA + 1} · ${new Date(aSnap.ts).toLocaleDateString()}`}
        />
        <SummaryTile
          label="B 总分"
          value={bSnap.overallScore}
          sub={`#${effB + 1} · ${new Date(bSnap.ts).toLocaleDateString()}`}
        />
        <SummaryTile
          label="A → B 变化"
          value={`${s.delta >= 0 ? "+" : ""}${s.delta}`}
          sub={s.delta >= 0 ? "↑ 进步" : "↓ 退步"}
          accent={s.delta >= 0 ? "emerald" : "red"}
        />
        <SummaryTile
          label="最大进步维"
          value={s.best.name}
          sub={`+${s.best.delta}`}
          accent="blue"
        />
        {s.toTarget != null && (
          <SummaryTile
            label="距目标"
            value={s.toTarget > 0 ? `还差 ${s.toTarget}` : `已超 ${-s.toTarget}`}
            sub={`目标 ${targetScore}`}
            accent={s.toTarget > 0 ? "red" : "emerald"}
          />
        )}
      </div>

      {/* 成长趋势折线图 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">能力成长趋势</h3>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          每次诊断沉淀的能力画像，构成你的长期职业建模轨迹。虚线标记所选对比点（A/B）与目标线。
        </p>
        <div className="h-72 w-full">
          <ErrorBoundary
            fallback={(error, reset) => (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">趋势图加载失败</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{error.message}</p>
                <button
                  onClick={reset}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  重试
                </button>
              </div>
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
                  tickFormatter={(_, i) => `#${i + 1}`}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
                  width={40}
                />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--chart-axis)" }} />
                {SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={s.key === "overall" ? 3 : 1.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
                <ReferenceLine
                  x={`#${effA + 1}`}
                  stroke="var(--chart-series-1)"
                  strokeDasharray="4 4"
                  label={{ value: "A", position: "top", fontSize: 11, fill: "var(--chart-series-1)" }}
                />
                <ReferenceLine
                  x={`#${effB + 1}`}
                  stroke="var(--chart-series-4)"
                  strokeDasharray="4 4"
                  label={{ value: "B", position: "top", fontSize: 11, fill: "var(--chart-series-4)" }}
                />
                {targetScore != null && (
                  <ReferenceLine
                    y={targetScore}
                    stroke="var(--chart-series-3)"
                    strokeDasharray="6 4"
                    label={{
                      value: "目标线",
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "var(--chart-series-3)",
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        </div>
      </div>

      {/* 任选快照雷达对比 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">
          对比 A vs B · 维度雷达
        </h3>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          五维能力的所选两次快照前后变化；虚线为理想岗位目标基准（若已设定）。
        </p>
        <div className="h-72 w-full">
          <ErrorBoundary
            fallback={(error, reset) => (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">对比图加载失败</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{error.message}</p>
                <button
                  onClick={reset}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  重试
                </button>
              </div>
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="var(--chart-grid)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: "var(--chart-axis)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--chart-axis)" }} />
                <Radar
                  name="对比A"
                  dataKey="对比A"
                  stroke="var(--chart-series-1)"
                  fill="var(--chart-series-1)"
                  fillOpacity={0.2}
                />
                <Radar
                  name="对比B"
                  dataKey="对比B"
                  stroke="var(--chart-series-4)"
                  fill="var(--chart-series-4)"
                  fillOpacity={0.35}
                />
                {targetScore != null && (
                  <Radar
                    name="目标"
                    dataKey="目标"
                    stroke="var(--chart-series-3)"
                    strokeDasharray="6 4"
                    fill="none"
                  />
                )}
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--chart-axis)" }} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "slate" | "emerald" | "red" | "blue";
}) {
  const accentCls: Record<string, string> = {
    slate: "text-neutral-800 dark:text-neutral-100",
    emerald: "text-success-600 dark:text-success-400",
    red: "text-danger-600 dark:text-danger-400",
    blue: "text-primary-600 dark:text-primary-400",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentCls[accent]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{sub}</p>}
    </div>
  );
}
