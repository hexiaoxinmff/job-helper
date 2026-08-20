"use client";

import { useEffect, useState } from "react";
import {
  generateInterviewQuestions,
  reviewInterviewAnswer,
  type InterviewQuestion,
  type InterviewReview,
} from "@/lib/ai-client";
import { track } from "@/lib/track";
import PrivacyNote from "@/components/PrivacyNote";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const CTX_KEY = "job-helper:interview-ctx";

interface InterviewCtx {
  resumeText: string;
  jdText: string;
  missingKeywords: string[];
}

function readCtx(): InterviewCtx | null {
  try {
    const raw = sessionStorage.getItem(CTX_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<InterviewCtx>;
    if (!c || typeof c !== "object") return null;
    return {
      resumeText: String(c.resumeText ?? ""),
      jdText: String(c.jdText ?? ""),
      missingKeywords: Array.isArray(c.missingKeywords)
        ? c.missingKeywords.filter((k) => typeof k === "string")
        : [],
    };
  } catch {
    return null;
  }
}

export default function InterviewClient() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [missingInput, setMissingInput] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reviews, setReviews] = useState<Record<number, InterviewReview>>({});
  const [reviewLoading, setReviewLoading] = useState<number | null>(null);
  const [reviewMsg, setReviewMsg] = useState("");

  // 从诊断结果页带入上下文（resumeText + jdText + 缺失关键词），自动生成
  useEffect(() => {
    const ctx = readCtx();
    if (!ctx) return;
    if (!ctx.resumeText || !ctx.jdText) return;
    setResumeText(ctx.resumeText);
    setJdText(ctx.jdText);
    setMissingInput(ctx.missingKeywords.join("、"));
    try {
      sessionStorage.removeItem(CTX_KEY);
    } catch {
      /* 忽略 */
    }
    // 自动生成（仅当未生成过）
    void generate(ctx.resumeText, ctx.jdText, ctx.missingKeywords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async (r?: string, jdArg?: string, missingArg?: string[]) => {
    const resume = (r ?? resumeText).trim();
    const jd = (jdArg ?? jdText).trim();
    if (!resume) {
      setGenError("请填写简历文本（可粘贴诊断时使用的简历内容）");
      return;
    }
    if (!jd || jd.length < 20) {
      setGenError("请填写目标岗位 JD（至少 20 字）");
      return;
    }
    const missing = (missingArg ?? missingInput.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean)).slice(0, 8);
    setLoading(true);
    setGenError("");
    setQuestions(null);
    setAnswers({});
    setReviews({});
    track("interview_generate", { missing: missing.length });
    try {
      const qs = await generateInterviewQuestions(resume, jd, missing);
      if (!qs || qs.length === 0) {
        setGenError("AI 生成失败，请稍后重试");
        track("interview_generate_error", { reason: "null" });
        return;
      }
      setQuestions(qs);
      track("interview_generated", { count: qs.length });
    } catch {
      setGenError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const review = async (index: number) => {
    const answer = (answers[index] ?? "").trim();
    if (!answer) {
      setReviewMsg(`请先作答第 ${index + 1} 题`);
      return;
    }
    const qs = questions;
    if (!qs) return;
    const q = qs[index];
    if (!q) return;
    setReviewLoading(index);
    setReviewMsg("");
    track("interview_review", { index });
    try {
      const rev = await reviewInterviewAnswer(resumeText, jdText, q.question, answer);
      if (!rev) {
        setReviewMsg("AI 点评失败，请稍后重试");
        return;
      }
      setReviews((p) => ({ ...p, [index]: rev }));
      track("interview_reviewed", { score: rev.score });
    } catch {
      setReviewMsg("网络错误，请稍后重试");
    } finally {
      setReviewLoading(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* 输入区（未生成时显示） */}
      {!questions && (
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              简历文本
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="粘贴你的简历全文（可从「简历诊断」结果页一键带入）"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              目标岗位 JD
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={5}
              placeholder="粘贴目标岗位的职位描述"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              诊断出的缺失关键词（可选，逗号分隔，用于面试深挖）
            </label>
            <input
              value={missingInput}
              onChange={(e) => setMissingInput(e.target.value)}
              placeholder="例如：机器学习、数据分析、团队协作"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
          {genError && <Alert variant="danger">{genError}</Alert>}
          <Button size="lg" className="w-full" loading={loading} onClick={() => void generate()}>
            {loading ? "AI 正在出题…" : "生成面试追问"}
          </Button>
        </div>
      )}

      {/* 追问列表 */}
      {questions && questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              共 {questions.length} 道追问，先易后难。逐题作答后点「AI 点评」。
            </p>
            <button
              onClick={() => void generate()}
              disabled={loading}
              className="text-sm text-primary-600 hover:underline disabled:opacity-50 dark:text-primary-400"
            >
              ↻ 重新出题
            </button>
          </div>
          {reviewMsg && <Alert variant="warning">{reviewMsg}</Alert>}
          {questions.map((q, i) => {
            const rev = reviews[i];
            const answered = (answers[i] ?? "").trim().length > 0;
            return (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {i + 1}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">🎯 {q.focus}</span>
                </div>
                <p className="mt-2 font-medium leading-relaxed text-neutral-800 dark:text-neutral-100">
                  {q.question}
                </p>
                {q.hint && (
                  <p className="mt-1.5 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    💡 思考提示：{q.hint}
                  </p>
                )}
                <textarea
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [i]: e.target.value }))}
                  rows={3}
                  placeholder="在这里作答（尽量用 STAR 结构，包含具体数字与结果）"
                  className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {answered ? "✓ 已作答" : "未作答"}
                  </span>
                  <Button
                    size="sm"
                    loading={reviewLoading === i}
                    disabled={!answered}
                    onClick={() => void review(i)}
                  >
                    {rev ? "重新点评" : "AI 点评"}
                  </Button>
                </div>
                {rev && (
                  <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50/60 p-4 dark:border-accent-900 dark:bg-accent-950/30">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-accent-700 dark:text-accent-300">
                        AI 点评
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          rev.score >= 80
                            ? "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300"
                            : rev.score >= 60
                              ? "bg-warning-100 text-warning-700 dark:bg-warning-950 dark:text-warning-300"
                              : "bg-danger-100 text-danger-700 dark:bg-danger-950 dark:text-danger-300"
                        }`}
                      >
                        {rev.score} 分
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {rev.comment}
                    </p>
                    <div className="mt-3 rounded-lg border border-success-200 bg-success-50 px-3 py-2.5 dark:border-success-900 dark:bg-success-950/40">
                      <p className="mb-1 text-xs font-medium text-success-700 dark:text-success-300">
                        参考回答
                      </p>
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {rev.reference}
                      </p>
                    </div>
                    {rev.tips.length > 0 && (
                      <ul className="mt-2.5 list-inside list-disc space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {rev.tips.map((t, ti) => (
                          <li key={ti}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PrivacyNote>
        隐私承诺：简历与作答文本仅在你生成追问 / 点评时经云函数代理转发给 AI 服务商，不留存、不记录；页面无任何数据落盘（除浏览器会话内的临时带入）。
      </PrivacyNote>
    </section>
  );
}
