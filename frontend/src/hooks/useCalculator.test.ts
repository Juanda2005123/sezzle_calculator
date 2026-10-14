import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { calculatorReducer, INITIAL_STATE, useCalculator } from './useCalculator';
import * as calculatorApi from '../api/calculatorApi';
import type { CalculationData, HistoryItem } from '../types/calculator';

describe('useCalculator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculatorReducer unit tests', () => {
    it('handles input digits correctly', () => {
      let state = calculatorReducer(INITIAL_STATE, {
        type: 'INPUT_DIGIT',
        digit: '5',
      });
      expect(state.displayValue).toBe('5');

      // Append digit
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '8' });
      expect(state.displayValue).toBe('58');

      // Multiple leading zeros prevented
      state = calculatorReducer(INITIAL_STATE, {
        type: 'INPUT_DIGIT',
        digit: '0',
      });
      expect(state.displayValue).toBe('0');
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '0' });
      expect(state.displayValue).toBe('0');

      // -0 leading zero handling
      state = { ...INITIAL_STATE, displayValue: '-0' };
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '0' });
      expect(state.displayValue).toBe('-0');
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '7' });
      expect(state.displayValue).toBe('-7');

      // Replaces value when isWaitingForOperand is true
      state = { ...INITIAL_STATE, displayValue: '100', isWaitingForOperand: true };
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '3' });
      expect(state.displayValue).toBe('3');
      expect(state.isWaitingForOperand).toBe(false);

      // Replaces value with 0. if digit is . when isWaitingForOperand is true
      state = { ...INITIAL_STATE, displayValue: '100', isWaitingForOperand: true };
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '.' });
      expect(state.displayValue).toBe('0.');

      // Max input length guard (24 chars)
      const max24 = '123456789012345678901234';
      state = { ...INITIAL_STATE, displayValue: max24 };
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '9' });
      expect(state.displayValue).toBe(max24);
    });

    it('handles decimal input correctly', () => {
      let state = calculatorReducer(INITIAL_STATE, { type: 'INPUT_DECIMAL' });
      expect(state.displayValue).toBe('0.');

      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '5' });
      expect(state.displayValue).toBe('0.5');

      // Second decimal point ignored
      state = calculatorReducer(state, { type: 'INPUT_DECIMAL' });
      expect(state.displayValue).toBe('0.5');

      // When isWaitingForOperand is true
      state = { ...INITIAL_STATE, displayValue: '99', isWaitingForOperand: true };
      state = calculatorReducer(state, { type: 'INPUT_DECIMAL' });
      expect(state.displayValue).toBe('0.');
      expect(state.isWaitingForOperand).toBe(false);

      // Max length guard on decimal
      const max24 = '123456789012345678901234';
      state = { ...INITIAL_STATE, displayValue: max24 };
      state = calculatorReducer(state, { type: 'INPUT_DECIMAL' });
      expect(state.displayValue).toBe(max24);
    });

    it('handles sign toggling', () => {
      let state = calculatorReducer(INITIAL_STATE, { type: 'TOGGLE_SIGN' });
      expect(state.displayValue).toBe('0'); // 0 doesn't toggle

      state = calculatorReducer(INITIAL_STATE, {
        type: 'INPUT_DIGIT',
        digit: '4',
      });
      state = calculatorReducer(state, { type: 'TOGGLE_SIGN' });
      expect(state.displayValue).toBe('-4');

      state = calculatorReducer(state, { type: 'TOGGLE_SIGN' });
      expect(state.displayValue).toBe('4');
    });

    it('handles backspace correctly', () => {
      let state = calculatorReducer(INITIAL_STATE, {
        type: 'INPUT_DIGIT',
        digit: '4',
      });
      state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '2' });
      expect(state.displayValue).toBe('42');

      state = calculatorReducer(state, { type: 'DELETE_LAST_DIGIT' });
      expect(state.displayValue).toBe('4');

      state = calculatorReducer(state, { type: 'DELETE_LAST_DIGIT' });
      expect(state.displayValue).toBe('0');

      // If error is present, clears error
      state = {
        ...INITIAL_STATE,
        error: { code: 'ERR_TEST', message: 'Test error' },
      };
      state = calculatorReducer(state, { type: 'DELETE_LAST_DIGIT' });
      expect(state.error).toBeNull();

      // If isWaitingForOperand is true, does nothing
      state = { ...INITIAL_STATE, displayValue: '55', isWaitingForOperand: true };
      state = calculatorReducer(state, { type: 'DELETE_LAST_DIGIT' });
      expect(state.displayValue).toBe('55');

      // Negative single digit backspace resets to 0
      state = { ...INITIAL_STATE, displayValue: '-5' };
      state = calculatorReducer(state, { type: 'DELETE_LAST_DIGIT' });
      expect(state.displayValue).toBe('0');
    });

    it('resets state on CLEAR_ALL but preserves history', () => {
      const existingHistory: HistoryItem[] = [
        {
          id: '1',
          expression: '1 + 1 = 2',
          formatted: '2',
          operation: 'add',
          timestamp: Date.now(),
        },
      ];

      const modifiedState = {
        ...INITIAL_STATE,
        displayValue: '99',
        previousOperand: '10',
        pendingOperation: 'add' as const,
        history: existingHistory,
      };

      const state = calculatorReducer(modifiedState, { type: 'CLEAR_ALL' });
      expect(state.displayValue).toBe('0');
      expect(state.previousOperand).toBeNull();
      expect(state.pendingOperation).toBeNull();
      expect(state.history).toHaveLength(1);
    });

    it('handles binary operator selection and operator switching', () => {
      // Select add
      let state = calculatorReducer(
        { ...INITIAL_STATE, displayValue: '42' },
        { type: 'SET_FIRST_OPERAND', operation: 'add' }
      );
      expect(state.previousOperand).toBe('42');
      expect(state.pendingOperation).toBe('add');
      expect(state.isWaitingForOperand).toBe(true);
      expect(state.expressionPreview).toBe('42 +');

      // Switch to multiply while waiting for operand
      state = calculatorReducer(state, {
        type: 'SWITCH_OPERATION',
        operation: 'multiply',
      });
      expect(state.pendingOperation).toBe('multiply');
      expect(state.expressionPreview).toBe('42 ×');
    });

    it('handles calculation success and history recording', () => {
      const mockData: CalculationData = {
        operation: 'add',
        operand_a: '0.1',
        operand_b: '0.2',
        result: 0.3,
        formatted: '0.3',
        expression: '0.1 + 0.2 = 0.3',
      };

      const state = calculatorReducer(INITIAL_STATE, {
        type: 'CALCULATION_SUCCESS',
        data: mockData,
      });

      expect(state.displayValue).toBe('0.3');
      expect(state.expressionPreview).toBe('0.1 + 0.2 = 0.3');
      expect(state.isWaitingForOperand).toBe(true);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].formatted).toBe('0.3');
    });

    it('caps history at 10 items', () => {
      let state = INITIAL_STATE;
      for (let i = 1; i <= 15; i++) {
        const mockData: CalculationData = {
          operation: 'add',
          operand_a: `${i}`,
          operand_b: '1',
          result: i + 1,
          formatted: `${i + 1}`,
          expression: `${i} + 1 = ${i + 1}`,
        };
        state = calculatorReducer(state, {
          type: 'CALCULATION_SUCCESS',
          data: mockData,
        });
      }
      expect(state.history).toHaveLength(10);
      expect(state.history[0].formatted).toBe('16');
    });

    it('handles chained calculation success', () => {
      const mockData: CalculationData = {
        operation: 'add',
        operand_a: '10',
        operand_b: '5',
        result: 15,
        formatted: '15',
        expression: '10 + 5 = 15',
      };

      const state = calculatorReducer(INITIAL_STATE, {
        type: 'CALCULATION_SUCCESS',
        data: mockData,
        nextOperation: 'multiply',
        isChained: true,
      });

      expect(state.displayValue).toBe('15');
      expect(state.previousOperand).toBe('15');
      expect(state.pendingOperation).toBe('multiply');
      expect(state.expressionPreview).toBe('15 ×');
      expect(state.isWaitingForOperand).toBe(true);
    });

    it('handles PERCENT_BINARY_INTERMEDIATE', () => {
      const state = calculatorReducer(
        {
          ...INITIAL_STATE,
          displayValue: '20',
          previousOperand: '150',
          pendingOperation: 'add',
        },
        {
          type: 'PERCENT_BINARY_INTERMEDIATE',
          formatted: '30',
          previousOperand: '150',
          pendingOperation: 'add',
        }
      );

      expect(state.displayValue).toBe('30');
      expect(state.expressionPreview).toBe('150 + 30');
      expect(state.isWaitingForOperand).toBe(true);
    });

    it('handles history item selection and clear history', () => {
      const item: HistoryItem = {
        id: 'h1',
        expression: '4 * 5 = 20',
        formatted: '20',
        operation: 'multiply',
        timestamp: Date.now(),
      };

      let state = calculatorReducer(
        { ...INITIAL_STATE, history: [item] },
        { type: 'SELECT_HISTORY_ITEM', item }
      );
      expect(state.displayValue).toBe('20');
      expect(state.isWaitingForOperand).toBe(true);

      state = calculatorReducer(state, { type: 'CLEAR_HISTORY' });
      expect(state.history).toHaveLength(0);
    });

    it('handles DISMISS_ERROR', () => {
      const state = calculatorReducer(
        {
          ...INITIAL_STATE,
          error: { code: 'ERR_TEST', message: 'Test' },
        },
        { type: 'DISMISS_ERROR' }
      );
      expect(state.error).toBeNull();
    });
  });

  describe('useCalculator hook actions', () => {
    it('executes sqrt calculation cleanly', async () => {
      const mockResult: CalculationData = {
        operation: 'sqrt',
        operand_a: '144',
        result: 12,
        formatted: '12',
        expression: 'sqrt(144) = 12',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('1');
        result.current.inputDigit('4');
        result.current.inputDigit('4');
      });

      await act(async () => {
        await result.current.executeSqrt();
      });

      expect(result.current.displayValue).toBe('12');
      expect(result.current.expressionPreview).toBe('sqrt(144) = 12');
      expect(result.current.history).toHaveLength(1);
    });

    it('handles sqrt error cleanly', async () => {
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValue(
        new calculatorApi.CalculatorApiError(
          422,
          'ERR_NEGATIVE_RADICAND',
          'Square root of negative number is undefined.'
        )
      );

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('4');
        result.current.toggleSign();
      });

      await act(async () => {
        await result.current.executeSqrt();
      });

      expect(result.current.error?.code).toBe('ERR_NEGATIVE_RADICAND');
      expect(result.current.error?.message).toContain('negative number');

      act(() => {
        result.current.dismissError();
      });
      expect(result.current.error).toBeNull();
    });

    it('executes unary percentage', async () => {
      const mockResult: CalculationData = {
        operation: 'percent',
        operand_a: '50',
        result: 0.5,
        formatted: '0.5',
        expression: '50% = 0.5',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('5');
        result.current.inputDigit('0');
      });

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.displayValue).toBe('0.5');
      expect(result.current.expressionPreview).toBe('50% = 0.5');
    });

    it('executes binary percentage intermediate mode', async () => {
      const mockResult: CalculationData = {
        operation: 'percent',
        operand_a: '20',
        operand_b: '150',
        result: 30,
        formatted: '30',
        expression: '20% of 150 = 30',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('1');
        result.current.inputDigit('5');
        result.current.inputDigit('0');
        result.current.selectOperation('add');
        result.current.inputDigit('2');
        result.current.inputDigit('0');
      });

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.displayValue).toBe('30');
      expect(result.current.expressionPreview).toBe('150 + 30');
    });

    it('executes binary percentage direct mode when pendingOperation is percent', async () => {
      const mockResult: CalculationData = {
        operation: 'percent',
        operand_a: '200',
        operand_b: '10',
        result: 20,
        formatted: '20',
        expression: '200% of 10 = 20',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('2');
        result.current.inputDigit('0');
        result.current.inputDigit('0');
        result.current.selectOperation('percent');
        result.current.inputDigit('1');
        result.current.inputDigit('0');
      });

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.displayValue).toBe('20');
    });

    it('executes chained calculation on subsequent operator press', async () => {
      const mockResult: CalculationData = {
        operation: 'add',
        operand_a: '10',
        operand_b: '5',
        result: 15,
        formatted: '15',
        expression: '10 + 5 = 15',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('1');
        result.current.inputDigit('0');
        result.current.selectOperation('add');
        result.current.inputDigit('5');
      });

      await act(async () => {
        await result.current.selectOperation('multiply');
      });

      expect(result.current.displayValue).toBe('15');
      expect(result.current.previousOperand).toBe('15');
      expect(result.current.pendingOperation).toBe('multiply');
    });

    it('executes evaluate cleanly and updates history', async () => {
      const mockResult: CalculationData = {
        operation: 'divide',
        operand_a: '20',
        operand_b: '4',
        result: 5,
        formatted: '5',
        expression: '20 / 4 = 5',
      };

      vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockResult);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('2');
        result.current.inputDigit('0');
        result.current.selectOperation('divide');
        result.current.inputDigit('4');
      });

      await act(async () => {
        await result.current.evaluate();
      });

      expect(result.current.displayValue).toBe('5');
      expect(result.current.history).toHaveLength(1);

      // Select history item
      act(() => {
        result.current.selectHistoryItem(result.current.history[0]);
      });
      expect(result.current.displayValue).toBe('5');

      // Clear history
      act(() => {
        result.current.clearHistory();
      });
      expect(result.current.history).toHaveLength(0);
    });

    it('handles unexpected generic error during evaluate', async () => {
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValue(
        new Error('Network crash')
      );

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('2');
        result.current.selectOperation('add');
        result.current.inputDigit('2');
      });

      await act(async () => {
        await result.current.evaluate();
      });

      expect(result.current.error?.code).toBe('ERR_UNEXPECTED');
    });

    it('does nothing when evaluate is called without pending operation or previous operand', async () => {
      const calculateSpy = vi.spyOn(calculatorApi, 'calculate');
      const { result } = renderHook(() => useCalculator());

      await act(async () => {
        await result.current.evaluate();
      });

      expect(calculateSpy).not.toHaveBeenCalled();
    });

    it('handles CalculatorApiError and generic error during chained selectOperation', async () => {
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new calculatorApi.CalculatorApiError(422, 'ERR_NUMERIC_OVERFLOW', 'Overflow occurred')
      );

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('1');
        result.current.selectOperation('add');
        result.current.inputDigit('2');
      });

      await act(async () => {
        await result.current.selectOperation('multiply');
      });

      expect(result.current.error?.code).toBe('ERR_NUMERIC_OVERFLOW');

      // Generic error during chained op
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new Error('Unexpected network exception')
      );

      await act(async () => {
        await result.current.selectOperation('multiply');
      });

      expect(result.current.error?.code).toBe('ERR_UNEXPECTED');
    });

    it('handles CalculatorApiError and generic error during unary and binary executePercent', async () => {
      // Unary percent error
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new Error('Unary percent failed')
      );

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('5');
      });

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.error?.code).toBe('ERR_UNEXPECTED');

      // Binary percent error (CalculatorApiError)
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new calculatorApi.CalculatorApiError(422, 'ERR_NUMERIC_OVERFLOW', 'Overflow')
      );

      act(() => {
        result.current.inputDigit('1');
        result.current.selectOperation('add');
        result.current.inputDigit('2');
      });

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.error?.code).toBe('ERR_NUMERIC_OVERFLOW');

      // Binary percent generic error
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new Error('Binary percent failed')
      );

      await act(async () => {
        await result.current.executePercent();
      });

      expect(result.current.error?.code).toBe('ERR_UNEXPECTED');
    });

    it('handles generic error during executeSqrt', async () => {
      vi.spyOn(calculatorApi, 'calculate').mockRejectedValueOnce(
        new Error('Unexpected sqrt failure')
      );

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('9');
      });

      await act(async () => {
        await result.current.executeSqrt();
      });

      expect(result.current.error?.code).toBe('ERR_UNEXPECTED');
    });
  });
});

