import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, ContentfulStatusCode> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

/**
 * Domain-level error. Services throw these; the root error handler turns them
 * into the `errorSchema` envelope so handlers never format errors themselves.
 */
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: ContentfulStatusCode;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = "HttpError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }

  static statusFor(code: ErrorCode): ContentfulStatusCode {
    return STATUS_BY_CODE[code];
  }

  static unauthorized(message = "Authentication required") {
    return new HttpError("UNAUTHORIZED", message);
  }

  static notFound(message = "Resource not found") {
    return new HttpError("NOT_FOUND", message);
  }
}
