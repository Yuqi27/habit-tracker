# ✅ Habit Tracker 习惯打卡系统

一个基于 Next.js 16 的个人习惯追踪应用。记录每日习惯、保持连续打卡、用图表查看自己的坚持成果。

## 技术栈

| 层级 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) + React 19 + TypeScript |
| **数据库** | SQLite + Prisma ORM |
| **认证** | NextAuth.js v4（邮箱密码登录，JWT Session） |
| **样式** | Tailwind CSS v3 |
| **图表** | Recharts |

## 功能

- ✅ **用户注册 / 登录** — 邮箱密码认证
- ✅ **习惯管理** — 添加、修改（名称/描述/颜色）、删除
- ✅ **每日打卡** — 一键打卡，支持取消
- ✅ **进度条** — 今日完成进度实时展示
- ✅ **连续天数** — 自动计算连续打卡 streak
- ✅ **打卡统计** — 月度趋势柱状图
- ✅ **最近 7 天** — 周打卡可视化
- ✅ **鼓励语** — 每日随机鼓励

## 快速开始

### 前置要求

- Node.js 18+
- npm

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/Yuqi27/habit-tracker.git
cd habit-tracker

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，可以修改 NEXTAUTH_SECRET（随便填一个随机字符串即可）

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 启动
npm run dev
```

打开 **http://localhost:3000** 即可使用。

### 环境变量

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `file:./prisma/dev.db` |
| `NEXTAUTH_SECRET` | 加密 Session 的密钥 | 随机字符串 |
| `NEXTAUTH_URL` | 应用访问地址 | `http://localhost:3000` |

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]   # NextAuth 配置
│   │   ├── checkins/            # 打卡 API（POST 打卡 / DELETE 取消）
│   │   ├── habits/              # 习惯 CRUD（GET 列表 / POST 创建）
│   │   ├── habits/[id]          # 单习惯操作（PATCH 修改 / DELETE 删除）
│   │   ├── register/            # 注册 API
│   │   └── stats/               # 统计数据 API
│   ├── dashboard/               # 主页仪表盘
│   ├── login/                   # 登录页
│   ├── register/                # 注册页
│   ├── stats/                   # 统计页面
│   ├── layout.tsx               # 根布局
│   └── providers.tsx            # SessionProvider
├── lib/
│   └── prisma.ts               # Prisma 客户端单例
└── types/
    └── next-auth.d.ts          # NextAuth 类型扩展
```

## 数据库设计

三个核心模型：**User** → **Habit** → **Checkin**

- `Checkin.date` 以 `YYYY-MM-DD` 字符串存储，从源头消灭时区问题
- 通过 Prisma 的 `@@unique([habitId, date])` 约束防止重复打卡
- 级联删除：删除 Habit 时自动删除关联的 Checkin

## 许可证

MIT
