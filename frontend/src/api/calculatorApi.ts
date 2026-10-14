import type {
  CalculateRequest,
  CalculateResponse,
  CalculationData,
  ErrorResponse,
} from '../types/calculator';

export class CalculatorApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string;

  constructor(status: number, code: string, message: string, details?: string) {
    super(message);
    this.name = 'CalculatorApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, CalculatorApiError.prototype);
  }
}

const DEFAULT_TIMEOUT_MS = 8000;

export function getBaseUrl(): string {
  const envUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.replace(/\/+$/, '');
}

export async function calculate(
  payload: CalculateRequest,
  signal?: AbortSignal
): Promise<CalculationData> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/calculate`;

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new CalculatorApiError(
        499,
        'ERR_ABORTED',
        'Calculation request was aborted.'
      );
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorData: ErrorResponse | null = null;
      try {
        errorData = (await response.json()) as ErrorResponse;
      } catch {
        // Non-JSON response body
      }

      if (errorData?.error?.code && errorData?.error?.message) {
        throw new CalculatorApiError(
          response.status,
          errorData.error.code,
          errorData.error.message,
          errorData.error.details
        );
      }

      throw new CalculatorApiError(
        response.status,
        `ERR_HTTP_${response.status}`,
        response.statusText || 'An unexpected HTTP error occurred.'
      );
    }

    const data = (await response.json()) as CalculateResponse;
    return data.data;
  } catch (error) {
    if (error instanceof CalculatorApiError) {
      throw error;
    }

    if (timedOut) {
      throw new CalculatorApiError(
        408,
        'ERR_TIMEOUT',
        'Calculation request timed out after 8 seconds.'
      );
    }

    if (signal?.aborted) {
      throw new CalculatorApiError(
        499,
        'ERR_ABORTED',
        'Calculation request was aborted.'
      );
    }

    throw new CalculatorApiError(
      0,
      'ERR_NETWORK',
      'Unable to reach calculation server. Please check your connection.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/health`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data?.status === 'healthy';
  } catch {
    return false;
  }
}
