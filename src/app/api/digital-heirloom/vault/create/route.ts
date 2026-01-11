/**
 * POST /api/digital-heirloom/vault/create
 * 创建数字保险箱
 */

import { NextRequest } from 'next/server';
import { respData, respErr } from '@/shared/lib/resp';
import { requireAuth } from '@/shared/lib/api-auth';
import {
  createDigitalVault,
  findDigitalVaultByUserId,
  VaultStatus,
} from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';

export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user;

    // 检查用户是否已有保险箱
    const existingVault = await findDigitalVaultByUserId(user.id);
    if (existingVault) {
      return respErr('You already have a digital vault. Use update endpoint to modify it.');
    }

    // 解析请求体
    const body = await request.json();
    const {
      encryptedData,
      encryptionSalt,
      encryptionIv,
      encryptionHint,
      heartbeatFrequency = 90,
      gracePeriod = 7,
      deadManSwitchEnabled = false,
    } = body;

    // 验证必需字段
    if (!encryptedData || !encryptionSalt || !encryptionIv) {
      return respErr('encryptedData, encryptionSalt, and encryptionIv are required');
    }

    // 创建保险箱
    const newVault = await createDigitalVault({
      id: getUuid(),
      userId: user.id,
      encryptedData,
      encryptionSalt,
      encryptionIv,
      encryptionHint: encryptionHint || null,
      heartbeatFrequency,
      gracePeriod,
      deadManSwitchEnabled,
      status: VaultStatus.ACTIVE,
      lastSeenAt: new Date(),
    });

    return respData({
      vault: newVault,
      message: 'Digital vault created successfully',
    });
  } catch (error: any) {
    console.error('Create vault failed:', error);
    return respErr(error.message || 'Failed to create digital vault');
  }
}




