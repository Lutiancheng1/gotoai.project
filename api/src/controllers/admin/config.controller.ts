import { Request, Response } from 'express';
import { ConfigModel } from '@/models/config.model';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

// 获取客服配置
export const getCustomerServiceConfig = async (req: Request, res: Response) => {
  try {
    const config = await ConfigModel.findOne({ key: 'customer-service' });
    
    // 如果没有配置，返回默认值
    const defaultConfig = {
      greeting: '您好，我是您的智能助手，请问有什么可以帮您？',
      apiKey: '',
      apiSecret: ''
    };

    return successResponse(res, {
      config: config?.value || defaultConfig
    });
  } catch (error: any) {
    logger.error('Failed to get customer service config', { error });
    return errorResponse(res, 'Failed to get customer service config', 500, error);
  }
};

// 更新客服配置
export const updateCustomerServiceConfig = async (req: Request, res: Response) => {
  try {
    const { greeting, apiKey, apiSecret } = req.body;

    // 验证必填字段
    if (!greeting || !apiKey || !apiSecret) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // 更新或创建配置
    const config = await ConfigModel.findOneAndUpdate(
      { key: 'customer-service' },
      {
        $set: {
          key: 'customer-service',
          value: { greeting, apiKey, apiSecret }
        }
      },
      { upsert: true, new: true }
    );

    logger.info('Customer service config updated successfully');
    return successResponse(res, { config: config.value });
  } catch (error: any) {
    logger.error('Failed to update customer service config', { error });
    return errorResponse(res, 'Failed to update customer service config', 500, error);
  }
}; 