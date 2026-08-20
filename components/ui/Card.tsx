import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:shadow-lg ${className}`}
      {...rest}
    >
      {title && <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-neutral-100">{title}</h3>}
      {children}
    </div>
  );
}
