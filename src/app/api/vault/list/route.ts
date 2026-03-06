import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { digitalVaults } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuth } from '@/core/auth';

/**
 * 获取用户的 Vault 列表
 * GET /api/vault/list
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户 session（从 cookie 中读取）
    const auth = await getAuth();
    
    // Better-Auth 会自动从 cookie 中读取 session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login first',
          message: 'No valid session found. Please login to access your vaults.'
        },
        { status: 401 }
      );
    }

    // 查询用户的所有 Vault
    const vaults = await db()
      .select({
        id: digitalVaults.id,
        name: digitalVaults.name,
        description: digitalVaults.description,
        planLevel: digitalVaults.planLevel,
        status: digitalVaults.status,
        storageUsed: digitalVaults.storageUsed,
        storageLimit: digitalVaults.storageLimit,
        currentPeriodEnd: digitalVaults.currentPeriodEnd,
        createdAt: digitalVaults.createdAt,
        updatedAt: digitalVaults.updatedAt,
      })
      .from(digitalVaults)
      .where(eq(digitalVaults.userId, session.user.id))
      .orderBy(desc(digitalVaults.createdAt));

    return NextResponse.json({
      success: true,
      vaults,
      total: vaults.length,
    });
  } catch (error) {
    console.error('[Vault List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vaults', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

