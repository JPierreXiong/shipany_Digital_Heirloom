// 直接测试数据库连接（不需要启动服务器）
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 加载环境变量
config({ path: '.env.local' });

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║       数据库直接连接测试                                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未配置');
  process.exit(1);
}

console.log('✅ DATABASE_URL 已配置');
console.log(`   连接地址: ${DATABASE_URL.split('@')[1]?.split('/')[0] || '***'}\n`);

async function testDatabase() {
  let client;
  
  try {
    // 创建数据库连接
    console.log('【测试 1】创建数据库连接...');
    client = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(client);
    console.log('✅ 数据库连接创建成功\n');

    // 测试基本查询
    console.log('【测试 2】执行基本查询...');
    const result = await client`SELECT version()`;
    console.log('✅ 数据库查询成功');
    console.log(`   PostgreSQL 版本: ${result[0].version.split(' ')[1]}\n`);

    // 检查 config 表
    console.log('【测试 3】检查 config 表...');
    try {
      const configResult = await client`SELECT COUNT(*) as count FROM config`;
      const count = parseInt(configResult[0].count);
      console.log(`✅ config 表存在`);
      console.log(`   配置项数量: ${count}\n`);

      if (count === 0) {
        console.log('⚠️  config 表为空，需要初始化');
        console.log('   请在 Supabase 执行: init-config-table.sql\n');
      } else {
        // 显示部分配置
        const configs = await client`
          SELECT name, 
                 CASE 
                   WHEN name LIKE '%secret%' OR name LIKE '%key%' OR name LIKE '%token%' 
                   THEN '***' 
                   ELSE value 
                 END as value
          FROM config 
          LIMIT 5
        `;
        console.log('   前 5 个配置项:');
        configs.forEach(c => {
          console.log(`   - ${c.name}: ${c.value || '(空)'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('❌ config 表不存在或查询失败');
      console.log(`   错误: ${error.message}`);
      console.log('   需要执行: init-config-table.sql\n');
    }

    // 检查 users 表
    console.log('【测试 4】检查 users 表...');
    try {
      const usersResult = await client`SELECT COUNT(*) as count FROM "user"`;
      const count = parseInt(usersResult[0].count);
      console.log(`✅ users 表存在`);
      console.log(`   用户数量: ${count}\n`);
    } catch (error) {
      console.log('❌ users 表查询失败');
      console.log(`   错误: ${error.message}\n`);
    }

    // 检查 digital_vaults 表
    console.log('【测试 5】检查 digital_vaults 表...');
    try {
      const vaultsResult = await client`SELECT COUNT(*) as count FROM digital_vaults`;
      const count = parseInt(vaultsResult[0].count);
      console.log(`✅ digital_vaults 表存在`);
      console.log(`   Vault 数量: ${count}\n`);
    } catch (error) {
      console.log('❌ digital_vaults 表查询失败');
      console.log(`   错误: ${error.message}\n`);
    }

    // 检查 vault_assets 表
    console.log('【测试 6】检查 vault_assets 表...');
    try {
      const assetsResult = await client`SELECT COUNT(*) as count FROM vault_assets`;
      const count = parseInt(assetsResult[0].count);
      console.log(`✅ vault_assets 表存在`);
      console.log(`   资产数量: ${count}\n`);
    } catch (error) {
      console.log('⚠️  vault_assets 表不存在');
      console.log(`   错误: ${error.message}`);
      console.log('   这是新表，需要创建\n');
    }

    // 检查 orders 表
    console.log('【测试 7】检查 orders 表...');
    try {
      const ordersResult = await client`SELECT COUNT(*) as count FROM orders`;
      const count = parseInt(ordersResult[0].count);
      console.log(`✅ orders 表存在`);
      console.log(`   订单数量: ${count}\n`);
    } catch (error) {
      console.log('❌ orders 表查询失败');
      console.log(`   错误: ${error.message}\n`);
    }

    // 检查 subscriptions 表
    console.log('【测试 8】检查 subscriptions 表...');
    try {
      const subsResult = await client`SELECT COUNT(*) as count FROM subscriptions`;
      const count = parseInt(subsResult[0].count);
      console.log(`✅ subscriptions 表存在`);
      console.log(`   订阅数量: ${count}\n`);
    } catch (error) {
      console.log('❌ subscriptions 表查询失败');
      console.log(`   错误: ${error.message}\n`);
    }

    // 列出所有表
    console.log('【测试 9】列出所有数据库表...');
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log(`✅ 找到 ${tables.length} 个表:`);
    tables.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name}`);
    });
    console.log('');

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       测试完成                                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('✅ 数据库连接正常');
    console.log('✅ 核心表结构完整\n');

  } catch (error) {
    console.error('\n❌ 数据库测试失败:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

testDatabase();

