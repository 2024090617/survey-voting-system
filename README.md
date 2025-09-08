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

#### 系统依赖

在安装 npm 依赖之前，需要先安装 Canvas 库所需的系统依赖：

**自动安装（推荐）:**
```bash
# 运行自动安装脚本
chmod +x scripts/install-deps.sh
./scripts/install-deps.sh
```

**手动安装:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev
```

**macOS:**
```bash
brew install cairo pango libpng jpeg giflib librsvg pixman
```

**CentOS/RHEL/Fedora:**
```bash
sudo yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel pixman-devel
# 或者在较新版本中使用 dnf
sudo dnf install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel pixman-devel
```

#### Node.js 依赖

```bash
# 安装依赖
npm install

# 启动 PostgreSQL（使用 Docker）
docker compose up -d

# 运行数据库迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate
```

### 2. 验证安装

```bash
# 测试 Canvas 包是否正常工作
npm run test-canvas

# 测试 QR 生成功能
npm run test-qr

# 启动开发服务器
npm run dev
```

### 3. Docker 部署（推荐）

如果您不想处理系统依赖问题，可以使用 Docker：

```bash
# 启动完整开发环境（包括数据库和应用）
docker compose up -d

# 仅启动数据库（如果您想在本地运行应用）
docker compose up -d db
```

## 故障排除

### Canvas 安装问题

如果遇到 `npm install` 时 Canvas 包编译失败的问题：

```
npm error Package pixman-1 was not found in the pkg-config search path.
npm error Perhaps you should add the directory containing `pixman-1.pc'
npm error to the PKG_CONFIG_PATH environment variable
npm error No package 'pixman-1' found
```

**解决方案:**

1. **使用自动安装脚本:**
   ```bash
   npm run setup
   ```

2. **使用 Docker（最简单）:**
   ```bash
   docker compose up -d
   ```

3. **手动安装系统依赖:**
   - 确保已安装所需的系统依赖（参见上面的系统依赖部分）
   - 清除 npm 缓存：`npm cache clean --force`
   - 重新安装：`npm install`

4. **验证安装:**
   ```bash
   npm run test-canvas
   ```

### 常见问题

- **Q: macOS 上安装失败**
  - A: 确保已安装 Xcode 命令行工具：`xcode-select --install`
  - A: 确保已安装 Homebrew 并运行了 `brew install cairo pango libpng jpeg giflib librsvg pixman`

- **Q: Ubuntu/Debian 上权限错误**
  - A: 确保有 sudo 权限，或联系系统管理员安装所需包

- **Q: 网络问题导致下载失败**
  - A: 检查网络连接，或尝试使用不同的 npm 镜像源