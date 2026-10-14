import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const setupHandlers = () => ({
    inputDigit: vi.fn(),
    inputDecimal: vi.fn(),
    selectOperation: vi.fn(),
    executeSqrt: vi.fn(),
    executePercent: vi.fn(),
    evaluate: vi.fn(),
    deleteLastDigit: vi.fn(),
    clearAll: vi.fn(),
  });

  it('triggers digit and decimal handlers', () => {
    const handlers = setupHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }));
    });
    expect(handlers.inputDigit).toHaveBeenCalledWith('7');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }));
    });
    expect(handlers.inputDecimal).toHaveBeenCalledTimes(1);
  });

  it('triggers operation handlers with correct operation type', () => {
    const handlers = setupHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('add');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('subtract');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '*' }));
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('multiply');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('multiply');

    const slashEvent = new KeyboardEvent('keydown', {
      key: '/',
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(slashEvent, 'preventDefault');
    act(() => {
      window.dispatchEvent(slashEvent);
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('divide');
    expect(preventDefaultSpy).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '^' }));
    });
    expect(handlers.selectOperation).toHaveBeenCalledWith('power');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '%' }));
    });
    expect(handlers.executePercent).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });
    expect(handlers.executeSqrt).toHaveBeenCalledTimes(1);
  });

  it('triggers evaluate on Enter or = and prevents default', () => {
    const handlers = setupHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
    act(() => {
      window.dispatchEvent(enterEvent);
    });
    expect(handlers.evaluate).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '=' }));
    });
    expect(handlers.evaluate).toHaveBeenCalledTimes(2);
  });

  it('triggers delete on Backspace and clearAll on Escape', () => {
    const handlers = setupHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    });
    expect(handlers.deleteLastDigit).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(handlers.clearAll).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts when modifier keys are pressed', () => {
    const handlers = setupHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '7', ctrlKey: true })
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '+', altKey: true })
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
      );
    });

    expect(handlers.inputDigit).not.toHaveBeenCalled();
    expect(handlers.selectOperation).not.toHaveBeenCalled();
    expect(handlers.evaluate).not.toHaveBeenCalled();
  });
});
