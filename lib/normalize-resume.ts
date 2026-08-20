// 把 AI 解析 / 优化产出的「部分结构化简历」(ParsedResumeInput，数组元素不含 id)
// 归一化为完整的 Resume（补齐 id 与默认值），可直接灌入编辑器 store。
// 与云函数 actionParseResume 的字段抽取保持同构，但此处负责「加 id + 兜底默认值」。

import {
  createEmptyResume,
  type ActivityItem,
  type AwardItem,
  type EducationItem,
  type InternshipItem,
  type LanguageItem,
  type PortfolioItem,
  type ProjectItem,
  type Resume,
  type SkillGroup,
  type WorkItem,
} from "./types";
import type { ParsedResumeInput } from "./resume-import";

/** 去掉 id 的项类型（AI 产出形态，id 由本模块补齐） */
type WithoutId<T> = Omit<T, "id">;

const uid = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const str = (v: unknown, max = 2000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const strArr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .filter((s) => typeof s === "string")
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 30)
    : [];

/** 把任意数组映射成「带 id 的对象数组」，丢弃映射失败 / 空的条目 */
function withIds<T extends object>(
  v: unknown,
  map: (o: Record<string, unknown>) => T | null,
  max = 30
): (T & { id: string })[] {
  if (!Array.isArray(v)) return [];
  const out: (T & { id: string })[] = [];
  for (const it of v) {
    if (!it || typeof it !== "object") continue;
    const m = map(it as Record<string, unknown>);
    if (m) out.push({ ...m, id: uid() });
    if (out.length >= max) break;
  }
  return out;
}

/** 判断 AI 优化结果是否「过空」（避免把空白简历写进编辑器） */
export function isResumeEmpty(r: Resume): boolean {
  return (
    !r.basics.name.trim() &&
    r.education.length === 0 &&
    r.work.length === 0 &&
    r.internships.length === 0 &&
    r.projects.length === 0
  );
}

/**
 * 将 ParsedResumeInput（AI 产出，数组元素无 id）转换为完整、合法的 Resume。
 * 缺失字段用 createEmptyResume 兜底；basics 仅覆盖非空字符串，避免清掉已有值。
 */
export function normalizeParsedResume(parsed: ParsedResumeInput): Resume {
  const base = createEmptyResume();
  const b = parsed.basics && typeof parsed.basics === "object" ? parsed.basics : {};

  // basics：仅覆盖非空字符串字段
  const basics = { ...base.basics };
  for (const k of Object.keys(b) as (keyof typeof base.basics)[]) {
    const v = (b as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) basics[k] = v.trim();
  }

  const education = withIds<WithoutId<EducationItem>>(parsed.education, (o) => {
    const school = str(o.school, 60);
    if (!school) return null;
    return {
      school,
      degree: str(o.degree, 30),
      major: str(o.major, 60),
      startDate: str(o.startDate, 20),
      endDate: str(o.endDate, 20),
      description: str(o.description, 800),
    };
  });

  const languages = withIds<WithoutId<LanguageItem>>(parsed.languages, (o) => {
    const language = str(o.language, 40);
    if (!language) return null;
    return { language, level: str(o.level, 60) };
  });

  const internships = withIds<WithoutId<InternshipItem>>(parsed.internships, (o) => {
    const company = str(o.company, 60);
    if (!company) return null;
    return {
      company,
      role: str(o.role, 60),
      startDate: str(o.startDate, 20),
      endDate: str(o.endDate, 20),
      bullets: strArr(o.bullets),
    };
  });

  const work = withIds<WithoutId<WorkItem>>(parsed.work, (o) => {
    const company = str(o.company, 60);
    if (!company) return null;
    return {
      company,
      role: str(o.role, 60),
      startDate: str(o.startDate, 20),
      endDate: str(o.endDate, 20),
      bullets: strArr(o.bullets),
    };
  });

  const projects = withIds<WithoutId<ProjectItem>>(parsed.projects, (o) => {
    const name = str(o.name, 60);
    if (!name) return null;
    return {
      name,
      role: str(o.role, 60),
      link: str(o.link, 300),
      startDate: str(o.startDate, 20),
      endDate: str(o.endDate, 20),
      bullets: strArr(o.bullets),
    };
  });

  const activities = withIds<WithoutId<ActivityItem>>(parsed.activities, (o) => {
    const org = str(o.org, 60);
    if (!org) return null;
    return {
      org,
      role: str(o.role, 60),
      startDate: str(o.startDate, 20),
      endDate: str(o.endDate, 20),
      description: str(o.description, 800),
    };
  });

  const skills = withIds<WithoutId<SkillGroup>>(parsed.skills, (o) => {
    const category = str(o.category, 40);
    const items = strArr(o.items);
    if (!category && items.length === 0) return null;
    return { category: category || "技能", items };
  });

  const awards = withIds<WithoutId<AwardItem>>(parsed.awards, (o) => {
    const name = str(o.name, 80);
    if (!name) return null;
    return { name, date: str(o.date, 30), description: str(o.description, 400) };
  });

  const portfolio = withIds<WithoutId<PortfolioItem>>(parsed.portfolio, (o) => {
    const name = str(o.name, 80);
    if (!name) return null;
    return { name, link: str(o.link, 300), description: str(o.description, 400) };
  });

  const advantages = strArr(parsed.advantages).slice(0, 12);

  return {
    ...base,
    basics,
    advantages,
    education,
    languages,
    internships,
    work,
    projects,
    activities,
    skills,
    awards,
    portfolio,
  };
}
