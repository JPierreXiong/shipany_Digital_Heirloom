/**
 * 用户注册后自动创建 Digital Vault
 * 集成到 Better Auth 的 after.signUp 钩子
 */

import { createDigitalVault } from '@/shared/models/digital-vault';
import { getUuid } from '@/shared/lib/hash';

/**
 * 在用户注册成功后自动创建空的 Digital Vault
 * 注意：这只是创建记录，用户仍需完成设置流程（设置主密码等）
 */
export async function createVaultForNewUser(userId: string) {
  try {
    console.log(`Creating vault for new user: ${userId}`);

    // 🆕 计算 7 天试用期结束时间
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // 创建初始保险箱（未加密状态）
    const vault = await createDigitalVault({
      id: getUuid(),
      userId: userId,
      encryptedData: null,
      encryptionSalt: null,
      encryptionIv: null,
      encryptionHint: null,
      recoveryBackupToken: null,
      recoveryBackupSalt: null,
      recoveryBackupIv: null,
      heartbeatFrequency: 180, // Free 用户默认 180 天（固定）
      gracePeriod: 7, // 默认7天宽限期
      lastSeenAt: new Date(),
      deadManSwitchEnabled: false, // 默认关闭，用户完成设置后开启
      status: 'active',
      planLevel: 'free', // 新用户默认免费版
      currentPeriodEnd: trialEndDate, // 🆕 设置 7 天试用期
      bonusDays: 0,
    });

    console.log(`✅ Vault created successfully for user ${userId}: ${vault.id}, trial ends: ${trialEndDate}`);
    return vault;
  } catch (error) {
    console.error(`❌ Failed to create vault for user ${userId}:`, error);
    // 不抛出错误，避免影响注册流程
    return null;
  }
}





