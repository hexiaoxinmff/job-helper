"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResultView from "@/components/ResultView";
import PrivacyNote from "@/components/PrivacyNote";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";
import { diagnoseResume } from "@/lib/diagnose";
import { track } from "@/lib/track";
import { JD_LIBRARY, JD_LOCALES, getJdById, type JdLocale } from "@/lib/jd-library";
import { SAMPLE_RESUME_TEXT } from "@/lib/sample-resume";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const AI_ENABLED_KEY = "job-helper:ai-enabled"; // 默认开启 AI 增强；关闭后仅规则评分，不发外部请求
// 示例体验默认载入的 JD：与 JD 库 fe（前端开发工程师）一致，让示例诊断跑出有区分度的结果
const SAMPLE_JD = getJdById("fe")?.jd["zh-CN"] ?? "";

// AI 增强开关：外部 store（localStorage 记忆），用 useSyncExternalStore 订阅
type Listener = () => void;
const aiEnabledListeners = new Set<Listener>();

function subscribeAiEnabled(listener: Listener) {
  aiEnabledListeners.add(listener);
  return () => aiEnabledListeners.delete(listener);
}

function getAiEnabledSnapshot(): boolean {
  try {
    return window.localStorage.getItem(AI_ENABLED_KEY) !== "off";
  } catch {
    return true;
  }
}

function setAiEnabledStore(v: boolean) {
  try {
    window.localStorage.setItem(AI_ENABLED_KEY, v ? "on" : "off");
  } catch {
    /* 忽略写入失败 */
  }
  aiEnabledListeners.forEach((l) => l());
}

const PROGRESS_STEPS = [
  "正在解析简历…",
  "正在比对 JD 关键词…",
  "AI 正在生成诊断建议…",
  "即将完成…",
];

// 首页流程引导步骤（体验优化：步骤条 + 每步校验提示）
const FLOW_STEPS = ["上传简历", "粘贴目标 JD", "查看诊断报告"];

