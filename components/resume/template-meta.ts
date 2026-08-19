import type { TemplateId } from "@/lib/types";

/** 模板元数据：编辑器缩略图/选择卡片 + 渲染配置驱动 */
export interface TemplateMeta {
  id: TemplateId;
  label: string;
  desc: string;
  /** 主题强调色（缩略图用） */
  accent: string;
  /** 布局类型（缩略图用） */
  layout: "timeline" | "single" | "split" | "banner" | "magazine";
}

export const TEMPLATE_META: TemplateMeta[] = [
  { id: "timeline", label: "时间轴", desc: "蓝点时间轴，经典校园简历版式", accent: "#4f81bd", layout: "timeline" },
  { id: "minimal-blue", label: "单栏极简蓝", desc: "应届生标准版式，蓝色小标题", accent: "#4f81bd", layout: "single" },
  { id: "bw-minimal", label: "黑白极简", desc: "纯黑白，ATS 系统最友好", accent: "#111111", layout: "single" },
  { id: "artistic", label: "留白文艺", desc: "细线分割居中，设计/内容岗", accent: "#c9b458", layout: "magazine" },
  { id: "dense", label: "紧凑单页", desc: "高信息密度，一页装更多", accent: "#374151", layout: "single" },
  { id: "fresh-green", label: "清新绿", desc: "绿色系，清爽有活力", accent: "#3f9d6b", layout: "single" },
  { id: "gradient-purple", label: "渐变紫", desc: "浅紫渐变头区，现代感", accent: "#7c5cd6", layout: "single" },
  { id: "vibrant-orange", label: "活力橙", desc: "橙色点缀，热情积极", accent: "#e8833a", layout: "single" },
  { id: "it-minimal", label: "极简IT", desc: "等宽字体终端感，技术岗", accent: "#1a73e8", layout: "single" },
  { id: "biz-split", label: "简约商务分栏", desc: "左信息右经历，通用商务", accent: "#1d3557", layout: "split" },
  { id: "edu-blue", label: "时尚蓝教育", desc: "圆角渐变蓝，教育培训岗", accent: "#1e88e5", layout: "banner" },
  { id: "dark-biz", label: "深色经典商务", desc: "深色头图，稳重正式", accent: "#14181d", layout: "banner" },
  { id: "space-grey", label: "深空灰", desc: "柔和灰调，低调专业", accent: "#6b7280", layout: "single" },
  { id: "rose-gold", label: "玫瑰金", desc: "温柔粉调，文职/设计岗", accent: "#c98585", layout: "single" },
  { id: "classic-red", label: "经典红黑", desc: "红黑点缀，正式庄重", accent: "#b03a3a", layout: "single" },
  { id: "light-blue", label: "浅蓝清新", desc: "浅蓝底纹分模块，清爽", accent: "#4a90d9", layout: "single" },
  { id: "sidebar-navy", label: "侧栏深蓝", desc: "深蓝侧栏 + 主内容区", accent: "#1d3557", layout: "split" },
  { id: "military-green", label: "军绿稳重", desc: "墨绿头图，沉稳可靠", accent: "#5c7351", layout: "banner" },
  { id: "topbar-modern", label: "顶部色条", desc: "渐变蓝顶条，现代大方", accent: "#2563eb", layout: "banner" },
  { id: "magazine", label: "杂志风", desc: "衬线大标题，文艺设计感", accent: "#c9b458", layout: "magazine" },
];

export const TEMPLATE_META_MAP: Record<TemplateId, TemplateMeta> = Object.fromEntries(
  TEMPLATE_META.map((m) => [m.id, m])
) as Record<TemplateId, TemplateMeta>;
