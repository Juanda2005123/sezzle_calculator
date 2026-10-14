import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPanel } from './HistoryPanel';
import type { HistoryItem } from '../types/calculator';

describe('HistoryPanel Component', () => {
  const mockHistory: HistoryItem[] = [
    {
      id: 'h1',
      expression: '10 + 2 = 12',
      formatted: '12',
      operation: 'add',
      timestamp: Date.now(),
    },
    {
      id: 'h2',
      expression: 'sqrt(144) = 12',
      formatted: '12',
      operation: 'sqrt',
      timestamp: Date.now(),
    },
  ];

  it('renders region with toggle button and badge count', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <HistoryPanel
        history={mockHistory}
        onSelectItem={vi.fn()}
        onClearHistory={vi.fn()}
        isOpen={false}
        onToggle={onToggle}
      />
    );

    const toggleBtn = screen.getByRole('button', {
      name: /calculation history/i,
    });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders empty message when history is empty and panel is open', () => {
    render(
      <HistoryPanel
        history={[]}
        onSelectItem={vi.fn()}
        onClearHistory={vi.fn()}
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('No recent calculations')).toBeInTheDocument();
  });

  it('renders history items and handles selection and clear when open', async () => {
    const onSelectItem = vi.fn();
    const onClearHistory = vi.fn();
    const user = userEvent.setup();

    render(
      <HistoryPanel
        history={mockHistory}
        onSelectItem={onSelectItem}
        onClearHistory={onClearHistory}
        isOpen={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('10 + 2 = 12')).toBeInTheDocument();
    expect(screen.getByText('sqrt(144) = 12')).toBeInTheDocument();

    const itemBtn = screen.getByRole('button', {
      name: /load result 12 from 10 \+ 2 = 12/i,
    });
    await user.click(itemBtn);
    expect(onSelectItem).toHaveBeenCalledWith(mockHistory[0]);

    const clearBtn = screen.getByRole('button', {
      name: /clear calculation history/i,
    });
    await user.click(clearBtn);
    expect(onClearHistory).toHaveBeenCalledTimes(1);
  });
});
