import type { NextFunction, Request, Response } from 'express';
import { sendFailure } from '../utils/response';

/** Terminal 404 for any unmatched route. */
export function notFound(req: Request, res: Response, _next: NextFunction): void {
  sendFailure(res, 404, 'NOT_FOUND', `No API route matches ${req.method} ${req.originalUrl}`);
}
