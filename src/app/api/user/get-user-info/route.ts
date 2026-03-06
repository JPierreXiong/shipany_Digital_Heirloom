import { PERMISSIONS } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';
import { getUserPlanLimits } from '@/shared/services/media/plan-limits';
import { PLAN_CONFIG, PlanType } from '@/shared/config/plans';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { findDigitalVaultByUserId } from '@/shared/models/digital-vault';
// 计算剩余天数
function calculateDaysRemaining(endDate: Date | null | undefined): number | null {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export async function POST(req: Request) {
  try {
    // get sign user info
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    // check if user is admin
    const isAdmin = await hasPermission(user.id, PERMISSIONS.ADMIN_ACCESS);

    // get remaining credits
    const remainingCredits = await getRemainingCredits(user.id);

    // get plan information
    const planLimits = await getUserPlanLimits(user.id);
    const planConfig = PLAN_CONFIG[planLimits.planType as PlanType] || PLAN_CONFIG.free;

    // 🆕 获取订阅信息
    const subscription = await getCurrentSubscription(user.id);
    
    // 🆕 获取 Vault 信息
    const vault = await findDigitalVaultByUserId(user.id);

    return respData({ 
      ...user, 
      isAdmin, 
      credits: { remainingCredits },
      planType: planLimits.planType,
      freeTrialUsed: planLimits.freeTrialUsed || 0,
      planLimits: {
        maxVideoDuration: planLimits.subscriptionLimits?.maxVideoDuration ?? planConfig.maxVideoDuration,
        concurrentLimit: planLimits.subscriptionLimits?.concurrentLimit ?? planConfig.concurrentLimit,
        translationCharLimit: planLimits.subscriptionLimits?.translationCharLimit ?? planConfig.translationCharLimit,
        freeTrialCount: planConfig.freeTrialCount || 0,
      },
      // 🆕 订阅信息
      subscription: subscription ? {
        status: subscription.status,
        planName: subscription.planName,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: calculateDaysRemaining(subscription.currentPeriodEnd),
      } : null,
      // 🆕 Vault 信息
      vault: vault ? {
        planLevel: vault.planLevel,
        currentPeriodEnd: vault.currentPeriodEnd,
        bonusDays: vault.bonusDays,
        daysRemaining: calculateDaysRemaining(vault.currentPeriodEnd),
      } : null,
    });
  } catch (e) {
    console.log('get user info failed:', e);
    return respErr('get user info failed');
  }
}
