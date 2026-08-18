import { ReactNode } from "react";
import { Input, Textarea } from "./Input";

interface FieldProps {
  label: string;
  hint?: string;
  /** 简易绑定模式：传入 value/onChange/placeholder 自动渲染输入控件 */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  /** 自定义控件（优先级高于简易绑定） */
  children?: ReactNode;
}

export function Field({ label, hint, children, value, onChange, placeholder, textarea }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children ??
        (textarea ? (
          <Textarea
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <Input value={value} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} />
        ))}
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  );
}
