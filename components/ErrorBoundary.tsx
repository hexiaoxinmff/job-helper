"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI；不传则使用内置的简洁提示 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 通用 React 错误边界（类组件）。
 * 用于捕获「渲染阶段」抛出的异常，避免整页白屏。
 * 注意：无法捕获事件处理函数 / 异步代码中的错误，那些需自行 try/catch。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary] 捕获到渲染错误：", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);
      return (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-lg text-center dark:border-danger-900 dark:bg-danger-950/40">
          <p className="text-sm font-medium text-danger-700 dark:text-danger-300">加载出错了</p>
          <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error.message}</p>
          <button
            onClick={this.reset}
            className="mt-sm rounded-lg bg-danger-600 px-md py-xs text-sm text-white transition-colors hover:bg-danger-700"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
