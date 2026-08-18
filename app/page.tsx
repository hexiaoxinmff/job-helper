"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResultView from "@/components/ResultView";
import { track } from "@/lib/track";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const PROGRESS_STEPS = [
  "正在上传简历…",
  "正在解析 PDF…",
  "正在比对 JD 关键词…",
  "AI 正在生成诊断建议…",
];

export default function UploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
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
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd", jdText);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "分析失败，请稍后重试");
        track("diagnose_error", { reason: data.error?.slice(0, 40) });
        return;
      }
      setResult(data as AnalysisResult);
      track("diagnose_success", {
        score: data.overallScore,
        ai: !!data.aiEnhanced,
      });
    } catch {
      setError("网络错误，请稍后重试");
      track("diagnose_error", { reason: "network" });
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
    setResumeFile(null);
    setJdText("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">简历诊断</h1>
        <p className="mt-3 text-slate-600">
          上传简历 PDF + 粘贴目标岗位 JD，AI 帮你诊断匹配度，给出可执行的改进建议
        </p>
      </header>

      {!result ? (
        <section className="space-y-6">
          {/* 上传区 */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : resumeFile
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-300 bg-white hover:border-blue-400"
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
                <p className="font-medium text-emerald-700">{resumeFile.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-slate-700">
                  点击选择或拖拽简历 PDF 到此处
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  仅支持文字版 PDF（扫描件无法解析）· 10MB 以内
                </p>
              </div>
            )}
          </div>

          {/* JD 输入区 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              目标岗位 JD（职位描述）
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder={"粘贴招聘 JD，例如：\n岗位职责：负责数据分析和报表开发…\n任职要求：熟练使用 Python、SQL，有机器学习经验者优先…"}
              className="w-full h-40 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
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
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-700"
                  style={{
                    width: `${((progress + 1) / PROGRESS_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-600">{PROGRESS_STEPS[progress]}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            🔒 隐私承诺：简历仅在内存中处理，分析完成后立即丢弃，不存储、不保留
          </p>
        </section>
      ) : (
        <ResultView
          result={result}
          resumeFile={resumeFile!}
          jdText={jdText}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
