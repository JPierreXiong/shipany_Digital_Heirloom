/**
 * 成本预警检查服务
 * 监控系统成本并发送预警
 */

import { db } from '@/core/db';
import { digitalVault, user } from '@/core/db/schema';
import { sql } from 'drizzle-orm';

// 成本配置（每月）
const COST_CONFIG = {
  // Vercel
  vercelHobby: 0, // 免费
  vercelPro: 20, // 如果升级
  
  // Supabase
  supabaseFree: 0, // 免费额度
  supabasePerGB: 0.125, // 超出后每GB
  
  // Upstash QStash
  upstashFree: 0, // 500次/月免费
  upstashPerRequest: 0.001, // 超出后每次请求
  
  // 预警阈值
  warningThreshold: 50, // $50
  criticalThreshold: 100, // $100
};

export async function checkCostAlerts() {
  console.log('[Cost Alert] Starting cost alert check...');
  
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. 估算数据库存储成本
    let storageCost = 0;
    try {
      // 查询数据库大小（需要数据库权限）
      const dbSize = await db().execute(sql`
        SELECT pg_database_size(current_database()) as size
      `);
      
      const sizeInGB = (dbSize.rows[0]?.size || 0) / (1024 * 1024 * 1024);
      const freeGB = 0.5; // Supabase 免费 500MB
      
      if (sizeInGB > freeGB) {
        storageCost = (sizeInGB - freeGB) * COST_CONFIG.supabasePerGB;
      }
      
      console.log(`[Cost Alert] Database size: ${sizeInGB.toFixed(2)} GB, cost: $${storageCost.toFixed(2)}`);
    } catch (error) {
      console.warn('[Cost Alert] Could not check database size:', error);
    }
    
    // 2. 估算 Cron 调用成本
    let cronCost = 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const estimatedCronCalls = daysInMonth * 1; // 每天1次
    const freeCronCalls = 500;
    
    if (estimatedCronCalls > freeCronCalls) {
      cronCost = (estimatedCronCalls - freeCronCalls) * COST_CONFIG.upstashPerRequest;
    }
    
    console.log(`[Cost Alert] Estimated cron calls: ${estimatedCronCalls}/month, cost: $${cronCost.toFixed(2)}`);
    
    // 3. 统计用户和 Vault 数量
    let userCount = 0;
    let vaultCount = 0;
    
    try {
      const userResult = await db()
        .select({ count: sql<number>`count(*)::int` })
        .from(user);
      userCount = userResult[0]?.count || 0;
      
      const vaultResult = await db()
        .select({ count: sql<number>`count(*)::int` })
        .from(digitalVault);
      vaultCount = vaultResult[0]?.count || 0;
      
      console.log(`[Cost Alert] Users: ${userCount}, Vaults: ${vaultCount}`);
    } catch (error) {
      console.warn('[Cost Alert] Could not get user/vault counts:', error);
    }
    
    // 4. 计算总成本
    const totalCost = storageCost + cronCost + COST_CONFIG.vercelHobby;
    
    // 5. 生成预警
    const alerts = [];
    let alertLevel: 'none' | 'warning' | 'critical' = 'none';
    
    if (totalCost >= COST_CONFIG.criticalThreshold) {
      alertLevel = 'critical';
      alerts.push({
        level: 'critical',
        message: `Monthly cost ($${totalCost.toFixed(2)}) exceeds critical threshold ($${COST_CONFIG.criticalThreshold})`,
        action: 'Immediate action required: Review and optimize costs'
      });
    } else if (totalCost >= COST_CONFIG.warningThreshold) {
      alertLevel = 'warning';
      alerts.push({
        level: 'warning',
        message: `Monthly cost ($${totalCost.toFixed(2)}) exceeds warning threshold ($${COST_CONFIG.warningThreshold})`,
        action: 'Consider optimizing costs or upgrading plan'
      });
    }
    
    // 6. 检查增长趋势
    const projectedMonthlyGrowth = vaultCount * 0.1; // 假设每月增长10%
    const projectedCost = totalCost * (1 + projectedMonthlyGrowth);
    
    if (projectedCost > COST_CONFIG.warningThreshold && alertLevel === 'none') {
      alerts.push({
        level: 'info',
        message: `Projected cost next month: $${projectedCost.toFixed(2)}`,
        action: 'Monitor growth and plan for scaling'
      });
    }
    
    // 7. 输出结果
    const costReport = {
      timestamp: now.toISOString(),
      period: {
        start: monthStart.toISOString(),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      },
      breakdown: {
        vercel: COST_CONFIG.vercelHobby,
        database: storageCost,
        cron: cronCost,
        total: totalCost
      },
      metrics: {
        users: userCount,
        vaults: vaultCount,
        cronCalls: estimatedCronCalls
      },
      alerts,
      alertLevel
    };
    
    if (alerts.length > 0) {
      console.warn('[Cost Alert] Alerts generated:', alerts);
      // TODO: 发送邮件通知管理员
    } else {
      console.log('[Cost Alert] No alerts, costs within normal range');
    }
    
    console.log(`[Cost Alert] Completed: Total cost $${totalCost.toFixed(2)}/month`);
    
    return costReport;
    
  } catch (error) {
    console.error('[Cost Alert] Fatal error:', error);
    throw error;
  }
}
