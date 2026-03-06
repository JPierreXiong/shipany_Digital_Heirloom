/**
 * 测试密码找回和 Google OAuth 功能
 * 运行: node test-auth-features.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试密码找回功能
async function testPasswordReset() {
  log('\n=== 测试密码找回功能 ===', 'blue');

  const testEmail = 'test@example.com';

  try {
    // 1. 发送验证码
    log('\n1. 发送验证码...', 'yellow');
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    const forgotData = await forgotResponse.json();

    if (forgotResponse.ok) {
      log('✅ 验证码发送成功', 'green');
      if (forgotData.code) {
        log(`   开发环境验证码: ${forgotData.code}`, 'yellow');
      }
    } else {
      log(`❌ 验证码发送失败: ${forgotData.error}`, 'red');
      return false;
    }

    // 2. 测试重置密码（使用模拟验证码）
    if (forgotData.code) {
      log('\n2. 重置密码...', 'yellow');
      const resetResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          code: forgotData.code,
          newPassword: 'newPassword123',
        }),
      });

      const resetData = await resetResponse.json();

      if (resetResponse.ok) {
        log('✅ 密码重置成功', 'green');
      } else {
        log(`❌ 密码重置失败: ${resetData.error}`, 'red');
        return false;
      }
    }

    return true;
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试 Google OAuth 配置
async function testGoogleOAuth() {
  log('\n=== 测试 Google OAuth 配置 ===', 'blue');

  try {
    // 检查登录页面是否包含 Google 按钮
    log('\n1. 检查登录页面...', 'yellow');
    const signInResponse = await fetch(`${BASE_URL}/sign-in`);
    const signInHtml = await signInResponse.text();

    if (signInHtml.includes('google') || signInHtml.includes('Google')) {
      log('✅ 登录页面包含 Google 相关内容', 'green');
    } else {
      log('⚠️  登录页面未找到 Google 相关内容', 'yellow');
      log('   请检查数据库 config 表中 google_auth_enabled 是否为 true', 'yellow');
    }

    // 检查 OAuth 回调端点
    log('\n2. 检查 OAuth 回调端点...', 'yellow');
    const callbackResponse = await fetch(
      `${BASE_URL}/api/auth/callback/google`,
      { redirect: 'manual' }
    );

    if (callbackResponse.status === 302 || callbackResponse.status === 200) {
      log('✅ OAuth 回调端点可访问', 'green');
    } else {
      log(`⚠️  OAuth 回调端点状态: ${callbackResponse.status}`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试忘记密码页面
async function testForgotPasswordPage() {
  log('\n=== 测试忘记密码页面 ===', 'blue');

  try {
    log('\n1. 访问忘记密码页面...', 'yellow');
    const response = await fetch(`${BASE_URL}/forgot-password`);

    if (response.ok) {
      const html = await response.text();
      if (html.includes('Reset Password') || html.includes('Verification Code')) {
        log('✅ 忘记密码页面正常', 'green');
        return true;
      } else {
        log('⚠️  页面内容异常', 'yellow');
        return false;
      }
    } else {
      log(`❌ 页面访问失败: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║  认证功能测试套件                      ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  log(`\n测试环境: ${BASE_URL}`, 'yellow');

  const results = {
    passwordReset: await testPasswordReset(),
    googleOAuth: await testGoogleOAuth(),
    forgotPasswordPage: await testForgotPasswordPage(),
  };

  // 总结
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║  测试结果总结                          ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;

  log(`\n密码找回功能: ${results.passwordReset ? '✅ 通过' : '❌ 失败'}`, 
    results.passwordReset ? 'green' : 'red');
  log(`Google OAuth: ${results.googleOAuth ? '✅ 通过' : '❌ 失败'}`, 
    results.googleOAuth ? 'green' : 'red');
  log(`忘记密码页面: ${results.forgotPasswordPage ? '✅ 通过' : '❌ 失败'}`, 
    results.forgotPasswordPage ? 'green' : 'red');

  log(`\n总计: ${passed}/${total} 测试通过`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 所有测试通过！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查配置', 'yellow');
  }

  // 配置提示
  log('\n📝 配置检查清单:', 'blue');
  log('   1. 数据库执行: migrations/002_enable_google_oauth.sql', 'yellow');
  log('   2. Vercel 环境变量: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET', 'yellow');
  log('   3. Google Cloud Console: 配置回调 URL', 'yellow');
  log('   4. 可选: 配置 RESEND_API_KEY 用于发送邮件\n', 'yellow');
}

// 运行测试
runTests().catch((error) => {
  log(`\n❌ 测试运行失败: ${error.message}`, 'red');
  process.exit(1);
});


