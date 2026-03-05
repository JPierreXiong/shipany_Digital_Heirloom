import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { user, verification, account } from '@/config/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getUuid } from '@/shared/lib/hash';

/**
 * 重置密码
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 验证验证码
    const now = new Date();
    const verificationRecord = await db()
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          eq(verification.value, code),
          gt(verification.expiresAt, now)
        )
      )
      .limit(1);

    if (verificationRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // 查找用户
    const existingUser = await db()
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = existingUser[0].id;

    // 使用 better-auth 的密码哈希（bcrypt）
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 查找用户的 credential 账户
    const userAccount = await db()
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (userAccount.length > 0) {
      // 更新现有账户密码
      await db()
        .update(account)
        .set({
          password: hashedPassword,
          updatedAt: now,
        })
        .where(eq(account.id, userAccount[0].id));
    } else {
      // 创建新的 credential 账户（如果用户之前只用 OAuth 登录）
      await db().insert(account).values({
        id: getUuid(),
        accountId: email,
        providerId: 'credential',
        userId,
        password: hashedPassword,
      });
    }

    // 删除已使用的验证码
    await db()
      .delete(verification)
      .where(eq(verification.id, verificationRecord[0].id));

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

