// 测试 billing 和 payments 页面
const BASE_URL = 'http://localhost:3000';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       Billing & Payments 页面测试                       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testBillingPage() {
  console.log('【测试 1】访问 Billing 页面...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/settings/billing`);
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log('   ✅ Billing 页面加载成功');
      console.log(`   页面大小: ${html.length} 字节\n`);
    } else {
      const text = await response.text();
      console.log('   ❌ Billing 页面加载失败');
      console.log(`   错误: ${text.substring(0, 200)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }
}

async function testPaymentsPage() {
  console.log('【测试 2】访问 Payments 页面...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/settings/payments`);
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log('   ✅ Payments 页面加载成功');
      console.log(`   页面大小: ${html.length} 字节\n`);
    } else {
      const text = await response.text();
      console.log('   ❌ Payments 页面加载失败');
      console.log(`   错误: ${text.substring(0, 200)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }
}

async function testProfilePage() {
  console.log('【测试 3】访问 Profile 页面（对比）...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/settings/profile`);
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log('   ✅ Profile 页面加载成功');
      console.log(`   页面大小: ${html.length} 字节\n`);
    } else {
      const text = await response.text();
      console.log('   ❌ Profile 页面加载失败');
      console.log(`   错误: ${text.substring(0, 200)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }
}

async function runTests() {
  await testBillingPage();
  await testPaymentsPage();
  await testProfilePage();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       测试完成                                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);

