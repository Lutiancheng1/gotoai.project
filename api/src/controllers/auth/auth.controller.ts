import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await AuthService.login(email, password, 'admin', req);
    logger.info('Admin logged in successfully', { userId: result.user.id });
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Admin login failed', { error: error.message });
    return errorResponse(
      res,
      error.message || 'Login failed',
      error.statusCode || 400,
      error
    );
  }
};

export const webLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await AuthService.login(email, password, 'web', req);
    logger.info('Web user logged in successfully', { userId: result.user.id });
    
    return successResponse(res, result);
  } catch (error: any) {
    logger.error('Web login failed', { error: error.message });
    return errorResponse(
      res,
      error.message || 'Login failed',
      error.statusCode || 400,
      error
    );
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!userId || !token) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    await AuthService.logout(userId, token, req);
    logger.info('User logged out successfully', { userId });
    
    return successResponse(res, {
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error('Logout failed', { error: error.message });
    return errorResponse(
      res,
      error.message || 'Logout failed',
      error.statusCode || 400,
      error
    );
  }
}; 