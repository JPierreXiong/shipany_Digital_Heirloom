/**
 * 测试新功能：Creem支付集成和订阅管理
 */

const testResults = {
  timestamp: new Date().toISOString(),
  tests: []
};

// 测试1: 检查环境变量配置
async function testEnvironmentVariables() {
  console.log('\n=== 测试1: 环境变量配置 ===');
  const requiredVars = [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
    'CREEM_PRODUCT_ID_LIFETIME_BASE',
    'CREEM_PRODUCT_ID_LIFETIME_PRO'
  ];
  
  const missing = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  const passed = missing.length === 0;
  testResults.tests.push({
    name: '环境变量配置',
    passed,
    message: passed ? '所有必需的环境变量已配置' : `缺少环境变量: ${missing.join(', ')}`
  });
  
  console.log(passed ? '✅ 通过' : `❌ 失败: ${missing.join(', ')}`);
  return passed;
}

// 测试2: 检查API路由可访问性
async function testAPIRoutes() {
  console.log('\n=== 测试2: API路由可访问性 ===');
  const routes = [
    { path: '/api/user/get-user-info', method: 'GET' },
    { path: '/api/payment/creem/webhook', method: 'POST' }
  ];
  
  const results = [];
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3000${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const accessible = response.status !== 404;
      results.push({
        route: route.path,
        accessible,
        status: response.status
      });
      
      console.log(`${accessible ? '✅' : '❌'} ${route.path} - Status: ${response.status}`);
    } catch (error) {
      results.push({
        route: route.path,
        accessible: false,
        error: error.message
      });
      console.log(`❌ ${route.path} - Error: ${error.message}`);
    }
  }
  
  const passed = results.every(r => r.accessible);
  testResults.tests.push({
    name: 'API路由可访问性',
    passed,
    details: results
  });
  
  return passed;
}

// 测试3: 检查定价配置
async function testPricingConfiguration() {
  console.log('\n=== 测试3: 定价配置 ===');
  const locales = ['en', 'zh', 'fr'];
  const results = [];
  
  for (const locale of locales) {
    try {
      const pricingModule = await import(`./src/config/locale/messages/${locale}/pricing.json`);
      const pricing = pricingModule.default || pricingModule;
      
      const hasLifetimeBase = pricing.plans?.some(p => p.id === 'lifetime-base');
      const hasLifetimePro = pricing.plans?.some(p => p.id === 'lifetime-pro');
      
      results.push({
        locale,
        hasLifetimeBase,
        hasLifetimePro,
        passed: hasLifetimeBase && hasLifetimePro
      });
      
      console.log(`${hasLifetimeBase && hasLifetimePro ? '✅' : '❌'} ${locale}: Lifetime Base=${hasLifetimeBase}, Lifetime Pro=${hasLifetimePro}`);
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

// 测试4: 检查新文件是否存在
async function testNewFiles() {
  console.log('\n=== 测试4: 新文件检查 ===');
  const fs = require('fs');
  const path = require('path');
  
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

// 测试5: 服务器健康检查
async function testServerHealth() {
  console.log('\n=== 测试5: 服务器健康检查 ===');
  try {
    const response = await fetch('http://localhost:3000');
    const passed = response.ok;
    
    testResults.tests.push({
      name: '服务器健康检查',
      passed,
      status: response.status,
      statusText: response.statusText
    });
    
    console.log(passed ? '✅ 服务器运行正常' : `❌ 服务器响应异常: ${response.status}`);
    return passed;
  } catch (error) {
    testResults.tests.push({
      name: '服务器健康检查',
      passed: false,
      error: error.message
    });
    console.log(`❌ 无法连接到服务器: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试新功能...\n');
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  
  const tests = [
    testEnvironmentVariables,
    testServerHealth,
    testAPIRoutes,
    testPricingConfiguration,
    testNewFiles
  ];
  
  for (const test of tests) {
    await test();
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  const totalTests = testResults.tests.length;
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`\n总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n详细结果:');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
  });
  
  // 保存测试结果
  const fs = require('fs');
  const reportPath = './TEST_RESULTS_' + Date.now() + '.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportPath}`);
  
  console.log('\n' + '='.repeat(60));
  
  if (failedTests === 0) {
    console.log('🎉 所有测试通过！系统已准备就绪。');
  } else {
    console.log('⚠️  部分测试失败，请检查配置。');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});






