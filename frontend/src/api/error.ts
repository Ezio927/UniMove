export class ApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
