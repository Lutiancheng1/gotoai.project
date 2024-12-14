import { Response } from 'express';

export const successResponse = (res: Response, data: any = null) => {
  return res.json({
    status: 'success',
    data
  });
};

export const errorResponse = (
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500,
  error: any = null
) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
}; 