# Upstash QStash 任务创建脚本
# 使用正确的 Token 和域名

$QSTASH_TOKEN = "eyJVc2VySUQiOiIwNzc3NTVkOS05ZWVhLTQ5Y2QtOTk5Mi0zNTI2ZTNlM2Y4ZjEiLCJQYXNzd29yZCI6IjYyMjM3MjY2ZWI0YjQ4MGVhN2FmYjAzN2EwZTNhNTcyIn0="
$QSTASH_URL = "https://qstash-us-east-1.upstash.io"
$DOMAIN = "https://shipany-digital-heirloom.vercel.app"
$CRON_SECRET = "d42281902beb7caf7619821c9975581b8d8ab87df6b3ece81e21910538ae2a48"

$headers = @{
    "Authorization" = "Bearer $QSTASH_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating 5 Upstash QStash Cron Jobs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Task 1: 订阅过期检查
Write-Host "[1/5] Creating: Subscription Expiry Check..." -ForegroundColor Yellow
$task1Body = @{
    destination = "$DOMAIN/api/cron/check-expired-subscriptions"
    cron = "0 2 * * *"
} | ConvertTo-Json -Depth 10

try {
    $result1 = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Method Post -Headers $headers -Body $task1Body
    Write-Host "✅ Task 1 Created: $($result1.scheduleId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Task 1 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Task 2: 心跳检查
Write-Host "[2/5] Creating: Heartbeat Check..." -ForegroundColor Yellow
$task2Body = @{
    destination = "$DOMAIN/api/cron/check-heartbeat"
    cron = "0 */3 * * *"
} | ConvertTo-Json -Depth 10

try {
    $result2 = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Method Post -Headers $headers -Body $task2Body
    Write-Host "✅ Task 2 Created: $($result2.scheduleId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Task 2 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Task 3: Dead Man's Switch
Write-Host "[3/5] Creating: Dead Man's Switch Check..." -ForegroundColor Yellow
$task3Body = @{
    destination = "$DOMAIN/api/cron/dead-man-switch-check"
    cron = "0 0 * * *"
} | ConvertTo-Json -Depth 10

try {
    $result3 = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Method Post -Headers $headers -Body $task3Body
    Write-Host "✅ Task 3 Created: $($result3.scheduleId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Task 3 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Task 4: 系统健康检查
Write-Host "[4/5] Creating: System Health Check..." -ForegroundColor Yellow
$task4Body = @{
    destination = "$DOMAIN/api/cron/system-health-check"
    cron = "0 6 * * *"
} | ConvertTo-Json -Depth 10

try {
    $result4 = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Method Post -Headers $headers -Body $task4Body
    Write-Host "✅ Task 4 Created: $($result4.scheduleId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Task 4 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Task 5: 成本预警检查
Write-Host "[5/5] Creating: Cost Alerts Check..." -ForegroundColor Yellow
$task5Body = @{
    destination = "$DOMAIN/api/cron/cost-alerts-check"
    cron = "0 12 * * *"
} | ConvertTo-Json -Depth 10

try {
    $result5 = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Method Post -Headers $headers -Body $task5Body
    Write-Host "✅ Task 5 Created: $($result5.scheduleId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Task 5 Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ All tasks creation completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://console.upstash.com/qstash to verify tasks" -ForegroundColor White
Write-Host "2. Add CRON_SECRET to Vercel environment variables" -ForegroundColor White
Write-Host "3. Test one task manually in Upstash Dashboard" -ForegroundColor White

