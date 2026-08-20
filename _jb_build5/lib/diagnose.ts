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

/** 诊断选项 */
export interface DiagnoseOptions {
  /** 是否启用 AI 增强（默认 true；用户可关闭，关闭后仅规则评分） */
  aiEnabled?: boolean;
}

export async function diagnoseResume(
  resumeText: string,
  jdText: string,
  options: DiagnoseOptions = {}
): Promise<AnalysisResult> {
  // 1) 规则评分（始终执行，作为基础结果）
  let result: AnalysisResult = analyzeResume(resumeText, jdText);

  // 用户关闭 AI 增强：仅走规则评分，不发起任何外部请求（隐私红线）
  if (options.aiEnabled === false) {
    return result;
  }

  // 2) AI 评分建议 + 语义 JD 解析：并行发起（二者无依赖，任一失败返回 null 不影响另一个）
  //    串行改为并行，端到端耗时减半，满足 NFR-03 诊断 <8s 指标
  const [aiResult, semantics] = await Promise.all([
    generateAiSuggestions(resumeText, jdText),
    analyzeJdSemantics(jdText),
  ]);
  if (aiResult) {
    // AI 返回的维度可能不带 weight，按同名维度或原顺序权重兜底，避免总分 NaN
    const dims =
      aiResult.dimensions.length > 0
        ? aiResult.dimensions.map((d, i) => ({
            ...d,
            weight:
              d.weight ??
              result.dimensions.find((rd) => rd.name === d.name)?.weight ??
              result.weights[i] ??
              0,
          }))
        : result.dimensions;
    result = {
      ...result,
      overallScore: aiResult.overallScore ?? result.overallScore,
      dimensions: dims,
      suggestions: aiResult.suggestions,
      aiEnhanced: true,
    };
  }

  // 3) AI 语义 JD 解析：识别近义技能（如"机器学习"≈"深度学习"），修正关键词与技能维度
  if (semantics) {
    const { matched, missing } = matchSemanticSkills(
      resumeText,
      semantics.coreSkills,
      semantics.aliases
    );
    if (matched.length + missing.length > 0) {
      const total = matched.length + missing.length;
      const skillDimIndex = result.dimensions.findIndex((d) => d.name === "技能匹配");
      const skillDim = skillDimIndex >= 0 ? result.dimensions[skillDimIndex] : undefined;
      if (skillDim) {
        result.dimensions[skillDimIndex] = {
          ...skillDim,
          score: Math.round((matched.length / total) * 100),
          description: `AI 语义解析出 ${total} 项核心技能，简历命中 ${matched.length} 项（含近义表达）`,
        };
        // 用修正后的维度分重算总分（权重随维度自带，保留原始权重不被 AI 覆盖丢失）
        const fallbackWeights = result.weights;
        result.overallScore = Math.round(
          result.dimensions.reduce((sum, d, i) => {
            const w = d.weight ?? fallbackWeights[i] ?? 0;
            return sum + d.score * w;
          }, 0)
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
