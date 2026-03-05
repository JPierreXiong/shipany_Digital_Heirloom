# ============================================
# Upstash QStash 配置 - cURL 命令版本
# 项目: Digital Heirloom
# 域名: digitalheirloom.app
# ============================================

# 配置信息
QSTASH_TOKEN="eyJVc2VySUQiOiIwNzc3NTVkOS05ZWVhLTQ5Y2QtOTk5Mi0zNTI2ZTNlM2Y4ZjEiLCJQYXNzd29yZCI6IjYyMjM3MjY2ZWI0YjQ4MGVhN2FmYjAzN2EwZTNhNTcyIn0="
DOMAIN="digitalheirloom.app"
CRON_SECRET="your-cron-secret-here"  # 请替换为您的 CRON_SECRET

echo "🚀 开始配置 Upstash QStash Cron 任务"
echo "域名: https://$DOMAIN"
echo "========================================"
echo ""

# 任务 1: 订阅过期检查（每天凌晨 2 点）
echo "📌 任务 1: 订阅过期检查"
echo "   频率: 每天凌晨 2 点 (0 2 * * *)"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://'"$DOMAIN"'/api/cron/check-expired-subscriptions",
    "cron": "0 2 * * *",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"Authorization\": \"Bearer '"$CRON_SECRET"'\"}"
  }'

echo ""
echo ""

# 任务 2: 心跳检查（每 3 小时）
echo "📌 任务 2: 心跳检查"
echo "   频率: 每 3 小时 (0 */3 * * *)"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://'"$DOMAIN"'/api/cron/check-heartbeat",
    "cron": "0 */3 * * *",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"Authorization\": \"Bearer '"$CRON_SECRET"'\"}"
  }'

echo ""
echo ""

# 任务 3: Dead Man's Switch 检查（每天凌晨 0 点）
echo "📌 任务 3: Dead Man's Switch 检查"
echo "   频率: 每天凌晨 0 点 (0 0 * * *)"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://'"$DOMAIN"'/api/cron/dead-man-switch-check",
    "cron": "0 0 * * *",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"Authorization\": \"Bearer '"$CRON_SECRET"'\"}"
  }'

echo ""
echo ""

# 任务 4: 系统健康检查（每天早上 6 点）
echo "📌 任务 4: 系统健康检查"
echo "   频率: 每天早上 6 点 (0 6 * * *)"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://'"$DOMAIN"'/api/cron/system-health-check",
    "cron": "0 6 * * *",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"Authorization\": \"Bearer '"$CRON_SECRET"'\"}"
  }'

echo ""
echo ""

# 任务 5: 成本预警检查（每天中午 12 点）
echo "📌 任务 5: 成本预警检查"
echo "   频率: 每天中午 12 点 (0 12 * * *)"

curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://'"$DOMAIN"'/api/cron/cost-alerts-check",
    "cron": "0 12 * * *",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"Authorization\": \"Bearer '"$CRON_SECRET"'\"}"
  }'

echo ""
echo ""
echo "========================================"
echo "✅ 所有任务配置完成！"
echo ""
echo "📊 下一步:"
echo "  1. 访问 Upstash Dashboard 查看任务"
echo "  2. 在 Vercel 配置环境变量 CRON_SECRET"
echo "  3. 等待任务自动执行或手动测试"
echo ""
echo "🎉 配置完成！"




