import { useReducer, useCallback, useRef } from 'react';
import type {
  ApiErrorDetail,
  CalculationData,
  HistoryItem,
  Operation,
} from '../types/calculator';
import { OPERATION_SYMBOLS } from '../types/calculator';
import { calculate, CalculatorApiError } from '../api/calculatorApi';

export interface CalculatorState {
  displayValue: string;
  previousOperand: string | null;
  pendingOperation: Operation | null;
  expressionPreview: string;
  isWaitingForOperand: boolean;
  isLoading: boolean;
  error: ApiErrorDetail | null;
  history: HistoryItem[];
}

export const INITIAL_STATE: CalculatorState = {
  displayValue: '0',
  previousOperand: null,
  pendingOperation: null,
  expressionPreview: '',
  isWaitingForOperand: false,
  isLoading: false,
  error: null,
  history: [],
};

const MAX_INPUT_LENGTH = 24;
const MAX_HISTORY_LENGTH = 10;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `calc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CalculatorAction =
  | { type: 'INPUT_DIGIT'; digit: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'DELETE_LAST_DIGIT' }
  | { type: 'CLEAR_ALL' }
  | { type: 'DISMISS_ERROR' }
  | { type: 'SET_FIRST_OPERAND'; operation: Operation }
  | { type: 'SWITCH_OPERATION'; operation: Operation }
  | { type: 'START_CALCULATION' }
  | {
      type: 'CALCULATION_SUCCESS';
      data: CalculationData;
      nextOperation?: Operation | null;
      isChained?: boolean;
    }
  | { type: 'CALCULATION_ERROR'; error: ApiErrorDetail }
  | {
      type: 'PERCENT_BINARY_INTERMEDIATE';
      formatted: string;
      previousOperand: string;
      pendingOperation: Operation;
    }
  | { type: 'SELECT_HISTORY_ITEM'; item: HistoryItem }
  | { type: 'CLEAR_HISTORY' };

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case 'INPUT_DIGIT': {
      const { digit } = action;
      if (state.isWaitingForOperand) {
        return {
          ...state,
          displayValue: digit === '.' ? '0.' : digit,
          isWaitingForOperand: false,
          error: null,
        };
      }

      if (state.displayValue.length >= MAX_INPUT_LENGTH) {
        return { ...state, error: null };
      }

      if (state.displayValue === '0') {
        return {
          ...state,
          displayValue: digit === '0' ? '0' : digit,
          error: null,
        };
      }

      if (state.displayValue === '-0') {
        return {
          ...state,
          displayValue: digit === '0' ? '-0' : `-${digit}`,
          error: null,
        };
      }

      return {
        ...state,
        displayValue: state.displayValue + digit,
        error: null,
      };
    }

    case 'INPUT_DECIMAL': {
      if (state.isWaitingForOperand) {
        return {
          ...state,
          displayValue: '0.',
          isWaitingForOperand: false,
          error: null,
        };
      }

      if (state.displayValue.includes('.')) {
        return { ...state, error: null };
      }

      if (state.displayValue.length >= MAX_INPUT_LENGTH) {
        return { ...state, error: null };
      }

      return {
        ...state,
        displayValue: `${state.displayValue}.`,
        error: null,
      };
    }

    case 'TOGGLE_SIGN': {
      if (state.displayValue === '0' || state.displayValue === '') {
        return state;
      }

      const next = state.displayValue.startsWith('-')
        ? state.displayValue.slice(1)
        : `-${state.displayValue}`;

      return {
        ...state,
        displayValue: next,
      };
    }

    case 'DELETE_LAST_DIGIT': {
      if (state.error !== null) {
        return { ...state, error: null };
      }

      if (state.isWaitingForOperand) {
        return state;
      }

      const next = state.displayValue.slice(0, -1);
      const normalized =
        next === '' || next === '-' || next === '-0' ? '0' : next;

      return {
        ...state,
        displayValue: normalized,
      };
    }

    case 'CLEAR_ALL': {
      return {
        ...INITIAL_STATE,
        history: state.history,
      };
    }

    case 'DISMISS_ERROR': {
      return {
        ...state,
        error: null,
      };
    }

    case 'SET_FIRST_OPERAND': {
      return {
        ...state,
        previousOperand: state.displayValue,
        pendingOperation: action.operation,
        isWaitingForOperand: true,
        expressionPreview: `${state.displayValue} ${OPERATION_SYMBOLS[action.operation]}`,
        error: null,
      };
    }

    case 'SWITCH_OPERATION': {
      return {
        ...state,
        pendingOperation: action.operation,
        expressionPreview: `${state.previousOperand} ${OPERATION_SYMBOLS[action.operation]}`,
        error: null,
      };
    }

    case 'START_CALCULATION': {
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    }

    case 'CALCULATION_SUCCESS': {
      const { data, nextOperation, isChained } = action;
      const historyItem: HistoryItem = {
        id: generateId(),
        expression: data.expression,
        formatted: data.formatted,
        operation: data.operation,
        timestamp: Date.now(),
      };

      const updatedHistory = [historyItem, ...state.history].slice(
        0,
        MAX_HISTORY_LENGTH
      );

      if (isChained && nextOperation) {
        return {
          ...state,
          displayValue: data.formatted,
          previousOperand: data.formatted,
          pendingOperation: nextOperation,
          expressionPreview: `${data.formatted} ${OPERATION_SYMBOLS[nextOperation]}`,
          isWaitingForOperand: true,
          isLoading: false,
          error: null,
          history: updatedHistory,
        };
      }

      return {
        ...state,
        displayValue: data.formatted,
        previousOperand: null,
        pendingOperation: null,
        expressionPreview: data.expression,
        isWaitingForOperand: true,
        isLoading: false,
        error: null,
        history: updatedHistory,
      };
    }

    case 'CALCULATION_ERROR': {
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    }

    case 'PERCENT_BINARY_INTERMEDIATE': {
      return {
        ...state,
        displayValue: action.formatted,
        expressionPreview: `${action.previousOperand} ${OPERATION_SYMBOLS[action.pendingOperation]} ${action.formatted}`,
        isWaitingForOperand: true,
        isLoading: false,
        error: null,
      };
    }

    case 'SELECT_HISTORY_ITEM': {
      return {
        ...state,
        displayValue: action.item.formatted,
        isWaitingForOperand: true,
        error: null,
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: [],
      };
    }

    default:
      return state;
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const inputDigit = useCallback((digit: string) => {
    dispatch({ type: 'INPUT_DIGIT', digit });
  }, []);

  const inputDecimal = useCallback(() => {
    dispatch({ type: 'INPUT_DECIMAL' });
  }, []);

  const toggleSign = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIGN' });
  }, []);

  const deleteLastDigit = useCallback(() => {
    dispatch({ type: 'DELETE_LAST_DIGIT' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: 'DISMISS_ERROR' });
  }, []);

  const executeSqrt = useCallback(async () => {
    const current = stateRef.current;
    if (current.isLoading) return;

    dispatch({ type: 'START_CALCULATION' });
    try {
      const data = await calculate({
        operation: 'sqrt',
        operand_a: current.displayValue,
      });
      dispatch({ type: 'CALCULATION_SUCCESS', data });
    } catch (err) {
      if (err instanceof CalculatorApiError) {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      } else {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: 'ERR_UNEXPECTED',
            message: 'An unexpected error occurred during calculation.',
          },
        });
      }
    }
  }, []);

  const executePercent = useCallback(async () => {
    const current = stateRef.current;
    if (current.isLoading) return;

    // Unary percentage mode
    if (current.previousOperand === null || current.pendingOperation === null) {
      dispatch({ type: 'START_CALCULATION' });
      try {
        const data = await calculate({
          operation: 'percent',
          operand_a: current.displayValue,
        });
        dispatch({ type: 'CALCULATION_SUCCESS', data });
      } catch (err) {
        if (err instanceof CalculatorApiError) {
          dispatch({
            type: 'CALCULATION_ERROR',
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          });
        } else {
          dispatch({
            type: 'CALCULATION_ERROR',
            error: {
              code: 'ERR_UNEXPECTED',
              message: 'An unexpected error occurred during calculation.',
            },
          });
        }
      }
      return;
    }

    // Binary percentage mode
    dispatch({ type: 'START_CALCULATION' });
    try {
      if (current.pendingOperation === 'percent') {
        const data = await calculate({
          operation: 'percent',
          operand_a: current.previousOperand,
          operand_b: current.displayValue,
        });
        dispatch({ type: 'CALCULATION_SUCCESS', data });
      } else {
        // e.g. 150 + 20% -> compute 20% of 150 = 30
        const data = await calculate({
          operation: 'percent',
          operand_a: current.displayValue,
          operand_b: current.previousOperand,
        });
        dispatch({
          type: 'PERCENT_BINARY_INTERMEDIATE',
          formatted: data.formatted,
          previousOperand: current.previousOperand,
          pendingOperation: current.pendingOperation,
        });
      }
    } catch (err) {
      if (err instanceof CalculatorApiError) {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      } else {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: 'ERR_UNEXPECTED',
            message: 'An unexpected error occurred during calculation.',
          },
        });
      }
    }
  }, []);

  const selectOperation = useCallback(async (op: Operation) => {
    const current = stateRef.current;
    if (current.isLoading) return;

    // Case 1: Switching operation while waiting for second operand
    if (current.pendingOperation !== null && current.isWaitingForOperand) {
      dispatch({ type: 'SWITCH_OPERATION', operation: op });
      return;
    }

    // Case 2: Chained calculation (e.g., 5 + 3, now user presses *)
    if (
      current.previousOperand !== null &&
      current.pendingOperation !== null &&
      !current.isWaitingForOperand
    ) {
      dispatch({ type: 'START_CALCULATION' });
      try {
        const data = await calculate({
          operation: current.pendingOperation,
          operand_a: current.previousOperand,
          operand_b: current.displayValue,
        });
        dispatch({
          type: 'CALCULATION_SUCCESS',
          data,
          nextOperation: op,
          isChained: true,
        });
      } catch (err) {
        if (err instanceof CalculatorApiError) {
          dispatch({
            type: 'CALCULATION_ERROR',
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          });
        } else {
          dispatch({
            type: 'CALCULATION_ERROR',
            error: {
              code: 'ERR_UNEXPECTED',
              message: 'An unexpected error occurred during calculation.',
            },
          });
        }
      }
      return;
    }

    // Case 3: Standard first operator selection
    dispatch({ type: 'SET_FIRST_OPERAND', operation: op });
  }, []);

  const evaluate = useCallback(async () => {
    const current = stateRef.current;
    if (current.isLoading) return;
    if (current.pendingOperation === null || current.previousOperand === null) {
      return;
    }

    dispatch({ type: 'START_CALCULATION' });
    try {
      const data = await calculate({
        operation: current.pendingOperation,
        operand_a: current.previousOperand,
        operand_b: current.displayValue,
      });
      dispatch({ type: 'CALCULATION_SUCCESS', data });
    } catch (err) {
      if (err instanceof CalculatorApiError) {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      } else {
        dispatch({
          type: 'CALCULATION_ERROR',
          error: {
            code: 'ERR_UNEXPECTED',
            message: 'An unexpected error occurred during calculation.',
          },
        });
      }
    }
  }, []);

  const selectHistoryItem = useCallback((item: HistoryItem) => {
    dispatch({ type: 'SELECT_HISTORY_ITEM', item });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  return {
    ...state,
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
  };
}
