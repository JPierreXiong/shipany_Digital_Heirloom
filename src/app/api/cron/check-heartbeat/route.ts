import { NextResponse } from 'next/server';
import { findVaultsNeedingWarning, findVaultsNeedingAssetRelease, updateDigitalVault } from '@/shared/models/digital-vault';
import { VaultStatus } from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';
import { db } from '@/core/db';
import { deadManSwitchEvents, emailNotifications } from '@/config/db/schema';

/**
 * Vercel Cron Job: 检查心跳并触发 Dead Man's Switch
 * 路由: GET /api/cron/check-heartbeat
 * 
 * 配置在 vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-heartbeat",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 * 
 * 说明: 每6小时执行一次
 */
export async function GET(req: Request) {
  try {
    // 验证 Cron Secret
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

    console.log('🔍 Starting heartbeat check...');

    const results = {
      warningsSent: 0,
      assetsReleased: 0,
      errors: [] as string[],
    };

    // 1. 检查需要发送预警的保险箱
    const vaultsNeedingWarning = await findVaultsNeedingWarning();
    console.log(`Found ${vaultsNeedingWarning.length} vaults needing warning`);

    for (const vault of vaultsNeedingWarning) {
      try {
        console.log(`⚠️  Sending warning for vault: ${vault.id} (User: ${vault.userId})`);

        // 更新状态为 pending_verification（宽限期）
        await updateDigitalVault(vault.id, {
          status: VaultStatus.PENDING_VERIFICATION,
          warningEmailSentAt: new Date(),
          warningEmailCount: (vault.warningEmailCount || 0) + 1,
        });

        // 记录事件
        await db().insert(deadManSwitchEvents).values({
          id: getUuid(),
          vaultId: vault.id,
          eventType: 'warning_sent',
          eventData: JSON.stringify({
            lastSeenAt: vault.lastSeenAt,
            heartbeatFrequency: vault.heartbeatFrequency,
            gracePeriod: vault.gracePeriod,
          }),
        });

        // TODO: 发送预警邮件
        // await sendWarningEmail(vault.userId, vault);

        // 记录邮件通知
        await db().insert(emailNotifications).values({
          id: getUuid(),
          vaultId: vault.id,
          recipientEmail: '', // TODO: 从 user 表获取
          recipientType: 'user',
          emailType: 'heartbeat_warning',
          subject: 'Digital Heirloom - Heartbeat Warning',
          status: 'pending',
        });

        results.warningsSent++;
        console.log(`✅ Warning sent for vault ${vault.id}`);

      } catch (error) {
        const errorMsg = `Failed to send warning for vault ${vault.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    // 2. 检查需要释放资产的保险箱（宽限期已过）
    const vaultsNeedingRelease = await findVaultsNeedingAssetRelease();
    console.log(`Found ${vaultsNeedingRelease.length} vaults needing asset release`);

    for (const vault of vaultsNeedingRelease) {
      try {
        console.log(`🚨 Triggering asset release for vault: ${vault.id} (User: ${vault.userId})`);

        // 更新状态为 triggered
        await updateDigitalVault(vault.id, {
          status: VaultStatus.TRIGGERED,
          deadManSwitchActivatedAt: new Date(),
        });

        // 记录事件
        await db().insert(deadManSwitchEvents).values({
          id: getUuid(),
          vaultId: vault.id,
          eventType: 'assets_released',
          eventData: JSON.stringify({
            lastSeenAt: vault.lastSeenAt,
            heartbeatFrequency: vault.heartbeatFrequency,
            gracePeriod: vault.gracePeriod,
            triggeredAt: new Date(),
          }),
        });

        // TODO: 通知所有受益人
        // await notifyBeneficiaries(vault.id);

        results.assetsReleased++;
        console.log(`✅ Assets released for vault ${vault.id}`);

      } catch (error) {
        const errorMsg = `Failed to release assets for vault ${vault.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log('✅ Heartbeat check completed');
    console.log(`📊 Results: Warnings=${results.warningsSent}, Released=${results.assetsReleased}, Errors=${results.errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Heartbeat check completed',
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

