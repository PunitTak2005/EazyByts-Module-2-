import React from 'react';

/**
 * AppErrorBoundary
 *
 * A class-based React Error Boundary that catches runtime exceptions thrown by
 * any child component and renders a friendly fallback UI instead of crashing
 * the entire application.
 *
 * Usage:
 *   <AppErrorBoundary>
 *     <Dashboard />
 *   </AppErrorBoundary>
 *
 * Or with a custom fallback label:
 *   <AppErrorBoundary label="Portfolio">
 *     <PortfolioPage />
 *   </AppErrorBoundary>
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in dev; in production this would go to an error tracker
    if (import.meta.env.DEV) {
      console.error('[AppErrorBoundary] Caught runtime error:', error, errorInfo);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const label = this.props.label || 'This section';
    const errorMessage = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center dark:border-rose-900/30 dark:bg-rose-950/10">
        {/* Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
          <svg
            className="h-8 w-8 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-dark-text">
          {label} encountered an error
        </h2>

        {/* Message */}
        <p className="mb-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Something went wrong while rendering this section. This is likely a temporary issue.
        </p>

        {/* Error detail — dev only */}
        {import.meta.env.DEV && (
          <pre className="mb-4 mt-3 max-w-lg overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-left text-[11px] leading-relaxed text-rose-300">
            {errorMessage}
          </pre>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-slate-800"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
