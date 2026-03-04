/**
 * Dead Man's Switch 检查服务
 * 检查并触发继承流程
 */

import { db } from '@/core/db';
import { digitalVault } from '@/shared/models/digital-vault';
import { eq } from 'drizzle-orm';

export async function checkDeadManSwitch() {
  console.log('[Dead Man Switch] Starting check...');
  
  try {
    // 查找所有状态为 triggered 的保险箱
    const triggeredVaults = await db()
      .select()
      .from(digitalVault)
      .where(eq(digitalVault.status, 'triggered'));
    
    let processedCount = 0;
    
    for (const vault of triggeredVaults) {
      console.log(`[Dead Man Switch] Processing vault ${vault.id}`);
      
      // 这里应该触发继承流程：
      // 1. 发送邮件给受益人
      // 2. 生成访问令牌
      // 3. 更新状态为 released
      
      // 目前只记录日志
      processedCount++;
    }
    
    console.log(`[Dead Man Switch] Completed: ${processedCount} vaults processed`);
    
    return {
      triggered: triggeredVaults.length,
      processed: processedCount
    };
  } catch (error) {
    console.error('[Dead Man Switch] Error:', error);
    throw error;
  }
}

