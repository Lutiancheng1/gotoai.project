import bcrypt from 'bcryptjs';
import logger from '@/utils/logger';
import { UserModel } from '@/models/user.model';

export class InitService {
  private static async createDefaultAdmin(): Promise<void> {
    try {
      // 验证必要的环境变量
      const requiredEnvVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_USERNAME'];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }

      // 检查是否已存在管理员账户
      const adminExists = await UserModel.findOne({ 
        $or: [
          { email: process.env.ADMIN_EMAIL },
          { role: 'admin' }
        ]
      });
      
      if (adminExists) {
        logger.info('Admin account already exists', { 
          email: adminExists.email,
          username: adminExists.username 
        });
        return;
      }

      // 创建默认管理员账户
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
      
      const adminUser = await UserModel.create({
        email: process.env.ADMIN_EMAIL,
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        departments: [],
        isActive: true,
        canAccessAdmin: true,
        canAccessWeb: true
      });

      logger.info('Default admin account created successfully', { 
        userId: adminUser.id,
        email: adminUser.email,
        username: adminUser.username
      });
    } catch (error) {
      logger.error('Failed to create default admin account:', error);
      throw error;
    }
  }

  public static async initializeSystem(): Promise<void> {
    try {
      logger.info('Starting system initialization...');
      
      // 创建默认管理员账户
      await InitService.createDefaultAdmin();
      
      // TODO: 可以添加其他初始化操作
      // - 创建默认部门
      // - 初始化系统配置
      // - 等等

      logger.info('System initialization completed');
    } catch (error) {
      logger.error('System initialization failed:', error);
      throw error;
    }
  }
} 