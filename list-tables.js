// 查询数据库表名
require('dotenv').config({path: '.env.production'});
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function listTables() {
  try {
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    
    console.log('数据库中的表:');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    
    await sql.end();
  } catch (error) {
    console.error('错误:', error);
    await sql.end();
  }
}

listTables();

