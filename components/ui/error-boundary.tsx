"use client";

import { Component, type ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <GlassCard className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <GlassButton
            variant="primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </GlassButton>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}
