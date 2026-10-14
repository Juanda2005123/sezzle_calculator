import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { ApiErrorDetail } from '../types/calculator';

export interface ErrorBannerProps {
  error: ApiErrorDetail | null;
  onDismiss: () => void;
}

export function ErrorBanner({
  error,
  onDismiss,
}: ErrorBannerProps): React.JSX.Element | null {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="error-banner"
      className="w-full flex items-start gap-3 p-3.5 my-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 shadow-md backdrop-blur-sm"
    >
      <AlertCircle
        className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 text-sm min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-rose-900/90 text-rose-300 border border-rose-700/60">
            {error.code}
          </span>
          <span className="font-medium text-rose-100">{error.message}</span>
        </div>
        {error.details && (
          <p className="text-xs text-rose-300/80 mt-1 font-mono break-words">
            {error.details}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 p-1 rounded-lg text-rose-400 hover:text-rose-100 hover:bg-rose-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
