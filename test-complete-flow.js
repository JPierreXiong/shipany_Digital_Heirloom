// 完整功能测试脚本
const BASE_URL = 'http://localhost:3000';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       完整功能测试                                      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'Test123456!';
let authToken = null;
let userId = null;

// 测试 1: 用户注册
async function test1_SignUp() {
  console.log('【测试 1】用户注册...\n');
  
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
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      userId = data.user?.id;
      
      console.log('   ✅ 注册成功');
      console.log(`   用户 ID: ${userId}`);
      console.log(`   邮箱: ${data.user?.email}\n`);
      return { success: true, data };
    } else {
      const error = await response.text();
      console.log('   ❌ 注册失败');
      console.log(`   错误: ${error.substring(0, 100)}\n`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 2: 用户登录
async function test2_SignIn() {
  console.log('【测试 2】用户登录...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      
      console.log('   ✅ 登录成功');
      console.log(`   Token: ${authToken?.substring(0, 20)}...\n`);
      return { success: true, data };
    } else {
      console.log('   ❌ 登录失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 3: 获取 Vault 列表
async function test3_VaultList() {
  console.log('【测试 3】获取 Vault 列表...\n');
  
  if (!authToken) {
    console.log('   ⚠️  跳过（未登录）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Vault 列表获取成功');
      console.log(`   Vault 数量: ${data.total || 0}`);
      
      if (data.vaults && data.vaults.length > 0) {
        console.log(`   第一个 Vault: ${data.vaults[0].name || 'Unnamed'}\n`);
      } else {
        console.log('   (暂无 Vault)\n');
      }
      
      return { success: true, data };
    } else if (response.status === 404) {
      console.log('   ⚠️  API 不存在（需要创建）\n');
      return { success: false };
    } else {
      console.log('   ❌ 获取失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 4: 配置 API
async function test4_Config() {
  console.log('【测试 4】配置 API...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/config/get-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ 配置读取成功');
      console.log(`   配置项数量: ${Object.keys(data).length}`);
      console.log(`   app_name: ${data.app_name || '未设置'}`);
      console.log(`   default_payment_provider: ${data.default_payment_provider || '未设置'}\n`);
      return { success: true, data };
    } else {
      console.log('   ❌ 配置读取失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 5: 支付 Checkout API
async function test5_PaymentCheckout() {
  console.log('【测试 5】支付 Checkout API...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/payment/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 'pro_monthly',
        currency: 'USD',
        locale: 'en'
      })
    });
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Checkout API 正常');
      console.log(`   响应: ${JSON.stringify(data).substring(0, 100)}\n`);
      return { success: true, data };
    } else {
      console.log('   ⚠️  Checkout API 响应异常\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 6: 数据库性能
async function test6_DatabasePerformance() {
  console.log('【测试 6】数据库查询性能...\n');
  
  const times = [];
  
  try {
    for (let i = 0; i < 3; i++) {
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
      console.log('   ✅ 数据库性能测试完成');
      console.log(`   平均响应时间: ${avg}ms`);
      console.log(`   最快: ${Math.min(...times)}ms`);
      console.log(`   最慢: ${Math.max(...times)}ms\n`);
      return { success: true, avgTime: avg };
    } else {
      console.log('   ❌ 性能测试失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 运行所有测试
async function runAllTests() {
  const results = [];
  
  results.push(await test1_SignUp());
  results.push(await test2_SignIn());
  results.push(await test3_VaultList());
  results.push(await test4_Config());
  results.push(await test5_PaymentCheckout());
  results.push(await test6_DatabasePerformance());
  
  // 生成报告
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试结果总结                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`总测试数: ${total}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${total - passed}`);
  console.log(`成功率: ${successRate}%\n`);
  
  if (successRate === 100) {
    console.log('🎉 所有测试通过！系统完全正常！\n');
  } else if (successRate >= 80) {
    console.log('✅ 大部分测试通过，系统基本正常\n');
  } else {
    console.log('⚠️  多个测试失败，需要进一步检查\n');
  }
  
  console.log(`测试完成时间: ${new Date().toLocaleString('zh-CN')}\n`);
}

runAllTests().catch(console.error);

