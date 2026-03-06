import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/core/auth';

/**
 * 模拟订阅过期（仅用于测试）
 * POST /api/test/simulate-expiry
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
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { vaultId } = await request.json();

    if (!vaultId) {
      return NextResponse.json(
        { error: 'Missing vaultId' },
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

    // 模拟过期：降级到免费版
    await db()
      .update(digitalVaults)
      .set({
        planLevel: 'free',
        currentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(digitalVaults.id, vaultId));

    console.log(`[Test Expiry] Simulated expiry for vault ${vaultId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry simulated successfully',
      vaultId,
      planLevel: 'free',
    });
  } catch (error) {
    console.error('[Test Expiry] Error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate expiry' },
      { status: 500 }
    );
  }
}



