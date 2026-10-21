import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-[#faf8ff]">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#131b2e]">
                {this.props.fallbackTitle || 'Something went wrong loading this view'}
              </h2>
              <p className="text-xs sm:text-sm text-[#464555] leading-relaxed">
                SkillSwap encountered a temporary interface issue while rendering campus data.
                Your account credentials and saved workshops are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#f2f3ff] rounded-xl text-left border border-[#eaedff] overflow-x-auto text-[11px] font-mono text-[#ba1a1a]">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry View</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl bg-[#eaedff] text-[#3525cd] text-xs font-semibold hover:bg-[#dae2fd] transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
