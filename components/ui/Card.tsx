import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`} {...rest}>
      {title && <h3 className="mb-3 text-base font-medium text-slate-800 dark:text-slate-100">{title}</h3>}
      {children}
    </div>
  );
}
