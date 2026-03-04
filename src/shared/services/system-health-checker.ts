/**
 * 系统健康检查服务
 * 监控系统状态和性能
 */

import { db } from '@/core/db';
import { digitalVault } from '@/shared/models/digital-vault';

export async function checkSystemHealth() {
  console.log('[System Health] Starting health check...');
  
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      database: 'ok',
      vaults: {
        total: 0,
        active: 0,
        triggered: 0,
        released: 0
      }
    };
    
    // 检查数据库连接
    try {
      const vaults = await db()
        .select()
        .from(digitalVault);
      
      stats.vaults.total = vaults.length;
      stats.vaults.active = vaults.filter(v => v.status === 'active').length;
      stats.vaults.triggered = vaults.filter(v => v.status === 'triggered').length;
      stats.vaults.released = vaults.filter(v => v.status === 'released').length;
      
      stats.database = 'ok';
    } catch (error) {
      stats.database = 'error';
      console.error('[System Health] Database error:', error);
    }
    
    console.log('[System Health] Completed:', JSON.stringify(stats));
    
    return stats;
  } catch (error) {
    console.error('[System Health] Error:', error);
    throw error;
  }
}

