import { NextResponse } from 'next/server';
import { db } from '@/core/db';
import { subscription, user as userTable, digitalVaults } from '@/config/db/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Vercel Cron Job: 检查并处理过期订阅
 * 路由: GET /api/cron/check-expired-subscriptions
 * 
 * 配置在 vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expired-subscriptions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * 
 * 说明: 每天凌晨2点执行
 */
export async function GET(req: Request) {
  try {
    // 验证 Cron Secret（防止未授权访问）
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // 如果配置了 CRON_SECRET，则验证；否则允许访问（开发环境）
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('🔍 Starting expired subscription check...');

    const now = new Date();
    const results = {
      checked: 0,
      downgraded: 0,
      errors: [] as string[],
    };

    // 查找所有过期的活跃订阅（排除终身版）
    const expiredSubscriptions = await db()
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.status, 'active'),
          lt(subscription.currentPeriodEnd, now)
        )
      );

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const sub of expiredSubscriptions) {
      results.checked++;

      try {
        // 检查是否为终身版（interval = 'one-time'）
        if (sub.interval === 'one-time') {
          console.log(`⏭️  Skipping lifetime subscription: ${sub.subscriptionNo}`);
          continue;
        }

        console.log(`⬇️  Downgrading subscription: ${sub.subscriptionNo} (User: ${sub.userId})`);

        // 1. 更新订阅状态为过期
        await db()
          .update(subscription)
          .set({
            status: 'expired',
            updatedAt: new Date(),
          })
          .where(eq(subscription.id, sub.id));

        // 2. 降级用户到免费版
        await db()
          .update(userTable)
          .set({
            planType: 'free',
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, sub.userId));

        // 3. 降级 Vault 到免费版
        await db()
          .update(digitalVaults)
          .set({
            planLevel: 'free',
            currentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(digitalVaults.userId, sub.userId));

        results.downgraded++;
        console.log(`✅ Successfully downgraded user ${sub.userId}`);

        // TODO: 发送邮件通知用户订阅已过期
        // await sendSubscriptionExpiredEmail(sub.userEmail, sub.planName);

      } catch (error) {
        const errorMsg = `Failed to downgrade subscription ${sub.subscriptionNo}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log('✅ Expired subscription check completed');
    console.log(`📊 Results: Checked=${results.checked}, Downgraded=${results.downgraded}, Errors=${results.errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Expired subscription check completed',
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 允许手动触发（用于测试）
export async function POST(req: Request) {
  return GET(req);
}

