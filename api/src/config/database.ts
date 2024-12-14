import mongoose from 'mongoose';
import logger from '@/utils/logger';

const getMongoConfig = () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || 27017;
  const database = process.env.MONGODB_DATABASE || 'ai-chat';

  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${database}`;
};

export const connectDB = async () => {
  try {
    const mongoURI = getMongoConfig();
    
    // 设置 Mongoose 配置
    mongoose.set('strictQuery', true);
    
    // 连接到 MongoDB
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 超时时间
      socketTimeoutMS: 45000, // Socket 超时
    });

    logger.info('MongoDB Connected...');

    // 监听连接事件
    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // 优雅关闭连接
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};
