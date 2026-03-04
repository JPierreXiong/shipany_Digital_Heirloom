import { NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { createDigitalVault, findDigitalVaultByUserId } from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';

/**
 * POST /api/vault/create
 * 创建数字保险箱
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

    // 检查是否已存在保险箱
    const existingVault = await findDigitalVaultByUserId(user.id);
    if (existingVault) {
      return NextResponse.json(
        { error: 'Vault already exists', vaultId: existingVault.id },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      encryptionSalt,
      encryptionIv,
      encryptionHint,
      recoveryBackupToken,
      recoveryBackupSalt,
      recoveryBackupIv,
      heartbeatFrequency = 90,
      gracePeriod = 7,
    } = body;

    // 验证必需字段
    if (!encryptionSalt || !encryptionIv || !recoveryBackupToken || !recoveryBackupSalt || !recoveryBackupIv) {
      return NextResponse.json(
        { error: 'Missing required encryption fields' },
        { status: 400 }
      );
    }

    // 创建保险箱
    const vault = await createDigitalVault({
      id: getUuid(),
      userId: user.id,
      encryptedData: null, // 初始为空，后续通过 /api/vault/save 更新
      encryptionSalt,
      encryptionIv,
      encryptionHint: encryptionHint || null,
      recoveryBackupToken,
      recoveryBackupSalt,
      recoveryBackupIv,
      heartbeatFrequency,
      gracePeriod,
      lastSeenAt: new Date(),
      deadManSwitchEnabled: false, // 默认关闭，用户完成设置后开启
      status: 'active',
      planLevel: 'free', // 新用户默认免费版
      currentPeriodEnd: null,
      bonusDays: 0,
    });

    return NextResponse.json({
      success: true,
      vaultId: vault.id,
      message: 'Vault created successfully',
    });
  } catch (error: any) {
    console.error('Failed to create vault:', error);
    return NextResponse.json(
      { error: 'Failed to create vault', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vault/create
 * 获取当前用户的保险箱信息（如果存在）
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
      return NextResponse.json({
        exists: false,
        message: 'No vault found',
      });
    }

    return NextResponse.json({
      exists: true,
      vaultId: vault.id,
      status: vault.status,
      planLevel: vault.planLevel,
      deadManSwitchEnabled: vault.deadManSwitchEnabled,
      heartbeatFrequency: vault.heartbeatFrequency,
      gracePeriod: vault.gracePeriod,
      lastSeenAt: vault.lastSeenAt,
      currentPeriodEnd: vault.currentPeriodEnd,
      bonusDays: vault.bonusDays,
      hasEncryptedData: !!vault.encryptedData,
    });
  } catch (error: any) {
    console.error('Failed to get vault:', error);
    return NextResponse.json(
      { error: 'Failed to get vault', details: error.message },
      { status: 500 }
    );
  }
}

