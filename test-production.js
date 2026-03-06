// 测试生产环境 Better-Auth
const PROD_URL = 'https://shipany-digital-heirloom.vercel.app';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       生产环境 Better-Auth 测试                         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`测试环境: ${PROD_URL}\n`);

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test123456!';

async function checkDeploymentStatus() {
  console.log('【检查】部署状态...\n');
  
  try {
    const response = await fetch(PROD_URL);
    console.log(`   首页状态: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ 部署已完成\n');
      return true;
    } else {
      console.log('   ⚠️  部署可能还在进行中\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 无法访问: ${error.message}\n`);
    return false;
  }
}

async function testProductionAuth() {
  console.log('【测试 1】生产环境注册...');
  console.log(`   邮箱: ${testEmail}\n`);
  
  try {
    const response = await fetch(`${PROD_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.status === 500) {
      const text = await response.text();
      console.log(`   ❌ 仍然返回 500 错误`);
      console.log(`   响应: ${text.substring(0, 100)}\n`);
      return false;
    } else if (response.ok || response.status === 422) {
      console.log(`   ✅ Better-Auth 正常工作！\n`);
      return true;
    } else {
      console.log(`   ⚠️  状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return false;
  }
}

async function testProductionLogin() {
  console.log('【测试 2】生产环境登录...\n');
  
  try {
    const response = await fetch(`${PROD_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.status === 500) {
      console.log(`   ❌ 仍然返回 500 错误\n`);
      return false;
    } else if (response.status === 401 || response.status === 422) {
      console.log(`   ✅ Better-Auth 正常工作（返回认证错误）\n`);
      return true;
    } else {
      console.log(`   ⚠️  状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return false;
  }
}

async function testConfigAPI() {
  console.log('【测试 3】配置 API...\n');
  
  try {
    const response = await fetch(`${PROD_URL}/api/config/get-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ 配置 API 正常`);
      console.log(`   配置项: ${Object.keys(data).length}\n`);
      return true;
    } else {
      console.log(`   ❌ 配置 API 失败\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  // 检查部署状态
  const isDeployed = await checkDeploymentStatus();
  
  if (!isDeployed) {
    console.log('⚠️  部署可能还在进行中，等待 30 秒...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  // 测试配置 API
  const configOk = await testConfigAPI();
  
  // 测试注册
  const signUpOk = await testProductionAuth();
  
  // 测试登录
  const signInOk = await testProductionLogin();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试结果                                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`配置 API: ${configOk ? '✅ 通过' : '❌ 失败'}`);
  console.log(`注册功能: ${signUpOk ? '✅ 通过' : '❌ 失败'}`);
  console.log(`登录功能: ${signInOk ? '✅ 通过' : '❌ 失败'}\n`);
  
  if (configOk && signUpOk && signInOk) {
    console.log('🎉 所有测试通过！Better-Auth 已修复！\n');
  } else {
    console.log('⚠️  部分测试失败，可能需要等待部署完成\n');
  }
}

runTests().catch(console.error);

