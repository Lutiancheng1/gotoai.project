import jwt from 'jsonwebtoken';
import { UserModel, IUserDocument } from '@/models/user.model';
import redisClient from '@/config/redis';
import logger from '@/utils/logger';
import { LogService } from './log.service';
import { Request } from 'express';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * 用户登录
   * @param email 用户邮箱
   * @param password 用户密码
   * @param loginType 登录类型 ('admin' | 'web')
   * @param req Request对象，用于记录日志
   */
  public static async login(email: string, password: string, loginType: 'admin' | 'web', req: Request) {
    try {
      // 查找用户
      const user = await UserModel.findOne({ email }).select('+password');
      if (!user) {
        await LogService.logLogin({
          userId: 'unknown',
          username: email,
          loginType,
          req,
          status: 'failed',
          failReason: 'User not found'
        });
        throw new Error('User not found');
      }

      // 检查用户状态
      if (!user.isActive) {
        await LogService.logLogin({
          userId: user.id,
          username: user.username,
          loginType,
          req,
          status: 'failed',
          failReason: 'Account disabled'
        });
        throw new Error('User account is disabled');
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await LogService.logLogin({
          userId: user.id,
          username: user.username,
          loginType,
          req,
          status: 'failed',
          failReason: 'Invalid password'
        });
        throw new Error('Invalid password');
      }

      // 验证访问权限
      if (loginType === 'admin' && !user.canAccessAdmin) {
        await LogService.logLogin({
          userId: user.id,
          username: user.username,
          loginType,
          req,
          status: 'failed',
          failReason: 'No admin access'
        });
        logger.warn('Unauthorized admin login attempt', { userId: user.id, email });
        throw new Error('You do not have permission to access the admin panel');
      }

      if (loginType === 'web' && !user.canAccessWeb) {
        await LogService.logLogin({
          userId: user.id,
          username: user.username,
          loginType,
          req,
          status: 'failed',
          failReason: 'No web access'
        });
        logger.warn('Unauthorized web login attempt', { userId: user.id, email });
        throw new Error('You do not have permission to access the web application');
      }

      // 生成 token
      const token = this.generateToken(user, loginType);

      // 保存 token 到 Redis（用于登出和token验证）
      await this.saveTokenToRedis(user.id, token);

      // 记录成功登录
      await LogService.logLogin({
        userId: user.id,
        username: user.username,
        loginType,
        req,
        status: 'success'
      });

      // 记录操作日志
      await LogService.logOperation({
        userId: user.id,
        username: user.username,
        module: 'auth',
        action: 'login',
        description: `User logged in via ${loginType}`,
        req
      });

      // 返回用户信息时排除敏感字段
      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        departments: user.departments,
        isActive: user.isActive,
        canAccessAdmin: user.canAccessAdmin,
        canAccessWeb: user.canAccessWeb
      };

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 用户登出
   */
  public static async logout(userId: string, token: string, req?: Request) {
    try {
      // 将 token 加入黑名单
      await this.blacklistToken(token);
      // 清除用户的 Redis 缓存
      await redisClient.del(`user:${userId}:token`);

      // 如果提供了请求对象，记录操作日志
      if (req) {
        const user = await UserModel.findById(userId);
        if (user) {
          await LogService.logOperation({
            userId,
            username: user.username,
            module: 'auth',
            action: 'logout',
            description: 'User logged out',
            req
          });
        }
      }
    } catch (error) {
      logger.error('Logout failed', { error, userId });
      throw error;
    }
  }

  /**
   * 验证 token
   */
  public static async verifyToken(token: string) {
    // 检查 token 是否在黑名单中
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new Error('Token is invalid');
    }

    // 验证 token
    const decoded = jwt.verify(token, this.JWT_SECRET) as { 
      userId: string;
      loginType: 'admin' | 'web';
    };
    
    // 获取用户信息
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // 验证访问权限
    if (decoded.loginType === 'admin' && !user.canAccessAdmin) {
      throw new Error('Admin access denied');
    }

    if (decoded.loginType === 'web' && !user.canAccessWeb) {
      throw new Error('Web access denied');
    }

    return user;
  }

  /**
   * 生成 JWT token
   */
  private static generateToken(user: IUserDocument, loginType: 'admin' | 'web'): string {
    return jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        loginType
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * 保存 token 到 Redis
   */
  private static async saveTokenToRedis(userId: string, token: string) {
    const expiresIn = parseInt(this.JWT_EXPIRES_IN) || 7 * 24 * 60 * 60; // 默认7天
    await redisClient.setEx(`user:${userId}:token`, expiresIn, token);
  }

  /**
   * 将 token 加入黑名单
   */
  private static async blacklistToken(token: string) {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisClient.setEx(`blacklist:${token}`, ttl, '1');
      }
    }
  }
} 