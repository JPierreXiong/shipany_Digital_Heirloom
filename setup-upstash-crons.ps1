# ============================================
# Upstash QStash 自动配置脚本 (PowerShell)
# 用途: 一键创建 5 个定时任务
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$QStashToken,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$CronSecret
)

Write-Host "🚀 Upstash QStash 配置脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 配置信息:" -ForegroundColor Yellow
Write-Host "  Domain: https://$Domain"
Write-Host "  Token: $($QStashToken.Substring(0, [Math]::Min(20, $QStashToken.Length)))..."
Write-Host "  Secret: $($CronSecret.Substring(0, [Math]::Min(10, $CronSecret.Length)))..."
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 创建任务的函数
function Create-Schedule {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Cron,
        [string]$Description
    )
    
    Write-Host "📌 创建任务: $Name" -ForegroundColor Yellow
    Write-Host "   路径: $Path"
    Write-Host "   频率: $Cron ($Description)"
    
    $body = @{
        destination = "https://$Domain$Path"
        cron = $Cron
        method = "POST"
        headers = @{
            Authorization = "Bearer $CronSecret"
            "Content-Type" = "application/json"
        }
        body = "{}"
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" `
            -Method Post `
            -Headers @{
                Authorization = "Bearer $QStashToken"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "   ✅ 成功创建 (ID: $($response.scheduleId))" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ 创建失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 1. 订阅过期检查（每天凌晨 2 点）
Create-Schedule `
    -Name "订阅过期检查" `
    -Path "/api/cron/check-expired-subscriptions" `
    -Cron "0 2 * * *" `
    -Description "每天凌晨 2 点"

# 2. 心跳检查（每 3 小时）
Create-Schedule `
    -Name "心跳检查" `
    -Path "/api/cron/check-heartbeat" `
    -Cron "0 */3 * * *" `
    -Description "每 3 小时一次"

# 3. Dead Man's Switch 检查（每天凌晨 0 点）
Create-Schedule `
    -Name "Dead Man's Switch 检查" `
    -Path "/api/cron/dead-man-switch-check" `
    -Cron "0 0 * * *" `
    -Description "每天凌晨 0 点"

# 4. 系统健康检查（每天早上 6 点）
Create-Schedule `
    -Name "系统健康检查" `
    -Path "/api/cron/system-health-check" `
    -Cron "0 6 * * *" `
    -Description "每天早上 6 点"

# 5. 成本预警检查（每天中午 12 点）
Create-Schedule `
    -Name "成本预警检查" `
    -Path "/api/cron/cost-alerts-check" `
    -Cron "0 12 * * *" `
    -Description "每天中午 12 点"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ 所有任务创建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 下一步:" -ForegroundColor Yellow
Write-Host "  1. 访问 Upstash Dashboard 查看任务"
Write-Host "  2. 测试任务执行:"
Write-Host "     Invoke-RestMethod -Uri 'https://$Domain/api/cron/check-heartbeat' ``"
Write-Host "       -Method Post ``"
Write-Host "       -Headers @{Authorization='Bearer $CronSecret'}"
Write-Host "  3. 查看 Upstash Logs 确认执行状态"
Write-Host ""
Write-Host "🎉 配置完成！" -ForegroundColor Green

