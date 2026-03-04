/**
 * 成本预警检查服务
 * 监控系统成本和资源使用
 */

import { db } from '@/core/db';
import { digitalVault } from '@/shared/models/digital-vault';

export async function checkCostAlerts() {
  console.log('[Cost Alerts] Starting cost check...');
  
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      vaults: {
        total: 0,
        free: 0,
        annual: 0,
        lifetime: 0
      },
      alerts: [] as string[]
    };
    
    // 统计保险箱数量
    const vaults = await db()
      .select()
      .from(digitalVault);
    
    stats.vaults.total = vaults.length;
    stats.vaults.free = vaults.filter(v => v.planLevel === 'free').length;
    stats.vaults.annual = vaults.filter(v => v.planLevel === 'annual').length;
    stats.vaults.lifetime = vaults.filter(v => v.planLevel === 'lifetime').length;
    
    // 检查是否超过阈值
    if (stats.vaults.total > 1000) {
      stats.alerts.push('Total vaults exceeds 1000');
    }
    
    if (stats.vaults.free > 500) {
      stats.alerts.push('Free tier vaults exceeds 500');
    }
    
    console.log('[Cost Alerts] Completed:', JSON.stringify(stats));
    
    return stats;
  } catch (error) {
    console.error('[Cost Alerts] Error:', error);
    throw error;
  }
}

