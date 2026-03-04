/**
 * 实施完成测试 - Creem支付集成和订阅管理
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {}
};

console.log('🚀 开始测试实施完成情况...\n');
console.log('测试时间:', new Date().toLocaleString('zh-CN'));
console.log('='.repeat(60));

// 测试1: 检查新文件是否创建
function testNewFiles() {
  console.log('\n📁 测试1: 新文件检查');
  console.log('-'.repeat(60));
  
  const newFiles = [
    'src/shared/services/plan-sync.ts',
    'src/shared/components/subscription-status.tsx'
  ];
  
  const results = [];
  for (const file of newFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    results.push({ file, exists });
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  }
  
  const passed = results.every(r => r.exists);
  testResults.tests.push({
    name: '新文件检查',
    passed,
    details: results
  });
  
  return passed;
}

// 测试2: 检查定价配置
function testPricingConfiguration() {
  console.log('\n💰 测试2: 定价配置检查');
  console.log('-'.repeat(60));
  
  const locales = ['en', 'zh', 'fr'];
  const results = [];
  
  for (const locale of locales) {
    try {
      const pricingPath = path.join(process.cwd(), `src/config/locale/messages/${locale}/pricing.json`);
      const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
      
      const items = pricingData.pricing?.items || [];
      const hasLifetimeBase = items.some(p => p.product_id === 'digital-heirloom-base-lifetime');
      const hasLifetimePro = items.some(p => p.product_id === 'digital-heirloom-pro-lifetime');
      
      // 检查产品ID
      const lifetimeBase = items.find(p => p.product_id === 'digital-heirloom-base-lifetime');
      const lifetimePro = items.find(p => p.product_id === 'digital-heirloom-pro-lifetime');
      
      results.push({
        locale,
        hasLifetimeBase,
        hasLifetimePro,
        lifetimeBasePrice: lifetimeBase?.price,
        lifetimeProPrice: lifetimePro?.price,
        lifetimeBasePaymentId: lifetimeBase?.payment_product_id,
        lifetimeProPaymentId: lifetimePro?.payment_product_id,
        passed: hasLifetimeBase && hasLifetimePro
      });
      
      console.log(`${hasLifetimeBase && hasLifetimePro ? '✅' : '❌'} ${locale}:`);
      console.log(`   - 终身标准版: ${hasLifetimeBase ? '✓' : '✗'} (${lifetimeBase?.price || 'N/A'})`);
      console.log(`   - 终身尊享版: ${hasLifetimePro ? '✓' : '✗'} (${lifetimePro?.price || 'N/A'})`);
      if (lifetimeBase?.payment_product_id) {
        console.log(`   - 标准版产品ID: ${lifetimeBase.payment_product_id}`);
      }
      if (lifetimePro?.payment_product_id) {
        console.log(`   - 尊享版产品ID: ${lifetimePro.payment_product_id}`);
      }
    } catch (error) {
      results.push({
        locale,
        passed: false,
        error: error.message
      });
      console.log(`❌ ${locale}: ${error.message}`);
    }
  }
  
  const passed = results.every(r => r.passed);
  testResults.tests.push({
    name: '定价配置',
    passed,
    details: results
  });
  
  return passed;
}

// 测试3: 检查代码修改
function testCodeModifications() {
  console.log('\n🔧 测试3: 代码修改检查');
  console.log('-'.repeat(60));
  
  const filesToCheck = [
    {
      path: 'src/shared/services/payment.ts',
      checks: [
        { pattern: /syncPlanToVault/i, description: '计划同步到保险库' },
        { pattern: /handleCheckoutSuccess/i, description: '支付成功处理' }
      ]
    },
    {
      path: 'src/shared/models/digital-vault.ts',
      checks: [
        { pattern: /updateVaultPlan/i, description: '更新保险库计划' }
      ]
    },
    {
      path: 'src/app/api/user/get-user-info/route.ts',
      checks: [
        { pattern: /subscription/i, description: '订阅信息' },
        { pattern: /expiresAt/i, description: '过期时间' }
      ]
    }
  ];
  
  const results = [];
  
  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      results.push({
        file: file.path,
        passed: false,
        error: '文件不存在'
      });
      console.log(`❌ ${file.path}: 文件不存在`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const checkResults = [];
    
    for (const check of file.checks) {
      const found = check.pattern.test(content);
      checkResults.push({
        description: check.description,
        found
      });
    }
    
    const allPassed = checkResults.every(c => c.found);
    results.push({
      file: file.path,
      passed: allPassed,
      checks: checkResults
    });
    
    console.log(`${allPassed ? '✅' : '⚠️'} ${file.path}:`);
    checkResults.forEach(c => {
      console.log(`   ${c.found ? '✓' : '✗'} ${c.description}`);
    });
  }
  
  const passed = results.every(r => r.passed);
  testResults.tests.push({
    name: '代码修改',
    passed,
    details: results
  });
  
  return passed;
}

// 测试4: 检查服务器状态
async function testServerStatus() {
  console.log('\n🌐 测试4: 服务器状态检查');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch('http://localhost:3000', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    const passed = response.ok;
    testResults.tests.push({
      name: '服务器状态',
      passed,
      status: response.status,
      statusText: response.statusText
    });
    
    console.log(passed ? '✅ 服务器运行正常' : `⚠️ 服务器响应: ${response.status}`);
    console.log(`   URL: http://localhost:3000`);
    console.log(`   状态: ${response.status} ${response.statusText}`);
    
    return passed;
  } catch (error) {
    testResults.tests.push({
      name: '服务器状态',
      passed: false,
      error: error.message
    });
    console.log(`❌ 无法连接到服务器: ${error.message}`);
    return false;
  }
}

// 测试5: 检查API路由
async function testAPIRoutes() {
  console.log('\n🔌 测试5: API路由检查');
  console.log('-'.repeat(60));
  
  const routes = [
    { path: '/api/user/get-user-info', method: 'GET', expectedStatus: [401, 405] },
    { path: '/api/payment/notify/creem', method: 'POST', expectedStatus: [200, 400, 500] }
  ];
  
  const results = [];
  
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3000${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      const accessible = response.status !== 404;
      const statusOk = route.expectedStatus.includes(response.status);
      
      results.push({
        route: route.path,
        accessible,
        status: response.status,
        statusOk
      });
      
      console.log(`${accessible ? '✅' : '❌'} ${route.path}`);
      console.log(`   状态: ${response.status} ${statusOk ? '(预期)' : '(非预期)'}`);
    } catch (error) {
      results.push({
        route: route.path,
        accessible: false,
        error: error.message
      });
      console.log(`❌ ${route.path}: ${error.message}`);
    }
  }
  
  const passed = results.every(r => r.accessible);
  testResults.tests.push({
    name: 'API路由',
    passed,
    details: results
  });
  
  return passed;
}

// 测试6: 环境变量检查（仅提示）
function testEnvironmentVariables() {
  console.log('\n⚙️ 测试6: 环境变量配置提示');
  console.log('-'.repeat(60));
  
  const requiredVars = [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
    'CREEM_PRODUCT_ID_LIFETIME_BASE',
    'CREEM_PRODUCT_ID_LIFETIME_PRO'
  ];
  
  console.log('需要配置的环境变量:');
  requiredVars.forEach(v => {
    const exists = !!process.env[v];
    console.log(`${exists ? '✅' : '⚠️'} ${v} ${exists ? '(已配置)' : '(待配置)'}`);
  });
  
  const allConfigured = requiredVars.every(v => !!process.env[v]);
  
  if (!allConfigured) {
    console.log('\n💡 提示: 请在 .env.local 文件中配置以上环境变量');
  }
  
  testResults.tests.push({
    name: '环境变量配置',
    passed: allConfigured,
    note: allConfigured ? '所有环境变量已配置' : '部分环境变量待配置（不影响代码实施）'
  });
  
  return true; // 不影响整体测试结果
}

// 主测试函数
async function runTests() {
  const tests = [
    { name: '新文件检查', fn: testNewFiles, async: false },
    { name: '定价配置', fn: testPricingConfiguration, async: false },
    { name: '代码修改', fn: testCodeModifications, async: false },
    { name: '服务器状态', fn: testServerStatus, async: true },
    { name: 'API路由', fn: testAPIRoutes, async: true },
    { name: '环境变量', fn: testEnvironmentVariables, async: false }
  ];
  
  for (const test of tests) {
    if (test.async) {
      await test.fn();
    } else {
      test.fn();
    }
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  const totalTests = testResults.tests.length;
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  
  testResults.summary = {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
  };
  
  console.log(`\n总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`成功率: ${testResults.summary.successRate}`);
  
  console.log('\n详细结果:');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.note) {
      console.log(`   💡 ${test.note}`);
    }
  });
  
  // 保存测试结果
  const reportPath = path.join(process.cwd(), 'TEST_IMPLEMENTATION_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportPath}`);
  
  console.log('\n' + '='.repeat(60));
  
  if (failedTests === 0) {
    console.log('🎉 所有测试通过！实施已完成。');
    console.log('\n📋 下一步操作:');
    console.log('1. 在 .env.local 中配置 Creem API 凭证');
    console.log('2. 在 Creem 控制台配置 webhook URL');
    console.log('3. 重启服务器使环境变量生效');
    console.log('4. 执行完整的用户注册和支付流程测试');
  } else {
    console.log('⚠️  部分测试失败，请检查实施。');
  }
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});

