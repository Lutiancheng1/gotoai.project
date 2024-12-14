import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@/utils/response';

interface ValidationRule {
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

// 创建验证中间件
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // 验证每个字段
    Object.keys(schema).forEach(field => {
      const value = req.body[field];
      const rules = schema[field];

      // 必填验证
      if (rules.required && (value === undefined || value === null || value === '')) {
        validationErrors.push(`${field} is required`);
        return;
      }

      // 如果字段不是必填且值为空，跳过其他验证
      if (!rules.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // 类型验证
      if (rules.type && typeof value !== rules.type) {
        validationErrors.push(`${field} must be a ${rules.type}`);
      }

      // 最小长度/值验证
      if (rules.min !== undefined) {
        if (typeof value === 'string' && value.length < rules.min) {
          validationErrors.push(`${field} must be at least ${rules.min} characters long`);
        } else if (typeof value === 'number' && value < rules.min) {
          validationErrors.push(`${field} must be greater than or equal to ${rules.min}`);
        }
      }

      // 最大长度/值验证
      if (rules.max !== undefined) {
        if (typeof value === 'string' && value.length > rules.max) {
          validationErrors.push(`${field} must be at most ${rules.max} characters long`);
        } else if (typeof value === 'number' && value > rules.max) {
          validationErrors.push(`${field} must be less than or equal to ${rules.max}`);
        }
      }

      // 正则表达式验证
      if (rules.pattern && !rules.pattern.test(value)) {
        validationErrors.push(`${field} format is invalid`);
      }

      // 枚举验证
      if (rules.enum && !rules.enum.includes(value)) {
        validationErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      // 自定义验证
      if (rules.custom && !rules.custom(value)) {
        validationErrors.push(`${field} validation failed`);
      }
    });

    // 如果有验证错误，返回错误响应
    if (validationErrors.length > 0) {
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }

    next();
  };
};

// 预定义的验证规则
export const validationRules = {
  // 用户相关验证规则
  user: {
    createUser: {
      email: {
        required: true,
        type: 'string',
        pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      },
      password: {
        required: true,
        type: 'string',
        min: 6,
        max: 50
      },
      username: {
        required: true,
        type: 'string',
        min: 2,
        max: 50
      },
      role: {
        type: 'string',
        enum: ['admin', 'user']
      }
    },
    updateUser: {
      username: {
        type: 'string',
        min: 2,
        max: 50
      },
      role: {
        type: 'string',
        enum: ['admin', 'user']
      },
      isActive: {
        type: 'boolean'
      }
    }
  },

  // 部门相关验证规则
  department: {
    createDepartment: {
      name: {
        required: true,
        type: 'string',
        min: 2,
        max: 50
      },
      description: {
        type: 'string',
        max: 500
      },
      parentId: {
        type: 'string'
      }
    },
    updateDepartment: {
      name: {
        type: 'string',
        min: 2,
        max: 50
      },
      description: {
        type: 'string',
        max: 500
      }
    }
  },

  // 应用相关验证规则
  application: {
    createApplication: {
      name: {
        required: true,
        type: 'string',
        min: 2,
        max: 50
      },
      type: {
        required: true,
        type: 'string',
        enum: ['dify', 'ragflow', 'fastgpt']
      },
      apiKey: {
        required: true,
        type: 'string',
        min: 10
      },
      dailyLimit: {
        type: 'number',
        min: 1
      }
    },
    updateApplication: {
      name: {
        type: 'string',
        min: 2,
        max: 50
      },
      apiKey: {
        type: 'string',
        min: 10
      },
      isActive: {
        type: 'boolean'
      },
      dailyLimit: {
        type: 'number',
        min: 1
      }
    }
  }
}; 