# 问卷投票系统

基于 Next.js 14 + TypeScript + Tailwind CSS + PostgreSQL + Prisma 的移动端问卷投票系统。

## 功能特性

- ✅ 单选投票，支持选项配图
- ✅ 手写签名采集（Canvas 实现）
- ✅ 手机号码验证与防重复投票
- ✅ 本地会话锁定（一设备一票）
- ✅ 投票结果统计与可视化
- ✅ 签名拼图生成（便于打印按指纹）
- ✅ 移动端优先的响应式设计
- ✅ 完整的法务免责声明与同意流程

## 技术栈

- **前端**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **图像处理**: Sharp
- **部署**: 支持 Docker 容器化部署

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 启动 PostgreSQL（使用 Docker）
docker compose up -d

# 运行数据库迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate