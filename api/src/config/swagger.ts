import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Knowledge Base Chat System API',
      version: '1.0.0',
      description: '基于多知识库的智能对话系统 API 文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: '未认证或认证已过期',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: '无权限访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
            departments: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            canAccessAdmin: { type: 'boolean' },
            canAccessWeb: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            parentId: { type: 'string' },
            path: { type: 'string' },
            level: { type: 'number' },
            applications: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['dify', 'ragflow', 'fastgpt'] },
            apiKey: { type: 'string' },
            config: { type: 'object' },
            isActive: { type: 'boolean' },
            requestCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginHistory: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            username: { type: 'string' },
            loginType: { type: 'string', enum: ['admin', 'web'] },
            ip: { type: 'string' },
            userAgent: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed'] },
            failReason: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        OperationLog: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            username: { type: 'string' },
            module: { type: 'string' },
            action: { type: 'string' },
            description: { type: 'string' },
            details: { type: 'object' },
            ip: { type: 'string' },
            userAgent: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['error'] },
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' }
          }
        }
      }
    }
  },
  apis: [
    // 根据环境选择正确的路由文件路径
    process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '../routes/**/*.js')  // 生产环境使用编译后的 JS 文件
      : path.join(__dirname, '../routes/**/*.ts')  // 开发环境使用 TS 文件
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI 配置
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI Knowledge Base Chat System API Documentation',
    swaggerOptions: {
      persistAuthorization: true
    }
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
}; 