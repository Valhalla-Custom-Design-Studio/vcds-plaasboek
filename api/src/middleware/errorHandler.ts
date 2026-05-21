import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  console.error(`[ERROR] ${statusCode} — ${err.message}`, { stack: err.stack, path: req.path });
  res.status(statusCode).json({ success: false, message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
};

export const createError = (message: string, statusCode = 500, isOperational = true): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = isOperational;
  return err;
};
