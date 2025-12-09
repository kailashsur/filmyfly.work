import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error ${statusCode}: ${message}`).catch(() => {});

  res.status(statusCode).render('error', {
    title: `${statusCode} - Error`,
    message: message,
    statusCode: statusCode
  });
};

