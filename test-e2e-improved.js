/**
 * Digital Heirloom 改进版端到端测试
 * 
 * 改进点：
 * 1. 使用 Cookie 认证而不是 Bearer Token
 * 2. 修复 HTTP 方法错误
 * 3. 添加更详细的错误日志
 * 4. 支持本地和生产环境测试
 * 5. 添加重试机制
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // 切换测试环境
  useLocal: false, // true = localhost, false = production
  
  // 生产环境
  productionUrl: 'https://www.digitalheirloom.app',
  
  // 本地环境
  localUrl: 'http://localhost:3000',
  
  // 测试用户
  testUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
    name: 'Test User'
  },
  
  // 受益人
  beneficiary: {
    email: `beneficiary_${Date.now()}@example.com`,
    name: 'Test Beneficiary'
  },
  
  // 超时设置
  timeout: 30000, // 30秒
  
  // 重试设置
  maxRetries: 3,
  retryDelay: 1000
};

// 获取基础 URL
const BASE_URL = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.productionUrl;
const isHttps = BASE_URL.startsWith('https');

// Cookie 存储
let cookies = [];

// 测试结果
const testResults = {
  timestamp: new Date().toISOString(),
  environment: CONFIG.useLocal ? 'local' : 'production',
  baseUrl: BASE_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// 测试上下文
const testContext = {
  userId: null,
  sessionToken: null,
  vaultId: null,
  beneficiaryId: null,
  encryptedData: null,
  encryptionIv: null,
  masterPasswordHash: null
};

// ============================================
// HTTP 请求工具（支持 Cookie）
// ============================================

function makeRequest(options, data = null, retries = 0) {
  return new Promise((resolve, reject) => {
    const protocol = isHttps ? https : http;
    const url = new URL(options.path, BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-Heirloom-Test/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };
    
    // 添加 Cookie
    if (cookies.length > 0) {
      requestOptions.headers['Cookie'] = cookies.join('; ');
    }
    
    // 添加 Content-Length
    if (data) {
      const bodyString = typeof data === 'string' ? data : JSON.stringify(data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }
    
    const req = protocol.request(requestOptions, (res) => {
      let body = '';
      
      // 保存 Cookie
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(cookie => {
          return cookie.split(';')[0];
        });
        cookies = [...cookies, ...newCookies];
      }
      
      res.on('data', chunk => body += chunk);
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
            rawBody: body
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      if (retries < CONFIG.maxRetries) {
        console.log(`  Retrying... (${retries + 1}/${CONFIG.maxRetries})`);
        setTimeout(() => {
          makeRequest(options, data, retries + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.retryDelay);
      } else {
        reject(error);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      const bodyString = typeof data === 'string' ? data : JSON.stringify(data);
      req.write(bodyString);
    }
    
    req.end();
  });
}

// ============================================
// 测试工具函数
// ============================================

function logTest(name, status, message, data = null) {
  const result = {
    name,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  testResults.summary[status]++;
  
  const icons = { passed: '✓', failed: '✗', skipped: '○' };
  const colors = { passed: '\x1b[32m', failed: '\x1b[31m', skipped: '\x1b[33m' };
  const icon = icons[status] || '?';
  const color = colors[status] || '\x1b[0m';
  
  console.log(`${color}${icon}\x1b[0m ${name}: ${message}`);
  
  if (data && status === 'failed') {
    console.log('  Details:', JSON.stringify(data, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 测试函数
// ============================================

async function test1_UserSignup() {
  console.log('\n[1/10] Testing User Signup...');
  
  try {
    const response = await makeRequest({
      path: '/api/auth/sign-up/email',
      method: 'POST'
    }, {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password,
      name: CONFIG.testUser.name
    });
    
    if (response.status === 200 || response.status === 201) {
      testContext.userId = response.body?.user?.id;
      logTest('User Signup', 'passed', `User created: ${CONFIG.testUser.email}`, {
        userId: testContext.userId
      });
    } else {
      logTest('User Signup', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('User Signup', 'failed', error.message);
  }
}

async function test2_UserSignin() {
  console.log('\n[2/10] Testing User Signin...');
  
  try {
    const response = await makeRequest({
      path: '/api/auth/sign-in/email',
      method: 'POST'
    }, {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password
    });
    
    if (response.status === 200) {
      testContext.userId = response.body?.user?.id;
      logTest('User Signin', 'passed', 'User signed in successfully', {
        userId: testContext.userId,
        cookiesReceived: cookies.length
      });
    } else {
      logTest('User Signin', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('User Signin', 'failed', error.message);
  }
}

async function test3_GetUserInfo() {
  console.log('\n[3/10] Testing Get User Info...');
  
  try {
    // 使用 POST 方法（Shipany 的 API 要求）
    const response = await makeRequest({
      path: '/api/user/get-user-info',
      method: 'POST'
    });
    
    if (response.status === 200) {
      const planType = response.body?.planType || 'free';
      logTest('Get User Info', 'passed', `User plan: ${planType}`, {
        planType,
        email: response.body?.email,
        hasVault: !!response.body?.vault
      });
    } else {
      logTest('Get User Info', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Get User Info', 'failed', error.message);
  }
}

async function test4_CreateVault() {
  console.log('\n[4/10] Testing Vault Creation...');
  
  try {
    // 生成加密参数
    const masterPassword = 'MasterPassword123!';
    testContext.masterPasswordHash = crypto
      .createHash('sha256')
      .update(masterPassword)
      .digest('hex');
    
    // 生成加密所需的参数
    const encryptionSalt = crypto.randomBytes(32).toString('hex');
    const encryptionIv = crypto.randomBytes(16).toString('hex');
    const recoveryBackupToken = crypto.randomBytes(32).toString('hex');
    const recoveryBackupSalt = crypto.randomBytes(32).toString('hex');
    const recoveryBackupIv = crypto.randomBytes(16).toString('hex');
    
    const response = await makeRequest({
      path: '/api/vault/create',
      method: 'POST'
    }, {
      encryptionSalt,
      encryptionIv,
      encryptionHint: 'Your master password hint',
      recoveryBackupToken,
      recoveryBackupSalt,
      recoveryBackupIv,
      heartbeatFrequency: 30,
      gracePeriod: 7
    });
    
    if (response.status === 200 || response.status === 201) {
      testContext.vaultId = response.body?.vaultId;
      logTest('Vault Creation', 'passed', 'Vault created successfully', {
        vaultId: testContext.vaultId
      });
    } else {
      logTest('Vault Creation', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Vault Creation', 'failed', error.message);
  }
}

async function test5_EncryptAndUploadFile() {
  console.log('\n[5/10] Testing File Encryption and Upload...');
  
  try {
    // 模拟文件加密
    const testData = {
      fileName: 'test-document.txt',
      content: 'This is a test document for Digital Heirloom',
      metadata: {
        createdAt: new Date().toISOString(),
        type: 'document'
      }
    };
    
    // 使用新的加密 API (createCipheriv)
    const key = crypto.scryptSync(testContext.masterPasswordHash, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(testData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 保存 IV 用于解密
    testContext.encryptedData = encrypted;
    testContext.encryptionIv = iv.toString('hex');
    
    const response = await makeRequest({
      path: '/api/vault/save',
      method: 'POST'
    }, {
      encryptedData: encrypted,
      dataType: 'document'
    });
    
    if (response.status === 200 || response.status === 201) {
      logTest('File Encryption & Upload', 'passed', 'File encrypted and uploaded', {
        dataSize: encrypted.length
      });
    } else {
      logTest('File Encryption & Upload', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('File Encryption & Upload', 'failed', error.message);
  }
}

async function test6_UpdateHeartbeat() {
  console.log('\n[6/10] Testing Heartbeat Update...');
  
  try {
    const response = await makeRequest({
      path: '/api/vault/heartbeat',
      method: 'POST'
    }, {
      timestamp: new Date().toISOString()
    });
    
    if (response.status === 200) {
      logTest('Heartbeat Update', 'passed', 'Heartbeat updated successfully');
    } else {
      logTest('Heartbeat Update', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Heartbeat Update', 'failed', error.message);
  }
}

async function test7_AddBeneficiary() {
  console.log('\n[7/10] Testing Add Beneficiary...');
  
  try {
    const response = await makeRequest({
      path: '/api/beneficiary',
      method: 'POST'
    }, {
      email: CONFIG.beneficiary.email,
      name: CONFIG.beneficiary.name,
      relationship: 'family',
      sharePercentage: 100
    });
    
    if (response.status === 200 || response.status === 201) {
      testContext.beneficiaryId = response.body?.beneficiary?.id;
      logTest('Add Beneficiary', 'passed', 'Beneficiary added successfully', {
        beneficiaryId: testContext.beneficiaryId,
        email: CONFIG.beneficiary.email
      });
    } else {
      logTest('Add Beneficiary', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Add Beneficiary', 'failed', error.message);
  }
}

async function test8_UpdateBeneficiary() {
  console.log('\n[8/10] Testing Update Beneficiary...');
  
  if (!testContext.beneficiaryId) {
    logTest('Update Beneficiary', 'skipped', 'No beneficiary ID available');
    return;
  }
  
  try {
    const response = await makeRequest({
      path: `/api/beneficiary/${testContext.beneficiaryId}`,
      method: 'PUT'
    }, {
      name: 'Updated Beneficiary Name',
      relationship: 'friend'
    });
    
    if (response.status === 200) {
      logTest('Update Beneficiary', 'passed', 'Beneficiary updated successfully');
    } else {
      logTest('Update Beneficiary', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Update Beneficiary', 'failed', error.message);
  }
}

async function test9_DataDecryption() {
  console.log('\n[9/10] Testing Data Decryption...');
  
  try {
    if (!testContext.encryptedData || !testContext.encryptionIv) {
      logTest('Data Decryption', 'skipped', 'No encrypted data available');
      return;
    }
    
    // 模拟受益人解密
    const key = crypto.scryptSync(testContext.masterPasswordHash, 'salt', 32);
    const iv = Buffer.from(testContext.encryptionIv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(testContext.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    if (data.fileName && data.content) {
      logTest('Data Decryption', 'passed', 'Data decrypted successfully', {
        fileName: data.fileName,
        contentLength: data.content.length
      });
    } else {
      logTest('Data Decryption', 'failed', 'Decrypted data is invalid');
    }
  } catch (error) {
    logTest('Data Decryption', 'failed', error.message);
  }
}

async function test10_CronEndpoint() {
  console.log('\n[10/10] Testing Unified Cron Endpoint...');
  
  try {
    const response = await makeRequest({
      path: '/api/cron/unified-check',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer d42281902beb7caf7619821c9975581b8d8ab87df6b3ece81e21910538ae2a48'
      }
    });
    
    if (response.status === 200) {
      const summary = response.body?.summary || {};
      logTest('Unified Cron Endpoint', 'passed', `Executed ${summary.success || 0}/${summary.total || 0} checks`, {
        summary
      });
    } else {
      logTest('Unified Cron Endpoint', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Unified Cron Endpoint', 'failed', error.message);
  }
}

// ============================================
// 主测试流程
// ============================================

async function runAllTests() {
  console.log('========================================');
  console.log('Digital Heirloom E2E Test Suite v2.0');
  console.log('========================================');
  console.log(`Environment: ${CONFIG.useLocal ? 'Local' : 'Production'}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${CONFIG.testUser.email}`);
  console.log(`Beneficiary: ${CONFIG.beneficiary.email}`);
  console.log('========================================\n');
  
  try {
    await test1_UserSignup();
    await sleep(500);
    
    await test2_UserSignin();
    await sleep(500);
    
    await test3_GetUserInfo();
    await sleep(500);
    
    await test4_CreateVault();
    await sleep(500);
    
    await test5_EncryptAndUploadFile();
    await sleep(500);
    
    await test6_UpdateHeartbeat();
    await sleep(500);
    
    await test7_AddBeneficiary();
    await sleep(500);
    
    await test8_UpdateBeneficiary();
    await sleep(500);
    
    await test9_DataDecryption();
    await sleep(500);
    
    await test10_CronEndpoint();
    
  } catch (error) {
    console.error('\n\x1b[31mFatal Error:\x1b[0m', error.message);
  }
  
  // 输出测试报告
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`\x1b[32mPassed: ${testResults.summary.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${testResults.summary.failed}\x1b[0m`);
  console.log(`\x1b[33mSkipped: ${testResults.summary.skipped}\x1b[0m`);
  
  const passRate = testResults.summary.total > 0 
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)
    : 0;
  console.log(`Pass Rate: ${passRate}%`);
  console.log('========================================\n');
  
  // 保存测试报告
  const fs = require('fs');
  const reportPath = `./TEST_E2E_REPORT_V2_${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`Test report saved to: ${reportPath}\n`);
  
  // 返回退出码
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests();

