/**
 * Digital Heirloom 功能测试脚本
 * 测试所有新增的 API 端点和功能
 */

const BASE_URL = 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// 测试结果
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}${message ? ': ' + message : ''}`, color);
}

// 测试辅助函数
async function testAPI(name, method, endpoint, body = null, expectedStatus = 200) {
  testResults.totalTests++;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    const passed = response.status === expectedStatus;
    
    if (passed) {
      testResults.passed++;
      logTest(name, 'pass', `Status: ${response.status}`);
    } else {
      testResults.failed++;
      logTest(name, 'fail', `Expected ${expectedStatus}, got ${response.status}`);
    }

    testResults.tests.push({
      name,
      method,
      endpoint,
      status: passed ? 'passed' : 'failed',
      expectedStatus,
      actualStatus: response.status,
      response: data,
    });

    return { passed, response, data };
  } catch (error) {
    testResults.failed++;
    logTest(name, 'fail', error.message);
    testResults.tests.push({
      name,
      method,
      endpoint,
      status: 'failed',
      error: error.message,
    });
    return { passed: false, error };
  }
}

// 主测试函数
async function runTests() {
  log('\n🚀 Digital Heirloom 功能测试开始\n', 'cyan');
  log('测试时间: ' + new Date().toLocaleString('zh-CN'), 'blue');
  log('测试环境: ' + BASE_URL, 'blue');
  log('='.repeat(60), 'blue');

  // ============================================
  // 第一部分：API 可访问性测试
  // ============================================
  log('\n📡 第一部分：API 可访问性测试', 'cyan');
  log('-'.repeat(60), 'blue');

  await testAPI(
    '1.1 创建 Vault API (未登录)',
    'POST',
    '/api/vault/create',
    {},
    401
  );

  await testAPI(
    '1.2 获取 Vault 信息 API (未登录)',
    'GET',
    '/api/vault/create',
    null,
    401
  );

  await testAPI(
    '1.3 保存 Vault 数据 API (未登录)',
    'POST',
    '/api/vault/save',
    { encryptedData: 'test' },
    401
  );

  await testAPI(
    '1.4 获取 Vault 数据 API (未登录)',
    'GET',
    '/api/vault/data',
    null,
    401
  );

  await testAPI(
    '1.5 更新心跳 API (未登录)',
    'POST',
    '/api/vault/heartbeat',
    {},
    401
  );

  await testAPI(
    '1.6 获取心跳状态 API (未登录)',
    'GET',
    '/api/vault/heartbeat',
    null,
    401
  );

  await testAPI(
    '1.7 创建受益人 API (未登录)',
    'POST',
    '/api/beneficiary',
    { name: 'Test', email: 'test@example.com' },
    401
  );

  await testAPI(
    '1.8 获取受益人列表 API (未登录)',
    'GET',
    '/api/beneficiary',
    null,
    401
  );

  // ============================================
  // 第二部分：Cron Job 测试
  // ============================================
  log('\n⏰ 第二部分：Cron Job 测试', 'cyan');
  log('-'.repeat(60), 'blue');

  await testAPI(
    '2.1 订阅过期检查 Cron (无认证)',
    'GET',
    '/api/cron/check-expired-subscriptions',
    null,
    401
  );

  await testAPI(
    '2.2 心跳检查 Cron (无认证)',
    'GET',
    '/api/cron/check-heartbeat',
    null,
    401
  );

  // ============================================
  // 第三部分：数据验证测试
  // ============================================
  log('\n🔍 第三部分：数据验证测试', 'cyan');
  log('-'.repeat(60), 'blue');

  // 测试服务器是否运行
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      testResults.totalTests++;
      testResults.passed++;
      logTest('3.1 服务器运行状态', 'pass', 'Server is running');
      testResults.tests.push({
        name: '3.1 服务器运行状态',
        status: 'passed',
      });
    }
  } catch (error) {
    testResults.totalTests++;
    testResults.failed++;
    logTest('3.1 服务器运行状态', 'fail', 'Server is not running');
    testResults.tests.push({
      name: '3.1 服务器运行状态',
      status: 'failed',
      error: error.message,
    });
  }

  // 测试用户信息 API
  await testAPI(
    '3.2 获取用户信息 API',
    'POST',
    '/api/user/get-user-info',
    {},
    200 // 可能返回 200 但提示未登录
  );

  // ============================================
  // 第四部分：文件存在性检查
  // ============================================
  log('\n📁 第四部分：文件存在性检查', 'cyan');
  log('-'.repeat(60), 'blue');

  const filesToCheck = [
    'src/app/api/vault/create/route.ts',
    'src/app/api/vault/save/route.ts',
    'src/app/api/vault/data/route.ts',
    'src/app/api/vault/heartbeat/route.ts',
    'src/app/api/beneficiary/route.ts',
    'src/app/api/beneficiary/[id]/route.ts',
    'src/app/api/cron/check-expired-subscriptions/route.ts',
    'src/app/api/cron/check-heartbeat/route.ts',
    'src/shared/hooks/create-vault-on-signup.ts',
    'src/shared/services/plan-sync.ts',
    'src/shared/components/subscription-status.tsx',
    'migrations/001_add_constraints_and_triggers.sql',
  ];

  for (const file of filesToCheck) {
    testResults.totalTests++;
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      testResults.passed++;
      logTest(`4.${filesToCheck.indexOf(file) + 1} ${file}`, 'pass');
      testResults.tests.push({
        name: `文件存在: ${file}`,
        status: 'passed',
      });
    } else {
      testResults.failed++;
      logTest(`4.${filesToCheck.indexOf(file) + 1} ${file}`, 'fail', 'File not found');
      testResults.tests.push({
        name: `文件存在: ${file}`,
        status: 'failed',
        error: 'File not found',
      });
    }
  }

  // ============================================
  // 第五部分：配置文件检查
  // ============================================
  log('\n⚙️  第五部分：配置文件检查', 'cyan');
  log('-'.repeat(60), 'blue');

  testResults.totalTests++;
  try {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8')
    );
    
    const hasCronJobs = vercelConfig.crons && vercelConfig.crons.length > 0;
    const hasExpiredSubCron = vercelConfig.crons.some(
      c => c.path === '/api/cron/check-expired-subscriptions'
    );
    const hasHeartbeatCron = vercelConfig.crons.some(
      c => c.path === '/api/cron/check-heartbeat'
    );

    if (hasCronJobs && hasExpiredSubCron && hasHeartbeatCron) {
      testResults.passed++;
      logTest('5.1 vercel.json Cron 配置', 'pass', `Found ${vercelConfig.crons.length} cron jobs`);
      testResults.tests.push({
        name: 'vercel.json Cron 配置',
        status: 'passed',
        cronJobs: vercelConfig.crons,
      });
    } else {
      testResults.failed++;
      logTest('5.1 vercel.json Cron 配置', 'fail', 'Missing cron jobs');
      testResults.tests.push({
        name: 'vercel.json Cron 配置',
        status: 'failed',
        error: 'Missing cron jobs',
      });
    }
  } catch (error) {
    testResults.failed++;
    logTest('5.1 vercel.json Cron 配置', 'fail', error.message);
    testResults.tests.push({
      name: 'vercel.json Cron 配置',
      status: 'failed',
      error: error.message,
    });
  }

  // ============================================
  // 测试总结
  // ============================================
  log('\n' + '='.repeat(60), 'blue');
  log('📊 测试总结', 'cyan');
  log('='.repeat(60), 'blue');

  const successRate = ((testResults.passed / testResults.totalTests) * 100).toFixed(1);
  
  log(`\n总测试数: ${testResults.totalTests}`, 'blue');
  log(`✅ 通过: ${testResults.passed}`, 'green');
  log(`❌ 失败: ${testResults.failed}`, 'red');
  log(`⏭️  跳过: ${testResults.skipped}`, 'yellow');
  log(`成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  // 保存测试报告
  const reportPath = path.join(process.cwd(), 'TEST_REPORT_FUNCTIONAL.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n📄 测试报告已保存: ${reportPath}`, 'blue');

  // 生成 Markdown 报告
  const mdReport = generateMarkdownReport(testResults);
  const mdReportPath = path.join(process.cwd(), 'TEST_REPORT_FUNCTIONAL.md');
  fs.writeFileSync(mdReportPath, mdReport);
  log(`📄 Markdown 报告已保存: ${mdReportPath}`, 'blue');

  log('\n' + '='.repeat(60), 'blue');
  
  if (testResults.failed === 0) {
    log('🎉 所有测试通过！', 'green');
  } else {
    log('⚠️  部分测试失败，请检查详细报告', 'yellow');
  }

  log('\n✨ 测试完成！\n', 'cyan');
}

