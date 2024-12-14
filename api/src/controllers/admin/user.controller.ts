import { Request, Response } from 'express';
import { UserModel } from '@/models/user.model';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

// 获取用户列表
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (search) {
      query.$or = [
        { username: new RegExp(String(search), 'i') },
        { email: new RegExp(String(search), 'i') }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // 执行查询
    const total = await UserModel.countDocuments(query);
    const users = await UserModel.find(query)
      .populate('departments', 'name')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Failed to get users', { error });
    return errorResponse(res, 'Failed to get users', 500, error);
  }
};

// 创建用户
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username, role, departments, canAccessAdmin, canAccessWeb } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }

    // 创建用户
    const user = await UserModel.create({
      email,
      password,
      username,
      role: role || 'user',
      departments: departments || [],
      canAccessAdmin: canAccessAdmin || false,
      canAccessWeb: canAccessWeb || true,
      isActive: true
    });

    logger.info('User created successfully', { userId: user.id });
    return successResponse(res, { user });
  } catch (error: any) {
    logger.error('Failed to create user', { error });
    return errorResponse(res, 'Failed to create user', 500, error);
  }
};

// 更新用户
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 防止更新敏感字段
    delete updateData.password;
    delete updateData.email;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('departments', 'name');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    logger.info('User updated successfully', { userId: user.id });
    return successResponse(res, { user });
  } catch (error: any) {
    logger.error('Failed to update user', { error });
    return errorResponse(res, 'Failed to update user', 500, error);
  }
};

// 删除用户
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 防止删除最后一个管理员
    if (req.user?.userId === id) {
      return errorResponse(res, 'Cannot delete yourself', 400);
    }

    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    const userToDelete = await UserModel.findById(id);
    
    if (userToDelete?.role === 'admin' && adminCount <= 1) {
      return errorResponse(res, 'Cannot delete the last admin', 400);
    }

    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    logger.info('User deleted successfully', { userId: id });
    return successResponse(res, { message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete user', { error });
    return errorResponse(res, 'Failed to delete user', 500, error);
  }
};

// 修改用户密码
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return errorResponse(res, 'Invalid password', 400);
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    user.password = password;
    await user.save();

    logger.info('User password updated successfully', { userId: id });
    return successResponse(res, { message: 'Password updated successfully' });
  } catch (error: any) {
    logger.error('Failed to update password', { error });
    return errorResponse(res, 'Failed to update password', 500, error);
  }
}; 