import { ButtonHTMLAttributes, type Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** React 19 ref-as-prop：透传给内部 <button>，供弹窗等场景做初始焦点管理 */
  ref?: Ref<HTMLButtonElement>;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all select-none whitespace-nowrap " +
  // 键盘焦点环（WCAG 2.4.7）：offset 跟随页面背景 token，亮暗自动
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  // 方案 A：紫罗兰渐变主按钮（紫 → 靛蓝），hover 提亮 + 紫光阴影
  primary:
    "bg-linear-to-r from-primary-500 via-primary-600 to-indigo-500 text-white shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95",
  secondary:
    "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
  outline:
    "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
  // 浅底强调按钮：primary 的弱化版本，用于「次要但同主色系」的确认操作（如解析结果填入）
  soft: "border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/40",
  danger:
    "bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md active:bg-danger-800",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  // 全宽主操作按钮（提交/诊断等）：宽度由调用方 className 控制
  lg: "px-4 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        // currentColor 让 spinner 自动跟随各变体文字色（白底变体为白、浅底变体为深）
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      {children}
    </button>
  );
}
