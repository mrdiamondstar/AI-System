/**
 * Application error taxonomy. Every thrown error crossing a module boundary
 * must be an AppError with a stable machine-readable code, so API surfaces
 * can map them to RFC 9457 problem+json responses (doc 04 §3).
 */
export type ErrorCode =
  | "not_found"
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limited"
  | "internal";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  not_found: 404,
  validation_failed: 422,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static notFound(resource: string, id?: string): AppError {
    return new AppError(
      "not_found",
      id ? `${resource} '${id}' not found` : `${resource} not found`,
    );
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
