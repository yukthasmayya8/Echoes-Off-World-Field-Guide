import type { Response } from 'express';
import { API_VERSION, type ApiErrorDetail, type ApiMeta } from '@echoes/shared';

export function responseMeta(): ApiMeta {
  return {
    apiVersion: API_VERSION,
    timestamp: new Date().toISOString(),
  };
}

/** Every successful endpoint uses this envelope. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
    meta: responseMeta(),
  });
}

/** Every failure uses this envelope and never includes a stack trace. */
export function sendFailure(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    meta: responseMeta(),
  });
}
