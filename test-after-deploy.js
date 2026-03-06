// 等待部署并测试
const PROD_URL = 'https://shipany-digital-heirloom.vercel.app';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       等待 Vercel 部署并测试                            ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function waitAndTest() {
  console.log('⏳ 等待 Vercel 部署完成...\n');
  console.log('   预计等待时间: 2-3 分钟\n');
  
  // 等待 2 分钟
  for (let i = 120; i > 0; i -= 10) {
    process.stdout.write(`\r   剩余时间: ${i} 秒...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n\n【测试 1】检查首页...\n');
  
  try {
    const homeResponse = await fetch(PROD_URL);
    console.log(`   状态码: ${homeResponse.status}`);
    
    if (homeResponse.ok) {
      console.log('   ✅ 首页正常\n');
    } else {
      console.log('   ⚠️  首页异常\n');
    }
  } catch (error) {
    console.log(`   ❌ 无法访问: ${error.message}\n`);
  }
  
  console.log('【测试 2】测试用户注册...\n');
  
  const testEmail = `test_${Date.now()}@example.com`;
  
  try {
    const signUpResponse = await fetch(`${PROD_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test123456!',
        name: 'Test User'
      })
    });
    
    console.log(`   状态码: ${signUpResponse.status}`);
    
    if (signUpResponse.status === 500) {
      console.log('   ❌ 仍然返回 500 错误\n');
      console.log('   可能需要更长时间部署，或者需要其他修复\n');
    } else if (signUpResponse.ok) {
      console.log('   ✅ 注册成功！\n');
      const data = await signUpResponse.json();
      console.log(`   用户数据: ${JSON.stringify(data, null, 2)}\n`);
    } else if (signUpResponse.status === 422) {
      console.log('   ✅ Better-Auth 正常工作（验证错误）\n');
      const data = await signUpResponse.json();
      console.log(`   验证错误: ${JSON.stringify(data, null, 2)}\n`);
    } else {
      console.log(`   ⚠️  状态码: ${signUpResponse.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }
  
  console.log('【测试 3】测试用户登录...\n');
  
  try {
    const signInResponse = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`   状态码: ${signInResponse.status}`);
    
    if (signInResponse.status === 500) {
      console.log('   ❌ 仍然返回 500 错误\n');
    } else if (signInResponse.status === 401 || signInResponse.status === 422) {
      console.log('   ✅ Better-Auth 正常工作（认证失败）\n');
    } else {
      console.log(`   ⚠️  状态码: ${signInResponse.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试完成                                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

waitAndTest().catch(console.error);

