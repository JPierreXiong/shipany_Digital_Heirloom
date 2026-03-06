# 数据库和存储架构分析报告

## 📊 数据存储架构总览

### 数据库：Supabase (PostgreSQL)
- **用途**: 存储所有结构化数据和元数据
- **连接**: Drizzle ORM
- **提供商**: Supabase

### 文件存储：Vercel Blob
- **用途**: 存储大文件（加密文件、图片、视频等）
- **提供商**: Vercel Blob Storage
- **备选**: Cloudflare R2, AWS S3

---

## 🗄️ 数据存储分布详解

### 1. 存储在数据库（Supabase PostgreSQL）

#### 1.1 用户认证数据
- ✅ `user` - 用户基本信息（邮箱、姓名、计划类型）
- ✅ `session` - 登录会话
- ✅ `account` - OAuth 账号关联
- ✅ `verification` - 验证码（密码重置、邮箱验证）

#### 1.2 会员和支付数据
- ✅ `order` - 订单记录
- ✅ `subscription` - 订阅记录
- ✅ `credit` - 积分记录

#### 1.3 Digital Heirloom 核心数据

**🔐 加密数据（存储在数据库）**:
```typescript
digitalVaults 表：
- encryptedData: text        // ⚠️ 加密后的 JSON 字符串（存储在数据库）
- encryptionSalt: text        // 加密盐值
- encryptionIv: text          // 加密初始向量
- encryptionHint: text        // 密码提示
- recoveryBackupToken: text   // 恢复包（加密的主密码）
- recoveryBackupSalt: text    // 恢复包盐值
- recoveryBackupIv: text      // 恢复包 IV
```

**📋 元数据（存储在数据库）**:
```typescript
digitalVaults 表：
- userId, status, planLevel
- heartbeatFrequency, gracePeriod
- lastSeenAt, deadManSwitchEnabled
- currentPeriodEnd, bonusDays
- warningEmailSentAt, reminderEmailSentAt
```

**👥 受益人数据（存储在数据库）**:
```typescript
beneficiaries 表：
- name, email, relationship, language
- releaseToken, releaseTokenExpiresAt
- decryptionCount, decryptionLimit
- decryptionHistory (JSONB)
- physicalAssetPhotoUrl        // ⚠️ 指向 Blob 的 URL
```

**📝 日志数据（存储在数据库）**:
- ✅ `heartbeatLogs` - 心跳记录
- ✅ `deadManSwitchEvents` - DMS 事件日志
- ✅ `emailNotifications` - 邮件发送记录
- ✅ `adminAuditLogs` - 管理员操作审计
- ✅ `systemAlerts` - 系统报警记录
- ✅ `shippingLogs` - 物流记录

---

### 2. 存储在 Blob Storage（Vercel Blob）

#### 2.1 加密文件（通过 API 上传）
```
路径格式: {vaultId}/{fileId}.enc
示例: abc123/file_xyz789.enc

存储内容:
- 加密后的文件内容（二进制）
- 由客户端加密后上传
- 服务器不解密，只存储
```

#### 2.2 物理资产照片（Pro 用户）
```
路径格式: physical-assets/{vaultId}/{assetId}.jpg
示例: physical-assets/abc123/photo_xyz789.jpg

存储内容:
- 物理资产照片（U盘、信件等）
- 用于管理员审核物流请求
```

#### 2.3 用户头像（可选）
```
路径格式: avatars/{userId}.jpg
示例: avatars/user_abc123.jpg
```

---

## 🔍 关键发现

### ⚠️ 问题 1: 加密数据存储位置不一致

**当前状态**:
- `digitalVaults.encryptedData` 存储在**数据库**（text 字段）
- 适合小文本数据（< 10KB）
- **不适合大文件**（如视频、大量照片）

**设计意图**:
- 代码中有 `vault_assets` 表的引用（`src/app/api/digital-heirloom/assets/upload/route.ts`）
- 但 `schema.ts` 中**没有定义** `vault_assets` 表
- 说明文件上传功能**未完全实现**

**建议**:
1. 小文本数据（< 10KB）→ 存储在 `digitalVaults.encryptedData`
2. 大文件（> 10KB）→ 存储在 Vercel Blob，数据库只存储 URL

---

### ⚠️ 问题 2: vault_assets 表缺失

**代码引用**:
```typescript
// src/app/api/digital-heirloom/assets/upload/route.ts
const { data: assetData, error: dbError } = await supabase
  .from('vault_assets')  // ⚠️ 表不存在
  .insert({ ... })
```

