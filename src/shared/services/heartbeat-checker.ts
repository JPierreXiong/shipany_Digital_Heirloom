/**
 * 心跳检查服务
 * 检查用户的心跳状态，识别不活跃用户
 */

import { db } from '@/core/db';
import { digitalVault } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkHeartbeats() {
  console.log('[Heartbeat Checker] Starting heartbeat check...');
  
  try {
    const now = new Date();
    
    // 查找所有启用了 Dead Man's Switch 的 vault
    const vaults = await db()
      .select()
      .from(digitalVault)
      .where(
        and(
          eq(digitalVault.deadManSwitchEnabled, true),
          eq(digitalVault.status, 'active')
        )
      );
    
    console.log(`[Heartbeat Checker] Found ${vaults.length} active vaults with DMS enabled`);
    
    let inactiveCount = 0;
    
    for (const vault of vaults) {
      try {
        if (!vault.lastSeenAt || !vault.heartbeatFrequency || !vault.gracePeriod) {
          continue;
        }
        
        // 计算最后心跳时间 + 频率 + 宽限期
        const lastSeen = new Date(vault.lastSeenAt);
        const maxInactiveDays = vault.heartbeatFrequency + vault.gracePeriod;
        const maxInactiveMs = maxInactiveDays * 24 * 60 * 60 * 1000;
        const inactiveThreshold = new Date(lastSeen.getTime() + maxInactiveMs);
        
        // 检查是否超过不活跃阈值
        if (now > inactiveThreshold) {
          inactiveCount++;
          
          console.log(`[Heartbeat Checker] Vault ${vault.id} is inactive (last seen: ${lastSeen.toISOString()})`);
          
          // 更新状态为触发
          await db()
            .update(digitalVault)
            .set({
              status: 'triggered',
              updatedAt: now
            })
            .where(eq(digitalVault.id, vault.id));
          
          // TODO: 触发继承流程
          // TODO: 通知受益人
          
          console.log(`[Heartbeat Checker] Triggered inheritance for vault ${vault.id}`);
        }
        
      } catch (error) {
        console.error(`[Heartbeat Checker] Failed to process vault ${vault.id}:`, error);
      }
    }
    
    console.log(`[Heartbeat Checker] Completed: ${inactiveCount} vaults triggered`);
    return {
      checked: vaults.length,
      triggered: inactiveCount
    };
    
  } catch (error) {
    console.error('[Heartbeat Checker] Fatal error:', error);
    throw error;
  }
}
