import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner Component', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(
      <ErrorBanner error={null} onDismiss={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders error code, message, and details with accessible alert role', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <ErrorBanner
        error={{
          code: 'ERR_DIVISION_BY_ZERO',
          message: 'Division by zero is undefined.',
          details: 'Denominator was 0',
        }}
        onDismiss={onDismiss}
      />
    );

    const banner = screen.getByTestId('error-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');

    expect(screen.getByText('ERR_DIVISION_BY_ZERO')).toBeInTheDocument();
    expect(
      screen.getByText('Division by zero is undefined.')
    ).toBeInTheDocument();
    expect(screen.getByText('Denominator was 0')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss error');
    await user.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
