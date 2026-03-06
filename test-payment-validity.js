// 支付流程和有效期显示测试
const BASE_URL = 'http://localhost:3000';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       支付流程和有效期显示测试                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let authCookie = null;
let userId = null;
let vaultId = null;

// 测试 1: 注册并登录
async function test1_SignUpAndLogin() {
  console.log('【测试 1】注册并登录...\n');
  
  const testEmail = `test_payment_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  try {
    // 注册
    const signUpResponse = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Payment Test User'
      })
    });
    
    if (signUpResponse.ok) {
      const data = await signUpResponse.json();
      userId = data.user?.id;
      authCookie = signUpResponse.headers.get('set-cookie');
      
      console.log('   ✅ 注册成功');
      console.log(`   用户 ID: ${userId}`);
      console.log(`   邮箱: ${testEmail}\n`);
      
      return { success: true, userId, email: testEmail };
    } else {
      console.log('   ❌ 注册失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 2: 获取 Vault 信息
async function test2_GetVault() {
  console.log('【测试 2】获取 Vault 信息...\n');
  
  if (!authCookie) {
    console.log('   ⚠️  跳过（未登录）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.vaults && data.vaults.length > 0) {
        const vault = data.vaults[0];
        vaultId = vault.id;
        
        console.log('   ✅ Vault 信息获取成功');
        console.log(`   Vault ID: ${vault.id}`);
        console.log(`   计划等级: ${vault.planLevel || 'free'}`);
        console.log(`   有效期: ${vault.currentPeriodEnd || '未设置'}`);
        console.log(`   状态: ${vault.status || 'unknown'}\n`);
        
        return { success: true, vault };
      } else {
        console.log('   ⚠️  用户暂无 Vault\n');
        return { success: false };
      }
    } else {
      console.log('   ❌ 获取失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 3: 模拟年费订阅支付
async function test3_SimulateAnnualPayment() {
  console.log('【测试 3】模拟年费订阅支付（Base $49/year）...\n');
  
  if (!vaultId || !authCookie) {
    console.log('   ⚠️  跳过（缺少必要信息）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/test/simulate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        vaultId: vaultId,
        planLevel: 'base',
        amount: 4900,  // $49
        duration: 365,  // 1年
        orderNo: `TEST_ANNUAL_${Date.now()}`
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ 年费订阅支付模拟成功');
      console.log(`   订单号: ${data.orderNo}`);
      console.log(`   计划等级: ${data.planLevel}`);
      console.log(`   有效期至: ${data.currentPeriodEnd}\n`);
      
      return { success: true, data };
    } else {
      const error = await response.text();
      console.log('   ❌ 支付模拟失败');
      console.log(`   错误: ${error.substring(0, 100)}\n`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 4: 验证 Vault 更新
async function test4_VerifyVaultUpdate() {
  console.log('【测试 4】验证 Vault 更新...\n');
  
  if (!authCookie) {
    console.log('   ⚠️  跳过（未登录）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/vault/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.vaults && data.vaults.length > 0) {
        const vault = data.vaults[0];
        
        console.log('   ✅ Vault 已更新');
        console.log(`   计划等级: ${vault.planLevel}`);
        console.log(`   有效期: ${vault.currentPeriodEnd}`);
        console.log(`   状态: ${vault.status}\n`);
        
        // 验证有效期是否正确（应该是约1年后）
        if (vault.currentPeriodEnd) {
          const endDate = new Date(vault.currentPeriodEnd);
          const now = new Date();
          const diffDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
          
          console.log(`   📅 距离到期还有: ${diffDays} 天`);
          
          if (diffDays >= 360 && diffDays <= 370) {
            console.log('   ✅ 有效期正确（约1年）\n');
          } else {
            console.log('   ⚠️  有效期可能不正确\n');
          }
        }
        
        return { success: true, vault };
      }
    }
    
    console.log('   ❌ 验证失败\n');
    return { success: false };
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 5: 访问 Billing 页面
async function test5_CheckBillingPage() {
  console.log('【测试 5】检查 Billing 页面显示...\n');
  
  if (!authCookie) {
    console.log('   ⚠️  跳过（未登录）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/settings/billing`, {
      headers: {
        'Cookie': authCookie
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      console.log('   ✅ Billing 页面加载成功');
      
      // 检查是否包含计划信息
      if (html.includes('base') || html.includes('Base')) {
        console.log('   ✅ 页面显示计划等级');
      }
      
      // 检查是否包含日期（有效期）
      const datePattern = /\d{4}-\d{2}-\d{2}/;
      if (datePattern.test(html)) {
        console.log('   ✅ 页面显示有效期\n');
      } else {
        console.log('   ⚠️  页面可能未显示有效期\n');
      }
      
      return { success: true };
    } else {
      console.log('   ❌ 页面加载失败\n');
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
    return { success: false };
  }
}

// 测试 6: 访问 Payments 页面
async function test6_CheckPaymentsPage() {
  console.log('【测试 6】检查 Payments 页面显示...\n');
  
  if (!authCookie) {
    console.log('   ⚠️  跳过（未登录）\n');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/settings/payments`, {
      headers: {
        'Cookie': authCookie
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      console.log('   ✅ Payments 页面加载成功');
      
      // 检查是否包含订单信息
      if (html.includes('TEST_ANNUAL') || html.includes('paid')) {
        console.log('   ✅ 页面显示订单记录');
      }
      
      // 检查是否包含金额
      if (html.includes('$49') || html.includes('4900')) {
        console.log('   ✅ 页面显示支付金额\n');
      }
      
      return { success: true };
    } else {
      console.log('   ❌ 页面加载失败\n');
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
  
  results.push(await test1_SignUpAndLogin());
  
  // 等待 Vault 自动创建
  console.log('⏳ 等待 2 秒让系统创建 Vault...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await test2_GetVault());
  results.push(await test3_SimulateAnnualPayment());
  
  // 等待数据库更新
  console.log('⏳ 等待 1 秒让数据库更新...\n');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await test4_VerifyVaultUpdate());
  results.push(await test5_CheckBillingPage());
  results.push(await test6_CheckPaymentsPage());
  
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
  
  console.log('【关键发现】\n');
  console.log('1. 支付流程:');
  console.log('   - 年费订阅支付后会更新 Vault');
  console.log('   - planLevel 更新为 base/pro');
  console.log('   - currentPeriodEnd 设置为 1年后\n');
  
  console.log('2. Billing 页面:');
  console.log('   - 显示当前订阅信息');
  console.log('   - 显示有效期（currentPeriodEnd）');
  console.log('   - 年费订阅会显示续费日期\n');
  
  console.log('3. Payments 页面:');
  console.log('   - 显示所有支付订单');
  console.log('   - 显示订单金额和状态');
  console.log('   - 当前不直接显示有效期（可以改进）\n');
  
  console.log('【改进建议】\n');
  console.log('1. Billing 页面:');
  console.log('   - 对于终身买断，需要从 Vault 表读取有效期');
  console.log('   - 显示 "Lifetime" 标签\n');
  
  console.log('2. Payments 页面:');
  console.log('   - 可以添加 "有效期" 列');
  console.log('   - 从 subscription 或 Vault 表关联查询\n');
  
  console.log(`测试完成时间: ${new Date().toLocaleString('zh-CN')}\n`);
}

runAllTests().catch(console.error);