**影响**:
- 文件上传 API 会失败
- 无法存储文件元数据

**修复方案**:
需要在 `schema.ts` 中添加 `vault_assets` 表定义

---

## 📋 完整的数据流

### 场景 1: 用户上传加密文本（< 10KB）

```
客户端:
1. 用户输入文本（密码、账号等）
2. 使用主密码加密（AES-256-GCM）
3. 调用 API: POST /api/vault/save

服务器:
4. 保存到 digitalVaults.encryptedData (数据库)
5. 同时保存 salt, iv, hint

存储位置: ✅ Supabase 数据库
```

### 场景 2: 用户上传加密文件（> 10KB）

```
客户端:
1. 用户选择文件（照片、视频等）
2. 使用主密码加密（AES-256-GCM）
3. 调用 API: POST /api/digital-heirloom/assets/blob-upload

服务器:
4. 上传到 Vercel Blob
5. 获取 Blob URL
6. 保存元数据到 vault_assets 表（⚠️ 表缺失）

存储位置: ✅ Vercel Blob + 数据库元数据
```

### 场景 3: 受益人解密

```
客户端:
1. 受益人输入 Release Token
2. 输入主密码或助记词

服务器:
3. 验证 Token
4. 从数据库读取 encryptedData
5. 返回给客户端

客户端:
6. 使用主密码解密
7. 显示明文内容

数据流: ✅ 数据库 → 客户端解密
```

---

## 🔧 存储配置

### Vercel Blob 配置

**环境变量**:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

**优先级**:
1. Vercel Blob（如果配置了 BLOB_READ_WRITE_TOKEN）
2. Cloudflare R2（如果配置了 R2 凭证）
3. AWS S3（如果配置了 S3 凭证）

**代码位置**: `src/shared/services/storage.ts`

---

## 📊 存储容量规划

### Free 用户
- 数据库: 10KB 文本数据
- Blob: 0 MB（不支持文件上传）
- 总计: **10KB**

### Base 用户
- 数据库: 10KB 文本数据
- Blob: 50MB 加密文件
- 总计: **50MB**

### Pro 用户
- 数据库: 10KB 文本数据
- Blob: 2GB 加密文件
- 总计: **2GB**

---

## 🧪 测试建议

### 测试 1: 数据库连接测试
```bash
# 测试 Supabase 连接
node test-database-connection.js
```

### 测试 2: Blob 存储测试
```bash
# 测试 Vercel Blob 上传
node test-blob-storage.js
```

### 测试 3: 完整支付流程测试
```bash
# 测试支付 → 权益激活 → 存储限制
node test-payment-flow.js
```

---

## 🔐 安全性分析

### ✅ 优点

1. **零知识架构**
   - 数据在客户端加密
   - 服务器不存储明文密码
   - 服务器不能解密用户数据

2. **加密参数分离**
   - Salt 和 IV 随机生成
   - 每次加密结果不同
   - 防止彩虹表攻击

3. **Blob 存储隔离**
   - 文件存储在 Blob（不在数据库）
   - 减少数据库负载
   - 提高查询性能

### ⚠️ 风险

1. **encryptedData 存储在数据库**
   - 如果数据库泄露，加密数据也泄露
   - 建议: 敏感数据也存储在 Blob

2. **Blob URL 公开**
   - Vercel Blob 默认 URL 是公开的
   - 但文件已加密，无法直接读取
   - 建议: 使用 Presigned URL（有效期限制）

3. **vault_assets 表缺失**
   - 文件上传功能不完整
   - 需要补充表定义

---

## 📝 总结

### 数据存储分布

| 数据类型 | 存储位置 | 大小限制 | 加密状态 |
|---------|---------|---------|---------|
| 用户信息 | Supabase | - | 明文 |
| 订单/订阅 | Supabase | - | 明文 |
| 加密文本 | Supabase | 10KB | 加密 |
| 加密文件 | Vercel Blob | 2GB | 加密 |
| 物理资产照片 | Vercel Blob | 10MB | 明文 |
| 日志记录 | Supabase | - | 明文 |

### 待修复问题

1. ⚠️ **vault_assets 表缺失** - 需要添加到 schema.ts
2. ⚠️ **文件上传 API 不完整** - 需要完善 blob-upload 逻辑
3. ⚠️ **存储限制检查缺失** - 需要在上传时检查套餐限制

### 下一步行动

1. 添加 `vault_assets` 表定义
2. 完善文件上传 API
3. 运行数据库连接测试
4. 运行 Blob 存储测试
5. 运行完整支付流程测试


