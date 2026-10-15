// 面试带入中转：诊断结果页 → /interview 的一次性上下文传递。
// 隐私红线：简历原文不落盘（不写 localStorage / sessionStorage），
// 仅存于模块级内存变量；客户端路由跳转不刷新页面，模块状态可达。
// 读一次即清空（consume），避免残留影响下一次进入。

export interface InterviewPrefill {
  resumeText: string;
  jdText: string;
  missingKeywords: string[];
}

let prefill: InterviewPrefill | null = null;

/** 跳转前调用：暂存诊断上下文（覆盖旧值） */
export function setInterviewPrefill(
  resumeText: string,
  jdText?: string,
  missingKeywords?: string[]
): void {
  prefill = {
    resumeText,
    jdText: jdText ?? "",
    missingKeywords: (missingKeywords ?? []).filter((k) => typeof k === "string" && k.trim()),
  };
}

/** 面试页挂载时调用：取走并立即清空；无暂存时返回 null（走原空态） */
export function consumeInterviewPrefill(): InterviewPrefill | null {
  const p = prefill;
  prefill = null;
  return p;
}
