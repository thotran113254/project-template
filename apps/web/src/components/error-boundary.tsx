import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render-time exceptions and displays a fallback UI. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Something went wrong
        </h2>
        <p className="max-w-md text-sm text-[var(--muted-foreground)]">
          {this.state.error?.message ?? "An unexpected error occurred."}
        </p>
        <Button
          variant="outline"
          onClick={() => this.setState({ hasError: false, error: null })}
        >
          Try Again
        </Button>
      </div>
    );
  }
}
