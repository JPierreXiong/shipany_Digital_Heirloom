import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/core/auth';

/**
 * 模拟支付成功（仅用于测试）
 * POST /api/test/simulate-payment
 * 
 * ⚠️ 生产环境应该禁用此端点
 */
export async function POST(request: NextRequest) {
  // 生产环境禁用
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    // 从 Better-Auth 获取 session
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const { vaultId, planLevel, amount, duration, orderNo } = await request.json();

    if (!vaultId || !planLevel || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证金额是否正确（防止篡改）
    const validAmounts: Record<string, number> = {
      base: 999,
      pro: 2999,
      lifetime: 9999,
    };

    if (validAmounts[planLevel] && amount !== validAmounts[planLevel]) {
      return NextResponse.json(
        { error: 'Invalid amount for plan level' },
        { status: 400 }
      );
    }

    // 查找 Vault
    const vaults = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.id, vaultId))
      .limit(1);

    if (vaults.length === 0) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    const vault = vaults[0];

    // 验证所有权
    if (vault.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to vault' },
        { status: 403 }
      );
    }

    // 计算订阅结束日期
    let currentPeriodEnd = null;
    if (duration) {
      const now = new Date();
      currentPeriodEnd = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    }

    // 更新 Vault
    await db()
      .update(digitalVaults)
      .set({
        planLevel,
        currentPeriodEnd,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(digitalVaults.id, vaultId));

    console.log(`[Test Payment] Simulated payment for vault ${vaultId}: ${planLevel}`);

    return NextResponse.json({
      success: true,
      message: 'Payment simulated successfully',
      orderNo: orderNo || `TEST_${Date.now()}`,
      vaultId,
      planLevel,
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      amount,
    });
  } catch (error) {
    console.error('[Test Payment] Error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate payment' },
      { status: 500 }
    );
  }
}



