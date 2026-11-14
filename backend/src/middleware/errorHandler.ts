import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendFailure } from '../utils/response';

interface BodyParserError extends SyntaxError {
  status?: number;
  type?: string;
}

/**
 * Central error boundary. Internal details and stack traces stay in the
 * server log; clients receive a stable envelope.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  if (error instanceof AppError) {
    sendFailure(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendFailure(
      res,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
    return;
  }

  const bodyError = error as BodyParserError;
  if (bodyError instanceof SyntaxError && bodyError.status === 400) {
    sendFailure(res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
    return;
  }

  console.error('[echoes] Unhandled API error:', error);
  sendFailure(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred');
}
