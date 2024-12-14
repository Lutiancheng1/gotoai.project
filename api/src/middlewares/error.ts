import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/types';
import { errorResponse } from '@/utils/response';

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  return errorResponse(res, message, statusCode, {
    code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
