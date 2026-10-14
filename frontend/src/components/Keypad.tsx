import React from 'react';
import type { Operation } from '../types/calculator';

export interface KeypadProps {
  onInputDigit: (digit: string) => void;
  onInputDecimal: () => void;
  onToggleSign: () => void;
  onDeleteLastDigit: () => void;
  onClearAll: () => void;
  onSelectOperation: (op: Operation) => void;
  onExecuteSqrt: () => void;
  onExecutePercent: () => void;
  onEvaluate: () => void;
  pendingOperation: Operation | null;
  isLoading: boolean;
  activeKey?: string | null;
}

export function Keypad({
  onInputDigit,
  onInputDecimal,
  onToggleSign,
  onDeleteLastDigit,
  onClearAll,
  onSelectOperation,
  onExecuteSqrt,
  onExecutePercent,
  onEvaluate,
  pendingOperation,
  isLoading,
  activeKey,
}: KeypadProps): React.JSX.Element {
  const getButtonClass = (
    baseClasses: string,
    keyId: string,
    isOpActive = false
  ): string => {
    const isPressed = activeKey === keyId;
    const activeOpClass = isOpActive
      ? '!bg-emerald-500 !text-slate-950 font-bold ring-2 ring-emerald-300'
      : '';
    const pressedClass = isPressed
      ? 'scale-95 ring-2 ring-emerald-400 brightness-125'
      : '';

    return `relative flex items-center justify-center rounded-xl p-3 sm:p-4 text-center select-none font-medium transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95 ${baseClasses} ${activeOpClass} ${pressedClass}`;
  };

  return (
    <div
      className="grid grid-cols-4 gap-2.5 sm:gap-3 p-1 w-full"
      role="group"
      aria-label="Calculator Keypad"
    >
      {/* Row 1: Clear All, Delete, Toggle Sign, Divide */}
      <button
        type="button"
        onClick={onClearAll}
        aria-label="Clear All"
        className={getButtonClass(
          'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-base sm:text-lg font-semibold',
          'clear'
        )}
      >
        AC
      </button>

      <button
        type="button"
        onClick={onDeleteLastDigit}
        disabled={isLoading}
        aria-label="Backspace"
        className={getButtonClass(
          'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-base sm:text-lg',
          'delete'
        )}
      >
        DEL
      </button>

      <button
        type="button"
        onClick={onToggleSign}
        disabled={isLoading}
        aria-label="Toggle Sign"
        className={getButtonClass(
          'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-lg sm:text-xl font-mono',
          'toggle-sign'
        )}
      >
        ±
      </button>

      <button
        type="button"
        onClick={() => onSelectOperation('divide')}
        disabled={isLoading}
        aria-label="Divide"
        className={getButtonClass(
          'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xl sm:text-2xl font-mono',
          'divide',
          pendingOperation === 'divide'
        )}
      >
        ÷
      </button>

      {/* Row 2: Square Root, Power, Percentage, Multiply */}
      <button
        type="button"
        onClick={onExecuteSqrt}
        disabled={isLoading}
        aria-label="Square Root"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-900/40 text-lg sm:text-xl font-mono',
          'sqrt'
        )}
      >
        √
      </button>

      <button
        type="button"
        onClick={() => onSelectOperation('power')}
        disabled={isLoading}
        aria-label="Power"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-900/40 text-lg sm:text-xl font-mono',
          'power',
          pendingOperation === 'power'
        )}
      >
        xʸ
      </button>

      <button
        type="button"
        onClick={onExecutePercent}
        disabled={isLoading}
        aria-label="Percentage"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-900/40 text-lg sm:text-xl font-mono',
          'percent',
          pendingOperation === 'percent'
        )}
      >
        %
      </button>

      <button
        type="button"
        onClick={() => onSelectOperation('multiply')}
        disabled={isLoading}
        aria-label="Multiply"
        className={getButtonClass(
          'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xl sm:text-2xl font-mono',
          'multiply',
          pendingOperation === 'multiply'
        )}
      >
        ×
      </button>

      {/* Row 3: 7, 8, 9, Subtract */}
      <button
        type="button"
        onClick={() => onInputDigit('7')}
        disabled={isLoading}
        aria-label="7"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '7'
        )}
      >
        7
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('8')}
        disabled={isLoading}
        aria-label="8"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '8'
        )}
      >
        8
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('9')}
        disabled={isLoading}
        aria-label="9"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '9'
        )}
      >
        9
      </button>

      <button
        type="button"
        onClick={() => onSelectOperation('subtract')}
        disabled={isLoading}
        aria-label="Subtract"
        className={getButtonClass(
          'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xl sm:text-2xl font-mono',
          'subtract',
          pendingOperation === 'subtract'
        )}
      >
        −
      </button>

      {/* Row 4: 4, 5, 6, Add */}
      <button
        type="button"
        onClick={() => onInputDigit('4')}
        disabled={isLoading}
        aria-label="4"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '4'
        )}
      >
        4
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('5')}
        disabled={isLoading}
        aria-label="5"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '5'
        )}
      >
        5
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('6')}
        disabled={isLoading}
        aria-label="6"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '6'
        )}
      >
        6
      </button>

      <button
        type="button"
        onClick={() => onSelectOperation('add')}
        disabled={isLoading}
        aria-label="Add"
        className={getButtonClass(
          'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xl sm:text-2xl font-mono',
          'add',
          pendingOperation === 'add'
        )}
      >
        +
      </button>

      {/* Row 5: 1, 2, 3, Equals (row-span-2) */}
      <button
        type="button"
        onClick={() => onInputDigit('1')}
        disabled={isLoading}
        aria-label="1"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '1'
        )}
      >
        1
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('2')}
        disabled={isLoading}
        aria-label="2"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '2'
        )}
      >
        2
      </button>

      <button
        type="button"
        onClick={() => onInputDigit('3')}
        disabled={isLoading}
        aria-label="3"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '3'
        )}
      >
        3
      </button>

      <button
        type="button"
        onClick={onEvaluate}
        disabled={isLoading}
        aria-label="Equals"
        className={`${getButtonClass(
          'row-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 text-2xl sm:text-3xl font-bold shadow-lg shadow-emerald-500/20',
          'equals'
        )}`}
      >
        =
      </button>

      {/* Row 6: 0 (col-span-2), Decimal */}
      <button
        type="button"
        onClick={() => onInputDigit('0')}
        disabled={isLoading}
        aria-label="0"
        className={`${getButtonClass(
          'col-span-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '0'
        )}`}
      >
        0
      </button>

      <button
        type="button"
        onClick={onInputDecimal}
        disabled={isLoading}
        aria-label="Decimal Point"
        className={getButtonClass(
          'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/50 text-xl sm:text-2xl font-mono',
          '.'
        )}
      >
        .
      </button>
    </div>
  );
}
