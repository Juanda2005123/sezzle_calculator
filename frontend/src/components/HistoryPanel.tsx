import React from 'react';
import { History, Trash2 } from 'lucide-react';
import type { HistoryItem } from '../types/calculator';

export interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function HistoryPanel({
  history,
  onSelectItem,
  onClearHistory,
  isOpen,
  onToggle,
}: HistoryPanelProps): React.JSX.Element {
  return (
    <section
      role="region"
      aria-label="Calculation History"
      className="w-full bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 backdrop-blur-sm transition-all"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg px-1 py-0.5"
          aria-expanded={isOpen}
          aria-controls="history-list-container"
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Calculation History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {history.length}
          </span>
        </button>

        {history.length > 0 && isOpen && (
          <button
            type="button"
            onClick={onClearHistory}
            aria-label="Clear calculation history"
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="history-list-container"
          className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1"
        >
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 italic select-none">
              No recent calculations
            </p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item)}
                aria-label={`Load result ${item.formatted} from ${item.expression}`}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/60 hover:border-emerald-500/40 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="text-xs font-mono text-slate-400 truncate group-hover:text-slate-300">
                  {item.expression}
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-400 group-hover:text-emerald-300 truncate">
                  = {item.formatted}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
