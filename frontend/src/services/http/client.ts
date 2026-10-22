import { AppError, toAppError } from '@/utils/errors';

/**
 * Thin JSON client for the NutriCart Spring Boot API.
 *
 * In development Vite proxies /api to http://localhost:8080 (see vite.config.ts),
 * so the default empty base URL works out of the box. For a deployed build set
 * VITE_API_BASE_URL to the public API origin.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
const TOKEN_KEY = 'nutricart.v1.apiToken';

let authToken: string | null = (() => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}/api${clean}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = 12_000 } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const shape = (payload ?? {}) as { message?: string; error?: string; fieldErrors?: Record<string, string> };
      throw new AppError(shape.message || shape.error || defaultMessageFor(response.status), {
        status: response.status,
        fieldErrors: shape.fieldErrors,
      });
    }

    return payload as T;
  } catch (error) {
    throw toAppError(error);
  } finally {
    window.clearTimeout(timer);
  }
}

function defaultMessageFor(status: number): string {
  if (status === 400) return 'That request could not be completed. Please check the details and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to that resource.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'That conflicts with data that already exists.';
  return 'The NutriCart service reported an error. Please try again.';
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};

/** True when the Spring Boot backend is reachable. */
export async function probeBackend(timeoutMs = 1500): Promise<boolean> {
  try {
    const health = await request<{ status: string }>('/health', { method: 'GET', timeoutMs });
    return health?.status === 'UP';
  } catch {
    return false;
  }
}
