"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResultView from "@/components/ResultView";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";
import { diagnoseResume } from "@/lib/diagnose";
import { track } from "@/lib/track";
import { JD_LIBRARY, JD_LOCALES, getJdById, type JdLocale } from "@/lib/jd-library";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    track("page_view");
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

    setLoading(true);
    setProgress(0);
    track("diagnose_start");
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

      // 3) 规则评分 + AI 增强（浏览器端评分 + ai-proxy 云函数）
      const analysis = await diagnoseResume(parsed, jdText);
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">简历诊断</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          上传简历 PDF + 粘贴目标岗位 JD，AI 帮你诊断匹配度，给出可执行的改进建议
        </p>
      </header>

      {!result ? (
        <section className="space-y-6">
          {/* 上传区 */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : resumeFile
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : "border-slate-300 bg-white hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
            }`}
            onClick={() => fileInputRef.current?.click()}
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
                <p className="font-medium text-emerald-700 dark:text-emerald-300">{resumeFile.name}</p>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  点击选择或拖拽简历 PDF 到此处
                </p>
                <p className="text-sm text-slate-400 mt-1 dark:text-slate-500">
                  仅支持文字版 PDF（扫描件无法解析）· 10MB 以内
                </p>
              </div>
            )}
          </div>

          {/* JD 输入区 */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-2 gap-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
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
                  className="text-sm rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
                  className="text-sm rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
              className="w-full h-40 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-medium text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "诊断中…" : "开始诊断"}
          </button>

          {loading && progress >= 0 && (
            <div className="space-y-2" aria-live="polite">
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-700"
                  style={{
                    width: `${((progress + 1) / PROGRESS_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-600 dark:text-slate-300">{PROGRESS_STEPS[progress]}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center dark:text-slate-500">
            🔒 隐私承诺：简历仅在你的浏览器内解析，分析完成后立即丢弃，不存储、不上传原文
          </p>
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
