# 🎯 使用现有 Cron 任务的简化方案

## 💡 方案说明

不需要创建 5 个独立的 Cron 任务，只需修改现有的 2 个任务，让它们调用统一的检查端点即可。

**优势**:
- ✅ 只需修改现有任务，无需创建新任务
- ✅ 一次调用执行所有 5 个检查
- ✅ 降低调用频率（2-3 天一次即可）
- ✅ 更容易管理和监控

---

## 📋 现有任务情况

您已经有 2 个 Cron 任务：

| Schedule ID | Destination | Cron | 状态 |
|------------|-------------|------|------|
| scd_6BoM2dGXoPDVrb45izid8YoQYEyJ | https://www.digitalheirloom.app/api/cron/heartbeat | 0 0,6,12,18,21 * * * | Active |
| scd_4eZuuu2KEyyMN5ve34tsk7QVp472 | https://www.digitalheirloom.app/api/cron/heartbeat | 0 0,6,12,18,21 * * * | Active |

---

## 🔧 修改方案

### 方案 A: 每天 1 次（推荐）

**修改任务 1**:
```
Destination: https://www.digitalheirloom.app/api/cron/unified-check
或: https://shipany-digital-heirloom.vercel.app/api/cron/unified-check

Cron: 0 2 * * *
说明: 每天凌晨 2:00 执行所有 5 个检查
```

**删除任务 2** (或保留作为备份)

---

### 方案 B: 每 2 天 1 次

**修改任务 1**:
```
Destination: https://www.digitalheirloom.app/api/cron/unified-check

Cron: 0 2 */2 * *
说明: 每 2 天凌晨 2:00 执行所有 5 个检查
```

**删除任务 2**

---

### 方案 C: 每 3 天 1 次

**修改任务 1**:
```
Destination: https://www.digitalheirloom.app/api/cron/unified-check

Cron: 0 2 */3 * *
说明: 每 3 天凌晨 2:00 执行所有 5 个检查
```

**删除任务 2**

---

### 方案 D: 每 12 小时 1 次（平衡方案）

**修改任务 1**:
```
Destination: https://www.digitalheirloom.app/api/cron/unified-check

Cron: 0 */12 * * *
说明: 每 12 小时执行所有 5 个检查（每天 2 次）
```

**删除任务 2**

---

## 📝 修改步骤

### 1. 访问 Upstash Dashboard

打开浏览器，访问：https://console.upstash.com/qstash

### 2. 修改任务 1

1. 找到任务 `scd_6BoM2dGXoPDVrb45izid8YoQYEyJ`
2. 点击任务右侧的 "..." 菜单
3. 选择 "Edit"
4. 修改以下字段：

```
Destination: https://www.digitalheirloom.app/api/cron/unified-check
Cron: 0 2 * * *  (或选择其他方案的 Cron 表达式)
Method: POST
Body: {"Authorization": "Bearer d42281902beb7caf7619821c9975581b8d8ab87df6b3ece81e21910538ae2a48"}
Headers: Content-Type: application/json
```

5. 点击 "Save" 保存

### 3. 删除任务 2（可选）

1. 找到任务 `scd_4eZuuu2KEyyMN5ve34tsk7QVp472`
2. 点击任务右侧的 "..." 菜单
3. 选择 "Delete"
4. 确认删除

---

## 🧪 测试统一端点

### 方法 1: 在 Upstash Dashboard 测试

1. 找到修改后的任务
2. 点击 "..." 菜单
3. 选择 "Trigger Now"
4. 查看 "Logs" 标签，确认执行成功

### 方法 2: 使用 PowerShell 测试

```powershell
$headers = @{
    "Authorization" = "Bearer d42281902beb7caf7619821c9975581b8d8ab87df6b3ece81e21910538ae2a48"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://www.digitalheirloom.app/api/cron/unified-check" -Method Post -Headers $headers
```

### 方法 3: 使用 curl 测试

```bash
curl -X POST https://www.digitalheirloom.app/api/cron/unified-check \
  -H "Authorization: Bearer d42281902beb7caf7619821c9975581b8d8ab87df6b3ece81e21910538ae2a48" \
  -H "Content-Type: application/json"
```

---

## 📊 Cron 表达式对照表

| Cron 表达式 | 说明 | 每月调用次数 |
|------------|------|-------------|
| `0 2 * * *` | 每天凌晨 2:00 | 30 次 |
| `0 */12 * * *` | 每 12 小时 | 60 次 |
| `0 2 */2 * *` | 每 2 天凌晨 2:00 | 15 次 |
| `0 2 */3 * *` | 每 3 天凌晨 2:00 | 10 次 |
| `0 2 * * 0` | 每周日凌晨 2:00 | 4 次 |

**推荐**: `0 2 * * *` (每天 1 次) - 平衡了及时性和资源消耗

---

## ✅ 统一端点执行的 5 个检查

1. **订阅过期检查** - 检查并降级过期订阅
2. **心跳检查** - 检查用户活跃状态
3. **Dead Man's Switch** - 检查触发条件
4. **系统健康检查** - 监控系统状态
5. **成本预警检查** - 检查成本阈值

所有检查在一次调用中并行执行，返回详细的执行报告。

---

## 📈 返回结果示例

```json
{
  "success": true,
  "summary": {
    "total": 5,
    "success": 5,
    "errors": 0,
    "duration": 1234
  },
  "results": {
    "timestamp": "2026-03-04T10:00:00.000Z",
    "tasks": [
      {
        "name": "subscription-expiry-check",
        "status": "success",
        "message": "Checked expired subscriptions",
        "duration": 234
      },
      {
        "name": "heartbeat-check",
        "status": "success",
        "message": "Checked vault heartbeats",
        "duration": 345
      },
      {
        "name": "dead-man-switch-check",
        "status": "success",
        "message": "Checked Dead Man's Switch triggers",
        "duration": 123
      },
      {
        "name": "system-health-check",
        "status": "success",
        "message": "System health check completed",
        "duration": 456
      },
      {
        "name": "cost-alerts-check",
        "status": "success",
        "message": "Cost alerts check completed",
        "duration": 76
      }
    ]
  }
}
```

---

## 🎯 完成检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 已自动部署
- [ ] 在 Upstash 修改任务 1 的 Destination 和 Cron
- [ ] 删除任务 2（可选）
- [ ] 手动触发测试（Trigger Now）
- [ ] 查看 Logs 确认所有 5 个检查都成功
- [ ] 确认 CRON_SECRET 已配置在 Vercel

---

## 🐛 故障排查

### 问题: 返回 401 Unauthorized

**解决**: 确认 Vercel 环境变量 `CRON_SECRET` 已配置并重新部署

### 问题: 某个检查失败

**解决**: 查看返回的 `results.tasks` 数组，找到失败的任务和错误信息

### 问题: 整个请求超时

**解决**: 检查数据库连接和网络状况

---

## 📞 下一步

1. ✅ 提交代码到 GitHub
2. ✅ 等待 Vercel 自动部署
3. ✅ 修改 Upstash 任务 1
4. ✅ 测试统一端点
5. ✅ 删除任务 2（可选）

**预计完成时间**: 5 分钟

---

**这个方案更简单、更高效！** 🚀



