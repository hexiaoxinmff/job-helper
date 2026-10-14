import { Alert } from "@/components/ui/Alert";

/** AI 服务维护中的诚实降级提示：各 AI 入口禁用态共用（中性文案，经 Alert 走 warning 语义色，暗色自适应） */
export function AiUnavailableNotice({ className = "" }: { className?: string }) {
  return (
    <Alert variant="warning" className={className}>
      AI 服务维护中，此功能暂时停用，恢复后即可正常使用。
    </Alert>
  );
}
