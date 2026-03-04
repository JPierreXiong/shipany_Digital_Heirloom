/**
 * 心跳检查服务
 * 检查用户的心跳状态
 */

import { db } from '@/core/db';
import { digitalVault } from '@/shared/models/digital-vault';
import { eq } from 'drizzle-orm';

export async function checkHeartbeats() {
  console.log('[Heartbeat Checker] Starting heartbeat check...');
  
  try {
    const now = new Date();
    
    // 查找所有启用 Dead Man's Switch 的保险箱
    const vaults = await db()
      .select()
      .from(digitalVault)
      .where(eq(digitalVault.deadManSwitchEnabled, true));
    
    let checkedCount = 0;
    let missedCount = 0;
    
    for (const vault of vaults) {
      checkedCount++;
      
      if (!vault.lastSeenAt) {
        continue;
      }
      
      const lastSeen = new Date(vault.lastSeenAt);
      const heartbeatFrequency = vault.heartbeatFrequency || 30; // 默认 30 天
      const gracePeriod = vault.gracePeriod || 7; // 默认 7 天
      const totalDays = heartbeatFrequency + gracePeriod;
      
      const daysSinceLastSeen = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastSeen > totalDays) {
        missedCount++;
        console.log(`[Heartbeat Checker] Vault ${vault.id} missed heartbeat: ${daysSinceLastSeen} days`);
        
        // 更新状态为 triggered
        await db()
          .update(digitalVault)
          .set({
            status: 'triggered',
            updatedAt: now
          })
          .where(eq(digitalVault.id, vault.id));
      }
    }
    
    console.log(`[Heartbeat Checker] Completed: ${checkedCount} checked, ${missedCount} missed`);
    
    return {
      checked: checkedCount,
      missed: missedCount
    };
  } catch (error) {
    console.error('[Heartbeat Checker] Error:', error);
    throw error;
  }
}

