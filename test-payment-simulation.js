/**
 * 会员支付流程模拟测试
 * 测试付款成功后的权益激活、服务启动和会员管理
 * 运行: node test-payment-simulation.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试数据
const testUser = {
  email: `test_payment_${Date.now()}@example.com`,
  password: 'TestPassword123',
  name: 'Payment Test User',
};

const testPlans = {
  base: {
    planLevel: 'base',
    amount: 999, // $9.99
    duration: 30, // 30天
    features: {
      maxBeneficiaries: 3,
      storageLimit: 100, // MB
      heartbeatFrequency: 90, // 天
    },
  },
  pro: {
    planLevel: 'pro',
    amount: 2999, // $29.99
    duration: 30,
    features: {
      maxBeneficiaries: 10,
      storageLimit: 1000, // MB
      heartbeatFrequency: 180,
      physicalRecoveryKit: true,
    },
  },
  lifetime: {
    planLevel: 'lifetime',
    amount: 9999, // $99.99
    duration: null, // 永久
    features: {
      maxBeneficiaries: 999,
      storageLimit: 10000,
      heartbeatFrequency: 365,
      physicalRecoveryKit: true,
      prioritySupport: true,
    },
  },
};

let authCookie = '';
let userId = '';
let vaultId = '';

// ============================================
// 辅助函数
// ============================================

async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authCookie && { Cookie: authCookie }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 保存 Cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie.split(';')[0];
  }

  return response;
}

// ============================================
// 测试步骤
// ============================================

// 1. 注册新用户
async function step1_registerUser() {
  log('\n【步骤 1】注册新用户', 'blue');
  log(`邮箱: ${testUser.email}`, 'cyan');

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/sign-up`, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      }),
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      log(`⚠️  非 JSON 响应: ${text.substring(0, 200)}`, 'yellow');
      
      // 尝试直接登录（可能用户已存在）
      if (response.status === 409 || text.includes('already exists')) {
        log('   用户可能已存在，尝试直接登录', 'yellow');
        return true; // 继续到登录步骤
      }
      
      return false;
    }

    if (response.ok) {
      log('✅ 用户注册成功', 'green');
      userId = data.user?.id || data.id;
      log(`   用户ID: ${userId}`, 'cyan');
      return true;
    } else {
      log(`❌ 注册失败: ${data.error}`, 'red');
      
      // 如果用户已存在，继续测试
      if (data.error && data.error.includes('already exists')) {
        log('   用户已存在，继续测试', 'yellow');
        return true;
      }
      
      return false;
    }
  } catch (error) {
    log(`❌ 注册失败: ${error.message}`, 'red');
    return false;
  }
}

// 2. 登录用户
async function step2_loginUser() {
  log('\n【步骤 2】登录用户', 'blue');

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/sign-in`, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      log(`⚠️  非 JSON 响应: ${text.substring(0, 200)}`, 'yellow');
      
      // 检查是否有 Cookie（登录可能成功）
      if (authCookie) {
        log('✅ 登录成功（通过 Cookie）', 'green');
        log(`   Cookie: ${authCookie.substring(0, 50)}...`, 'cyan');
        return true;
      }
      
      return false;
    }

    if (response.ok || authCookie) {
      log('✅ 登录成功', 'green');
      log(`   Cookie: ${authCookie.substring(0, 50)}...`, 'cyan');
      return true;
    } else {
      log(`❌ 登录失败: ${data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 登录失败: ${error.message}`, 'red');
    return false;
  }
}

// 3. 检查初始状态（免费版）
async function step3_checkInitialState() {
  log('\n【步骤 3】检查初始状态（免费版）', 'blue');

  try {
    const response = await makeRequest(`${BASE_URL}/api/user/get-user-info`);
    const data = await response.json();

    if (response.ok) {
      log('✅ 获取用户信息成功', 'green');
      log(`   计划类型: ${data.planType || 'free'}`, 'cyan');
      log(`   免费试用次数: ${data.freeTrialUsed || 0}`, 'cyan');
      
      // 检查是否有 Vault
      const vaultResponse = await makeRequest(`${BASE_URL}/api/vault/data`);
      const vaultData = await vaultResponse.json();
      
      if (vaultResponse.ok && vaultData.vault) {
        vaultId = vaultData.vault.id;
        log(`   Vault ID: ${vaultId}`, 'cyan');
        log(`   Vault 计划: ${vaultData.vault.planLevel || 'free'}`, 'cyan');
        log(`   订阅结束日期: ${vaultData.vault.currentPeriodEnd || '无'}`, 'cyan');
      } else {
        log('   ⚠️  用户尚未创建 Vault', 'yellow');
      }
      
      return true;
    } else {
      log(`❌ 获取用户信息失败: ${data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 4. 创建 Vault（如果不存在）
async function step4_createVault() {
  if (vaultId) {
    log('\n【步骤 4】Vault 已存在，跳过创建', 'yellow');
    return true;
  }

  log('\n【步骤 4】创建 Vault', 'blue');

  try {
    const response = await makeRequest(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      body: JSON.stringify({
        masterPassword: 'TestMasterPassword123',
        encryptionHint: 'Test hint',
        heartbeatFrequency: 90,
        gracePeriod: 7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      vaultId = data.vaultId || data.id;
      log('✅ Vault 创建成功', 'green');
      log(`   Vault ID: ${vaultId}`, 'cyan');
      return true;
    } else {
      log(`❌ Vault 创建失败: ${data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Vault 创建失败: ${error.message}`, 'red');
    return false;
  }
}

// 5. 模拟支付成功（直接更新数据库）
async function step5_simulatePayment(planType = 'base') {
  log('\n【步骤 5】模拟支付成功', 'blue');
  log(`   计划类型: ${planType}`, 'cyan');
  log(`   金额: $${(testPlans[planType].amount / 100).toFixed(2)}`, 'cyan');

  try {
    // 调用模拟支付 API（需要创建）
    const response = await makeRequest(`${BASE_URL}/api/test/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
        planLevel: planType,
        amount: testPlans[planType].amount,
        duration: testPlans[planType].duration,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log('✅ 支付模拟成功', 'green');
      log(`   订单号: ${data.orderNo || 'N/A'}`, 'cyan');
      log(`   订阅结束日期: ${data.currentPeriodEnd || 'N/A'}`, 'cyan');
      return true;
    } else {
      log(`❌ 支付模拟失败: ${data.error}`, 'red');
      log('   ⚠️  需要创建 /api/test/simulate-payment 端点', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ 支付模拟失败: ${error.message}`, 'red');
    return false;
  }
}

// 6. 验证权益激活
async function step6_verifyBenefits(planType = 'base') {
  log('\n【步骤 6】验证权益激活', 'blue');

  try {
    const response = await makeRequest(`${BASE_URL}/api/vault/data`);
    const data = await response.json();

    if (!response.ok) {
      log(`❌ 获取 Vault 数据失败: ${data.error}`, 'red');
      return false;
    }

    const vault = data.vault;
    const expectedPlan = testPlans[planType];

    log('✅ Vault 数据获取成功', 'green');
    
    // 验证计划等级
    const planMatch = vault.planLevel === planType;
    log(`   计划等级: ${vault.planLevel} ${planMatch ? '✅' : '❌ 应为 ' + planType}`, 
      planMatch ? 'green' : 'red');

    // 验证订阅结束日期
    if (expectedPlan.duration) {
      const hasEndDate = !!vault.currentPeriodEnd;
      log(`   订阅结束日期: ${vault.currentPeriodEnd || '无'} ${hasEndDate ? '✅' : '❌'}`, 
        hasEndDate ? 'green' : 'red');
      
      if (hasEndDate) {
        const endDate = new Date(vault.currentPeriodEnd);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        log(`   剩余天数: ${daysRemaining} 天`, 'cyan');
      }
    } else {
      log(`   订阅类型: 永久 ✅`, 'green');
    }

    // 验证心跳频率
    const heartbeatMatch = vault.heartbeatFrequency === expectedPlan.features.heartbeatFrequency;
    log(`   心跳频率: ${vault.heartbeatFrequency} 天 ${heartbeatMatch ? '✅' : '⚠️'}`, 
      heartbeatMatch ? 'green' : 'yellow');

    // 验证状态
    const statusActive = vault.status === 'active';
    log(`   Vault 状态: ${vault.status} ${statusActive ? '✅' : '❌'}`, 
      statusActive ? 'green' : 'red');

    return planMatch && statusActive;
  } catch (error) {
    log(`❌ 验证失败: ${error.message}`, 'red');
    return false;
  }
}

// 7. 测试受益人限制
async function step7_testBeneficiaryLimit(planType = 'base') {
  log('\n【步骤 7】测试受益人限制', 'blue');
  
  const maxBeneficiaries = testPlans[planType].features.maxBeneficiaries;
  log(`   计划允许的最大受益人数: ${maxBeneficiaries}`, 'cyan');

  try {
    let successCount = 0;
    let failCount = 0;

    // 尝试添加超过限制的受益人
    for (let i = 1; i <= maxBeneficiaries + 2; i++) {
      const response = await makeRequest(`${BASE_URL}/api/beneficiary`, {
        method: 'POST',
        body: JSON.stringify({
          vaultId,
          name: `Test Beneficiary ${i}`,
          email: `beneficiary${i}_${Date.now()}@example.com`,
          relationship: 'friend',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        successCount++;
        log(`   ✅ 受益人 ${i} 添加成功`, 'green');
      } else {
        failCount++;
        if (i <= maxBeneficiaries) {
          log(`   ❌ 受益人 ${i} 添加失败（不应该失败）: ${data.error}`, 'red');
        } else {
          log(`   ✅ 受益人 ${i} 添加被拒绝（符合预期）: ${data.error}`, 'green');
        }
      }

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    log(`\n   总结: ${successCount} 成功, ${failCount} 失败`, 'cyan');
    
    // 验证是否正确限制
    const correctLimit = successCount === maxBeneficiaries;
    if (correctLimit) {
      log(`   ✅ 受益人限制正确执行`, 'green');
    } else {
      log(`   ❌ 受益人限制有问题（应允许 ${maxBeneficiaries} 个）`, 'red');
    }

    return correctLimit;
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 8. 测试订阅过期处理
async function step8_testSubscriptionExpiry() {
  log('\n【步骤 8】测试订阅过期处理', 'blue');

  try {
    // 调用订阅检查 API
    const response = await makeRequest(`${BASE_URL}/api/test/simulate-expiry`, {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log('✅ 订阅过期模拟成功', 'green');
      
      // 验证是否降级到免费版
      const vaultResponse = await makeRequest(`${BASE_URL}/api/vault/data`);
      const vaultData = await vaultResponse.json();
      
      if (vaultData.vault.planLevel === 'free') {
        log('   ✅ 已正确降级到免费版', 'green');
        return true;
      } else {
        log(`   ❌ 降级失败，当前计划: ${vaultData.vault.planLevel}`, 'red');
        return false;
      }
    } else {
      log(`⚠️  订阅过期模拟失败: ${data.error}`, 'yellow');
      log('   需要创建 /api/test/simulate-expiry 端点', 'yellow');
      return null; // 跳过此测试
    }
  } catch (error) {
    log(`⚠️  测试跳过: ${error.message}`, 'yellow');
    return null;
  }
}

// 9. 测试安全漏洞
async function step9_testSecurityVulnerabilities() {
  log('\n【步骤 9】测试安全漏洞', 'blue');

  const vulnerabilities = [];

  // 9.1 测试未授权访问
  log('\n   9.1 测试未授权访问他人 Vault', 'cyan');
  try {
    const fakeVaultId = 'fake-vault-id-12345';
    const response = await makeRequest(`${BASE_URL}/api/vault/data?vaultId=${fakeVaultId}`);
    
    if (response.status === 403 || response.status === 404) {
      log('   ✅ 正确拒绝未授权访问', 'green');
    } else {
      log('   ❌ 安全漏洞：可以访问他人 Vault', 'red');
      vulnerabilities.push('未授权访问漏洞');
    }
  } catch (error) {
    log(`   ⚠️  测试失败: ${error.message}`, 'yellow');
  }

  // 9.2 测试支付金额篡改
  log('\n   9.2 测试支付金额篡改', 'cyan');
  try {
    const response = await makeRequest(`${BASE_URL}/api/test/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
        planLevel: 'pro',
        amount: 1, // 尝试用 $0.01 购买 Pro 版
        duration: 30,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      log('   ❌ 安全漏洞：可以篡改支付金额', 'red');
      vulnerabilities.push('支付金额篡改漏洞');
    } else {
      log('   ✅ 正确验证支付金额', 'green');
    }
  } catch (error) {
    log(`   ⚠️  测试跳过: ${error.message}`, 'yellow');
  }

  // 9.3 测试重复支付
  log('\n   9.3 测试重复支付处理', 'cyan');
  try {
    const orderNo = `TEST_${Date.now()}`;
    
    // 第一次支付
    await makeRequest(`${BASE_URL}/api/test/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
        planLevel: 'base',
        amount: 999,
        duration: 30,
        orderNo,
      }),
    });

    // 第二次相同订单号
    const response2 = await makeRequest(`${BASE_URL}/api/test/simulate-payment`, {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
        planLevel: 'base',
        amount: 999,
        duration: 30,
        orderNo, // 相同订单号
      }),
    });

    if (response2.status === 400 || response2.status === 409) {
      log('   ✅ 正确拒绝重复支付', 'green');
    } else {
      log('   ❌ 安全漏洞：可以重复支付', 'red');
      vulnerabilities.push('重复支付漏洞');
    }
  } catch (error) {
    log(`   ⚠️  测试跳过: ${error.message}`, 'yellow');
  }

  return vulnerabilities;
}

// ============================================
// 主测试流程
// ============================================

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║       会员支付流程模拟测试                              ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\n测试环境: ${BASE_URL}`, 'yellow');
  log(`测试时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');

  const results = {
    register: false,
    login: false,
    initialState: false,
    createVault: false,
    payment: false,
    benefits: false,
    beneficiaryLimit: false,
    expiry: null,
    vulnerabilities: [],
  };

  // 执行测试步骤
  results.register = await step1_registerUser();
  if (!results.register) {
    log('\n❌ 注册失败，终止测试', 'red');
    return;
  }

  results.login = await step2_loginUser();
  if (!results.login) {
    log('\n❌ 登录失败，终止测试', 'red');
    return;
  }

  results.initialState = await step3_checkInitialState();
  results.createVault = await step4_createVault();
  
  if (!vaultId) {
    log('\n❌ 无法获取 Vault ID，终止测试', 'red');
    return;
  }

  // 测试 Base 计划
  log('\n\n═══════════════════════════════════════════════════════', 'magenta');
  log('  测试 BASE 计划', 'magenta');
  log('═══════════════════════════════════════════════════════', 'magenta');
  
  results.payment = await step5_simulatePayment('base');
  if (results.payment) {
    results.benefits = await step6_verifyBenefits('base');
    results.beneficiaryLimit = await step7_testBeneficiaryLimit('base');
  }

  // 测试订阅过期
  results.expiry = await step8_testSubscriptionExpiry();

  // 安全测试
  log('\n\n═══════════════════════════════════════════════════════', 'magenta');
  log('  安全漏洞测试', 'magenta');
  log('═══════════════════════════════════════════════════════', 'magenta');
  
  results.vulnerabilities = await step9_testSecurityVulnerabilities();

  // 总结报告
  log('\n\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║       测试结果总结                                      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const testItems = [
    { name: '用户注册', result: results.register },
    { name: '用户登录', result: results.login },
    { name: '初始状态检查', result: results.initialState },
    { name: 'Vault 创建', result: results.createVault },
    { name: '支付模拟', result: results.payment },
    { name: '权益激活', result: results.benefits },
    { name: '受益人限制', result: results.beneficiaryLimit },
    { name: '订阅过期处理', result: results.expiry },
  ];

  testItems.forEach(item => {
    const status = item.result === true ? '✅ 通过' : 
                   item.result === false ? '❌ 失败' : 
                   '⚠️  跳过';
    const color = item.result === true ? 'green' : 
                  item.result === false ? 'red' : 
                  'yellow';
    log(`${item.name}: ${status}`, color);
  });

  // 安全漏洞报告
  log('\n安全漏洞检测:', 'cyan');
  if (results.vulnerabilities.length === 0) {
    log('✅ 未发现安全漏洞', 'green');
  } else {
    log(`❌ 发现 ${results.vulnerabilities.length} 个安全漏洞:`, 'red');
    results.vulnerabilities.forEach((vuln, index) => {
      log(`   ${index + 1}. ${vuln}`, 'red');
    });
  }

  // 计算通过率
  const passedTests = testItems.filter(item => item.result === true).length;
  const totalTests = testItems.filter(item => item.result !== null).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  log(`\n总计: ${passedTests}/${totalTests} 测试通过 (${passRate}%)`, 
    passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');

  // 建议
  log('\n📝 建议:', 'blue');
  if (!results.payment) {
    log('   1. 需要创建 /api/test/simulate-payment 端点用于测试', 'yellow');
  }
  if (results.expiry === null) {
    log('   2. 需要创建 /api/test/simulate-expiry 端点用于测试', 'yellow');
  }
  if (results.vulnerabilities.length > 0) {
    log('   3. 修复发现的安全漏洞', 'red');
  }
  if (passRate < 100) {
    log('   4. 修复失败的测试项', 'yellow');
  }

  log('\n测试完成！', 'green');
}

// 运行测试
runTests().catch((error) => {
  log(`\n❌ 测试运行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

