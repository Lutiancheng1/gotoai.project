import { Request, Response } from 'express';
import { DepartmentModel } from '@/models/department.model';
import { UserModel } from '@/models/user.model';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

// 获取部门列表（树形结构）
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await DepartmentModel.find()
      .populate('applications', 'name type isActive apiKey')
      .sort({ path: 1 });

    // 构建树形结构
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => String(item.parentId) === String(parentId))
        .map(item => ({
          ...item.toObject(),
          children: buildTree(items, item._id)
        }));
    };

    const tree = buildTree(departments);
    return successResponse(res, { departments: tree });
  } catch (error: any) {
    logger.error('Failed to get departments', { error });
    return errorResponse(res, 'Failed to get departments', 500, error);
  }
};

// 创建部门
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, parentId, applications } = req.body;

    // 检查部门名称是否已存在
    const existingDepartment = await DepartmentModel.findOne({
      name,
      parentId: parentId || null
    });

    if (existingDepartment) {
      return errorResponse(res, 'Department name already exists at this level', 400);
    }

    // 如果有父部门，检查父部门是否存在
    if (parentId) {
      const parentDepartment = await DepartmentModel.findById(parentId);
      if (!parentDepartment) {
        return errorResponse(res, 'Parent department not found', 404);
      }
    }

    const department = await DepartmentModel.create({
      name,
      description,
      parentId: parentId || null,
      applications: applications || []
    });

    // 创建后立即获取完整信息
    const populatedDepartment = await DepartmentModel.findById(department._id)
      .populate('applications', 'name type isActive apiKey');

    logger.info('Department created successfully', { departmentId: department.id });
    return successResponse(res, { department: populatedDepartment });
  } catch (error: any) {
    logger.error('Failed to create department', { error });
    return errorResponse(res, 'Failed to create department', 500, error);
  }
};

// 更新部门
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查是否存在同名部门
    if (updateData.name) {
      const existingDepartment = await DepartmentModel.findOne({
        name: updateData.name,
        parentId: updateData.parentId || null,
        _id: { $ne: id }
      });

      if (existingDepartment) {
        return errorResponse(res, 'Department name already exists at this level', 400);
      }
    }

    const department = await DepartmentModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('applications', 'name type isActive apiKey');

    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    logger.info('Department updated successfully', { departmentId: department.id });
    return successResponse(res, { department });
  } catch (error: any) {
    logger.error('Failed to update department', { error });
    return errorResponse(res, 'Failed to update department', 500, error);
  }
};

// 删除部门
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有子部门
    const childrenCount = await DepartmentModel.countDocuments({ parentId: id });
    if (childrenCount > 0) {
      return errorResponse(res, 'Cannot delete department with children', 400);
    }

    // 检查是否有关联用户
    const usersCount = await UserModel.countDocuments({ departments: id });
    if (usersCount > 0) {
      return errorResponse(res, 'Cannot delete department with associated users', 400);
    }

    const department = await DepartmentModel.findByIdAndDelete(id);
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    logger.info('Department deleted successfully', { departmentId: id });
    return successResponse(res, { message: 'Department deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete department', { error });
    return errorResponse(res, 'Failed to delete department', 500, error);
  }
};

// 获取部门详情
export const getDepartmentDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await DepartmentModel.findById(id)
      .populate('applications', 'name type isActive apiKey')
      .populate('parentId', 'name');

    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    // 获取子部门
    const children = await DepartmentModel.find({ parentId: id })
      .select('name');

    // 获取关联用户数量
    const userCount = await UserModel.countDocuments({ departments: id });

    return successResponse(res, {
      department,
      children,
      userCount
    });
  } catch (error: any) {
    logger.error('Failed to get department detail', { error });
    return errorResponse(res, 'Failed to get department detail', 500, error);
  }
}; 