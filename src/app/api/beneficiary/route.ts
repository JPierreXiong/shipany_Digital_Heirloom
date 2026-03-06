import { NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { findDigitalVaultByUserId } from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';
import { db } from '@/core/db';
import { beneficiaries } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/beneficiary
 * 创建受益人
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
        { error: 'Vault not found. Please create a vault first.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      relationship,
      language = 'en',
      phone,
      decryptionLimit = 1,
    } = body;

    // 验证必需字段
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同邮箱的受益人
    const [existing] = await db()
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.vaultId, vault.id),
          eq(beneficiaries.email, email)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Beneficiary with this email already exists' },
        { status: 400 }
      );
    }

    // 创建受益人
    const [beneficiary] = await db()
      .insert(beneficiaries)
      .values({
        id: getUuid(),
        vaultId: vault.id,
        name,
        email,
        relationship: relationship || null,
        language,
        phone: phone || null,
        decryptionLimit,
        decryptionCount: 0,
        bonusDecryptionCount: 0,
        status: 'pending',
        decryptionHistory: [],
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Beneficiary created successfully',
      beneficiary: {
        id: beneficiary.id,
        name: beneficiary.name,
        email: beneficiary.email,
        relationship: beneficiary.relationship,
        language: beneficiary.language,
        phone: beneficiary.phone,
        decryptionLimit: beneficiary.decryptionLimit,
        status: beneficiary.status,
      },
    });
  } catch (error: any) {
    console.error('Failed to create beneficiary:', error);
    return NextResponse.json(
      { error: 'Failed to create beneficiary', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beneficiary
 * 获取当前用户的所有受益人
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

    const beneficiaryList = await db()
      .select({
        id: beneficiaries.id,
        name: beneficiaries.name,
        email: beneficiaries.email,
        relationship: beneficiaries.relationship,
        language: beneficiaries.language,
        phone: beneficiaries.phone,
        status: beneficiaries.status,
        decryptionCount: beneficiaries.decryptionCount,
        decryptionLimit: beneficiaries.decryptionLimit,
        bonusDecryptionCount: beneficiaries.bonusDecryptionCount,
        lastDecryptionAt: beneficiaries.lastDecryptionAt,
        releasedAt: beneficiaries.releasedAt,
        createdAt: beneficiaries.createdAt,
      })
      .from(beneficiaries)
      .where(eq(beneficiaries.vaultId, vault.id))
      .orderBy(beneficiaries.createdAt);

    return NextResponse.json({
      success: true,
      count: beneficiaryList.length,
      beneficiaries: beneficiaryList,
    });
  } catch (error: any) {
    console.error('Failed to get beneficiaries:', error);
    return NextResponse.json(
      { error: 'Failed to get beneficiaries', details: error.message },
      { status: 500 }
    );
  }
}






