// 支付逻辑测试脚本
import { 
  getPlanLevelFromProductId, 
  isLifetimeProduct, 
  calculateLifetimeEndDate,
  getProductInfo 
} from './src/shared/services/plan-sync.js';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       支付产品配置测试                                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const products = [
  {
    id: 'prod_4oN2BFtSPSpAnYcvUN0uoi',
    name: 'Base (Annual)',
    price: '$49',
    type: '年费订阅',
  },
  {
    id: 'prod_4epepOcgUjSjPoWmAnBaFt',
    name: 'Pro (Annual)',
    price: '$149',
    type: '年费订阅',
  },
  {
    id: 'prod_7TTyBF8uPUAGrNJ5tK8sJW',
    name: 'Lifetime Base',
    price: '$299',
    type: '终身买断',
  },
  {
    id: 'prod_66sZAZLqySq4Rixu7XgYYh',
    name: 'Lifetime Pro',
    price: '$499',
    type: '终身买断',
  },
];

console.log('【产品配置】\n');

products.forEach((product, index) => {
  const planLevel = getPlanLevelFromProductId(product.id);
  const isLifetime = isLifetimeProduct(product.id);
  const info = getProductInfo(product.id);
  
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   产品 ID: ${product.id}`);
  console.log(`   价格: ${product.price}`);
  console.log(`   类型: ${product.type}`);
  console.log(`   计划等级: ${planLevel}`);
  console.log(`   是否终身: ${isLifetime ? '是' : '否'}`);
  console.log(`   有效期: ${info.duration}`);
  console.log('');
});

console.log('【支付处理逻辑】\n');

console.log('1️⃣ 年费订阅（Annual Subscription）');
console.log('   - Base: $49/year (prod_4oN2BFtSPSpAnYcvUN0uoi)');
console.log('   - Pro: $149/year (prod_4epepOcgUjSjPoWmAnBaFt)');
console.log('   - 处理方式: 使用订阅信息中的 currentPeriodEnd');
console.log('   - 有效期: 1年（从支付日期开始）');
console.log('   - 续费: 每年自动续费\n');

console.log('2️⃣ 终身买断（Lifetime Purchase）');
console.log('   - Lifetime Base: $299 (prod_7TTyBF8uPUAGrNJ5tK8sJW)');
console.log('   - Lifetime Pro: $499 (prod_66sZAZLqySq4Rixu7XgYYh)');
console.log('   - 处理方式: 设置为 100 年后');
console.log('   - 有效期: 100年+（实际上是永久）');
console.log('   - 续费: 无需续费\n');

const lifetimeEnd = calculateLifetimeEndDate();
console.log(`【终身买断有效期示例】`);
console.log(`   当前时间: ${new Date().toISOString()}`);
console.log(`   有效期至: ${lifetimeEnd.toISOString()}`);
console.log(`   有效年数: 100 年\n`);

console.log('【支付成功后的处理流程】\n');

console.log('✅ 年费订阅支付成功:');
console.log('   1. 创建订单记录（paymentType: SUBSCRIPTION）');
console.log('   2. 创建订阅记录（subscription 表）');
console.log('   3. 更新 Vault: planLevel = base/pro');
console.log('   4. 更新 Vault: currentPeriodEnd = 订阅的 currentPeriodEnd');
console.log('   5. 更新 Vault: status = active\n');

console.log('✅ 终身买断支付成功:');
console.log('   1. 创建订单记录（paymentType: ONE_TIME）');
console.log('   2. 不创建订阅记录（一次性购买）');
console.log('   3. 更新 Vault: planLevel = base/pro');
console.log('   4. 更新 Vault: currentPeriodEnd = 100年后');
console.log('   5. 更新 Vault: status = active\n');

console.log('【Creem 产品链接】\n');
console.log('年费订阅:');
console.log('  Base: https://www.creem.io/payment/prod_4oN2BFtSPSpAnYcvUN0uoi');
console.log('  Pro:  https://www.creem.io/payment/prod_4epepOcgUjSjPoWmAnBaFt\n');

console.log('终身买断:');
console.log('  Lifetime Base: https://www.creem.io/payment/prod_7TTyBF8uPUAGrNJ5tK8sJW');
console.log('  Lifetime Pro:  https://www.creem.io/payment/prod_66sZAZLqySq4Rixu7XgYYh\n');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║       配置验证完成                                      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

