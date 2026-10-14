import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keypad } from './Keypad';

describe('Keypad Component', () => {
  const setupHandlers = () => ({
    onInputDigit: vi.fn(),
    onInputDecimal: vi.fn(),
    onToggleSign: vi.fn(),
    onDeleteLastDigit: vi.fn(),
    onClearAll: vi.fn(),
    onSelectOperation: vi.fn(),
    onExecuteSqrt: vi.fn(),
    onExecutePercent: vi.fn(),
    onEvaluate: vi.fn(),
  });

  it('renders all key buttons and calls corresponding handlers on click', async () => {
    const handlers = setupHandlers();
    const user = userEvent.setup();

    render(
      <Keypad
        {...handlers}
        pendingOperation={null}
        isLoading={false}
      />
    );

    await user.click(screen.getByRole('button', { name: '7' }));
    expect(handlers.onInputDigit).toHaveBeenCalledWith('7');

    await user.click(screen.getByRole('button', { name: 'Decimal Point' }));
    expect(handlers.onInputDecimal).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Toggle Sign' }));
    expect(handlers.onToggleSign).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(handlers.onDeleteLastDigit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(handlers.onClearAll).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(handlers.onSelectOperation).toHaveBeenCalledWith('add');

    await user.click(screen.getByRole('button', { name: 'Subtract' }));
    expect(handlers.onSelectOperation).toHaveBeenCalledWith('subtract');

    await user.click(screen.getByRole('button', { name: 'Multiply' }));
    expect(handlers.onSelectOperation).toHaveBeenCalledWith('multiply');

    await user.click(screen.getByRole('button', { name: 'Divide' }));
    expect(handlers.onSelectOperation).toHaveBeenCalledWith('divide');

    await user.click(screen.getByRole('button', { name: 'Power' }));
    expect(handlers.onSelectOperation).toHaveBeenCalledWith('power');

    await user.click(screen.getByRole('button', { name: 'Square Root' }));
    expect(handlers.onExecuteSqrt).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Percentage' }));
    expect(handlers.onExecutePercent).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Equals' }));
    expect(handlers.onEvaluate).toHaveBeenCalledTimes(1);
  });

  it('disables all buttons during loading except Clear All (AC)', () => {
    const handlers = setupHandlers();
    render(
      <Keypad
        {...handlers}
        pendingOperation={null}
        isLoading={true}
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear All' });
    expect(clearBtn).not.toBeDisabled();

    const equalsBtn = screen.getByRole('button', { name: 'Equals' });
    expect(equalsBtn).toBeDisabled();

    const digitBtn = screen.getByRole('button', { name: '5' });
    expect(digitBtn).toBeDisabled();

    const addBtn = screen.getByRole('button', { name: 'Add' });
    expect(addBtn).toBeDisabled();
  });

  it('highlights the active operation button', () => {
    const handlers = setupHandlers();
    render(
      <Keypad
        {...handlers}
        pendingOperation="add"
        isLoading={false}
      />
    );

    const addBtn = screen.getByRole('button', { name: 'Add' });
    expect(addBtn.className).toContain('!bg-emerald-500');
  });

  it('applies pressed visual state when activeKey matches', () => {
    const handlers = setupHandlers();
    render(
      <Keypad
        {...handlers}
        pendingOperation={null}
        isLoading={false}
        activeKey="7"
      />
    );

    const sevenBtn = screen.getByRole('button', { name: '7' });
    expect(sevenBtn.className).toContain('scale-95');
  });
});
