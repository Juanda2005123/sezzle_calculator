export type Operation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percent';

export interface CalculateRequest {
  operation: Operation;
  operand_a: string | number;
  operand_b?: string | number | null;
}

export interface CalculationData {
  operation: Operation;
  operand_a: string;
  operand_b?: string | null;
  result: number;
  formatted: string;
  expression: string;
}

export interface CalculateResponse {
  data: CalculationData;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: string;
}

export interface ErrorResponse {
  error: ApiErrorDetail;
}

export interface HistoryItem {
  id: string;
  expression: string;
  formatted: string;
  operation: Operation;
  timestamp: number;
}

export const OPERATION_SYMBOLS: Record<Operation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  sqrt: '√',
  percent: '%',
};

export const OPERATION_LABELS: Record<Operation, string> = {
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
  power: 'Power',
  sqrt: 'Square Root',
  percent: 'Percentage',
};
