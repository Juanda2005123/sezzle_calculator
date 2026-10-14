import React from 'react';
import { Loader2 } from 'lucide-react';

export interface DisplayProps {
  expressionPreview: string;
  displayValue: string;
  isLoading: boolean;
}

export function Display({
  expressionPreview,
  displayValue,
  isLoading,
}: DisplayProps): React.JSX.Element {
  const getFontSizeClass = (value: string): string => {
    const len = value.length;
    if (len <= 10) return 'text-4xl sm:text-5xl';
    if (len <= 14) return 'text-3xl sm:text-4xl';
    if (len <= 18) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/90 p-5 shadow-inner border border-slate-800/80 backdrop-blur-sm">
      {/* Expression preview / calculation status header */}
      <div className="flex items-center justify-between min-h-[1.5rem] mb-1">
        <span
          className="text-xs font-mono text-slate-400 truncate max-w-[80%] select-none"
          title={expressionPreview}
        >
          {expressionPreview || '\u00A0'}
        </span>
        {isLoading && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full animate-pulse"
            aria-label="Calculating"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Calculating</span>
          </span>
        )}
      </div>

      {/* Primary calculation readout */}
      <div
        role="status"
        aria-live="polite"
        data-testid="calculator-display"
        className={`w-full font-mono font-semibold tracking-tight text-right text-slate-100 overflow-x-auto whitespace-nowrap select-all py-1 transition-all duration-150 ${getFontSizeClass(
          displayValue
        )}`}
      >
        {displayValue}
      </div>
    </div>
  );
}
