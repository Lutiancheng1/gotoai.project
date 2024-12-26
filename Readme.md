# AI 知识库对话系统

一个基于多知识库的智能对话系统，支持多部门、多应用管理的企业级解决方案。

## 快速开始

### 开发环境启动

1. 初始化环境配置

```bash
cd api
npm install
npm run setup     # 这会复制 .env.dev.example 到 .env.development
```

2. 编辑 `.env.development` 文件，配置必要的环境变量：

- MongoDB 配置
- Redis 配置
- JWT 密钥
- API Keys 等

3. 启动开发环境

```bash
npm run docker:dev
```

4. 清理并重启开发环境（如果需要）

```bash
npm run docker:dev:clean
```

5. 查看开发环境日志

```bash
npm run docker:logs
```

### 生产环境部署

1. 初始化生产环境配置

```bash
cd api
npm install
npm run setup:prod    # 这会复制 .env.prod.example 到 .env.production
```

2. 编辑 `.env.production` 文件，配置生产环境变量：

- 数据库凭证
- Redis 密码
- JWT 密钥
- 域名配置
- API Keys 等

3. 一键部署生产环境

```bash
npm run deploy
```

这个命令会自动：

- 检查环境配置
- 拉取最新代码（如果是 git 仓库）
- 安装依赖
- 构建项目
- 停止旧容器
- 启动新容器
- 检查服务健康状态

4. 生产环境维护命令

```bash
npm run docker:logs:prod   # 查看日志
npm run docker:stop:prod   # 停止服务
npm run docker:prod:clean  # 清理并重启
```

## 系统架构

### 后端 API 服务

**技术栈：** NodeJS + TypeScript + MongoDB + Redis

#### 核心功能模块

1. **认证与授权**

   - JWT 身份验证 + Redis Token 管理
   - 基于 RBAC 的权限控制
   - 用户状态管理（启用/停用）
   - 登录域控制（前台/后台访问权限）

2. **用户管理**

   - 用户 CRUD 操作
   - 多部门关联管理
   - 操作日志追踪

3. **部门管理**

   - 树形部门结构
   - 知识库应用关联
   - 部门权限继承机制

4. **知识库应用管理**
   - 多平台接入（Dify/Ragflow/FastGPT）
   - API Key 安全管理
   - 应用配置中心

### 前端架构

**技术栈：** React + TypeScript + Ant Design + TailwindCSS + Craco

#### 后台管理系统 (/admin)

- 系统配置中心
- 用户权限管理
- 部门结构管理
- 知识库应用配置
- 数据统计分析

#### 用户前台 (/web)

- 智能对话界面
- 多知识库自由切换
- 对话历史查询
- 个人中心管理

## 项目结构

```
project/
├── api/              # 后端服务
│   ├── src/          # 源代码
│   ├── docker/       # Docker配置
│   └── scripts/      # 部署脚本
├── web/              # 前端用户界面
│   ├── src/          # 源代码
│   │   ├── components/   # 通用组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API服务
│   │   └── utils/       # 工具函数
│   └── public/      # 静态资源
└── admin/           # 后台管理系统
    ├── src/         # 源代码
    └── public/      # 静态资源
```

## 开发规范

- 代码规范：ESLint + Prettier
- Git Flow 工作流
- 组件文档：Storybook
- API 文档：Swagger
- 区分本地开发环境和部署生产环境

### 提交规范

- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具链相关

## 部署架构

- Docker 容器化部署
- 服务编排与扩展
- 日志管理与监控
- 自动化部署流程
- 环境隔离
