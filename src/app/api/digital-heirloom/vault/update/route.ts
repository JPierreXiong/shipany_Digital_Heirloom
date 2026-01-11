/**
 * PUT /api/digital-heirloom/vault/update
 * 更新数字保险箱数据
 */

import { NextRequest } from 'next/server';
import { respData, respErr } from '@/shared/lib/resp';
import { requireAuthAndVaultOwnership } from '@/shared/lib/api-auth';
import {
  findDigitalVaultByUserId,
  updateDigitalVault,
} from '@/shared/models/digital-vault';

export async function PUT(request: NextRequest) {
  try {
    // 认证检查
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user;

    // 查找用户的保险箱
    const vault = await findDigitalVaultByUserId(user.id);
    if (!vault) {
      return respErr('Vault not found. Create one first.');
    }

    // 解析请求体
    const body = await request.json();
    const {
      encryptedData,
      encryptionSalt,
      encryptionIv,
      encryptionHint,
      heartbeatFrequency,
      gracePeriod,
      deadManSwitchEnabled,
    } = body;

    // 构建更新对象
    const updateData: any = {};

    // 只更新提供的字段
    if (encryptedData !== undefined) {
      if (!encryptionSalt || !encryptionIv) {
        return respErr('encryptionSalt and encryptionIv are required when updating encryptedData');
      }
      updateData.encryptedData = encryptedData;
      updateData.encryptionSalt = encryptionSalt;
      updateData.encryptionIv = encryptionIv;
    }

    if (encryptionHint !== undefined) {
      updateData.encryptionHint = encryptionHint;
    }

    if (heartbeatFrequency !== undefined) {
      if (heartbeatFrequency < 1 || heartbeatFrequency > 365) {
        return respErr('heartbeatFrequency must be between 1 and 365 days');
      }
      updateData.heartbeatFrequency = heartbeatFrequency;
    }

    if (gracePeriod !== undefined) {
      if (gracePeriod < 1 || gracePeriod > 30) {
        return respErr('gracePeriod must be between 1 and 30 days');
      }
      updateData.gracePeriod = gracePeriod;
    }

    if (deadManSwitchEnabled !== undefined) {
      updateData.deadManSwitchEnabled = deadManSwitchEnabled;
      if (deadManSwitchEnabled) {
        updateData.deadManSwitchActivatedAt = new Date();
      } else {
        updateData.deadManSwitchActivatedAt = null;
      }
    }

    // 更新保险箱
    const updatedVault = await updateDigitalVault(vault.id, updateData);

    return respData({
      vault: {
        ...updatedVault,
        encryptedData: undefined, // 不返回加密数据
      },
      message: 'Vault updated successfully',
    });
  } catch (error: any) {
    console.error('Update vault failed:', error);
    return respErr(error.message || 'Failed to update digital vault');
  }
}




