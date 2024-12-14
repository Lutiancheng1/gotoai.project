import { Request } from 'express';
import { OperationLogModel, IOperationLog } from '@/models/operation-log.model';
import { LoginHistoryModel, ILoginHistory } from '@/models/login-history.model';
import logger from '@/utils/logger';

export class LogService {
  /**
   * 记录操作日志
   */
  public static async logOperation(params: {
    userId: string;
    username: string;
    module: string;
    action: string;
    description: string;
    details?: any;
    req?: Request;
    status?: 'success' | 'failed';
  }) {
    try {
      const { userId, username, module, action, description, details, req, status } = params;

      const log: Partial<IOperationLog> = {
        userId,
        username,
        module,
        action,
        description,
        details,
        status: status || 'success'
      };

      // 如果提供了请求对象，记录IP和UserAgent
      if (req) {
        log.ip = req.ip;
        log.userAgent = req.get('user-agent');
      }

      await OperationLogModel.create(log);
    } catch (error) {
      logger.error('Failed to create operation log', { error, params });
    }
  }

  /**
   * 记录登录历史
   */
  public static async logLogin(params: {
    userId: string;
    username: string;
    loginType: 'admin' | 'web';
    req: Request;
    status: 'success' | 'failed';
    failReason?: string;
  }) {
    try {
      const { userId, username, loginType, req, status, failReason } = params;

      const log: Partial<ILoginHistory> = {
        userId,
        username,
        loginType,
        ip: req.ip,
        userAgent: req.get('user-agent') || 'unknown',
        status,
        failReason
      };

      // TODO: 可以通过IP获取地理位置信息
      // log.location = await getLocationByIp(req.ip);

      await LoginHistoryModel.create(log);
    } catch (error) {
      logger.error('Failed to create login history', { error, params });
    }
  }

  /**
   * 获取用户操作日志
   */
  public static async getUserOperationLogs(params: {
    userId?: string;
    module?: string;
    action?: string;
    status?: 'success' | 'failed';
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      module,
      action,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = params;

    // 构建查询条件
    const query: any = {};
    if (userId) query.userId = userId;
    if (module) query.module = module;
    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // 执行查询
    const total = await OperationLogModel.countDocuments(query);
    const logs = await OperationLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 获取用户登录历史
   */
  public static async getUserLoginHistory(params: {
    userId?: string;
    loginType?: 'admin' | 'web';
    status?: 'success' | 'failed';
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      loginType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = params;

    // 构建查询条件
    const query: any = {};
    if (userId) query.userId = userId;
    if (loginType) query.loginType = loginType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // 执行查询
    const total = await LoginHistoryModel.countDocuments(query);
    const history = await LoginHistoryModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
} 