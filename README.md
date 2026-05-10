# Habit Tracker 习惯打卡系统

一个基于 Next.js 的个人习惯打卡应用，帮助你养成好习惯，记录每日打卡。

## 技术栈

- **框架**：Next.js 16 (App Router) + React 19 + TypeScript
- **数据库**：SQLite + Prisma ORM
- **认证**：NextAuth.js v4（邮箱密码登录）
- **样式**：Tailwind CSS v3
- **图表**：Recharts

## 功能

- ✅ 用户注册 / 登录
- ✅ 添加、修改、删除习惯
- ✅ 每日打卡 / 取消打卡
- ✅ 今日完成进度条
- ✅ 连续打卡天数统计
- ✅ 月度打卡趋势图表
- ✅ 最近 7 天可视化

## 本地运行

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma db push

# 创建 .env 文件
cp .env.example .env
# 编辑 .env，填写 NEXTAUTH_SECRET

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

## 环境变量

复制 `.env.example` 为 `.env`，填写以下变量：

```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="你的密钥（随机字符串）"
NEXTAUTH_URL="http://localhost:3000"
```
