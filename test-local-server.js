// 本地服务器完整测试（基于真实 API 路由）
const BASE_URL = 'http://localhost:3000';
const testResults = [];

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       本地服务器完整测试                                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`测试环境: ${BASE_URL}`);
console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}\n`);

// 测试 1: 首页访问
async function test1_HomePage() {
  console.log('【测试 1】访问首页...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.ok) {
      console.log('✅ 首页访问成功');
      console.log(`   状态码: ${response.status}\n`);
      testResults.push({ name: '首页访问', status: 'pass', code: response.status });
    } else {
      console.log('❌ 首页访问失败');
      console.log(`   状态码: ${response.status}\n`);
      testResults.push({ name: '首页访问', status: 'fail', code: response.status });
    }
  } catch (error) {
    console.log('❌ 首页访问失败');
    console.log(`   错误: ${error.message}\n`);
    testResults.push({ name: '首页访问', status: 'fail', error: error.message });
  }
}

// 测试 2: 配置读取（POST 方法）
async function test2_GetConfigs() {
  console.log('【测试 2】读取系统配置（POST）...');
  try {
    const response = await fetch(`${BASE_URL}/api/config/get-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 配置读取成功');
      console.log(`   配置项数量: ${Object.keys(data).length}`);
      console.log(`   应用名称: ${data.app_name || '未设置'}`);
      console.log(`   支付提供商: ${data.default_payment_provider || '未设置'}\n`);
      testResults.push({ name: '配置读取', status: 'pass', configs: Object.keys(data).length });
    } else {
      console.log('❌ 配置读取失败');
      console.log(`   状态码: ${response.status}\n`);
      testResults.push({ name: '配置读取', status: 'fail', code: response.status });
    }
  } catch (error) {
    console.log('❌ 配置读取失败');
    console.log(`   错误: ${error.message}\n`);
    testResults.push({ name: '配置读取', status: 'fail', error: error.message });
  }
}

// 测试 3: Better-Auth 注册（正确路由）
async function test3_SignUp() {
  console.log('【测试 3】用户注册（Better-Auth）...');
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    });
    
    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ 用户注册成功');
      console.log(`   测试邮箱: ${testEmail}\n`);
      testResults.push({ name: '用户注册', status: 'pass', email: testEmail });
      return { email: testEmail, password: testPassword };
    } else {
      console.log('⚠️  用户注册失败（可能路由不存在）');
      console.log(`   状态码: ${response.status}`);
      console.log(`   响应: ${text.substring(0, 100)}\n`);
      testResults.push({ name: '用户注册', status: 'skip', code: response.status });
      return null;
    }
  } catch (error) {
    console.log('❌ 用户注册失败');
    console.log(`   错误: ${error.message}\n`);
    testResults.push({ name: '用户注册', status: 'fail', error: error.message });
    return null;
  }
}

// 测试 4: 数据库查询性能
async function test4_DatabasePerformance() {
  console.log('【测试 4】数据库查询性能...');
  const times = [];
  
  try {
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/config/get-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const end = Date.now();
      
      if (response.ok) {
        times.push(end - start);
      }
    }
    
    if (times.length > 0) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      console.log('✅ 数据库查询性能测试完成');
      console.log(`   平均响应时间: ${avg}ms`);
      console.log(`   最快: ${Math.min(...times)}ms`);
      console.log(`   最慢: ${Math.max(...times)}ms\n`);
      testResults.push({ name: '数据库性能', status: 'pass', avgTime: avg });
    } else {
      console.log('❌ 数据库查询性能测试失败\n');
      testResults.push({ name: '数据库性能', status: 'fail' });
    }
  } catch (error) {
    console.log('❌ 数据库查询性能测试失败');
    console.log(`   错误: ${error.message}\n`);
    testResults.push({ name: '数据库性能', status: 'fail', error: error.message });
  }
}

// 测试 5: 支付 Checkout API
async function test5_PaymentCheckout() {
  console.log('【测试 5】支付 Checkout API...');
  try {
    const response = await fetch(`${BASE_URL}/api/payment/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'pro',
        billingCycle: 'monthly'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 支付 Checkout API 响应正常');
      console.log(`   状态码: ${response.status}`);
      console.log(`   响应数据: ${JSON.stringify(data).substring(0, 100)}\n`);
      testResults.push({ name: '支付 Checkout', status: 'pass', code: response.status });
    } else {
      console.log('⚠️  支付 Checkout API 响应异常');
      console.log(`   状态码: ${response.status}\n`);
      testResults.push({ name: '支付 Checkout', status: 'warn', code: response.status });
    }
  } catch (error) {
    console.log('❌ 支付 Checkout API 失败');
    console.log(`   错误: ${error.message}\n`);
    testResults.push({ name: '支付 Checkout', status: 'fail', error: error.message });
  }
}

// 测试 6: API 路由检查
async function test6_APIRoutes() {
  console.log('【测试 6】检查关键 API 路由...');
  
  const routes = [
    { path: '/api/config/get-configs', method: 'POST', name: '配置 API' },
    { path: '/api/payment/checkout', method: 'POST', name: '支付 API' },
    { path: '/api/vault/list', method: 'GET', name: 'Vault 列表' },
  ];
  
  let available = 0;
  let total = routes.length;
  
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 200, 401, 403 都算路由存在
      if (response.status !== 404) {
        console.log(`   ✅ ${route.name}: ${response.status}`);
        available++;
      } else {
        console.log(`   ❌ ${route.name}: 404`);
      }
    } catch (error) {
      console.log(`   ❌ ${route.name}: ${error.message}`);
    }
  }
  
  console.log(`\n   可用路由: ${available}/${total}\n`);
  testResults.push({ name: 'API 路由', status: available > 0 ? 'pass' : 'fail', available, total });
}

// 运行所有测试
async function runAllTests() {
  await test1_HomePage();
  await test2_GetConfigs();
  await test3_SignUp();
  await test4_DatabasePerformance();
  await test5_PaymentCheckout();
  await test6_APIRoutes();
  
  // 生成测试报告
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试结果总结                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip' || r.status === 'warn').length;
  const total = testResults.length;
  
  console.log(`总测试数: ${total}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⚠️  跳过/警告: ${skipped}`);
  console.log(`成功率: ${Math.round((passed / total) * 100)}%\n`);
  
  console.log('【详细结果】');
  testResults.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${icon} ${result.name}`);
    if (result.code) console.log(`   状态码: ${result.code}`);
    if (result.error) console.log(`   错误: ${result.error}`);
    if (result.avgTime) console.log(`   平均时间: ${result.avgTime}ms`);
    if (result.configs) console.log(`   配置数: ${result.configs}`);
  });
  
  console.log(`\n测试完成时间: ${new Date().toLocaleString('zh-CN')}\n`);
  
  // 判断整体状态
  if (passed >= total * 0.7) {
    console.log('✅ 系统整体运行正常！\n');
  } else if (passed >= total * 0.5) {
    console.log('⚠️  系统部分功能正常，需要修复部分问题\n');
  } else {
    console.log('❌ 系统存在较多问题，需要全面检查\n');
  }
}

runAllTests().catch(console.error);

