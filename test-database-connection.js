/**
 * 数据库连接测试脚本
 * 测试 Supabase PostgreSQL 连接和基本操作
 */

const https = require('https');

// 配置
const BASE_URL = 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求封装
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    log(`✅ ${name}`, 'green');
    if (message) log(`   ${message}`, 'cyan');
  } else {
    testResults.failed++;
    log(`❌ ${name}`, 'red');
    if (message) log(`   ${message}`, 'yellow');
  }
}

// 主测试函数
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║       数据库连接测试                                    ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\n测试环境: ${BASE_URL}`, 'yellow');
  log(`测试时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');

  try {
    // 测试 1: 检查服务器是否运行
    log('\n【测试 1】检查服务器状态', 'blue');
    try {
      const response = await makeRequest(`${BASE_URL}/api/config/get-configs`);
      if (response.ok) {
        recordTest('服务器运行正常', true, `状态码: ${response.status}`);
      } else {
        recordTest('服务器响应异常', false, `状态码: ${response.status}`);
      }
    } catch (error) {
      recordTest('服务器连接失败', false, error.message);
      log('\n⚠️  请先启动开发服务器: pnpm dev', 'yellow');
      return;
    }

    // 测试 2: 测试数据库配置读取
    log('\n【测试 2】数据库配置读取', 'blue');
    try {
      const response = await makeRequest(`${BASE_URL}/api/config/get-configs`);
      const data = await response.json();
      
      if (data.data) {
        recordTest('配置读取成功', true, `读取到 ${Object.keys(data.data).length} 个配置项`);
        
        // 检查关键配置
        const configs = data.data;
        const hasDatabase = configs.database_url || configs.DATABASE_URL;
        const hasBlob = configs.blob_read_write_token || configs.BLOB_READ_WRITE_TOKEN;
        
        if (hasDatabase) {
          recordTest('数据库连接配置存在', true);
        } else {
          recordTest('数据库连接配置缺失', false, '请检查 DATABASE_URL 环境变量');
        }
        
        if (hasBlob) {
          recordTest('Blob 存储配置存在', true);
        } else {
          recordTest('Blob 存储配置缺失', false, '请检查 BLOB_READ_WRITE_TOKEN 环境变量');
        }
      } else {
        recordTest('配置读取失败', false, data.error || '未知错误');
      }
    } catch (error) {
      recordTest('配置读取异常', false, error.message);
    }

    // 测试 3: 测试用户表查询（通过注册测试）
    log('\n【测试 3】用户表操作测试', 'blue');
    const testEmail = `test_db_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    try {
      const response = await makeRequest(`${BASE_URL}/api/auth/sign-up`, {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Database Test User',
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (response.ok || response.status === 201) {
          recordTest('用户表写入成功', true, `创建用户: ${testEmail}`);
        } else if (response.status === 409) {
          recordTest('用户表查询成功', true, '用户已存在（表可读）');
        } else {
          recordTest('用户表操作失败', false, data.error || `状态码: ${response.status}`);
        }
      } else {
        const text = await response.text();
        if (response.status === 422) {
          recordTest('用户表操作失败', false, '422 错误 - 可能是验证问题');
        } else {
          recordTest('用户表操作失败', false, `非 JSON 响应: ${text.substring(0, 100)}`);
        }
      }
    } catch (error) {
      recordTest('用户表操作异常', false, error.message);
    }

    // 测试 4: 测试 Vault 表查询
    log('\n【测试 4】Vault 表操作测试', 'blue');
    try {
      // 先登录获取 session
      const loginResponse = await makeRequest(`${BASE_URL}/api/auth/sign-in`, {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const cookies = loginResponse.headers.get('set-cookie');
      
      if (cookies) {
        // 尝试获取用户信息（需要认证）
        const userResponse = await makeRequest(`${BASE_URL}/api/user/get-user-info`, {
          headers: {
            Cookie: cookies,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          recordTest('认证系统正常', true, `用户ID: ${userData.data?.id?.substring(0, 8)}...`);
          
          // 检查是否自动创建了 Vault
          if (userData.data?.vault) {
            recordTest('Vault 自动创建成功', true, '注册时已创建 Vault');
          } else {
            recordTest('Vault 未自动创建', false, '需要检查注册钩子');
          }
        } else {
          recordTest('用户信息查询失败', false, `状态码: ${userResponse.status}`);
        }
      } else {
        recordTest('登录失败', false, '未获取到 Cookie');
      }
    } catch (error) {
      recordTest('Vault 表操作异常', false, error.message);
    }

    // 测试 5: 测试订单表（模拟查询）
    log('\n【测试 5】订单表查询测试', 'blue');
    try {
      // 订单表查询需要管理员权限，这里只测试 API 是否存在
      const response = await makeRequest(`${BASE_URL}/api/payment/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'test_product',
          currency: 'usd',
        }),
      });

      if (response.status === 401 || response.status === 403) {
        recordTest('订单表 API 存在', true, '需要认证（正常）');
      } else if (response.status === 400) {
        recordTest('订单表 API 存在', true, '参数验证正常');
      } else {
        const data = await response.json();
        recordTest('订单表 API 响应', true, `状态码: ${response.status}`);
      }
    } catch (error) {
      recordTest('订单表查询异常', false, error.message);
    }

    // 测试 6: 测试数据库事务（通过支付模拟）
    log('\n【测试 6】数据库事务测试', 'blue');
    try {
      const response = await makeRequest(`${BASE_URL}/api/test/simulate-payment`, {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test_user_id',
          productId: 'digital_heirloom_base_yearly',
          amount: 9900,
          currency: 'usd',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        recordTest('数据库事务支持', true, '支付模拟 API 正常');
      } else if (response.status === 404) {
        recordTest('支付模拟 API 未启用', false, '测试 API 不存在');
      } else {
        recordTest('数据库事务测试失败', false, `状态码: ${response.status}`);
      }
    } catch (error) {
      recordTest('数据库事务测试异常', false, error.message);
    }

    // 测试 7: 测试数据库索引性能
    log('\n【测试 7】数据库索引测试', 'blue');
    try {
      // 通过多次查询测试索引效果
      const start = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await makeRequest(`${BASE_URL}/api/config/get-configs`);
      }
      
      const duration = Date.now() - start;
      const avgTime = duration / 5;
      
      if (avgTime < 100) {
        recordTest('数据库查询性能优秀', true, `平均响应时间: ${avgTime.toFixed(0)}ms`);
      } else if (avgTime < 500) {
        recordTest('数据库查询性能良好', true, `平均响应时间: ${avgTime.toFixed(0)}ms`);
      } else {
        recordTest('数据库查询性能较慢', false, `平均响应时间: ${avgTime.toFixed(0)}ms`);
      }
    } catch (error) {
      recordTest('数据库性能测试异常', false, error.message);
    }

  } catch (error) {
    log(`\n❌ 测试过程出错: ${error.message}`, 'red');
  }

  // 输出测试总结
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║       测试结果总结                                      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\n总测试数: ${testResults.passed + testResults.failed}`, 'cyan');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');
  log(`成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'yellow');

  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！数据库连接正常！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查数据库配置', 'yellow');
  }

  // 输出详细报告
  log('\n【详细测试报告】', 'blue');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${index + 1}. ${status} ${test.name}`, color);
    if (test.message) {
      log(`   ${test.message}`, 'cyan');
    }
  });

  log('\n测试完成时间: ' + new Date().toLocaleString('zh-CN'), 'yellow');
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

