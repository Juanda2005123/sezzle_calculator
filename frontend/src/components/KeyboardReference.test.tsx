import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardReference } from './KeyboardReference';

describe('KeyboardReference Component', () => {
  it('toggles keyboard reference panel on button click', async () => {
    const user = userEvent.setup();
    render(<KeyboardReference />);

    const toggleBtn = screen.getByRole('button', {
      name: /keyboard shortcuts reference/i,
    });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(/input digits/i)
    ).not.toBeInTheDocument();

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/input digits/i)).toBeInTheDocument();
    expect(screen.getByText(/square root/i)).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
