import React, { useState } from 'react';
import { Keyboard, ChevronDown, ChevronUp } from 'lucide-react';

export function KeyboardReference(): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  const shortcuts = [
    { key: '0 – 9', desc: 'Input digits' },
    { key: '.', desc: 'Decimal point' },
    { key: '+  −  *  /', desc: 'Basic arithmetic' },
    { key: '^', desc: 'Power (xʸ)' },
    { key: '%', desc: 'Percentage' },
    { key: 'R', desc: 'Square root (√)' },
    { key: 'Enter / =', desc: 'Evaluate' },
    { key: 'Backspace', desc: 'Delete last' },
    { key: 'Esc', desc: 'Clear all (AC)' },
  ];

  return (
    <footer className="w-full mt-4 text-xs text-slate-400">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-expanded={isExpanded}
        aria-controls="keyboard-shortcuts-grid"
      >
        <span className="flex items-center gap-2 font-medium text-slate-300">
          <Keyboard className="w-4 h-4 text-emerald-400" />
          <span>Keyboard Shortcuts Reference</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div
          id="keyboard-shortcuts-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 font-mono text-[11px]"
        >
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800/50"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-semibold border border-slate-700">
                {sc.key}
              </kbd>
              <span className="text-slate-400 font-sans">{sc.desc}</span>
            </div>
          ))}
        </div>
      )}
    </footer>
  );
}
