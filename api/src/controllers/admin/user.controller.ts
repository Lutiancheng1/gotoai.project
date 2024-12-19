import { Request, Response } from 'express';
import { UserModel } from '@/models/user.model';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { LogService } from '@/services/log.service';

// 获取用户列表
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role, isActive, departmentId } = req.query;
    
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
    if (departmentId) {
      query.departments = departmentId;
    }

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
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return errorResponse(res, '该邮箱已被注册', 400);
    }

    // 检查用户名是否已存在
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      return errorResponse(res, '该用户名已被使用', 400);
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

    // 如果要更新用户名，检查是否已存在
    if (updateData.username) {
      const existingUsername = await UserModel.findOne({
        username: updateData.username,
        _id: { $ne: id } // 排除当前用户
      });
      if (existingUsername) {
        return errorResponse(res, '该用户名已被使用', 400);
      }
    }

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
    const currentUser = req.user;

    // 检查当前用户权限
    if (!currentUser || currentUser.role !== 'admin') {
      return errorResponse(res, '只有管理员可以删除用户', 403);
    }

    // 不能删除自己
    if (id === currentUser.userId) {
      return errorResponse(res, '不能删除当前登录用户', 400);
    }

    // 获取要删除的用户
    const userToDelete = await UserModel.findById(id);
    if (!userToDelete) {
      return errorResponse(res, '用户不存在', 404);
    }

    // 如果要删除的是管理员，检查是否是最后一个管理员
    if (userToDelete.role === 'admin') {
      const adminCount = await UserModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return errorResponse(res, '系统中必须保留至少一个管理员', 400);
      }
    }

    // 执行删除操作
    await UserModel.findByIdAndDelete(id);
    // 获取当前用户的完整信息
    const currentUserInfo = await UserModel.findById(currentUser.userId);
    
    // 记录操作日志
    await LogService.logOperation({
      userId: currentUser.userId,
      username: currentUserInfo.username,
      module: 'user',
      action: 'delete',
      description: `Deleted user ${userToDelete.username}`,
      req
    });

    logger.info('User deleted successfully', { 
      deletedUserId: id,
      deletedBy: currentUser.userId 
    });

    return successResponse(res, { message: '用户删除成功' });
  } catch (error: any) {
    logger.error('Delete user failed', { error });
    return errorResponse(
      res,
      error.message || '删除用户失败',
      error.statusCode || 500
    );
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

// 获取所有用户（无分页）
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, isActive, departmentId } = req.query;
    
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
    if (departmentId) {
      query.departments = departmentId;
    }

    // 执行查询
    const users = await UserModel.find(query)
      .populate('departments', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, { users });
  } catch (error: any) {
    logger.error('Failed to get all users', { error });
    return errorResponse(res, 'Failed to get all users', 500, error);
  }
}; 