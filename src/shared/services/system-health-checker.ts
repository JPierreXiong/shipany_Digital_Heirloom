/**
 * 系统健康检查服务
 * 监控系统健康状态和关键指标
 */

import { db } from '@/core/db';
import { digitalVault, user } from '@/config/db/schema';
import { sql } from 'drizzle-orm';

export async function checkSystemHealth() {
  console.log('[System Health] Starting system health check...');
  
  try {
    const healthMetrics = {
      timestamp: new Date().toISOString(),
      database: { status: 'unknown', responseTime: 0 },
      vaults: { total: 0, active: 0, triggered: 0, released: 0 },
      users: { total: 0, active: 0 },
      subscriptions: { total: 0, active: 0, expired: 0 },
      errors: [] as string[]
    };
    
    // 1. 检查数据库连接
    try {
      const dbStart = Date.now();
      await db().execute(sql`SELECT 1`);
      healthMetrics.database.status = 'healthy';
      healthMetrics.database.responseTime = Date.now() - dbStart;
      console.log(`[System Health] Database: OK (${healthMetrics.database.responseTime}ms)`);
    } catch (error: any) {
      healthMetrics.database.status = 'error';
      healthMetrics.errors.push(`Database error: ${error.message}`);
      console.error('[System Health] Database check failed:', error);
    }
    
    // 2. 统计 Vault 数据
    try {
      const vaultStats = await db()
        .select({
          status: digitalVault.status,
          count: sql<number>`count(*)::int`
        })
        .from(digitalVault)
        .groupBy(digitalVault.status);
      
      healthMetrics.vaults.total = vaultStats.reduce((sum, s) => sum + s.count, 0);
      vaultStats.forEach(stat => {
        if (stat.status === 'active') healthMetrics.vaults.active = stat.count;
        if (stat.status === 'triggered') healthMetrics.vaults.triggered = stat.count;
        if (stat.status === 'released') healthMetrics.vaults.released = stat.count;
      });
      
      console.log(`[System Health] Vaults: ${healthMetrics.vaults.total} total, ${healthMetrics.vaults.active} active`);
    } catch (error: any) {
      healthMetrics.errors.push(`Vault stats error: ${error.message}`);
      console.error('[System Health] Vault stats failed:', error);
    }
    
    // 3. 统计用户数据
    try {
      const userCount = await db()
        .select({ count: sql<number>`count(*)::int` })
        .from(user);
      
      healthMetrics.users.total = userCount[0]?.count || 0;
      
      console.log(`[System Health] Users: ${healthMetrics.users.total} total`);
    } catch (error: any) {
      healthMetrics.errors.push(`User stats error: ${error.message}`);
      console.error('[System Health] User stats failed:', error);
    }
    
    // 4. 统计订阅数据（基于 Vault 的 planLevel）
    try {
      const planStats = await db()
        .select({
          planLevel: digitalVault.planLevel,
          count: sql<number>`count(*)::int`
        })
        .from(digitalVault)
        .groupBy(digitalVault.planLevel);
      
      healthMetrics.subscriptions.total = planStats.reduce((sum, s) => sum + s.count, 0);
      planStats.forEach(stat => {
        if (stat.planLevel !== 'free') healthMetrics.subscriptions.active = stat.count;
      });
      
      console.log(`[System Health] Plans: ${healthMetrics.subscriptions.total} total, ${healthMetrics.subscriptions.active} paid`);
    } catch (error: any) {
      healthMetrics.errors.push(`Plan stats error: ${error.message}`);
      console.error('[System Health] Plan stats failed:', error);
    }
    
    // 5. 检查异常情况
    const warnings = [];
    
    if (healthMetrics.vaults.triggered > 10) {
      warnings.push(`High number of triggered vaults: ${healthMetrics.vaults.triggered}`);
    }
    
    if (healthMetrics.subscriptions.expired > healthMetrics.subscriptions.active * 0.5) {
      warnings.push(`High expired subscription ratio: ${healthMetrics.subscriptions.expired}/${healthMetrics.subscriptions.total}`);
    }
    
    if (healthMetrics.database.responseTime > 1000) {
      warnings.push(`Slow database response: ${healthMetrics.database.responseTime}ms`);
    }
    
    if (warnings.length > 0) {
      console.warn('[System Health] Warnings:', warnings);
    }
    
    const isHealthy = healthMetrics.database.status === 'healthy' && healthMetrics.errors.length === 0;
    
    console.log(`[System Health] Completed: ${isHealthy ? 'HEALTHY' : 'DEGRADED'}`);
    
    return {
      healthy: isHealthy,
      metrics: healthMetrics,
      warnings
    };
    
  } catch (error) {
    console.error('[System Health] Fatal error:', error);
    throw error;
  }
}
