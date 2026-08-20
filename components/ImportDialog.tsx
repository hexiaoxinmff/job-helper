"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseResumeByRules, type ParsedResumeInput } from "@/lib/resume-import";
import { parseResumeByAi } from "@/lib/ai-client";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";

/**
 * 简历导入弹窗：上传 PDF / 粘贴文字 → 规则解析（本地，无 AI）→ 填入；
 * 可选「AI 智能补全」增强解析（文本会发送至 AI 服务，有隐私提示）。
 * 双轨降级：AI 失败时保留规则结果。
 */
export default function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedResumeInput) => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false); // 文件读取/PDF 提取中
  const [parsing, setParsing] = useState(false); // 规则解析中
  const [aiLoading, setAiLoading] = useState(false); // AI 补全中
  const [error, setError] = useState("");
  const [ruleResult, setRuleResult] = useState<ParsedResumeInput | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setText("");
    setFileName("");
    setReading(false);
    setParsing(false);
    setAiLoading(false);
    setError("");
    setRuleResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  // ESC 关闭 + body 滚动锁定
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    setRuleResult(null);
    setFileName(f.name);
    setReading(true);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      let txt: string;
      if (looksLikePdf(buf)) {
        txt = await extractTextFromPdf(buf);
      } else {
        txt = new TextDecoder("utf-8").decode(buf);
      }
      if (!txt.trim()) {
        setError("未能从文件中提取到文字（可能是图片型 PDF/扫描件），请粘贴文字版内容。");
        setText("");
      } else {
        setText(txt);
      }
    } catch (e) {
      setError(`读取文件失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setReading(false);
    }
  };

  const runRules = () => {
    if (!text.trim()) {
      setError("请先上传文件或粘贴简历文字。");
      return;
    }
    setError("");
    setParsing(true);
    // 规则解析是同步的，setTimeout 仅为让 loading 态可感知
    setTimeout(() => {
      try {
        const r = parseResumeByRules(text);
        setRuleResult(r);
        if (!r.basics?.name && !r.education?.length && !r.work?.length && !r.skills?.length) {
          setError("规则解析没识别到有效内容，可尝试「AI 智能补全」，或检查文字是否完整。");
        }
      } catch (e) {
        setError(`解析失败：${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setParsing(false);
      }
    }, 60);
  };

  const applyRule = () => {
    if (!ruleResult) return;
    onImport(ruleResult);
    reset();
    onClose();
  };

  const runAi = async () => {
    if (!text.trim()) {
      setError("请先上传文件或粘贴简历文字。");
      return;
    }
    setError("");
    setAiLoading(true);
    try {
      const ai = await parseResumeByAi(text);
      if (!ai) {
        setError("AI 解析失败（可能超时或服务不可用），已保留规则解析结果。");
        return;
      }
      onImport(ai);
      reset();
      onClose();
    } catch (e) {
      setError(`AI 解析出错：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const parsedCount =
    ruleResult
      ? [
          ruleResult.basics?.name && "姓名",
          ruleResult.basics?.title && "求职意向",
          ruleResult.basics?.phone && "电话",
          ruleResult.basics?.email && "邮箱",
          ruleResult.education?.length && `教育×${ruleResult.education.length}`,
          ruleResult.work?.length && `工作×${ruleResult.work.length}`,
          ruleResult.internships?.length && `实习×${ruleResult.internships.length}`,
          ruleResult.projects?.length && `项目×${ruleResult.projects.length}`,
          ruleResult.skills?.length && `技能×${ruleResult.skills.length}`,
        ].filter(Boolean).join("、")
      : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-privacy-fade"
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-neutral-200 animate-privacy-pop dark:bg-neutral-900 dark:ring-neutral-700">
        <h2 id="import-dialog-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          导入简历
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          上传 PDF / 文本文件，或直接粘贴文字简历；会自动识别并填入下方对应板块（电话 / 邮箱 / 教育 /
          经历 / 技能等），填完可再人工修改。
        </p>

        <div className="mt-4 space-y-3">
          {/* 文件上传 */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
              id="resume-import-file"
            />
            <label
              htmlFor="resume-import-file"
              className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 px-4 py-4 text-sm text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-400"
            >
              {reading ? "正在读取文件…" : fileName ? `已选择：${fileName}（可重新选择）` : "📄 点击选择 PDF / txt 文件"}
            </label>
          </div>

          {/* 文本粘贴 */}
          <div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setRuleResult(null);
              }}
              placeholder={"或直接粘贴简历文字…（支持从网页/Word 复制的内容）"}
              rows={6}
              className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-danger-600 dark:text-danger-400">
              {error}
            </p>
          )}

          {parsedCount && (
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
              规则解析到：{parsedCount}。可直接填入，或用 AI 补全更完整的板块。
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runRules}
              disabled={reading || parsing || !text.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {parsing ? "解析中…" : "规则解析并预览"}
            </button>
            {ruleResult && (
              <button
                type="button"
                onClick={applyRule}
                className="inline-flex items-center justify-center rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300"
              >
                填入编辑器（保留已有内容）
              </button>
            )}
            <button
              type="button"
              onClick={runAi}
              disabled={reading || aiLoading || !text.trim()}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {aiLoading ? "AI 解析中…" : "✨ AI 智能补全（完整识别）"}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            隐私说明：规则解析在本地浏览器完成，不上传任何内容；「AI 智能补全」会将简历文本发送至
            AI 服务做结构化识别（不留存，复用「AI 增强诊断」隐私约定）。图片型 PDF / 扫描件无法提取文字，请粘贴文字版。
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
