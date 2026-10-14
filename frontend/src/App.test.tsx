import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Smoke Test', () => {
  it('renders the Sezzle Precision Calculator heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', {
      name: /sezzle precision calculator/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();
  });
});
