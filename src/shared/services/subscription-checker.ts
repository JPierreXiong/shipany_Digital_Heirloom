/**
 * 订阅过期检查服务
 * 检查并处理过期的订阅（基于 Vault 的订阅信息）
 */

import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq, and, lt, ne } from 'drizzle-orm';

export async function checkExpiredSubscriptions() {
  console.log('[Subscription Checker] Starting expired subscription check...');
  
  try {
    const now = new Date();
    
    // 查找所有订阅已过期但状态仍为 active 的 vault
    const expiredVaults = await db()
      .select()
      .from(digitalVaults)
      .where(
        and(
          eq(digitalVaults.status, 'active'),
          ne(digitalVaults.planLevel, 'lifetime'),
          lt(digitalVaults.currentPeriodEnd, now)
        )
      );
    
    console.log(`[Subscription Checker] Found ${expiredVaults.length} expired subscriptions`);
    
    // 处理每个过期的 vault
    for (const vault of expiredVaults) {
      try {
        // 降级到免费版
        await db()
          .update(digitalVaults)
          .set({
            planLevel: 'free',
            currentPeriodEnd: null,
            updatedAt: now
          })
          .where(eq(digitalVaults.id, vault.id));
        
        console.log(`[Subscription Checker] Downgraded vault ${vault.id} to free plan for user ${vault.userId}`);
        
        // TODO: 发送过期通知邮件
        
      } catch (error) {
        console.error(`[Subscription Checker] Failed to process vault ${vault.id}:`, error);
      }
    }
    
    console.log('[Subscription Checker] Completed successfully');
    return {
      checked: expiredVaults.length,
      processed: expiredVaults.length
    };
    
  } catch (error) {
    console.error('[Subscription Checker] Fatal error:', error);
    throw error;
  }
}
