import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf, looksLikePdf } from "@/lib/pdf";
import { analyzeResume } from "@/lib/scoring";
import { generateAiSuggestions, analyzeJdSemantics } from "@/lib/ai";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 语义技能匹配：对每个核心技能，检查简历是否命中该技能或其近义表述。
 */
function matchSemanticSkills(
  resumeText: string,
  coreSkills: string[],
  aliases: { skill: string; terms: string[] }[]
): { matched: string[]; missing: string[] } {
  const lower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of coreSkills) {
    const alias = aliases.find((a) => a.skill === skill);
    const terms = [skill, ...(alias?.terms ?? [])];
    const hit = terms.some((t) => t && lower.includes(t.toLowerCase()));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }
  return { matched, missing };
}

/**
 * POST /api/analyze
 * 接收 multipart/form-data：
 *   - resume: PDF 文件（必填）
 *   - jd: 目标岗位 JD 文本（必填）
 * 处理流程：解析 PDF → 规则评分 → （可选）AI 增强 → 返回 JSON
 * 隐私：PDF 只在内存中处理，不落盘、不存储、不记录日志。
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");
    const jdText = (formData.get("jd") as string)?.trim() ?? "";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传简历 PDF 文件" },
        { status: 400 }
      );
    }

    if (!jdText) {
      return NextResponse.json(
        { error: "请粘贴目标岗位的 JD（职位描述）" },
        { status: 400 }
      );
    }

    if (jdText.length < 20) {
      return NextResponse.json(
        { error: "JD 内容过短，请粘贴完整的职位描述（至少 20 字）" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (!looksLikePdf(fileBuffer)) {
      return NextResponse.json(
        { error: "文件格式不正确，请上传 PDF 格式的简历" },
        { status: 400 }
      );
    }

    // 解析 PDF（内存中完成，处理完即释放）
    let resumeText = "";
    try {
      resumeText = (await extractTextFromPdf(fileBuffer)).trim();
    } catch (err) {
      console.warn("[analyze] PDF parse failed:", err);
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

    // 规则评分（始终执行，作为基础结果）
    let result: AnalysisResult = analyzeResume(resumeText, jdText);

    // AI 增强（可选：配置了 DEEPSEEK_API_KEY 时自动启用）
    const aiResult = await generateAiSuggestions(resumeText, jdText);
    if (aiResult) {
      result = {
        ...result,
        overallScore: aiResult.overallScore ?? result.overallScore,
        dimensions: aiResult.dimensions.length > 0 ? aiResult.dimensions : result.dimensions,
        suggestions: aiResult.suggestions,
        aiEnhanced: true,
      };
    }

    // AI 语义 JD 解析：识别近义技能（如"机器学习"≈"深度学习"），修正关键词与技能维度
    const semantics = await analyzeJdSemantics(jdText);
    if (semantics) {
      const { matched: sm, missing: smiss } = matchSemanticSkills(
        resumeText,
        semantics.coreSkills,
        semantics.aliases
      );
      if (sm.length + smiss.length > 0) {
        const total = sm.length + smiss.length;
        const skillDimIndex = result.dimensions.findIndex((d) => d.name === "技能匹配");
        if (skillDimIndex >= 0) {
          result.dimensions[skillDimIndex] = {
            ...result.dimensions[skillDimIndex],
            score: Math.round((sm.length / total) * 100),
            description: `AI 语义解析出 ${total} 项核心技能，简历命中 ${sm.length} 项（含近义表达）`,
          };
          // 用修正后的维度分重算总分
          result.overallScore = Math.round(
            result.dimensions.reduce(
              (sum, d, i) => sum + d.score * (result.weights[i] ?? 0),
              0
            )
          );
        }
        // 语义结果优先，规则结果补充去重
        result.matchedKeywords = [...sm, ...result.matchedKeywords.filter((k) => !sm.includes(k))]
          .slice(0, 20);
        result.missingKeywords = [...smiss, ...result.missingKeywords.filter((k) => !smiss.includes(k))]
          .slice(0, 20);
        if (!result.aiEnhanced) result.aiEnhanced = true;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze] unexpected error:", err);
    return NextResponse.json(
      { error: "服务器处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
