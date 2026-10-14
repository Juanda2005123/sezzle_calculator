import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculate,
  checkHealth,
  CalculatorApiError,
  getBaseUrl,
} from './calculatorApi';
import type { CalculateRequest, CalculateResponse } from '../types/calculator';

describe('calculatorApi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('CalculatorApiError', () => {
    it('sets properties correctly', () => {
      const err = new CalculatorApiError(
        422,
        'ERR_DIVISION_BY_ZERO',
        'Division by zero is undefined.',
        'divisor cannot be zero'
      );
      expect(err.name).toBe('CalculatorApiError');
      expect(err.status).toBe(422);
      expect(err.code).toBe('ERR_DIVISION_BY_ZERO');
      expect(err.message).toBe('Division by zero is undefined.');
      expect(err.details).toBe('divisor cannot be zero');
      expect(err instanceof Error).toBe(true);
      expect(err instanceof CalculatorApiError).toBe(true);
    });
  });

  describe('getBaseUrl', () => {
    it('returns empty string or trimmed url', () => {
      expect(typeof getBaseUrl()).toBe('string');
    });
  });

  describe('calculate', () => {
    it('sends POST request and returns data on 200 OK', async () => {
      const mockResponse: CalculateResponse = {
        data: {
          operation: 'add',
          operand_a: '0.1',
          operand_b: '0.2',
          result: 0.3,
          formatted: '0.3',
          expression: '0.1 + 0.2 = 0.3',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const payload: CalculateRequest = {
        operation: 'add',
        operand_a: '0.1',
        operand_b: '0.2',
      };

      const result = await calculate(payload);
      expect(result).toEqual(mockResponse.data);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('throws CalculatorApiError on backend error response with JSON body', async () => {
      const mockErrorResponse = {
        error: {
          code: 'ERR_DIVISION_BY_ZERO',
          message: 'Division by zero is undefined.',
          details: 'operand_b was 0',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => mockErrorResponse,
      } as unknown as Response);

      await expect(
        calculate({ operation: 'divide', operand_a: '10', operand_b: '0' })
      ).rejects.toThrow(CalculatorApiError);

      try {
        await calculate({
          operation: 'divide',
          operand_a: '10',
          operand_b: '0',
        });
      } catch (err) {
        expect(err).toBeInstanceOf(CalculatorApiError);
        const apiErr = err as CalculatorApiError;
        expect(apiErr.status).toBe(422);
        expect(apiErr.code).toBe('ERR_DIVISION_BY_ZERO');
        expect(apiErr.message).toBe('Division by zero is undefined.');
        expect(apiErr.details).toBe('operand_b was 0');
      }
    });

    it('throws generic HTTP error when non-200 response body is not JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      } as unknown as Response);

      try {
        await calculate({ operation: 'add', operand_a: '1', operand_b: '1' });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CalculatorApiError);
        const apiErr = err as CalculatorApiError;
        expect(apiErr.status).toBe(500);
        expect(apiErr.code).toBe('ERR_HTTP_500');
        expect(apiErr.message).toBe('Internal Server Error');
      }
    });

    it('throws generic HTTP error with fallback message when statusText is empty', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: '',
        json: async () => {
          throw new Error('Not JSON');
        },
      } as unknown as Response);

      try {
        await calculate({ operation: 'add', operand_a: '1', operand_b: '1' });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CalculatorApiError);
        const apiErr = err as CalculatorApiError;
        expect(apiErr.status).toBe(502);
        expect(apiErr.code).toBe('ERR_HTTP_502');
        expect(apiErr.message).toBe('An unexpected HTTP error occurred.');
      }
    });

    it('throws ERR_ABORTED when caller signal is already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      try {
        await calculate(
          { operation: 'add', operand_a: '1', operand_b: '2' },
          abortController.signal
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CalculatorApiError);
        const apiErr = err as CalculatorApiError;
        expect(apiErr.status).toBe(499);
        expect(apiErr.code).toBe('ERR_ABORTED');
      }
    });

    it('throws ERR_ABORTED when caller signal aborts during fetch', async () => {
      const abortController = new AbortController();

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        abortController.abort();
        throw new DOMException('The user aborted a request.', 'AbortError');
      });

      try {
        await calculate(
          { operation: 'add', operand_a: '1', operand_b: '2' },
          abortController.signal
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CalculatorApiError);
        const apiErr = err as CalculatorApiError;
        expect(apiErr.status).toBe(499);
        expect(apiErr.code).toBe('ERR_ABORTED');
      }
    });

    it('throws ERR_NETWORK on fetch network rejection', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        calculate({ operation: 'add', operand_a: '1', operand_b: '2' })
      ).rejects.toThrow(CalculatorApiError);

      try {
        await calculate({
          operation: 'add',
          operand_a: '1',
          operand_b: '2',
        });
      } catch (err) {
        const apiErr = err as CalculatorApiError;
        expect(apiErr.code).toBe('ERR_NETWORK');
        expect(apiErr.message).toContain('Unable to reach calculation server');
      }
    });
  });

  describe('checkHealth', () => {
    it('returns true on 200 OK with status: healthy', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      } as unknown as Response);

      const healthy = await checkHealth();
      expect(healthy).toBe(true);
    });

    it('returns false on non-200 response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as unknown as Response);

      const healthy = await checkHealth();
      expect(healthy).toBe(false);
    });

    it('returns false on fetch exception', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const healthy = await checkHealth();
      expect(healthy).toBe(false);
    });
  });
});
