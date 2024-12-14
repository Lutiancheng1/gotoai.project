import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // 记录请求开始时间
  const startTime = new Date();
  
  // 记录请求信息
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId // 如果用户已认证
  });

  // 重写 res.json 以记录响应
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = new Date().getTime() - startTime.getTime();
    
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.userId
    });

    return originalJson.call(this, body);
  };

  next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error', {
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack
    },
    userId: req.user?.userId
  });

  next(err);
}; 