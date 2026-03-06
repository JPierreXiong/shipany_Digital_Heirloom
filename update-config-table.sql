-- ============================================
-- 补充 config 表配置
-- 执行位置: Supabase SQL Editor
-- ============================================

-- 插入应用基础配置
INSERT INTO config (name, value) VALUES
  ('app_name', 'Digital Heirloom'),
  ('app_url', 'https://shipany-digital-heirloom.vercel.app'),
  ('default_locale', 'en'),
  
  -- 支付配置
  ('default_payment_provider', 'creem'),
  ('select_payment_enabled', 'true'),
  
  -- Creem 配置（从环境变量读取，这里只是占位）
  ('creem_enabled', 'true'),
  
  -- Stripe 配置
  ('stripe_enabled', 'false'),
  
  -- PayPal 配置
  ('paypal_enabled', 'false'),
  
  -- 存储配置
  ('storage_provider', 'vercel-blob'),
  
  -- 分析配置
  ('vercel_analytics_enabled', 'true')
  
ON CONFLICT (name) DO UPDATE SET
  value = EXCLUDED.value;

-- 验证插入结果
SELECT name, value FROM config ORDER BY name;

