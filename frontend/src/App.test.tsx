import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as calculatorApi from './api/calculatorApi';
import type { CalculationData } from './types/calculator';

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Sezzle Precision Calculator heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', {
      name: /sezzle precision calculator/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();
  });

  it('executes core binary operation (0.1 + 0.2 = 0.3) preserving decimal precision', async () => {
    const user = userEvent.setup();
    const mockData: CalculationData = {
      operation: 'add',
      operand_a: '0.1',
      operand_b: '0.2',
      result: 0.3,
      formatted: '0.3',
      expression: '0.1 + 0.2 = 0.3',
    };

    const calculateSpy = vi
      .spyOn(calculatorApi, 'calculate')
      .mockResolvedValue(mockData);

    render(<App />);

    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Decimal Point' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Decimal Point' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'add',
      operand_a: '0.1',
      operand_b: '0.2',
    });

    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('0.3');
    expect(screen.getByText('0.1 + 0.2 = 0.3')).toBeInTheDocument();
  });

  it('executes advanced operations: square root, power, and percentages', async () => {
    const user = userEvent.setup();

    // 1. Square root
    const sqrtData: CalculationData = {
      operation: 'sqrt',
      operand_a: '144',
      result: 12,
      formatted: '12',
      expression: 'sqrt(144) = 12',
    };
    const calculateSpy = vi
      .spyOn(calculatorApi, 'calculate')
      .mockResolvedValueOnce(sqrtData);

    render(<App />);

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Square Root' }));

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'sqrt',
      operand_a: '144',
    });
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('12');

    // 2. Power: 2 ^ 3 = 8
    const powerData: CalculationData = {
      operation: 'power',
      operand_a: '2',
      operand_b: '3',
      result: 8,
      formatted: '8',
      expression: '2 ^ 3 = 8',
    };
    calculateSpy.mockResolvedValueOnce(powerData);

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Power' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'power',
      operand_a: '2',
      operand_b: '3',
    });
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('8');

    // 3. Unary Percentage: 50% = 0.5
    const percentData: CalculationData = {
      operation: 'percent',
      operand_a: '50',
      result: 0.5,
      formatted: '0.5',
      expression: '50% = 0.5',
    };
    calculateSpy.mockResolvedValueOnce(percentData);

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Percentage' }));

    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0.5');

    // 4. Binary Percentage: 150 + 20% -> 30, then Equals -> 180
    const binaryPercentData: CalculationData = {
      operation: 'percent',
      operand_a: '20',
      operand_b: '150',
      result: 30,
      formatted: '30',
      expression: '20% of 150 = 30',
    };
    const addPercentData: CalculationData = {
      operation: 'add',
      operand_a: '150',
      operand_b: '30',
      result: 180,
      formatted: '180',
      expression: '150 + 30 = 180',
    };
    calculateSpy
      .mockResolvedValueOnce(binaryPercentData)
      .mockResolvedValueOnce(addPercentData);

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Percentage' }));

    expect(screen.getByTestId('calculator-display')).toHaveTextContent('30');

    await user.click(screen.getByRole('button', { name: 'Equals' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('180');
  });

  it('handles chained operations and operator switching', async () => {
    const user = userEvent.setup();
    const calculateSpy = vi.spyOn(calculatorApi, 'calculate');

    render(<App />);

    // Operator switching: clicks 5, +, then switches to * without calling API
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Multiply' }));

    expect(calculateSpy).not.toHaveBeenCalled();

    // Enters 3, = -> calculates 5 * 3 = 15
    const mulData: CalculationData = {
      operation: 'multiply',
      operand_a: '5',
      operand_b: '3',
      result: 15,
      formatted: '15',
      expression: '5 * 3 = 15',
    };
    calculateSpy.mockResolvedValueOnce(mulData);

    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'multiply',
      operand_a: '5',
      operand_b: '3',
    });
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('15');

    // Chained operation: 10 + 5 - 3 = 12
    const addData: CalculationData = {
      operation: 'add',
      operand_a: '10',
      operand_b: '5',
      result: 15,
      formatted: '15',
      expression: '10 + 5 = 15',
    };
    const subData: CalculationData = {
      operation: 'subtract',
      operand_a: '15',
      operand_b: '3',
      result: 12,
      formatted: '12',
      expression: '15 - 3 = 12',
    };
    calculateSpy.mockResolvedValueOnce(addData).mockResolvedValueOnce(subData);

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: 'Subtract' })); // triggers add calculation

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'add',
      operand_a: '10',
      operand_b: '5',
    });

    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    expect(calculateSpy).toHaveBeenCalledWith({
      operation: 'subtract',
      operand_a: '15',
      operand_b: '3',
    });
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('12');
  });

  it('presents domain errors with role="alert" and allows dismissal', async () => {
    const user = userEvent.setup();
    vi.spyOn(calculatorApi, 'calculate').mockRejectedValue(
      new calculatorApi.CalculatorApiError(
        422,
        'ERR_DIVISION_BY_ZERO',
        'Division by zero is undefined.',
        'divisor cannot be zero'
      )
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: 'Divide' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    const errorBanner = screen.getByTestId('error-banner');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveAttribute('role', 'alert');
    expect(screen.getByText('ERR_DIVISION_BY_ZERO')).toBeInTheDocument();
    expect(
      screen.getByText('Division by zero is undefined.')
    ).toBeInTheDocument();

    // Dismiss button clears error
    await user.click(screen.getByLabelText('Dismiss error'));
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
  });

  it('handles input utilities: multiple decimals, sign toggle, and DEL backspace', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Decimal guard: 1 . . 5 -> 1.5
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Decimal Point' }));
    await user.click(screen.getByRole('button', { name: 'Decimal Point' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('1.5');

    // Toggle sign: 1.5 -> -1.5 -> 1.5
    await user.click(screen.getByRole('button', { name: 'Toggle Sign' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('-1.5');
    await user.click(screen.getByRole('button', { name: 'Toggle Sign' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('1.5');

    // Backspace: 1.5 -> 1. -> 1 -> 0
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('1.');
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');
  });

  it('interacts with HistoryPanel and KeyboardReference', async () => {
    const user = userEvent.setup();
    const mockData: CalculationData = {
      operation: 'multiply',
      operand_a: '6',
      operand_b: '7',
      result: 42,
      formatted: '42',
      expression: '6 * 7 = 42',
    };
    vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockData);

    render(<App />);

    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByRole('button', { name: 'Multiply' }));
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    // Open History Panel
    const historyToggle = screen.getByRole('button', {
      name: /calculation history/i,
    });
    await user.click(historyToggle);

    expect(screen.getAllByText('6 * 7 = 42')).toHaveLength(2);

    // Clear display then reload from history
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');

    const historyItem = screen.getByRole('button', {
      name: /load result 42 from 6 \* 7 = 42/i,
    });
    await user.click(historyItem);
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('42');

    // Clear history
    await user.click(screen.getByRole('button', { name: /clear calculation history/i }));
    expect(screen.getByText('No recent calculations')).toBeInTheDocument();

    // Toggle Keyboard Shortcuts reference
    const kbdToggle = screen.getByRole('button', {
      name: /keyboard shortcuts reference/i,
    });
    await user.click(kbdToggle);
    expect(screen.getByText(/input digits/i)).toBeInTheDocument();
  });

  it('drives calculations via physical keyboard events', async () => {
    const mockData: CalculationData = {
      operation: 'multiply',
      operand_a: '8',
      operand_b: '7',
      result: 56,
      formatted: '56',
      expression: '8 * 7 = 56',
    };
    vi.spyOn(calculatorApi, 'calculate').mockResolvedValue(mockData);

    render(<App />);

    fireEvent.keyDown(window, { key: '8' });
    fireEvent.keyDown(window, { key: '*' });
    fireEvent.keyDown(window, { key: '7' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(await screen.findByText('8 * 7 = 56')).toBeInTheDocument();
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('56');

    // Escape clears display
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');
  });
});
