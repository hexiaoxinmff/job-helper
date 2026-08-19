import { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "info" | "warning" | "success" | "danger";

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  /** 可选标题，无标题时作为纯提示块 */
  title?: ReactNode;
  /** 可选图标（emoji / svg），置于正文前 */
  icon?: ReactNode;
}

/** 语义色映射：圆角 xl + 浅底深字，暗色 950/40 半透明底（与全站提示块一致） */
const styles: Record<AlertVariant, string> = {
  info: "border-info-200 bg-info-50 text-info-800 dark:border-info-900 dark:bg-info-950/40 dark:text-info-200",
  warning:
    "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-900 dark:bg-warning-950/40 dark:text-warning-200",
  success:
    "border-success-200 bg-success-50 text-success-800 dark:border-success-900 dark:bg-success-950/40 dark:text-success-200",
  danger:
    "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-400",
};

/**
 * 语义提示块：免责声明 / AI 降级提示 / 校验错误 / 成功回执。
 * - danger 使用 role="alert"（即时性错误，屏幕阅读器会打断播报）；
 *   其余使用 role="status"（状态提示，播报但不打断）。
 */
export function Alert({
  variant = "info",
  title,
  icon,
  className = "",
  children,
  ...rest
}: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]} ${className}`}
      {...rest}
    >
      {title && <p className="mb-1 font-medium">{title}</p>}
      {icon ? (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
