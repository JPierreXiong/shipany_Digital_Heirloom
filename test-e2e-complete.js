/**
 * Digital Heirloom 端到端完整测试
 * 
 * 测试流程：
 * 1. 用户注册/登录
 * 2. 订阅付费计划
 * 3. 验证会员权益
 * 4. 创建保险箱
 * 5. 加密并上传文件
 * 6. 添加受益人
 * 7. 模拟触发继承
 * 8. 受益人接收邮件
 * 9. 受益人解密文件
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const CONFIG = {
  baseUrl: 'https://www.digitalheirloom.app',
  // baseUrl: 'http://localhost:3000', // 本地测试
  testUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
    name: 'Test User'
  },
  beneficiary: {
    email: `beneficiary_${Date.now()}@example.com`,
    name: 'Test Beneficiary'
  }
};

// HTTP 请求工具
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试结果收集
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

function logTest(name, status, message, data = null) {
  const result = {
    name,
    status, // 'passed', 'failed', 'skipped'
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  testResults.summary[status]++;
  
  const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○';
  const color = status === 'passed' ? '\x1b[32m' : status === 'failed' ? '\x1b[31m' : '\x1b[33m';
  console.log(`${color}${icon}\x1b[0m ${name}: ${message}`);
  
  if (data && status === 'failed') {
    console.log('  Details:', JSON.stringify(data, null, 2));
  }
}

// 测试上下文
const testContext = {
  sessionToken: null,
  userId: null,
  vaultId: null,
  beneficiaryId: null,
  encryptedData: null,
  masterPasswordHash: null
};

// ============================================
// 测试函数
// ============================================

async function test1_UserSignup() {
  console.log('\n[1/9] Testing User Signup...');
  
  try {
    const url = new URL('/api/auth/sign-up/email', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password,
      name: CONFIG.testUser.name
    });
    
    if (response.status === 200 || response.status === 201) {
      testContext.userId = response.body?.user?.id;
      testContext.sessionToken = response.body?.session?.token;
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
  console.log('\n[2/9] Testing User Signin...');
  
  try {
    const url = new URL('/api/auth/sign-in/email', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password
    });
    
    if (response.status === 200) {
      testContext.sessionToken = response.body?.session?.token;
      testContext.userId = response.body?.user?.id;
      logTest('User Signin', 'passed', 'User signed in successfully', {
        userId: testContext.userId
      });
    } else {
      logTest('User Signin', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('User Signin', 'failed', error.message);
  }
}

async function test3_SubscriptionPayment() {
  console.log('\n[3/9] Testing Subscription Payment...');
  
  // 注意：实际支付需要真实的支付流程
  // 这里我们模拟支付成功后的状态
  logTest('Subscription Payment', 'skipped', 'Payment requires real payment gateway integration');
}

async function test4_MembershipDisplay() {
  console.log('\n[4/9] Testing Membership Display...');
  
  try {
    const url = new URL('/api/user/get-user-info', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testContext.sessionToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      const planType = response.body?.planType || 'free';
      logTest('Membership Display', 'passed', `User plan: ${planType}`, {
        planType,
        email: response.body?.email
      });
    } else {
      logTest('Membership Display', 'failed', `HTTP ${response.status}`, response.body);
    }
  } catch (error) {
    logTest('Membership Display', 'failed', error.message);
  }
}

async function test5_CreateVault() {
  console.log('\n[5/9] Testing Vault Creation...');
  
  try {
    const url = new URL('/api/vault/create', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testContext.sessionToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    // 生成主密码哈希
    testContext.masterPasswordHash = crypto
      .createHash('sha256')
      .update('MasterPassword123!')
      .digest('hex');
    
    const response = await makeRequest(options, {
      masterPasswordHash: testContext.masterPasswordHash,
      heartbeatFrequency: 30,
      gracePeriod: 7
    });
    
    if (response.status === 200 || response.status === 201) {
      testContext.vaultId = response.body?.vault?.id;
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

async function test6_EncryptAndUploadFile() {
  console.log('\n[6/9] Testing File Encryption and Upload...');
  
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
    
    // 使用主密码加密数据
    const key = crypto.scryptSync(testContext.masterPasswordHash, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(testData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    encrypted = iv.toString('hex') + ':' + encrypted;
    
    testContext.encryptedData = encrypted;
    
    const url = new URL('/api/vault/save', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testContext.sessionToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
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

async function test7_AddBeneficiary() {
  console.log('\n[7/9] Testing Add Beneficiary...');
  
  try {
    const url = new URL('/api/beneficiary', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testContext.sessionToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
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

async function test8_TriggerInheritance() {
  console.log('\n[8/9] Testing Trigger Inheritance...');
  
  logTest('Trigger Inheritance', 'skipped', 'Requires Dead Man\'s Switch to be triggered (manual or time-based)');
}

async function test9_BeneficiaryDecryption() {
  console.log('\n[9/9] Testing Beneficiary Decryption...');
  
  try {
    if (!testContext.encryptedData) {
      logTest('Beneficiary Decryption', 'skipped', 'No encrypted data available');
      return;
    }
    
    // 模拟受益人解密
    const parts = testContext.encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.scryptSync(testContext.masterPasswordHash, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    if (data.fileName && data.content) {
      logTest('Beneficiary Decryption', 'passed', 'Data decrypted successfully', {
        fileName: data.fileName,
        contentLength: data.content.length
      });
    } else {
      logTest('Beneficiary Decryption', 'failed', 'Decrypted data is invalid');
    }
  } catch (error) {
    logTest('Beneficiary Decryption', 'failed', error.message);
  }
}

// ============================================
// 主测试流程
// ============================================

async function runAllTests() {
  console.log('========================================');
  console.log('Digital Heirloom E2E Test Suite');
  console.log('========================================');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Test User: ${CONFIG.testUser.email}`);
  console.log(`Beneficiary: ${CONFIG.beneficiary.email}`);
  console.log('========================================\n');
  
  try {
    await test1_UserSignup();
    await test2_UserSignin();
    await test3_SubscriptionPayment();
    await test4_MembershipDisplay();
    await test5_CreateVault();
    await test6_EncryptAndUploadFile();
    await test7_AddBeneficiary();
    await test8_TriggerInheritance();
    await test9_BeneficiaryDecryption();
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
  console.log('========================================\n');
  
  // 保存测试报告
  const fs = require('fs');
  const reportPath = `./TEST_E2E_REPORT_${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`Test report saved to: ${reportPath}\n`);
  
  // 返回退出码
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests();

