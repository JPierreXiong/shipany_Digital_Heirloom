import { NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { findDigitalVaultByUserId } from '@/shared/models/digital-vault';
import { db } from '@/core/db';
import { beneficiaries } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/beneficiary/[id]
 * 更新受益人信息
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 验证受益人是否属于当前用户
    const [beneficiary] = await db()
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.vaultId, vault.id)
        )
      )
      .limit(1);

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      relationship,
      language,
      phone,
      decryptionLimit,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (relationship !== undefined) updateData.relationship = relationship;
    if (language !== undefined) updateData.language = language;
    if (phone !== undefined) updateData.phone = phone;
    if (decryptionLimit !== undefined) updateData.decryptionLimit = decryptionLimit;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db()
      .update(beneficiaries)
      .set(updateData)
      .where(eq(beneficiaries.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Beneficiary updated successfully',
      beneficiary: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        relationship: updated.relationship,
        language: updated.language,
        phone: updated.phone,
        decryptionLimit: updated.decryptionLimit,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error('Failed to update beneficiary:', error);
    return NextResponse.json(
      { error: 'Failed to update beneficiary', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/beneficiary/[id]
 * 删除受益人
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 验证受益人是否属于当前用户
    const [beneficiary] = await db()
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.vaultId, vault.id)
        )
      )
      .limit(1);

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    // 检查是否已释放资产
    if (beneficiary.status === 'released') {
      return NextResponse.json(
        { error: 'Cannot delete beneficiary after assets have been released' },
        { status: 403 }
      );
    }

    // 删除受益人
    await db()
      .delete(beneficiaries)
      .where(eq(beneficiaries.id, id));

    return NextResponse.json({
      success: true,
      message: 'Beneficiary deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete beneficiary:', error);
    return NextResponse.json(
      { error: 'Failed to delete beneficiary', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beneficiary/[id]
 * 获取单个受益人详情
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const [beneficiary] = await db()
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.vaultId, vault.id)
        )
      )
      .limit(1);

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      beneficiary: {
        id: beneficiary.id,
        name: beneficiary.name,
        email: beneficiary.email,
        relationship: beneficiary.relationship,
        language: beneficiary.language,
        phone: beneficiary.phone,
        status: beneficiary.status,
        decryptionCount: beneficiary.decryptionCount,
        decryptionLimit: beneficiary.decryptionLimit,
        bonusDecryptionCount: beneficiary.bonusDecryptionCount,
        lastDecryptionAt: beneficiary.lastDecryptionAt,
        releasedAt: beneficiary.releasedAt,
        createdAt: beneficiary.createdAt,
        updatedAt: beneficiary.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to get beneficiary:', error);
    return NextResponse.json(
      { error: 'Failed to get beneficiary', details: error.message },
      { status: 500 }
    );
  }
}






