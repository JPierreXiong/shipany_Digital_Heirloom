/**
 * 订阅过期检查服务
 * 检查并处理过期的订阅
 */

import { db } from '@/core/db';
import { digitalVault } from '@/shared/models/digital-vault';
import { eq, lt } from 'drizzle-orm';

export async function checkExpiredSubscriptions() {
  console.log('[Subscription Checker] Starting expired subscription check...');
  
  try {
    const now = new Date();
    
    // 查找所有过期的保险箱
    const expiredVaults = await db()
      .select()
      .from(digitalVault)
      .where(
        eq(digitalVault.planLevel, 'annual')
      );
    
    let expiredCount = 0;
    let downgradedCount = 0;
    
    for (const vault of expiredVaults) {
      // 检查是否过期
      if (vault.currentPeriodEnd && new Date(vault.currentPeriodEnd) < now) {
        // 降级到免费版
        await db()
          .update(digitalVault)
          .set({
            planLevel: 'free',
            currentPeriodEnd: null,
            updatedAt: now
          })
          .where(eq(digitalVault.id, vault.id));
        
        expiredCount++;
        downgradedCount++;
        
        console.log(`[Subscription Checker] Downgraded vault ${vault.id} to free plan`);
      }
    }
    
    console.log(`[Subscription Checker] Completed: ${expiredCount} expired, ${downgradedCount} downgraded`);
    
    return {
      checked: expiredVaults.length,
      expired: expiredCount,
      downgraded: downgradedCount
    };
  } catch (error) {
    console.error('[Subscription Checker] Error:', error);
    throw error;
  }
}

