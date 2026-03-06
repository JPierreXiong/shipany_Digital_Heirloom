import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { user, verification } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { getUuid } from '@/shared/lib/hash';

/**
 * 发送密码重置邮件
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 查找用户
    const existingUser = await db()
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    // 即使用户不存在也返回成功（安全考虑，不泄露用户是否存在）
    if (existingUser.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    // 生成 6 位数验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟有效期

    // 保存验证码到数据库
    await db().insert(verification).values({
      id: getUuid(),
      identifier: email,
      value: verificationCode,
      expiresAt,
    });

    // TODO: 发送邮件（集成 Resend）
    // 暂时在控制台输出验证码（开发环境）
    console.log(`[Password Reset] Verification code for ${email}: ${verificationCode}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset code has been sent to your email',
      // 开发环境返回验证码（生产环境删除）
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode }),
    });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}



