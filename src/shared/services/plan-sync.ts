/**
 * 计划同步服务
 * 用于在支付成功后同步更新用户的 Vault 权益
 */

import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 产品 ID 到计划等级的映射
 */
const PRODUCT_ID_TO_PLAN_LEVEL: Record<string, 'free' | 'base' | 'pro'> = {
  // 年费订阅（1年有效期）
  'prod_4oN2BFtSPSpAnYcvUN0uoi': 'base',  // Base $49/year
  'prod_4epepOcgUjSjPoWmAnBaFt': 'pro',   // Pro $149/year
  
  // 终身买断（10年+有效期）
  'prod_7TTyBF8uPUAGrNJ5tK8sJW': 'base',  // Lifetime Base $299
  'prod_66sZAZLqySq4Rixu7XgYYh': 'pro',   // Lifetime Pro $499
};

/**
 * 判断产品是否为终身买断
 */
const LIFETIME_PRODUCT_IDS = [
  'prod_7TTyBF8uPUAGrNJ5tK8sJW',  // Lifetime Base $299
  'prod_66sZAZLqySq4Rixu7XgYYh',  // Lifetime Pro $499
];

/**
 * 从产品 ID 获取计划等级
 */
export function getPlanLevelFromProductId(productId: string): 'free' | 'base' | 'pro' {
  return PRODUCT_ID_TO_PLAN_LEVEL[productId] || 'free';
}

/**
 * 判断产品是否为终身买断
 */
export function isLifetimeProduct(productId: string): boolean {
  return LIFETIME_PRODUCT_IDS.includes(productId);
}

/**
 * 计算终身买断的有效期（100年后）
 */
export function calculateLifetimeEndDate(): Date {
  const now = new Date();
  const lifetimeEnd = new Date(now);
  lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);
  return lifetimeEnd;
}

/**
 * 同步用户的计划等级和有效期到 Vault
 * 
 * @param userId - 用户 ID
 * @param planLevel - 计划等级 (base/pro)
 * @param currentPeriodEnd - 有效期结束时间
 */
export async function syncUserPlan(
  userId: string,
  planLevel: 'free' | 'base' | 'pro',
  currentPeriodEnd: Date
): Promise<void> {
  try {
    // 查找用户的 Vault
    const vaults = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.userId, userId))
      .limit(1);

    if (vaults.length === 0) {
      console.warn(`⚠️  User ${userId} has no vault, skipping plan sync`);
      return;
    }

    const vault = vaults[0];

    // 更新 Vault 的计划等级和有效期
    await db()
      .update(digitalVaults)
      .set({
        planLevel,
        currentPeriodEnd,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(digitalVaults.id, vault.id));

    console.log(`✅ Synced vault plan for user ${userId}: ${planLevel}, expires: ${currentPeriodEnd.toISOString()}`);
  } catch (error) {
    console.error(`❌ Failed to sync vault plan for user ${userId}:`, error);
    throw error;
  }
}

/**
 * 获取产品信息（用于日志和调试）
 */
export function getProductInfo(productId: string): {
  planLevel: string;
  isLifetime: boolean;
  price: string;
  duration: string;
} {
  const planLevel = getPlanLevelFromProductId(productId);
  const isLifetime = isLifetimeProduct(productId);

  const productInfo: Record<string, { price: string; duration: string }> = {
    'prod_4oN2BFtSPSpAnYcvUN0uoi': { price: '$49', duration: '1 year' },
    'prod_4epepOcgUjSjPoWmAnBaFt': { price: '$149', duration: '1 year' },
    'prod_7TTyBF8uPUAGrNJ5tK8sJW': { price: '$299', duration: '100 years (Lifetime)' },
    'prod_66sZAZLqySq4Rixu7XgYYh': { price: '$499', duration: '100 years (Lifetime)' },
  };

  const info = productInfo[productId] || { price: 'Unknown', duration: 'Unknown' };

  return {
    planLevel,
    isLifetime,
    price: info.price,
    duration: info.duration,
  };
}
