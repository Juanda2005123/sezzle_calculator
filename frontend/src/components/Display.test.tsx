import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Display } from './Display';

describe('Display Component', () => {
  it('renders display value with accessible ARIA live status role', () => {
    render(
      <Display
        displayValue="42"
        expressionPreview="40 + 2"
        isLoading={false}
      />
    );

    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('42');
    expect(display).toHaveAttribute('role', 'status');
    expect(display).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('40 + 2')).toBeInTheDocument();
  });

  it('renders loading indicator when isLoading is true', () => {
    const { rerender } = render(
      <Display displayValue="0" expressionPreview="" isLoading={true} />
    );

    expect(screen.getByLabelText('Calculating')).toBeInTheDocument();
    expect(screen.getByText('Calculating')).toBeInTheDocument();

    rerender(
      <Display displayValue="0" expressionPreview="" isLoading={false} />
    );
    expect(screen.queryByLabelText('Calculating')).not.toBeInTheDocument();
  });

  it('adjusts text size classes based on string length', () => {
    const { rerender } = render(
      <Display displayValue="12345" expressionPreview="" isLoading={false} />
    );
    let display = screen.getByTestId('calculator-display');
    expect(display.className).toContain('text-4xl');

    // 11 to 14 chars
    rerender(
      <Display
        displayValue="12345678901"
        expressionPreview=""
        isLoading={false}
      />
    );
    display = screen.getByTestId('calculator-display');
    expect(display.className).toContain('text-3xl');

    // 15 to 18 chars
    rerender(
      <Display
        displayValue="123456789012345"
        expressionPreview=""
        isLoading={false}
      />
    );
    display = screen.getByTestId('calculator-display');
    expect(display.className).toContain('text-2xl');

    // > 18 chars
    rerender(
      <Display
        displayValue="1234567890123456789"
        expressionPreview=""
        isLoading={false}
      />
    );
    display = screen.getByTestId('calculator-display');
    expect(display.className).toContain('text-xl');
  });
});
