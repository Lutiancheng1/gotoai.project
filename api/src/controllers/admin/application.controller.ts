import { Request, Response } from 'express';
import { ApplicationModel } from '@/models/application.model';
import { DepartmentModel } from '@/models/department.model';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

// 获取应用列表
export const getApplications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, type, isActive } = req.query;

    // 构建查询条件
    const query: any = {};
    if (search) {
      query.name = new RegExp(String(search), 'i');
    }
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // 执行查询
    const total = await ApplicationModel.countDocuments(query);
    const applications = await ApplicationModel.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, {
      applications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Failed to get applications', { error });
    return errorResponse(res, 'Failed to get applications', 500, error);
  }
};

// 创建应用
export const createApplication = async (req: Request, res: Response) => {
  try {
    const { name, type, apiKey, config, dailyLimit } = req.body;

    // 检查应用名称是否已存在
    const existingApp = await ApplicationModel.findOne({ name });
    if (existingApp) {
      return errorResponse(res, 'Application name already exists', 400);
    }

    // 创建应用
    const application = await ApplicationModel.create({
      name,
      type,
      apiKey,
      config: config || {},
      dailyLimit: dailyLimit || 1000,
      isActive: true
    });

    logger.info('Application created successfully', { applicationId: application.id });
    return successResponse(res, { application });
  } catch (error: any) {
    logger.error('Failed to create application', { error });
    return errorResponse(res, 'Failed to create application', 500, error);
  }
};

// 更新应用
export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查应用名称是否已存在
    if (updateData.name) {
      const existingApp = await ApplicationModel.findOne({
        name: updateData.name,
        _id: { $ne: id }
      });
      if (existingApp) {
        return errorResponse(res, 'Application name already exists', 400);
      }
    }

    const application = await ApplicationModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    logger.info('Application updated successfully', { applicationId: application.id });
    return successResponse(res, { application });
  } catch (error: any) {
    logger.error('Failed to update application', { error });
    return errorResponse(res, 'Failed to update application', 500, error);
  }
};

// 删除应用
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有部门在使用此应用
    const departmentsUsingApp = await DepartmentModel.countDocuments({
      applications: id
    });

    if (departmentsUsingApp > 0) {
      return errorResponse(res, 'Cannot delete application that is in use by departments', 400);
    }

    const application = await ApplicationModel.findByIdAndDelete(id);
    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    logger.info('Application deleted successfully', { applicationId: id });
    return successResponse(res, { message: 'Application deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete application', { error });
    return errorResponse(res, 'Failed to delete application', 500, error);
  }
};

// 获取应用详情
export const getApplicationDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await ApplicationModel.findById(id);
    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    // 获取使用此应用的部门
    const departments = await DepartmentModel.find({ applications: id })
      .select('name path');

    return successResponse(res, {
      application,
      departments
    });
  } catch (error: any) {
    logger.error('Failed to get application detail', { error });
    return errorResponse(res, 'Failed to get application detail', 500, error);
  }
};

// 重置应用请求计数
export const resetRequestCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await ApplicationModel.findById(id);
    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    application.requestCount = 0;
    await application.save();

    logger.info('Application request count reset successfully', { applicationId: id });
    return successResponse(res, { message: 'Request count reset successfully' });
  } catch (error: any) {
    logger.error('Failed to reset request count', { error });
    return errorResponse(res, 'Failed to reset request count', 500, error);
  }
}; 