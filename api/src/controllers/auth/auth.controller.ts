import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { UserModel } from '@/models/user.model';
import { comparePassword, hashPassword } from '@/utils/crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

interface PopulatedApplication {
  _id: string;
  name: string;
  type: 'dify' | 'ragflow' | 'fastgpt';
  apiKey: string;
  isActive: boolean;
}

interface PopulatedDepartment {
  _id: string;
  name: string;
  description?: string;
  parentId: string | null;
  path: string;
  level: number;
  applications: PopulatedApplication[];
}

interface UserWithPopulatedDepartments {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  role: string;
  departments: Array<PopulatedDepartment & { _id: mongoose.Types.ObjectId }>;
  isActive: boolean;
  canAccessAdmin: boolean;
  canAccessWeb: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface JwtPayload {
  userId: string;
  role: string;
  loginType: string;
  iat: number;
  exp: number;
}

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await AuthService.login(email, password, 'admin', req);
    
    // 获取完整的用户信息，包括部门和应用信息
    const user = await UserModel.findById(result.user.id)
      .select('-password')
      .populate<{ departments: PopulatedDepartment[] }>({
        path: 'departments',
        select: '_id name description path level applications parentId',
        populate: {
          path: 'applications',
          select: '_id name type isActive apiKey config'
        }
      })
      .lean<UserWithPopulatedDepartments>();

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // 确保返回的用户数据使用 _id 而不是 id
    const userResponse = {
      ...user,
      _id: user._id.toString(),
      departments: user.departments.map(dept => ({
        ...dept,
        _id: dept._id.toString(),
        parentId: dept.parentId?.toString() || null,
        applications: dept.applications?.map(app => ({
          ...app,
          _id: app._id.toString()
        })) || []
      }))
    };

    logger.info('Admin logged in successfully', { userId: userResponse._id });
    
    return successResponse(res, {
      user: userResponse,
      token: result.token
    });
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
    
    // 获取完整的用户信息，包括部门和应用信息
    const user = await UserModel.findById(result.user.id)
      .select('-password')
      .populate<{ departments: PopulatedDepartment[] }>({
        path: 'departments',
        select: '_id name description path level applications parentId',
        populate: {
          path: 'applications',
          select: '_id name type isActive apiKey config'
        }
      })
      .lean<UserWithPopulatedDepartments>();

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // 转换数据格式
    const userResponse = {
      ...user,
      _id: user._id.toString(),
      departments: user.departments.map(dept => ({
        ...dept,
        _id: dept._id.toString(),
        parentId: dept.parentId?.toString() || null,
        applications: dept.applications?.map(app => ({
          ...app,
          _id: app._id.toString()
        })) || []
      }))
    };

    logger.info('Web user logged in successfully', { userId: userResponse._id });
    
    return successResponse(res, {
      user: userResponse,
      token: result.token
    });
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
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, 'Unauthorized: No token provided', 401);
    }

    try {
      // 从 token 中解析出用户信息
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret') as JwtPayload;
      const userId = decoded.userId;

      logger.info('Logout attempt', { userId, token });

      await AuthService.logout(userId, token, req);
      logger.info('User logged out successfully', { userId });
      
      return successResponse(res, {
        message: 'Logged out successfully'
      });
    } catch (jwtError) {
      logger.error('Invalid token', { error: jwtError });
      return errorResponse(res, 'Unauthorized: Invalid token', 401);
    }
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

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const user = await UserModel.findById(userId)
      .select('-password')
      .populate<{ departments: PopulatedDepartment[] }>({
        path: 'departments',
        select: '_id name description path level applications parentId',
        populate: {
          path: 'applications',
          select: '_id name type isActive apiKey config'
        }
      })
      .lean<UserWithPopulatedDepartments>();
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // 转换数据格式
    const userResponse = {
      ...user,
      _id: user._id.toString(),
      departments: user.departments.map(dept => ({
        ...dept,
        _id: dept._id.toString(),
        parentId: dept.parentId?.toString() || null,
        applications: dept.applications?.map(app => ({
          ...app,
          _id: app._id.toString()
        })) || []
      }))
    };

    logger.info('User profile retrieved successfully', { userId });
    return successResponse(res, userResponse);
  } catch (error: any) {
    logger.error('Get profile failed', { error: error.message });
    return errorResponse(res, 'Failed to get profile', error.statusCode || 400, error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { username, currentPassword, newPassword } = req.body;

    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // 如果要修改密码，先验证当前密码
    if (newPassword) {
      if (!currentPassword) {
        return errorResponse(res, 'Current password is required to set new password', 400);
      }

      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return errorResponse(res, 'Current password is incorrect', 401);
      }

      // 更新密码
      user.password = await hashPassword(newPassword);
    }

    // 更新用户名
    if (username) {
      user.username = username;
    }

    await user.save();
    logger.info('User profile updated successfully', { userId });

    // 返回更新后的用户信息（不包含密码）
    const updatedUser = await UserModel.findById(userId)
      .select('-password')
      .populate<{ departments: PopulatedDepartment[] }>({
        path: 'departments',
        select: '_id name description path level applications parentId',
        populate: {
          path: 'applications',
          select: '_id name type isActive apiKey config'
        }
      })
      .lean<UserWithPopulatedDepartments>();

    const userResponse = {
      ...updatedUser,
      _id: updatedUser._id.toString(),
      departments: updatedUser.departments.map(dept => ({
        ...dept,
        _id: dept._id.toString(),
        parentId: dept.parentId?.toString() || null,
        applications: dept.applications?.map(app => ({
          ...app,
          _id: app._id.toString()
        })) || []
      }))
    };
    
    return successResponse(res, userResponse);
  } catch (error: any) {
    logger.error('Update profile failed', { error: error.message });
    return errorResponse(
      res,
      error.message || 'Failed to update profile',
      error.statusCode || 400,
      error
    );
  }
}; 