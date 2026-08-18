import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";
import { analyzeResume } from "@/lib/scoring";
import { generateResumeRewrites } from "@/lib/ai";
import type { RewriteItem } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/rewrite
 * 接收 multipart/form-data：
 *   - resume: PDF 文件（必填）
 *   - jd: 目标岗位 JD 文本（必填）
 * 处理流程：解析 PDF → 规则评分得出缺失关键词 → AI 生成改写文案
 * 返回：{ rewrites: RewriteItem[] }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");
    const jdText = (formData.get("jd") as string)?.trim() ?? "";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请上传简历 PDF 文件" }, { status: 400 });
    }
    if (!jdText) {
      return NextResponse.json({ error: "请粘贴目标岗位的 JD（职位描述）" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikePdf(fileBuffer)) {
      return NextResponse.json({ error: "文件格式不正确，请上传 PDF 格式的简历" }, { status: 400 });
    }

    let resumeText = "";
    try {
      resumeText = (await extractTextFromPdf(fileBuffer)).trim();
    } catch {
      return NextResponse.json(
        { error: "PDF 解析失败：可能是扫描件（图片型 PDF），请先转为文字版 PDF 再上传" },
        { status: 422 }
      );
    }

    if (resumeText.replace(/\s/g, "").length < 30) {
      return NextResponse.json(
        { error: "未能从 PDF 中提取到有效文字，请确认是文字版 PDF（而非扫描图片）" },
        { status: 422 }
      );
    }

    // 复用评分引擎得到缺失关键词
    const analysis = analyzeResume(resumeText, jdText);
    if (analysis.missingKeywords.length === 0) {
      return NextResponse.json({
        rewrites: [],
        message: "你的简历已覆盖 JD 的全部识别关键词，无需改写。可尝试更细化的 JD 或查看更多建议。",
      });
    }

    // AI 改写（需配置 DEEPSEEK_API_KEY）
    const rewrites: RewriteItem[] | null = await generateResumeRewrites(
      resumeText,
      jdText,
      analysis.missingKeywords
    );

    if (rewrites === null) {
      return NextResponse.json(
        { error: "AI 改写暂不可用：未配置 DeepSeek API Key 或服务调用失败。请先完成分析获得基础建议。" },
        { status: 503 }
      );
    }

    return NextResponse.json({ rewrites });
  } catch (err) {
    console.error("[rewrite] unexpected error:", err);
    return NextResponse.json({ error: "服务器处理失败，请稍后重试" }, { status: 500 });
  }
}
