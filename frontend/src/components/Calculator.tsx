import React, { useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Display } from './Display';
import { ErrorBanner } from './ErrorBanner';
import { Keypad } from './Keypad';
import { HistoryPanel } from './HistoryPanel';
import { KeyboardReference } from './KeyboardReference';

export function Calculator(): React.JSX.Element {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    displayValue,
    pendingOperation,
    expressionPreview,
    isLoading,
    error,
    history,
    inputDigit,
    inputDecimal,
    toggleSign,
    deleteLastDigit,
    clearAll,
    dismissError,
    executeSqrt,
    executePercent,
    selectOperation,
    evaluate,
    selectHistoryItem,
    clearHistory,
  } = useCalculator();

  const { activeKey } = useKeyboardShortcuts({
    inputDigit,
    inputDecimal,
    selectOperation,
    executeSqrt,
    executePercent,
    evaluate,
    deleteLastDigit,
    clearAll,
  });

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3">
      {/* Calculator main chassis */}
      <div className="w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl shadow-black/60 backdrop-blur-md">
        <Display
          expressionPreview={expressionPreview}
          displayValue={displayValue}
          isLoading={isLoading}
        />

        <ErrorBanner error={error} onDismiss={dismissError} />

        <div className="mt-3">
          <Keypad
            onInputDigit={inputDigit}
            onInputDecimal={inputDecimal}
            onToggleSign={toggleSign}
            onDeleteLastDigit={deleteLastDigit}
            onClearAll={clearAll}
            onSelectOperation={selectOperation}
            onExecuteSqrt={executeSqrt}
            onExecutePercent={executePercent}
            onEvaluate={evaluate}
            pendingOperation={pendingOperation}
            isLoading={isLoading}
            activeKey={activeKey}
          />
        </div>

        <div className="mt-4">
          <HistoryPanel
            history={history}
            onSelectItem={selectHistoryItem}
            onClearHistory={clearHistory}
            isOpen={isHistoryOpen}
            onToggle={() => setIsHistoryOpen((prev) => !prev)}
          />
        </div>
      </div>

      <KeyboardReference />
    </div>
  );
}
