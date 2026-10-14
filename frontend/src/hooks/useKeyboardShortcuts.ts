import { useEffect, useState, useRef } from 'react';
import type { Operation } from '../types/calculator';

export interface KeyboardShortcutHandlers {
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  selectOperation: (op: Operation) => void;
  executeSqrt: () => void;
  executePercent: () => void;
  evaluate: () => void;
  deleteLastDigit: () => void;
  clearAll: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeKeyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const flashKey = (keyId: string) => {
    setActiveKey(keyId);
    if (activeKeyTimeoutRef.current) {
      clearTimeout(activeKeyTimeoutRef.current);
    }
    activeKeyTimeoutRef.current = setTimeout(() => {
      setActiveKey(null);
    }, 150);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier keys are pressed (except Shift which produces %, ^, *, +)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        flashKey(key);
        handlersRef.current.inputDigit(key);
        return;
      }

      if (key === '.') {
        flashKey('.');
        handlersRef.current.inputDecimal();
        return;
      }

      if (key === '+') {
        flashKey('add');
        handlersRef.current.selectOperation('add');
        return;
      }

      if (key === '-') {
        flashKey('subtract');
        handlersRef.current.selectOperation('subtract');
        return;
      }

      if (key === '*' || key.toLowerCase() === 'x') {
        flashKey('multiply');
        handlersRef.current.selectOperation('multiply');
        return;
      }

      if (key === '/') {
        e.preventDefault(); // Prevent browser quick-find
        flashKey('divide');
        handlersRef.current.selectOperation('divide');
        return;
      }

      if (key === '^') {
        flashKey('power');
        handlersRef.current.selectOperation('power');
        return;
      }

      if (key === '%') {
        flashKey('percent');
        handlersRef.current.executePercent();
        return;
      }

      if (key.toLowerCase() === 'r') {
        flashKey('sqrt');
        handlersRef.current.executeSqrt();
        return;
      }

      if (key === 'Enter' || key === '=') {
        e.preventDefault(); // Prevent accidental re-triggering of focused buttons
        flashKey('equals');
        handlersRef.current.evaluate();
        return;
      }

      if (key === 'Backspace') {
        flashKey('delete');
        handlersRef.current.deleteLastDigit();
        return;
      }

      if (key === 'Escape') {
        flashKey('clear');
        handlersRef.current.clearAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activeKeyTimeoutRef.current) {
        clearTimeout(activeKeyTimeoutRef.current);
      }
    };
  }, []);

  return { activeKey };
}
