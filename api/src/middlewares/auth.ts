import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '@/types';
import redisClient from '@/config/redis';
import { UserModel } from '@/models/user.model';
import logger from '@/utils/logger';

interface JwtPayload {
  userId: string;
  role: string;
  loginType: 'admin' | 'web';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    // 检查 token 是否在黑名单中
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new Error('Token is invalid');
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // 检查用户状态
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted to access API', {
        userId: user.id,
        endpoint: req.originalUrl
      });
      throw new Error('User account is disabled');
    }

    // 验证访问权限
    if (decoded.loginType === 'admin' && !user.canAccessAdmin) {
      throw new Error('Admin access denied');
    }

    if (decoded.loginType === 'web' && !user.canAccessWeb) {
      throw new Error('Web access denied');
    }

    req.user = decoded;
    next();
  } catch (err) {
    const error = new Error('Please authenticate') as ApiError;
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    next(error);
  }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    next();
  } catch (err) {
    const error = new Error('Admin access required') as ApiError;
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    next(error);
  }
};
