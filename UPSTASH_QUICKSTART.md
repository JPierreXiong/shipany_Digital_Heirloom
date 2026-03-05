# 🚀 Upstash QStash 快速开始指南

**5 分钟完成配置，绕过 Vercel Cron 限制！**

---

## 📋 准备工作

### 1. 注册 Upstash 账号

访问 https://upstash.com/ 并注册（推荐使用 GitHub 登录）

### 2. 获取 Token

1. 登录 Upstash Dashboard
2. 点击左侧 "QStash"
3. 复制 **QSTASH_TOKEN**

### 3. 生成 CRON_SECRET

在终端执行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的密钥。

---

## ⚡ 快速配置（3 种方法）

### 方法 1: 使用 PowerShell 脚本（推荐 Windows 用户）

```powershell
# 在项目根目录执行
.\setup-upstash-crons.ps1 `
  -QStashToken "your-qstash-token" `
  -Domain "your-app.vercel.app" `
  -CronSecret "your-cron-secret"
```

### 方法 2: 使用 Bash 脚本（推荐 Mac/Linux 用户）

```bash
# 添加执行权限
chmod +x setup-upstash-crons.sh

# 执行脚本
./setup-upstash-crons.sh \
  "your-qstash-token" \
  "your-app.vercel.app" \
  "your-cron-secret"
```

### 方法 3: 使用 Upstash Web 控制台（手动）

1. 登录 Upstash Dashboard
2. 进入 QStash → Schedules
3. 点击 "Create Schedule"
4. 按照下表配置 5 个任务：

| 任务名称 | URL | Cron | Headers |
|---------|-----|------|---------|
| 订阅过期检查 | `https://your-app.vercel.app/api/cron/check-expired-subscriptions` | `0 2 * * *` | `Authorization: Bearer your-cron-secret` |
| 心跳检查 | `https://your-app.vercel.app/api/cron/check-heartbeat` | `0 */3 * * *` | `Authorization: Bearer your-cron-secret` |
| Dead Man's Switch | `https://your-app.vercel.app/api/cron/dead-man-switch-check` | `0 0 * * *` | `Authorization: Bearer your-cron-secret` |
| 系统健康检查 | `https://your-app.vercel.app/api/cron/system-health-check` | `0 6 * * *` | `Authorization: Bearer your-cron-secret` |
| 成本预警检查 | `https://your-app.vercel.app/api/cron/cost-alerts-check` | `0 12 * * *` | `Authorization: Bearer your-cron-secret` |

**配置详情**：
- Method: POST
- Content-Type: application/json
- Body: `{}`

---

## 🔧 配置 Vercel 环境变量

1. 登录 Vercel Dashboard
2. 进入项目 → Settings → Environment Variables
3. 添加以下变量：

```
QSTASH_TOKEN=your-qstash-token
CRON_SECRET=your-cron-secret
```

4. 点击 "Save"

---

## 🚀 部署代码

```bash
git add .
git commit -m "feat: migrate to Upstash QStash for cron jobs"
git push origin main
```

Vercel 会自动部署。

---

## ✅ 验证配置

### 1. 测试单个任务

```bash
curl -X POST https://your-app.vercel.app/api/cron/check-heartbeat \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

**预期响应**：
```json
{
  "success": true,
  "message": "Heartbeat check completed",
  "timestamp": "2026-03-04T12:00:00.000Z"
}
```

### 2. 查看 Upstash 日志

1. 登录 Upstash Dashboard
2. 进入 QStash → Logs
3. 等待下一次自动执行
4. 查看执行状态和响应

---

## 📊 调度频率

| 任务 | 频率 | 每天次数 |
|------|------|---------|
| 订阅过期检查 | 每天凌晨 2 点 | 1 次 |
| 心跳检查 | 每 3 小时 | 8 次 |
| Dead Man's Switch | 每天凌晨 0 点 | 1 次 |
| 系统健康检查 | 每天早上 6 点 | 1 次 |
| 成本预警检查 | 每天中午 12 点 | 1 次 |

**总计**: 每天 12 次，每月 360 次（远低于免费额度 500 次）

---

## 🎯 完成清单

- [ ] 注册 Upstash 账号
- [ ] 获取 QSTASH_TOKEN
- [ ] 生成 CRON_SECRET
- [ ] 运行配置脚本（或手动创建任务）
- [ ] 在 Vercel 配置环境变量
- [ ] 部署代码
- [ ] 测试任务执行
- [ ] 查看 Upstash 日志

---

## 🐛 常见问题

### Q: 任务返回 401 Unauthorized

**A**: 检查 `CRON_SECRET` 是否在 Vercel 和 Upstash 中配置一致

### Q: 任务没有按时执行

**A**: 
1. 检查 Cron 表达式是否正确（使用 https://crontab.guru/）
2. 注意 Upstash 使用 UTC 时区

### Q: 如何删除任务？

**A**: 
1. 登录 Upstash Dashboard
2. 进入 QStash → Schedules
3. 点击任务右侧的删除按钮

---

## 📞 需要帮助？

参考完整文档：`UPSTASH_QSTASH_SETUP_GUIDE.md`

---

**预计完成时间**: 5-10 分钟  
**难度**: ⭐⭐☆☆☆（简单）

🎉 开始配置吧！