export default function UploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [usingSample, setUsingSample] = useState(false);
  const [jdText, setJdText] = useState("");
  const [jdLocale, setJdLocale] = useState<JdLocale>("zh-CN");
  const [selectedJdId, setSelectedJdId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(-1);
  // AI 增强开关：外部 store 订阅（localStorage 记忆，默认开）
  const aiEnabled = useSyncExternalStore(
    subscribeAiEnabled,
    getAiEnabledSnapshot,
    () => true
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 并发锁：防止重复点击「开始诊断」发起多次诊断
  const submittingRef = useRef(false);

  useEffect(() => {
    track("page_view");
  }, []);

  // 卸载时清理进度定时器，避免组件卸载后仍更新状态
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, []);

  const handleFile = useCallback((file: File | undefined | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("只支持 PDF 格式的简历文件");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("文件过大，请上传 10MB 以内的 PDF");
      return;
    }
    setError("");
    setResumeFile(file);
    setUsingSample(false);
    track("file_uploaded", { sizeMB: +(file.size / 1024 / 1024).toFixed(2) });
  }, []);

  // 核心诊断执行：resumeText 已就绪（来自 PDF 解析或示例）时直接诊断
  const runDiagnose = useCallback(
    async (text: string, jd: string) => {
      if (submittingRef.current) return; // 并发锁：诊断进行中忽略重复点击
      setError("");
      if (!jd.trim()) {
        setError("请粘贴目标岗位的 JD");
        return;
      }
      if (jd.trim().length < 20) {
        setError("JD 内容过短，请粘贴完整的职位描述");
        return;
      }

      submittingRef.current = true;
      setLoading(true);
      setProgress(0);
      track("diagnose_start", { ai: aiEnabled });
      stepTimerRef.current = setInterval(() => {
        setProgress((p) => (p < PROGRESS_STEPS.length - 1 ? p + 1 : p));
      }, 1400);

      try {
        const analysis = await diagnoseResume(text, jd, { aiEnabled });
        setResumeText(text);
        setResult(analysis);
        track("diagnose_success", { score: analysis.overallScore, ai: !!analysis.aiEnhanced });
      } catch {
        setError("诊断失败，请稍后重试");
        track("diagnose_error", { reason: "unknown" });
      } finally {
        if (stepTimerRef.current) {
          clearInterval(stepTimerRef.current);
          stepTimerRef.current = null;
        }
        submittingRef.current = false;
        setLoading(false);
        setProgress(-1);
      }
    },
    [aiEnabled]
  );

  const handleSubmit = async () => {
    setError("");
    if (!resumeFile) {
      setError("请先上传简历 PDF");
      return;
    }
    if (!jdText.trim()) {
      setError("请粘贴目标岗位的 JD");
      return;
    }

    try {
      // 1) 浏览器端读取并校验 PDF
      const buf = new Uint8Array(await resumeFile.arrayBuffer());
      if (!looksLikePdf(buf)) {
        setError("文件格式不正确，请上传 PDF 格式的简历");
        track("diagnose_error", { reason: "not_pdf" });
        return;
      }

      // 2) 浏览器端解析 PDF 文本
      let parsed = "";
      try {
        parsed = (await extractTextFromPdf(buf)).trim();
      } catch {
        setError("PDF 解析失败：可能是扫描件（图片型 PDF），请先转为文字版 PDF 再上传");
        track("diagnose_error", { reason: "parse_fail" });
        return;
      }
      if (parsed.replace(/\s/g, "").length < 30) {
        setError("未能从 PDF 中提取到有效文字，请确认是文字版 PDF（而非扫描图片）");
        track("diagnose_error", { reason: "empty_text" });
        return;
      }

      // 3) 规则评分 + AI 增强
      await runDiagnose(parsed, jdText);
    } catch {
      setError("读取文件失败，请重试");
    }
  };

  // 样例简历一键体验：无需 PDF，30 秒跑通全流程
  const loadSample = () => {
    setError("");
    setResumeFile(null);
    setUsingSample(true);
    setJdText(SAMPLE_JD);
    setSelectedJdId("fe");
    if (fileInputRef.current) fileInputRef.current.value = "";
    void runDiagnose(SAMPLE_RESUME_TEXT, SAMPLE_JD);
    track("sample_experience_click");
  };

  // 反向岗位推荐回调：点击推荐方向后，换 JD 自动重新诊断
  const handleReDiagnose = async (jd: string, jdId?: string) => {
    setJdText(jd);
    setSelectedJdId(jdId ?? "");
    setError("");
    const text = resumeText || (usingSample ? SAMPLE_RESUME_TEXT : "");
    if (!text) return;
    setResult(null); // 回到诊断状态，展示加载反馈
    await runDiagnose(text, jd);
  };

  const handleReset = () => {
    setResult(null);
    setResumeText("");
    setResumeFile(null);
    setUsingSample(false);
    setJdText("");
    setSelectedJdId("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 步骤条状态：已完成 / 当前 / 待做
  const flowDone = [!!(resumeFile || usingSample), jdText.trim().length >= 20, !!result];
  const currentStep = flowDone.findIndex((d) => !d);

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">简历诊断</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          上传简历 PDF + 粘贴目标岗位 JD，AI 帮你诊断匹配度，给出可执行的改进建议
        </p>
      </header>

      {/* 顶部步骤条：流程引导 */}
      <div className="mb-8" aria-label="诊断流程步骤">
        <ol className="flex items-center">
          {FLOW_STEPS.map((label, i) => {
            const done = flowDone[i];
            const active = currentStep === i && !done;
            return (
              <li key={label} className={`flex items-center ${i < FLOW_STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      done
                        ? "bg-success-500 text-white"
                        : active
                          ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950"
                          : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      done || active
                        ? "font-medium text-neutral-700 dark:text-neutral-200"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors ${
                      flowDone[i] ? "bg-success-400" : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {!result ? (
        <section className="space-y-6">
          {/* 上传区 */}
          <div
            role="button"
            tabIndex={0}
            aria-label="选择或拖拽上传简历 PDF"
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              isDragging
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/40"
                : resumeFile || usingSample
                  ? "border-success-400 bg-success-50 dark:bg-success-950/40"
                  : "border-neutral-300 bg-white hover:border-primary-400 dark:border-neutral-700 dark:bg-neutral-900"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="text-4xl mb-3">
              {resumeFile ? "✅" : usingSample ? "🧪" : "📄"}
            </div>
            {resumeFile ? (
              <div>
                <p className="font-medium text-success-700 dark:text-success-300">{resumeFile.name}</p>
                <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择
                </p>
              </div>
            ) : usingSample ? (
              <div>
                <p className="font-medium text-primary-700 dark:text-primary-300">
                  正在使用示例简历体验（前端开发工程师）
                </p>
                <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                  上传你自己的 PDF 即可切换到真实简历
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-neutral-700 dark:text-neutral-200">
                  点击选择或拖拽简历 PDF 到此处
                </p>
                <p className="text-sm text-neutral-400 mt-1 dark:text-neutral-500">
                  仅支持文字版 PDF（扫描件无法解析）· 10MB 以内
                </p>
              </div>
            )}
          </div>

          {/* 冷启动引导：没有简历也能体验完整流程 */}
          {!usingSample && !resumeFile && (
            <div className="-mt-3 text-center">
              <button
                type="button"
                onClick={loadSample}
                disabled={loading}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50 dark:text-primary-400 dark:hover:text-primary-300"
              >
                没有简历？用示例体验 →
              </button>
            </div>
          )}

          {/* JD 输入区 */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-2 gap-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                目标岗位 JD（职位描述）
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={jdLocale}
                  onChange={(e) => {
                    const loc = e.target.value as JdLocale;
                    setJdLocale(loc);
                    if (selectedJdId) {
                      const tpl = getJdById(selectedJdId);
                      if (tpl) setJdText(tpl.jd[loc]);
                    }
                  }}
                  aria-label="JD 语言"
                  className="text-sm rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-600 outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  {JD_LOCALES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedJdId}
                  onChange={(e) => {
                    const tpl = JD_LIBRARY.find((x) => x.id === e.target.value);
                    if (tpl) {
                      setSelectedJdId(tpl.id);
                      setJdText(tpl.jd[jdLocale]);
                    }
                  }}
                  className="text-sm rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-600 outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <option value="">加载示例 JD…</option>
                  {JD_LIBRARY.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.industry[jdLocale]} · {x.role[jdLocale]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder={
                jdLocale === "zh-CN"
                  ? "粘贴招聘 JD，例如：\n岗位职责：负责数据分析和报表开发…\n任职要求：熟练使用 Python、SQL，有机器学习经验者优先…"
                  : "Paste a job description, e.g.:\nResponsibilities: data analysis and reporting…\nRequirements: proficient in Python, SQL, machine learning preferred…"
              }
              className="w-full h-40 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          {/* AI 增强开关：关闭后仅规则评分，不发任何外部请求（隐私红线） */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">AI 增强诊断</p>
              <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">
                开启后简历文本将经云函数代理发送给 AI 服务商用于生成建议，不留存；关闭后仅本地规则评分
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aiEnabled}
              aria-label="AI 增强诊断开关"
              onClick={() => setAiEnabledStore(!aiEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                aiEnabled ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  aiEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "诊断中…" : "开始诊断"}
          </Button>

          {loading && progress >= 0 && (
            <div className="space-y-4" aria-live="polite">
              {/* 诊断加载反馈：雷达骨架预览（替代纯文字进度，等待体验更直观） */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <div className="relative h-36 w-36 shrink-0 animate-pulse">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-950" />
                    <div className="absolute inset-3 rounded-full border-4 border-primary-100 dark:border-primary-950" />
                    <div className="absolute inset-6 rounded-full border-4 border-primary-100 dark:border-primary-950" />
                    <div className="absolute inset-[27px] rounded-full bg-primary-500/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">📡</span>
                    </div>
                  </div>
                  <div className="w-full flex-1 space-y-3">
                    <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="space-y-2">
                      {["技能匹配", "关键词覆盖", "经历与成果", "教育背景", "表达规范"].map((d) => (
                        <div key={d} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-xs text-neutral-400 dark:text-neutral-500">{d}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary-400/60" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* 进度条 */}
              <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-700"
                  style={{
                    width: `${((progress + 1) / PROGRESS_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{PROGRESS_STEPS[progress]}</p>
              </div>
            </div>
          )}

          <PrivacyNote>
            隐私承诺：简历默认仅在你的浏览器内解析、不落库不上传；仅在主动开启「私人档案-云端同步-同步简历」后以加密形式（AES-256，密钥仅存本地）上云。开启 AI 增强时，文本经云函数代理转发给 AI 服务商用于生成建议，不留存、不记录
          </PrivacyNote>
        </section>
      ) : (
        <ResultView
          result={result}
          resumeText={resumeText}
          jdText={jdText}
          onReset={handleReset}
          onReDiagnose={handleReDiagnose}
        />
      )}
    </main>
  );
}
