import { NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { findDigitalVaultByUserId, updateDigitalVault } from '@/shared/models/digital-vault';

/**
 * POST /api/vault/save
 * 保存加密数据到保险箱
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
    const { encryptedData } = body;

    if (!encryptedData) {
      return NextResponse.json(
        { error: 'Missing encryptedData' },
        { status: 400 }
      );
    }

    // 验证加密数据格式（应该是 Base64 字符串）
    if (typeof encryptedData !== 'string') {
      return NextResponse.json(
        { error: 'encryptedData must be a string' },
        { status: 400 }
      );
    }

    // 更新保险箱数据
    await updateDigitalVault(vault.id, {
      encryptedData,
      lastSeenAt: new Date(), // 更新最后活跃时间
    });

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      vaultId: vault.id,
    });
  } catch (error: any) {
    console.error('Failed to save vault data:', error);
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vault/save
 * 更新保险箱配置（不更新加密数据）
 */
export async function PUT(req: Request) {
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

    const body = await req.json();
    const {
      heartbeatFrequency,
      gracePeriod,
      deadManSwitchEnabled,
      encryptionHint,
    } = body;

    const updateData: any = {};

    if (heartbeatFrequency !== undefined) {
      if (heartbeatFrequency < 1 || heartbeatFrequency > 365) {
        return NextResponse.json(
          { error: 'heartbeatFrequency must be between 1 and 365 days' },
          { status: 400 }
        );
      }
      updateData.heartbeatFrequency = heartbeatFrequency;
    }

    if (gracePeriod !== undefined) {
      if (gracePeriod < 1 || gracePeriod > 30) {
        return NextResponse.json(
          { error: 'gracePeriod must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.gracePeriod = gracePeriod;
    }

    if (deadManSwitchEnabled !== undefined) {
      updateData.deadManSwitchEnabled = deadManSwitchEnabled;
    }

    if (encryptionHint !== undefined) {
      updateData.encryptionHint = encryptionHint;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    await updateDigitalVault(vault.id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Vault configuration updated',
      updated: updateData,
    });
  } catch (error: any) {
    console.error('Failed to update vault config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration', details: error.message },
      { status: 500 }
    );
  }
}





