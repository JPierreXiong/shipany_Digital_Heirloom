// 检查环境变量配置
require('dotenv').config({path: '.env.production'});

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       Vercel 环境变量配置检查                           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const required = [
  { key: 'DATABASE_URL', desc: '数据库连接' },
  { key: 'AUTH_SECRET', desc: 'Better-Auth 密钥' },
  { key: 'AUTH_URL', desc: 'Better-Auth URL' },
  { key: 'CRON_SECRET', desc: 'Cron 任务密钥' },
  { key: 'RESEND_API_KEY', desc: 'Resend 邮件 API' },
  { key: 'RESEND_DEFAULT_FROM', desc: 'Resend 发件人' },
  { key: 'CREEM_API_KEY', desc: 'Creem 支付 API' },
  { key: 'CREEM_SIGNING_SECRET', desc: 'Creem Webhook 密钥' },
  { key: 'CREEM_PRODUCT_IDS', desc: 'Creem 产品 ID' },
];

const optional = [
  { key: 'VERCEL_CRON_SECRET', desc: 'Vercel Cron 密钥' },
  { key: 'QSTASH_TOKEN', desc: 'QStash Token' },
  { key: 'SHIPANY_API_KEY', desc: 'Shipany 物流 API' },
  { key: 'SHIPANY_API_URL', desc: 'Shipany API URL' },
];

console.log('【必需的环境变量】\n');
let missingRequired = [];
required.forEach(({key, desc}) => {
  const value = process.env[key];
  if (value) {
    console.log(`   ✅ ${key}`);
    console.log(`      ${desc}: 已配置`);
  } else {
    console.log(`   ❌ ${key}`);
    console.log(`      ${desc}: 未配置`);
    missingRequired.push(key);
  }
});

console.log('\n【可选的环境变量】\n');
optional.forEach(({key, desc}) => {
  const value = process.env[key];
  if (value) {
    console.log(`   ✅ ${key}`);
    console.log(`      ${desc}: 已配置`);
  } else {
    console.log(`   ⚠️  ${key}`);
    console.log(`      ${desc}: 未配置`);
  }
});

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       检查结果                                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

if (missingRequired.length === 0) {
  console.log('   ✅ 所有必需的环境变量都已配置！\n');
  console.log('   系统已就绪，可以运行测试。\n');
} else {
  console.log(`   ❌ 缺少 ${missingRequired.length} 个必需的环境变量:\n`);
  missingRequired.forEach(key => {
    console.log(`      - ${key}`);
  });
  console.log('\n   请使用以下命令添加:\n');
  missingRequired.forEach(key => {
    console.log(`   vercel env add ${key}`);
  });
  console.log('');
}

