// 反向岗位推荐：基于简历文本，从行业 JD 库中匹配高契合度的岗位方向。
// 复用规则评分引擎（analyzeResume）做反向匹配，零外部依赖、零成本、毫秒级完成，
// 形成「简历 → 方向 → 换 JD 再诊断」的闭环（建议清单 #4）。
import { JD_LIBRARY } from "./jd-library";
import { analyzeResume } from "./scoring";

export interface RoleRecommendation {
  /** JD 模板 id */
  id: string;
  /** 行业（中文） */
  industry: string;
  /** 岗位（中文） */
  role: string;
  /** 匹配度 0-100（基于规则评分） */
  score: number;
  /** 高匹配（>=70）/ 可考虑（50-69） */
  tier: "high" | "mid";
}

/**
 * 返回与简历匹配度最高的 N 个岗位方向。
 * @param resumeText 简历全文
 * @param excludeJdText 排除当前已诊断的 JD 原文（避免推荐与正在看的岗位重复）
 * @param topN 返回条数，默认 3
 */
export function recommendRoles(
  resumeText: string,
  excludeJdText?: string,
  topN = 3
): RoleRecommendation[] {
  const excluded = (excludeJdText ?? "").replace(/\s/g, "").toLowerCase();
  const scored: RoleRecommendation[] = [];
  for (const tpl of JD_LIBRARY) {
    const jdZh = tpl.jd["zh-CN"];
    if (excluded && jdZh.replace(/\s/g, "").toLowerCase() === excluded) continue;
    const score = analyzeResume(resumeText, jdZh).overallScore;
    scored.push({
      id: tpl.id,
      industry: tpl.industry["zh-CN"],
      role: tpl.role["zh-CN"],
      score,
      tier: score >= 70 ? "high" : "mid",
    });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topN);
}
