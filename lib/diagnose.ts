// 浏览器端诊断编排：复用规则评分引擎 + 调用 ai-proxy 增强。
// 逻辑原在 app/api/analyze/route.ts（服务端），现整体搬回浏览器，便于静态部署。
import type { AnalysisResult } from "./types";
import { analyzeResume } from "./scoring";
import { generateAiSuggestions, analyzeJdSemantics } from "./ai-client";

/** 语义技能匹配：命中核心技能或其近义表述 */
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

export async function diagnoseResume(
  resumeText: string,
  jdText: string
): Promise<AnalysisResult> {
  // 1) 规则评分（始终执行，作为基础结果）
  let result: AnalysisResult = analyzeResume(resumeText, jdText);

  // 2) AI 评分建议增强
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

  // 3) AI 语义 JD 解析：识别近义技能（如"机器学习"≈"深度学习"），修正关键词与技能维度
  const semantics = await analyzeJdSemantics(jdText);
  if (semantics) {
    const { matched, missing } = matchSemanticSkills(
      resumeText,
      semantics.coreSkills,
      semantics.aliases
    );
    if (matched.length + missing.length > 0) {
      const total = matched.length + missing.length;
      const skillDimIndex = result.dimensions.findIndex((d) => d.name === "技能匹配");
      if (skillDimIndex >= 0) {
        result.dimensions[skillDimIndex] = {
          ...result.dimensions[skillDimIndex],
          score: Math.round((matched.length / total) * 100),
          description: `AI 语义解析出 ${total} 项核心技能，简历命中 ${matched.length} 项（含近义表达）`,
        };
        // 用修正后的维度分重算总分
        result.overallScore = Math.round(
          result.dimensions.reduce(
            (sum, d, i) => sum + d.score * (result.weights[i] ?? 0),
            0
          )
        );
      }
      result.matchedKeywords = [
        ...matched,
        ...result.matchedKeywords.filter((k) => !matched.includes(k)),
      ].slice(0, 20);
      result.missingKeywords = [
        ...missing,
        ...result.missingKeywords.filter((k) => !missing.includes(k)),
      ].slice(0, 20);
      if (!result.aiEnhanced) result.aiEnhanced = true;
    }
  }

  return result;
}
