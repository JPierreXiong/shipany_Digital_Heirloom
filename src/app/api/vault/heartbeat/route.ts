import { NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { findDigitalVaultByUserId, updateVaultHeartbeat } from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';
import { db } from '@/core/db';
import { heartbeatLogs } from '@/config/db/schema';

/**
 * POST /api/vault/heartbeat
 * 更新用户心跳（证明用户还活着）
 */
export async function POST(req: Request) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vault = await findDigitalVaultByUserId(user.id);
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // 检查保险箱状态
    if (vault.status === 'released') {
      return NextResponse.json(
        { error: 'Vault has been released, cannot update heartbeat' },
        { status: 403 }
      );
    }

    // 更新心跳时间并重置状态为 active
    const updatedVault = await updateVaultHeartbeat(vault.id);

    // 记录心跳日志
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await db().insert(heartbeatLogs).values({
      id: getUuid(),
      vaultId: vault.id,
      userId: user.id,
      checkinDate: today,
    }).onConflictDoNothing(); // 防止同一天重复记录

    // 计算下次心跳截止时间
    const nextHeartbeatDeadline = new Date(updatedVault.lastSeenAt!);
    nextHeartbeatDeadline.setDate(
      nextHeartbeatDeadline.getDate() + (updatedVault.heartbeatFrequency || 90)
    );

    return NextResponse.json({
      success: true,
      message: 'Heartbeat updated successfully',
      vaultId: vault.id,
      lastSeenAt: updatedVault.lastSeenAt,
      nextHeartbeatDeadline,
      status: updatedVault.status,
    });
  } catch (error: any) {
    console.error('Failed to update heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vault/heartbeat
 * 获取心跳状态
 */
export async function GET() {
  try {
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vault = await findDigitalVaultByUserId(user.id);
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const lastSeen = new Date(vault.lastSeenAt!);
    const heartbeatDeadline = new Date(lastSeen);
    heartbeatDeadline.setDate(
      heartbeatDeadline.getDate() + (vault.heartbeatFrequency || 90)
    );

    const graceDeadline = new Date(heartbeatDeadline);
    graceDeadline.setDate(
      graceDeadline.getDate() + (vault.gracePeriod || 7)
    );

    const daysSinceLastSeen = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUntilDeadline = Math.floor(
      (heartbeatDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isOverdue = now > heartbeatDeadline;
    const isInGracePeriod = now > heartbeatDeadline && now < graceDeadline;
    const isTriggered = now > graceDeadline;

    return NextResponse.json({
      success: true,
      vaultId: vault.id,
      status: vault.status,
      deadManSwitchEnabled: vault.deadManSwitchEnabled,
      lastSeenAt: vault.lastSeenAt,
      heartbeatFrequency: vault.heartbeatFrequency,
      gracePeriod: vault.gracePeriod,
      heartbeatDeadline,
      graceDeadline,
      daysSinceLastSeen,
      daysUntilDeadline,
      isOverdue,
      isInGracePeriod,
      isTriggered,
      warningEmailSentAt: vault.warningEmailSentAt,
      warningEmailCount: vault.warningEmailCount,
    });
  } catch (error: any) {
    console.error('Failed to get heartbeat status:', error);
    return NextResponse.json(
      { error: 'Failed to get heartbeat status', details: error.message },
      { status: 500 }
    );
  }
}






