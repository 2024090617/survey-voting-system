# 用户认证和请愿书激活时间功能迁移指南

## 更新内容

本次更新添加了以下功能：
1. 用户注册登录系统
2. 创建请愿书需要登录验证  
3. 请愿书可以设置激活时间
4. 只有已激活的请愿书才会对用户可见

## 数据库迁移

### 安装新依赖
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 生成并应用数据库迁移
```bash
# 启动数据库服务
docker compose up -d

# 生成迁移文件
npx prisma migrate dev --name add_user_auth_and_activation_time

# 生成 Prisma Client
npx prisma generate
```

### 环境变量设置
在 `.env` 文件中添加：
```
JWT_SECRET=your-secret-key-here-make-it-long-and-random
```

## 新的功能

### 1. 用户认证
- 访问 `/auth` 进行注册或登录
- 支持邮箱密码注册登录
- JWT Token 认证，有效期7天

### 2. 管理后台
- 访问 `/admin` 创建请愿书（需要登录）
- 支持设置请愿书激活时间
- 可选择立即激活或定时激活

### 3. 请愿书激活机制
- `activatedAt` 为 null：立即激活
- `activatedAt` 设置时间：到达指定时间后激活
- 只有已激活的请愿书才会在首页和结果页显示

## API 变更

### 新增端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录  
- `GET /api/auth/me` - 获取当前用户信息

### 现有端点变更
- `POST /api/poll` - 现在需要 Bearer Token 认证
- `GET /api/poll` - 只返回已激活的请愿书
- `GET /api/results` - 只返回已激活请愿书的结果

## 数据库模型变更

### User 表（新增）
```sql
- id: String (主键)
- email: String (唯一)
- password: String (加密存储)
- name: String
- createdAt: DateTime
- updatedAt: DateTime
```

### Petition 表（变更）
```sql
+ activatedAt: DateTime? (激活时间，可为空)
+ creatorId: String (创建者ID)
+ creator: User (关联到用户)
```

## 使用流程

1. **创建用户账户**: 访问 `/auth` 注册账户
2. **创建请愿书**: 登录后访问 `/admin` 创建请愿书
3. **设置激活时间**: 选择立即激活或设置未来激活时间
4. **用户参与**: 普通用户在首页参与已激活的请愿书
5. **查看结果**: 访问 `/results` 查看请愿书支持情况

## 注意事项

- 旧数据库中的请愿书需要手动分配 `creatorId` 才能正常显示
- 建议在生产环境中设置强密码的 `JWT_SECRET`
- 定时激活功能依赖服务器时间，确保服务器时间准确
