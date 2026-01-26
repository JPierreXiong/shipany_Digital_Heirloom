# Vercel 部署故障排查指南

## 📋 当前状态

- ✅ **GitHub Actions Docker 构建**：成功（3分钟）
- ❌ **Vercel 部署**：失败

## 🔍 可能的原因

### 1. Cron Jobs 配置问题（Hobby Plan 限制）

**Vercel Hobby Plan 限制**：
- 最多 100 个 cron jobs ✅（我们有 3 个）
- 调度精度：每小时（hourly）
- 不能保证精确时间执行

**当前配置**：
```json
{
  "crons": [
    {
      "path": "/api/cron/dead-man-switch-check",
      "schedule": "0 0 * * *"  // 每天午夜（符合要求）
    },
    {
      "path": "/api/cron/system-health-check",
      "schedule": "0 * * * *"  // 每小时（符合要求）
    },
    {
      "path": "/api/cron/cost-alerts-check",
      "schedule": "0 * * * *"  // 每小时（符合要求）
    }
  ]
}
```

### 2. Function 超时问题

**已修复**：已为 cron jobs 添加 `maxDuration: 300` 秒（5分钟）配置。

### 3. 环境变量缺失

**必需的环境变量**（在 Vercel Dashboard 中检查）：
- `DATABASE_URL` - 数据库连接字符串
- `AUTH_SECRET` - 认证密钥
- `NEXT_PUBLIC_APP_URL` - 应用 URL
- `VERCEL_CRON_SECRET` 或 `CRON_SECRET` - Cron 安全密钥（可选但推荐）

### 4. 构建环境差异

虽然 GitHub Actions 构建成功，但 Vercel 的构建环境可能不同：
- Node.js 版本
- 依赖安装方式
- 缓存状态

## 🛠️ 排查步骤

### 步骤 1：查看 Vercel 部署日志

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目页面
3. 点击失败的部署记录
4. 查看 **"Build Logs"** 和 **"Function Logs"**
5. 查找以下关键词：
   - `Error:`
   - `Failed to`
   - `Cannot find`
   - `Type error`
   - `Cron job`

### 步骤 2：检查环境变量

在 Vercel Dashboard → Settings → Environment Variables 中确认：

**必需变量**：
- [ ] `DATABASE_URL`
- [ ] `AUTH_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PRIVATE_SKIP_TURBOPACK=1`（已在 vercel.json 中设置）

**可选但推荐**：
- [ ] `VERCEL_CRON_SECRET` 或 `CRON_SECRET`
- [ ] `RESEND_API_KEY`（如果使用邮件服务）
- [ ] `GEMINI_API_KEY`（如果使用翻译服务）

### 步骤 3：清理缓存并重新部署

1. 在 Vercel Dashboard 中，找到失败的部署
2. 点击 **"Redeploy"**
3. 勾选 **"Use existing Build Cache"** 的**反选**（即不使用缓存）
4. 点击 **"Redeploy"**

### 步骤 4：检查 Cron Jobs 配置

如果错误与 cron jobs 相关，可以临时禁用 cron jobs 测试：

1. 备份 `vercel.json`
2. 临时注释掉 `crons` 数组
3. 提交并推送
4. 如果部署成功，说明问题在 cron 配置
5. 恢复 cron 配置并逐个启用测试

## 🔧 常见错误和解决方案

### 错误 1：`Cron job schedule not supported on Hobby plan`

**解决方案**：
- 确保所有 cron jobs 的调度都是每小时或更少频率
- 当前配置已符合要求

### 错误 2：`Function timeout`

**解决方案**：
- ✅ 已为 cron jobs 添加 `maxDuration: 300`
- 如果仍然超时，考虑优化 cron job 逻辑（分批处理）

### 错误 3：`Environment variable not found`

**解决方案**：
- 在 Vercel Dashboard 中添加缺失的环境变量
- 确保变量名称拼写正确
- 确保为正确的环境（Production/Preview/Development）设置

### 错误 4：`Type error` 或 `Build failed`

**解决方案**：
- 检查 `next.config.mjs` 中的 `ignoreBuildErrors` 设置
- 当前已设置为 `!!process.env.VERCEL`（在 Vercel 环境下忽略类型错误）
- 如果仍有问题，检查具体的类型错误并修复

### 错误 5：`Route not found` 或 `404`

**解决方案**：
- 确认所有 cron API 路由文件存在：
  - `src/app/api/cron/dead-man-switch-check/route.ts`
  - `src/app/api/cron/system-health-check/route.ts`
  - `src/app/api/cron/cost-alerts-check/route.ts`
- ✅ 已确认所有文件存在

## 📝 下一步行动

1. **立即执行**：查看 Vercel 部署日志，找到具体错误信息
2. **如果错误与 cron jobs 相关**：
   - 检查 Vercel Dashboard → Settings → Cron Jobs
   - 确认 cron jobs 是否已正确注册
   - 如果 Hobby Plan 不支持，考虑升级到 Pro Plan 或移除 cron jobs
3. **如果错误与环境变量相关**：
   - 在 Vercel Dashboard 中添加缺失的变量
   - 重新部署
4. **如果错误与构建相关**：
   - 清理构建缓存
   - 重新部署

## 🎯 快速诊断命令

在本地运行以下命令，模拟 Vercel 构建环境：

```bash
# 设置 Vercel 环境变量
export VERCEL=1
export NEXT_PRIVATE_SKIP_TURBOPACK=1
export NODE_OPTIONS="--max-old-space-size=4096"

# 清理并重新构建
rm -rf .next
pnpm install --frozen-lockfile
pnpm build
```

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供：
1. Vercel 部署日志的完整错误信息
2. 具体的错误堆栈跟踪
3. 失败时的构建步骤

---

**最后更新**：2025-01-XX
**相关文件**：`vercel.json`, `next.config.mjs`
