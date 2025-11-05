import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
  }

  // Handle OpenAI quota errors
  if (err.message && err.message.includes('exceeded your current quota')) {
    logger.error(`429 - OpenAI quota exceeded - ${req.originalUrl} - ${req.method}`);

    return res.status(503).json({
      error: 'AI service temporarily unavailable. Please contact support to add credits to the OpenAI account.',
      status: 503,
    });
  }

  // Handle other OpenAI API errors
  if (err.message && err.message.match(/^(429|401|403|500)/)) {
    logger.error(`${err.message} - ${req.originalUrl} - ${req.method}`);

    return res.status(503).json({
      error: 'AI service temporarily unavailable. Please try again later.',
      status: 503,
    });
  }

  // Unhandled errors
  logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method}`, {
    stack: err.stack,
  });

  return res.status(500).json({
    error: 'Internal server error',
    status: 500,
  });
};
