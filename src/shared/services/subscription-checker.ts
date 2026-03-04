/**
 * 订阅过期检查服务
 * 检查并处理过期的订阅
 */

import { db } from '@/core/db';
import { subscription } from '@/core/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function checkExpiredSubscriptions() {
  console.log('[Subscription Checker] Starting expired subscription check...');
  
  try {
    const now = new Date();
    
    // 查找所有过期的活跃订阅
    const expiredSubscriptions = await db()
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.status, 'active'),
          lt(subscription.currentPeriodEnd, now)
        )
      );
    
    console.log(`[Subscription Checker] Found ${expiredSubscriptions.length} expired subscriptions`);
    
    // 处理每个过期订阅
    for (const sub of expiredSubscriptions) {
      try {
        // 更新订阅状态为过期
        await db()
          .update(subscription)
          .set({
            status: 'expired',
            updatedAt: now
          })
          .where(eq(subscription.id, sub.id));
        
        console.log(`[Subscription Checker] Marked subscription ${sub.id} as expired for user ${sub.userId}`);
        
        // TODO: 发送过期通知邮件
        // TODO: 降级用户权限
        
      } catch (error) {
        console.error(`[Subscription Checker] Failed to process subscription ${sub.id}:`, error);
      }
    }
    
    console.log('[Subscription Checker] Completed successfully');
    return {
      checked: expiredSubscriptions.length,
      processed: expiredSubscriptions.length
    };
    
  } catch (error) {
    console.error('[Subscription Checker] Fatal error:', error);
    throw error;
  }
}