// 生成 Markdown 报告
function generateMarkdownReport(results) {
  const successRate = ((results.passed / results.totalTests) * 100).toFixed(1);
  
  let md = `# Digital Heirloom 功能测试报告\n\n`;
  md += `**生成时间**: ${new Date(results.timestamp).toLocaleString('zh-CN')}\n\n`;
  md += `## 📊 测试概览\n\n`;
  md += `| 指标 | 数值 |\n`;
  md += `|------|------|\n`;
  md += `| 总测试数 | ${results.totalTests} |\n`;
  md += `| ✅ 通过 | ${results.passed} |\n`;
  md += `| ❌ 失败 | ${results.failed} |\n`;
  md += `| ⏭️ 跳过 | ${results.skipped} |\n`;
  md += `| 成功率 | ${successRate}% |\n\n`;

  md += `## 📋 详细测试结果\n\n`;

  const sections = {
    'API 可访问性测试': results.tests.filter(t => t.name.startsWith('1.')),
    'Cron Job 测试': results.tests.filter(t => t.name.startsWith('2.')),
    '数据验证测试': results.tests.filter(t => t.name.startsWith('3.')),
    '文件存在性检查': results.tests.filter(t => t.name.startsWith('4.')),
    '配置文件检查': results.tests.filter(t => t.name.startsWith('5.')),
  };

  for (const [section, tests] of Object.entries(sections)) {
    md += `### ${section}\n\n`;
    md += `| 测试项 | 状态 | 详情 |\n`;
    md += `|--------|------|------|\n`;
    
    for (const test of tests) {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      const details = test.error || test.actualStatus || '-';
      md += `| ${test.name} | ${icon} ${test.status} | ${details} |\n`;
    }
    md += `\n`;
  }

  md += `## 🎯 结论\n\n`;
  if (results.failed === 0) {
    md += `✅ **所有测试通过！** 系统功能正常。\n\n`;
  } else {
    md += `⚠️ **部分测试失败** (${results.failed}/${results.totalTests})，需要进一步检查。\n\n`;
  }

  md += `## 📝 备注\n\n`;
  md += `- 未登录状态下的 API 测试预期返回 401 状态码\n`;
  md += `- Cron Job 需要配置 CRON_SECRET 环境变量\n`;
  md += `- 完整功能测试需要登录用户进行端到端测试\n`;

  return md;
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});



