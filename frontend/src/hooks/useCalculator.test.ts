import { describe, it, expect } from 'vitest';
import { calculatorReducer, INITIAL_STATE } from './useCalculator';
import type { CalculationData, HistoryItem } from '../types/calculator';

describe('calculatorReducer', () => {
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
  });

  it('handles decimal input correctly', () => {
    let state = calculatorReducer(INITIAL_STATE, { type: 'INPUT_DECIMAL' });
    expect(state.displayValue).toBe('0.');

    state = calculatorReducer(state, { type: 'INPUT_DIGIT', digit: '5' });
    expect(state.displayValue).toBe('0.5');

    // Second decimal point ignored
    state = calculatorReducer(state, { type: 'INPUT_DECIMAL' });
    expect(state.displayValue).toBe('0.5');
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
});
