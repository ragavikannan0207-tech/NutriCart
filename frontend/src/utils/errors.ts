import type { ApiErrorShape } from '@/types';

/**
 * The single error type surfaced to the UI.
 * Raw technical exceptions from the API layer are never rendered — they are
 * translated into a short, user-friendly sentence here.
 */
export class AppError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;
  readonly cause?: unknown;

  constructor(message: string, options: { status?: number; fieldErrors?: Record<string, string>; cause?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = options.status ?? 0;
    this.fieldErrors = options.fieldErrors;
    this.cause = options.cause;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  toShape(): ApiErrorShape {
    return { status: this.status, message: this.message, fieldErrors: this.fieldErrors };
  }
}

export function toAppError(error: unknown, fallback = 'Something went wrong. Please try again.'): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    if (error.name === 'AbortError') return new AppError('The request timed out. Please try again.', { status: 0 });
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      return new AppError('Unable to reach the NutriCart service right now.', { status: 0, cause: error });
    }
    return new AppError(error.message || fallback, { cause: error });
  }
  return new AppError(fallback, { cause: error });
}

/** Messages used when a business rule blocks an action. */
export const ERROR_MESSAGES = {
  emptyCart: 'Your cart is empty. Add a few groceries before checking out.',
  noAddress: 'Add a delivery address to place this order.',
  noPerson: 'Select who you are shopping for before checking out.',
  invalidPayment: 'Complete the payment details to place this order.',
  productUnavailable: 'This product is currently out of stock.',
  orderNotFound: 'We could not find that order.',
  cancellationExpired: 'Orders can only be cancelled within 60 seconds of being placed.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  notFound: 'That page does not exist in NutriCart.',
  budgetRequired: 'Enter a budget to see your spending summary.',
} as const;

/** Shown instead of raw stack traces on unexpected route/render failures. */
export function friendlyMessage(error: unknown): string {
  const appError = toAppError(error);
  if (appError.isNetworkError) return 'NutriCart could not reach the server. Check your connection and try again.';
  // 401: prefer the server's own message (e.g. "That password is not correct.").
  // The API already answers token failures with the session-expired sentence, and
  // the HTTP client defaults to it when no message is present, so only fall back
  // to the constant when nothing else is available.
  if (appError.isUnauthorized) return appError.message || ERROR_MESSAGES.sessionExpired;
  if (appError.isNotFound) return ERROR_MESSAGES.notFound;
  return appError.message;
}
