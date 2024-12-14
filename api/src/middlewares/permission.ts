import { Request, Response, NextFunction } from 'express';
import { UserModel } from '@/models/user.model';
import { DepartmentModel } from '@/models/department.model';
import { errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

// 验证管理员权限
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user || user.role !== 'admin') {
      return errorResponse(res, 'Admin privileges required', 403);
    }
    next();
  } catch (error) {
    logger.error('Admin permission check failed', { error });
    return errorResponse(res, 'Permission check failed', 500);
  }
};

// 验证后台访问权限
export const requireAdminAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user || !user.canAccessAdmin) {
      return errorResponse(res, 'Admin access required', 403);
    }
    next();
  } catch (error) {
    logger.error('Admin access check failed', { error });
    return errorResponse(res, 'Permission check failed', 500);
  }
};

// 验证前台访问权限
export const requireWebAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user || !user.canAccessWeb) {
      return errorResponse(res, 'Web access required', 403);
    }
    next();
  } catch (error) {
    logger.error('Web access check failed', { error });
    return errorResponse(res, 'Permission check failed', 500);
  }
};

// 验证部门访问权限
export const requireDepartmentAccess = (departmentId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user?.userId);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // 管理员可以访问所有部门
      if (user.role === 'admin') {
        return next();
      }

      // 检查用户是否属于该部门或其上级部门
      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        return errorResponse(res, 'Department not found', 404);
      }

      const userDepartments = await DepartmentModel.find({
        _id: { $in: user.departments }
      });

      const hasAccess = userDepartments.some(userDept => 
        department.path.startsWith(userDept.path)
      );

      if (!hasAccess) {
        return errorResponse(res, 'Department access denied', 403);
      }

      next();
    } catch (error) {
      logger.error('Department access check failed', { error });
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
};

// 验证应用访问权限
export const requireApplicationAccess = (applicationId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user?.userId)
        .populate('departments');
      
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // 管理员可以访问所有应用
      if (user.role === 'admin') {
        return next();
      }

      // 检查用户的部门是否有权限访问该应用
      const hasAccess = user.departments.some((dept: any) => 
        dept.applications.includes(applicationId)
      );

      if (!hasAccess) {
        return errorResponse(res, 'Application access denied', 403);
      }

      next();
    } catch (error) {
      logger.error('Application access check failed', { error });
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
}; 