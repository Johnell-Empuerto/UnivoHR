import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  name?: string;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.hasError) return;

    const prevKeys = prevProps.resetKeys;
    const currKeys = this.props.resetKeys;

    if (prevKeys === undefined || currKeys === undefined) return;
    if (prevKeys.length !== currKeys.length) {
      this.handleReset();
      return;
    }
    for (let i = 0; i < currKeys.length; i++) {
      if (prevKeys[i] !== currKeys[i]) {
        this.handleReset();
        return;
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = import.meta.env.DEV;
    const displayName = this.props.name || "page";

    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred while loading this {displayName}.
              Please try again.
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          {isDev && this.state.error && (
            <div className="mt-6 text-left">
              <details className="cursor-pointer">
                <summary className="text-xs font-medium text-muted-foreground mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs text-left bg-muted p-4 rounded-md overflow-auto max-h-48 border">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
