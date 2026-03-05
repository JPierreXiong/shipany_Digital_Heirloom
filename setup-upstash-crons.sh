#!/bin/bash

# ============================================
# Upstash QStash 自动配置脚本
# 用途: 一键创建 5 个定时任务
# ============================================

echo "🚀 Upstash QStash 配置脚本"
echo "=========================================="
echo ""

# 检查是否提供了必要的参数
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "❌ 缺少必要参数！"
    echo ""
    echo "使用方法:"
    echo "  ./setup-upstash-crons.sh <QSTASH_TOKEN> <DOMAIN> <CRON_SECRET>"
    echo ""
    echo "示例:"
    echo "  ./setup-upstash-crons.sh eyJxxx... your-app.vercel.app abc123..."
    echo ""
    echo "参数说明:"
    echo "  QSTASH_TOKEN  - 从 Upstash Dashboard 获取"
    echo "  DOMAIN        - 你的 Vercel 域名（不含 https://）"
    echo "  CRON_SECRET   - 自定义的安全密钥"
    echo ""
    exit 1
fi

# 配置变量
QSTASH_TOKEN="$1"
DOMAIN="$2"
CRON_SECRET="$3"

echo "📋 配置信息:"
echo "  Domain: https://$DOMAIN"
echo "  Token: ${QSTASH_TOKEN:0:20}..."
echo "  Secret: ${CRON_SECRET:0:10}..."
echo ""
echo "=========================================="
echo ""

# 创建任务的函数
create_schedule() {
    local name="$1"
    local path="$2"
    local cron="$3"
    local description="$4"
    
    echo "📌 创建任务: $name"
    echo "   路径: $path"
    echo "   频率: $cron ($description)"
    
    response=$(curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
      -H "Authorization: Bearer $QSTASH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "destination": "https://'"$DOMAIN"''"$path"'",
        "cron": "'"$cron"'",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer '"$CRON_SECRET"'",
          "Content-Type": "application/json"
        },
        "body": "{}"
      }')
    
    # 检查响应
    if echo "$response" | grep -q "scheduleId"; then
        schedule_id=$(echo "$response" | grep -o '"scheduleId":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ 成功创建 (ID: $schedule_id)"
    else
        echo "   ❌ 创建失败"
        echo "   响应: $response"
    fi
    echo ""
}

# 1. 订阅过期检查（每天凌晨 2 点）
create_schedule \
    "订阅过期检查" \
    "/api/cron/check-expired-subscriptions" \
    "0 2 * * *" \
    "每天凌晨 2 点"

# 2. 心跳检查（每 3 小时）
create_schedule \
    "心跳检查" \
    "/api/cron/check-heartbeat" \
    "0 */3 * * *" \
    "每 3 小时一次"

# 3. Dead Man's Switch 检查（每天凌晨 0 点）
create_schedule \
    "Dead Man's Switch 检查" \
    "/api/cron/dead-man-switch-check" \
    "0 0 * * *" \
    "每天凌晨 0 点"

# 4. 系统健康检查（每天早上 6 点）
create_schedule \
    "系统健康检查" \
    "/api/cron/system-health-check" \
    "0 6 * * *" \
    "每天早上 6 点"

# 5. 成本预警检查（每天中午 12 点）
create_schedule \
    "成本预警检查" \
    "/api/cron/cost-alerts-check" \
    "0 12 * * *" \
    "每天中午 12 点"

echo "=========================================="
echo "✅ 所有任务创建完成！"
echo ""
echo "📊 下一步:"
echo "  1. 访问 Upstash Dashboard 查看任务"
echo "  2. 测试任务执行:"
echo "     curl -X POST https://$DOMAIN/api/cron/check-heartbeat \\"
echo "       -H \"Authorization: Bearer $CRON_SECRET\""
echo "  3. 查看 Upstash Logs 确认执行状态"
echo ""
echo "🎉 配置完成！"




