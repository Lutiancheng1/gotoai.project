import { createClient } from 'redis';
import logger from '@/utils/logger';

const getRedisConfig = () => {
  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD;
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || 6379;

  if (username && password) {
    return {
      url: `redis://${username}:${password}@${host}:${port}`
    };
  } else if (password) {
    return {
      url: `redis://:${password}@${host}:${port}`
    };
  }

  return {
    url: `redis://${host}:${port}`
  };
};

const redisClient = createClient(getRedisConfig());

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis Connected...');
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });
    
    redisClient.on('reconnecting', () => {
      logger.warn('Redis Client reconnecting...');
    });
  } catch (err) {
    logger.error('Redis connection error:', err);
    process.exit(1);
  }
};

export default redisClient;
