// Better-Auth 注册登录测试
const BASE_URL = 'http://localhost:3000';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       Better-Auth 注册登录测试                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test123456!';
const testName = 'Test User';

async function testSignUp() {
  console.log('【测试 1】用户注册...');
  console.log(`   邮箱: ${testEmail}`);
  console.log(`   密码: ${testPassword}\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      })
    });
    
    console.log(`   响应状态码: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`   响应数据: ${JSON.stringify(data, null, 2)}\n`);
    } else {
      const text = await response.text();
      console.log(`   响应文本: ${text.substring(0, 200)}\n`);
    }
    
    if (response.ok) {
      console.log('✅ 用户注册成功\n');
      return { success: true, data };
    } else {
      console.log('❌ 用户注册失败\n');
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ 注册请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSignIn() {
  console.log('【测试 2】用户登录...');
  console.log(`   邮箱: ${testEmail}`);
  console.log(`   密码: ${testPassword}\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      })
    });
    
    console.log(`   响应状态码: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`   响应数据: ${JSON.stringify(data, null, 2)}\n`);
    } else {
      const text = await response.text();
      console.log(`   响应文本: ${text.substring(0, 200)}\n`);
    }
    
    // 获取 cookies
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('   ✅ 收到 Session Cookie\n');
    }
    
    if (response.ok) {
      console.log('✅ 用户登录成功\n');
      return { success: true, data, cookies };
    } else {
      console.log('❌ 用户登录失败\n');
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGetSession(cookies) {
  console.log('【测试 3】获取 Session...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: { 
        'Cookie': cookies || '',
      }
    });
    
    console.log(`   响应状态码: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`   Session 数据: ${JSON.stringify(data, null, 2)}\n`);
    } else {
      const text = await response.text();
      console.log(`   响应文本: ${text.substring(0, 200)}\n`);
    }
    
    if (response.ok && data?.user) {
      console.log('✅ Session 获取成功');
      console.log(`   用户 ID: ${data.user.id}`);
      console.log(`   用户邮箱: ${data.user.email}\n`);
      return { success: true, data };
    } else {
      console.log('❌ Session 获取失败\n');
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Session 请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAuthRoutes() {
  console.log('【测试 4】检查 Better-Auth 路由...\n');
  
  const routes = [
    '/api/auth/sign-up/email',
    '/api/auth/sign-in/email',
    '/api/auth/get-session',
    '/api/auth/sign-out',
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.status === 404) {
        console.log(`   ❌ ${route}: 404 (不存在)`);
      } else if (response.status === 400 || response.status === 401 || response.status === 422) {
        console.log(`   ✅ ${route}: ${response.status} (路由存在)`);
      } else {
        console.log(`   ⚠️  ${route}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${route}: ${error.message}`);
    }
  }
  console.log('');
}

async function runTests() {
  // 测试路由
  await testAuthRoutes();
  
  // 测试注册
  const signUpResult = await testSignUp();
  
  if (!signUpResult.success) {
    console.log('⚠️  注册失败，跳过后续测试\n');
    return;
  }
  
  // 等待 1 秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试登录
  const signInResult = await testSignIn();
  
  if (!signInResult.success) {
    console.log('⚠️  登录失败，跳过 Session 测试\n');
    return;
  }
  
  // 测试 Session
  if (signInResult.cookies) {
    await testGetSession(signInResult.cookies);
  }
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试完成                                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);

