/**
 * Dead Man's Switch 检查服务
 * 检查并触发 Dead Man's Switch
 */

import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkDeadManSwitch() {
  console.log('[Dead Man Switch] Starting Dead Man\'s Switch check...');
  
  try {
    const now = new Date();
    
    // 查找所有已触发但未处理的 vault
    const triggeredVaults = await db()
      .select()
      .from(digitalVaults)
      .where(
        and(
          eq(digitalVaults.status, 'triggered'),
          eq(digitalVaults.deadManSwitchEnabled, true)
        )
      );
    
    console.log(`[Dead Man Switch] Found ${triggeredVaults.length} triggered vaults`);
    
    let processedCount = 0;
    
    for (const vault of triggeredVaults) {
      try {
        console.log(`[Dead Man Switch] Processing vault ${vault.id} for user ${vault.userId}`);
        
        // TODO: 获取受益人列表
        // TODO: 生成解密密钥片段
        // TODO: 发送邮件给受益人
        // TODO: 记录继承日志
        
        // 更新状态为已释放
        await db()
          .update(digitalVaults)
          .set({
            status: 'released',
            updatedAt: now
          })
          .where(eq(digitalVaults.id, vault.id));
        
        processedCount++;
        console.log(`[Dead Man Switch] Successfully processed vault ${vault.id}`);
        
      } catch (error) {
        console.error(`[Dead Man Switch] Failed to process vault ${vault.id}:`, error);
      }
    }
    
    console.log(`[Dead Man Switch] Completed: ${processedCount} vaults processed`);
    return {
      checked: triggeredVaults.length,
      processed: processedCount
    };
    
  } catch (error) {
    console.error('[Dead Man Switch] Fatal error:', error);
    throw error;
  }
}
