import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import type { ApiErrorDetail } from '@echoes/shared';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundError(message: string): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function invalidAnswerError(message: string): AppError {
  return new AppError(400, 'INVALID_ANSWER', message);
}

/** Turn a Zod failure into a 400 with field paths, never a stack trace. */
export function parseOrThrow<S extends ZodTypeAny>(
  schema: S,
  value: unknown,
  context: string,
): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Invalid ${context}`,
      result.error.issues.map((issue) => ({
        path: issue.path.join('.') || context,
        message: issue.message,
      })),
    );
  }
  return result.data;
}
