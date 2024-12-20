import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { setupSwagger } from '@/config/swagger';
import routes from '@/routes';
import { errorHandler } from '@/middlewares/error';
import { requestLogger, errorLogger } from '@/middlewares/logger';
import logger from '@/utils/logger';
import { InitService } from '@/services/init.service';

// Load environment variables
dotenv.config();

// 验证必要的环境变量
const requiredEnvVars = [
  // MongoDB配置
  'MONGODB_HOST',
  'MONGODB_PORT',
  'MONGODB_DATABASE',
  'MONGODB_USERNAME',
  'MONGODB_PASSWORD',
  
  // Redis配置
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  
  // JWT配置
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  
  // 管理员配置
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_USERNAME',
  
  // API配置
  'NODE_ENV'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const port = process.env.API_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Logging middleware
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Setup Swagger documentation
setupSwagger(app);

// Error logging
app.use(errorLogger);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Create logs directory
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }

    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB Connected');
    
    // Connect to Redis
    await connectRedis();
    logger.info('Redis Connected');

    // Initialize system
    await InitService.initializeSystem();
    logger.info('System initialized');
    
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();
