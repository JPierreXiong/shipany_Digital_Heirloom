# ============================================
# Upstash QStash 配置脚本 - 5 个 Cron 任务
# 项目: Digital Heirloom
# 域名: digitalheirloom.app
# ============================================

# 配置变量
$QSTASH_TOKEN = "eyJVc2VySUQiOiIwNzc3NTVkOS05ZWVhLTQ5Y2QtOTk5Mi0zNTI2ZTNlM2Y4ZjEiLCJQYXNzd29yZCI6IjYyMjM3MjY2ZWI0YjQ4MGVhN2FmYjAzN2EwZTNhNTcyIn0="
$DOMAIN = "digitalheirloom.app"
$CRON_SECRET = "your-cron-secret-here"  # 请替换为您的 CRON_SECRET

Write-Host "🚀 开始配置 Upstash QStash Cron 任务" -ForegroundColor Cyan
Write-Host "域名: https://$DOMAIN" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 任务 1: 订阅过期检查（每天凌晨 2 点）
Write-Host "📌 任务 1: 订阅过期检查" -ForegroundColor Yellow
Write-Host "   频率: 每天凌晨 2 点 (0 2 * * *)" -ForegroundColor Gray

$body1 = @{
    destination = "https://$DOMAIN/api/cron/check-expired-subscriptions"
    cron = "0 2 * * *"
    method = "POST"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = @{
        Authorization = "Bearer $CRON_SECRET"
    } | ConvertTo-Json
} | ConvertTo-Json -Depth 10

try {
    $response1 = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $QSTASH_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body1
    
    Write-Host "   ✅ 成功创建 (ID: $($response1.scheduleId))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ 创建失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 任务 2: 心跳检查（每 3 小时）
Write-Host "📌 任务 2: 心跳检查" -ForegroundColor Yellow
Write-Host "   频率: 每 3 小时 (0 */3 * * *)" -ForegroundColor Gray

$body2 = @{
    destination = "https://$DOMAIN/api/cron/check-heartbeat"
    cron = "0 */3 * * *"
    method = "POST"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = @{
        Authorization = "Bearer $CRON_SECRET"
    } | ConvertTo-Json
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $QSTASH_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body2
    
    Write-Host "   ✅ 成功创建 (ID: $($response2.scheduleId))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ 创建失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 任务 3: Dead Man's Switch 检查（每天凌晨 0 点）
Write-Host "📌 任务 3: Dead Man's Switch 检查" -ForegroundColor Yellow
Write-Host "   频率: 每天凌晨 0 点 (0 0 * * *)" -ForegroundColor Gray

$body3 = @{
    destination = "https://$DOMAIN/api/cron/dead-man-switch-check"
    cron = "0 0 * * *"
    method = "POST"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = @{
        Authorization = "Bearer $CRON_SECRET"
    } | ConvertTo-Json
} | ConvertTo-Json -Depth 10

try {
    $response3 = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $QSTASH_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body3
    
    Write-Host "   ✅ 成功创建 (ID: $($response3.scheduleId))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ 创建失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 任务 4: 系统健康检查（每天早上 6 点）
Write-Host "📌 任务 4: 系统健康检查" -ForegroundColor Yellow
Write-Host "   频率: 每天早上 6 点 (0 6 * * *)" -ForegroundColor Gray

$body4 = @{
    destination = "https://$DOMAIN/api/cron/system-health-check"
    cron = "0 6 * * *"
    method = "POST"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = @{
        Authorization = "Bearer $CRON_SECRET"
    } | ConvertTo-Json
} | ConvertTo-Json -Depth 10

try {
    $response4 = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $QSTASH_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body4
    
    Write-Host "   ✅ 成功创建 (ID: $($response4.scheduleId))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ 创建失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 任务 5: 成本预警检查（每天中午 12 点）
Write-Host "📌 任务 5: 成本预警检查" -ForegroundColor Yellow
Write-Host "   频率: 每天中午 12 点 (0 12 * * *)" -ForegroundColor Gray

$body5 = @{
    destination = "https://$DOMAIN/api/cron/cost-alerts-check"
    cron = "0 12 * * *"
    method = "POST"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = @{
        Authorization = "Bearer $CRON_SECRET"
    } | ConvertTo-Json
} | ConvertTo-Json -Depth 10

try {
    $response5 = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $QSTASH_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $body5
    
    Write-Host "   ✅ 成功创建 (ID: $($response5.scheduleId))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ 创建失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 所有任务配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 下一步:" -ForegroundColor Yellow
Write-Host "  1. 访问 Upstash Dashboard 查看任务" -ForegroundColor White
Write-Host "  2. 在 Vercel 配置环境变量 CRON_SECRET" -ForegroundColor White
Write-Host "  3. 等待任务自动执行或手动测试" -ForegroundColor White
Write-Host ""
Write-Host "🎉 配置完成！" -ForegroundColor Green




