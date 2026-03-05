/**
 * 计划同步服务
 * 用于同步用户、订阅和保险箱的计划等级
 */

import { updateUser } from '../models/user';
import { updateDigitalVaultByUserId } from '../models/digital-vault';

/**
 * 从 product_id 获取计划等级
 */
export function getPlanLevelFromProductId(productId: string): 'free' | 'base' | 'pro' {
  if (!productId) return 'free';
  
  const productIdLower = productId.toLowerCase();
  
  // Base 计划（年付和终身）
  if (productIdLower.includes('base')) {
    return 'base';
  }
  
  // Pro 计划（年付和终身）
  if (productIdLower.includes('pro')) {
    return 'pro';
  }
  
  // 默认返回 free
  return 'free';
}

/**
 * 同步用户计划等级到所有相关表
 */
export async function syncUserPlan(
  userId: string, 
  planLevel: 'free' | 'base' | 'pro',
  currentPeriodEnd?: Date
) {
  try {
    // 同步更新 user 表
    await updateUser(userId, { 
      planType: planLevel 
    });

    // 同步更新 digitalVaults 表
    const vaultUpdate: any = {
      planLevel: planLevel,
    };
    
    // 如果提供了有效期，也更新
    if (currentPeriodEnd) {
      vaultUpdate.currentPeriodEnd = currentPeriodEnd;
    }
    
    await updateDigitalVaultByUserId(userId, vaultUpdate);

    console.log(`✅ Synced plan level for user ${userId}: ${planLevel}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to sync user plan:', error);
    throw error;
  }
}

/**
 * 计算剩余天数
 */
export function calculateDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null;
  
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * 计算终身版的有效期（设置为100年后）
 */
export function calculateLifetimeEndDate(): Date {
  const now = new Date();
  const lifetimeEnd = new Date(now);
  lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);
  return lifetimeEnd;
}




