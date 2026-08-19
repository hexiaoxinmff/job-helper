"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResultView from "@/components/ResultView";
import PrivacyNote from "@/components/PrivacyNote";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";
import { diagnoseResume } from "@/lib/diagnose";
import { track } from "@/lib/track";
import { JD_LIBRARY, JD_LOCALES, getJdById, type JdLocale } from "@/lib/jd-library";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const AI_ENABLED_KEY = "job-helper:ai-enabled"; // 默认开启 AI 增强；关闭后仅规则评分，不发外部请求

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
  "正在解析 PDF…",
  "正在比对 JD 关键词…",
  "AI 正在生成诊断建议…",
  "即将完成…",
];

export default function UploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
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
    track("file_uploaded", { sizeMB: +(file.size / 1024 / 1024).toFixed(2) });
  }, []);

  const handleSubmit = async () => {
    if (submittingRef.current) return; // 并发锁：诊断进行中忽略重复点击
    setError("");
    if (!resumeFile) {
      setError("请先上传简历 PDF");
      return;
    }
    if (!jdText.trim()) {
      setError("请粘贴目标岗位的 JD");
      return;
    }
    if (jdText.trim().length < 20) {
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

      // 3) 规则评分 + AI 增强（浏览器端评分 + ai-proxy 云函数；aiEnabled=false 时仅规则评分）
      const analysis = await diagnoseResume(parsed, jdText, { aiEnabled });
      setResumeText(parsed);
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
  };

  const handleReset = () => {
    setResult(null);
    setResumeText("");
    setResumeFile(null);
    setJdText("");
    setSelectedJdId("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">简历诊断</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          上传简历 PDF + 粘贴目标岗位 JD，AI 帮你诊断匹配度，给出可执行的改进建议
        </p>
      </header>

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
                : resumeFile
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
              {resumeFile ? "✅" : "📄"}
            </div>
            {resumeFile ? (
              <div>
                <p className="font-medium text-success-700 dark:text-success-300">{resumeFile.name}</p>
                <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择
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
            <p
              role="alert"
              className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-4 py-3 dark:bg-danger-950/40 dark:border-danger-900 dark:text-danger-400"
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-medium text-base hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "诊断中…" : "开始诊断"}
          </button>

          {loading && progress >= 0 && (
            <div className="space-y-2" aria-live="polite">
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
            隐私承诺：简历仅在你的浏览器内解析、不落库；开启 AI 增强时，文本经云函数代理转发给 AI 服务商用于生成建议，不留存、不记录
          </PrivacyNote>
        </section>
      ) : (
        <ResultView
          result={result}
          resumeText={resumeText}
          jdText={jdText}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
