import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`} {...rest}>
      {title && <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-neutral-100">{title}</h3>}
      {children}
    </div>
  );
}
