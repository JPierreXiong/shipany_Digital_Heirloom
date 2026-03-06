# 数据库和存储架构分析 - 最终报告

## 📊 执行摘要

**分析日期**: 2026-03-06  
**分析范围**: Supabase 数据库连接、Vercel Blob 存储、数据分布、测试脚本  
**Git 提交**: 8f81eec

---

## 🗄️ 数据存储架构

### 数据库：Supabase (PostgreSQL)
- **连接方式**: Drizzle ORM
- **环境变量**: `DATABASE_URL`
- **用途**: 存储所有结构化数据和元数据

### 文件存储：Vercel Blob
- **连接方式**: `@vercel/blob` SDK
- **环境变量**: `BLOB_READ_WRITE_TOKEN`
- **用途**: 存储大文件（加密文件、图片、视频）

---

## 📋 数据存储分布详解

### 1. 存储在数据库（Supabase）

#### ✅ 用户和认证数据
```
user 表：
- 用户基本信息（邮箱、姓名、头像）
- 计划类型（planType: free/base/pro）
- 签到记录（lastCheckinDate）

session 表：
- 登录会话（token, expiresAt）

account 表：
- OAuth 账号关联（Google, GitHub）

verification 表：
- 验证码（密码重置、邮箱验证）
```

#### ✅ 支付和订阅数据
```
order 表：
- 订单记录（orderNo, amount, status）
- 支付信息（paymentProvider, paidAt）
- 产品信息（productId, planName）

subscription 表：
- 订阅记录（subscriptionNo, status）
- 周期信息（currentPeriodStart, currentPeriodEnd）
- 计划信息（planType, planName）

credit 表：
- 积分记录（credits, remainingCredits）
```

#### ✅ Digital Heirloom 核心数据

**🔐 加密数据（存储在数据库）**:
```typescript
digitalVaults 表：
- encryptedData: text        // ⚠️ 加密后的 JSON 字符串
- encryptionSalt: text        // 加密盐值（Base64）
- encryptionIv: text          // 加密初始向量（Base64）
- encryptionHint: text        // 密码提示
- recoveryBackupToken: text   // 恢复包（加密的主密码）
- recoveryBackupSalt: text    // 恢复包盐值
- recoveryBackupIv: text      // 恢复包 IV

适用场景：
✅ 小文本数据（< 10KB）- 密码、账号、笔记
❌ 大文件（> 10KB）- 照片、视频、文档
```

**📋 元数据（存储在数据库）**:
```typescript
digitalVaults 表：
- userId, status, planLevel
- heartbeatFrequency, gracePeriod
- lastSeenAt, deadManSwitchEnabled
- currentPeriodEnd, bonusDays
- warningEmailSentAt, reminderEmailSentAt

beneficiaries 表：
- name, email, relationship, language
- releaseToken, releaseTokenExpiresAt
- decryptionCount, decryptionLimit
- decryptionHistory (JSONB)
- physicalAssetPhotoUrl        // ⚠️ 指向 Blob 的 URL

heartbeatLogs 表：
- vaultId, userId, checkinDate

deadManSwitchEvents 表：
- vaultId, eventType, eventData

emailNotifications 表：
- vaultId, recipientEmail, emailType, status

adminAuditLogs 表：
- adminId, actionType, vaultId, actionData

systemAlerts 表：
- level, type, category, message, alertData

shippingLogs 表：
- vaultId, beneficiaryId, status
- receiverName, addressLine1, trackingNumber
```

---

### 2. 存储在 Blob Storage（Vercel Blob）

#### ✅ 加密文件（客户端加密后上传）
```
路径格式: {vaultId}/{fileId}.enc
示例: abc123/file_xyz789.enc

存储内容:
- 加密后的文件内容（二进制）
- 由客户端使用主密码加密
- 服务器不解密，只存储

文件类型:
- 照片（.jpg, .png）
- 视频（.mp4, .mov）
- 文档（.pdf, .docx）
- 其他文件
```

#### ✅ 物理资产照片（Pro 用户）
```
路径格式: physical-assets/{vaultId}/{assetId}.jpg
示例: physical-assets/abc123/photo_xyz789.jpg

存储内容:
- 物理资产照片（U盘、信件等）
- 用于管理员审核物流请求
- 明文存储（非敏感信息）
```

#### ✅ 用户头像（可选）
```
路径格式: avatars/{userId}.jpg
示例: avatars/user_abc123.jpg
```

---

## ⚠️ 关键发现

### 问题 1: vault_assets 表缺失

**现状**:
- 代码中引用了 `vault_assets` 表（`src/app/api/digital-heirloom/assets/upload/route.ts`）
- 但 `schema.ts` 中**没有定义**此表
- 导致文件上传功能**无法使用**

**影响**:
```javascript
// src/app/api/digital-heirloom/assets/upload/route.ts:60
const { data: assetData, error: dbError } = await supabase
  .from('vault_assets')  // ❌ 表不存在
  .insert({ ... })
```

**修复方案**:
需要在 `schema.ts` 中添加表定义：

```typescript
export const vaultAssets = pgTable(
  'vault_assets',
  {
    id: text('id').primaryKey(),
    vaultId: text('vault_id')
      .notNull()
      .references(() => digitalVaults.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    displayName: text('display_name'),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    storagePath: text('storage_path').notNull(), // Blob URL
    encryptionSalt: text('encryption_salt').notNull(),
    encryptionIv: text('encryption_iv').notNull(),
    checksum: text('checksum').notNull(),
    category: text('category').notNull(), // secure_keys, legal_docs, video_legacy, instructions
    version: integer('version').default(1),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_vault_assets_vault').on(table.vaultId),
    index('idx_vault_assets_category').on(table.category),
  ]
);
```

---

### 问题 2: 加密数据存储位置不一致

**当前设计**:
- 小文本（< 10KB）→ `digitalVaults.encryptedData`（数据库）
- 大文件（> 10KB）→ Vercel Blob（文件存储）

**问题**:
- `encryptedData` 是 `text` 类型，适合小数据
- 如果用户存储大量文本，会影响数据库性能
- 建议设置明确的大小限制

**建议**:
```typescript
// 上传时检查大小
if (dataSize < 10 * 1024) {
  // 存储到 digitalVaults.encryptedData
  await updateVault({ encryptedData: encrypted });
} else {
  // 存储到 Blob
  const blobUrl = await uploadToBlob(encrypted);
  await createVaultAsset({ storagePath: blobUrl });
}
```

---

## 🔐 安全性分析

### ✅ 优点

1. **零知识架构**
   - 数据在客户端加密（AES-256-GCM）
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
   - 虽然已加密，但仍有暴力破解风险
   - 建议: 敏感大数据也存储在 Blob

2. **Blob URL 公开**
   - Vercel Blob 默认 URL 是公开的
   - 但文件已加密，无法直接读取
   - 建议: 使用 Presigned URL（有效期限制）

3. **vault_assets 表缺失**
   - 文件上传功能不完整
   - 无法追踪文件元数据
   - 需要立即修复

---

## 📊 存储容量规划

| 用户类型 | 数据库存储 | Blob 存储 | 总容量 |
|---------|-----------|----------|--------|
| Free | 10KB 文本 | 0 MB | **10KB** |
| Base | 10KB 文本 | 50MB 文件 | **50MB** |
| Pro | 10KB 文本 | 2GB 文件 | **2GB** |

**成本估算**:
- Supabase Free: 500MB 数据库（足够）
- Vercel Blob: $0.15/GB/月
  - Free 用户: $0/月
  - Base 用户: $0.0075/月（50MB）
  - Pro 用户: $0.30/月（2GB）

---

## 🧪 测试脚本

### 1. 数据库连接测试

**文件**: `test-database-connection.js`

**测试内容**:
- ✅ 服务器连接
- ✅ 数据库配置读取
- ✅ 用户表操作（注册/登录）
- ✅ Vault 表查询
- ✅ 订单表 API
- ✅ 数据库事务
- ✅ 查询性能

**运行方式**:
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 运行测试（新终端）
node test-database-connection.js
```

**预期结果**:
```
✅ 服务器运行正常
✅ 配置读取成功
✅ 数据库连接配置存在
✅ Blob 存储配置存在
✅ 用户表写入成功
✅ 认证系统正常
✅ Vault 自动创建成功
✅ 数据库查询性能优秀
```

---

### 2. 完整支付流程测试

**文件**: `test-payment-flow-complete.js`

**测试内容**:
- ✅ 用户注册
- ✅ 用户登录
- ✅ 获取用户信息
- ✅ Vault 自动创建
- ✅ 试用期设置
- ✅ 模拟支付（订阅年费）
- ✅ 权益激活验证
- ✅ 功能权限检查
- ✅ 模拟支付（Lifetime）
- ✅ 订阅过期测试

**运行方式**:
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 运行测试（新终端）
node test-payment-flow-complete.js
```

**预期结果**:
```
✅ 用户注册成功
✅ 用户登录成功
✅ Vault 自动创建成功
✅ 试用期设置正确（7天）
✅ 支付模拟成功
✅ 用户计划激活成功（base）
✅ Vault 计划激活成功（base）
✅ 订阅有效期正确（约365天）
✅ Lifetime 计划激活成功（pro）
✅ Lifetime 有效期正确（约100年）
```

---

## 📝 数据流示例

### 场景 1: 用户上传加密文本

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ 客户端  │                 │ 服务器  │                 │ 数据库   │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. 输入文本               │                           │
     │ 2. 使用主密码加密         │                           │
     │    (AES-256-GCM)          │                           │
     │                           │                           │
     │ 3. POST /api/vault/save   │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 4. 保存到 digitalVaults   │
     │                           ├──────────────────────────>│
     │                           │    encryptedData          │
     │                           │    encryptionSalt         │
     │                           │    encryptionIv           │
     │                           │                           │
     │ 5. 返回成功               │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### 场景 2: 用户上传加密文件

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────┐
│ 客户端  │         │ 服务器  │         │ 数据库   │         │ Blob    │
└────┬────┘         └────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                   │                    │
     │ 1. 选择文件       │                   │                    │
     │ 2. 加密文件       │                   │                    │
     │                   │                   │                    │
     │ 3. POST /api/     │                   │                    │
     │    blob-upload    │                   │                    │
     ├──────────────────>│                   │                    │
     │                   │                   │                    │
     │                   │ 4. 上传到 Blob    │                    │
     │                   ├───────────────────────────────────────>│
     │                   │                   │                    │
     │                   │ 5. 获取 Blob URL  │                    │
     │                   │<───────────────────────────────────────┤
     │                   │                   │                    │
     │                   │ 6. 保存元数据     │                    │
     │                   ├──────────────────>│                    │
     │                   │   vault_assets    │                    │
     │                   │   storagePath     │                    │
     │                   │                   │                    │
     │ 7. 返回成功       │                   │                    │
     │<──────────────────┤                   │                    │
     │                   │                   │                    │
```

---

## ✅ 总结

### 数据存储架构

| 数据类型 | 存储位置 | 大小限制 | 加密状态 | 状态 |
|---------|---------|---------|---------|------|
| 用户信息 | Supabase | - | 明文 | ✅ 正常 |
| 订单/订阅 | Supabase | - | 明文 | ✅ 正常 |
| 加密文本 | Supabase | 10KB | 加密 | ✅ 正常 |
| 加密文件 | Vercel Blob | 2GB | 加密 | ⚠️ 表缺失 |
| 物理资产照片 | Vercel Blob | 10MB | 明文 | ⚠️ 表缺失 |
| 日志记录 | Supabase | - | 明文 | ✅ 正常 |

### 待修复问题

1. ⚠️ **vault_assets 表缺失** - 需要添加到 schema.ts
2. ⚠️ **文件上传 API 不完整** - 需要完善 blob-upload 逻辑
3. ⚠️ **存储限制检查缺失** - 需要在上传时检查套餐限制

### 测试脚本状态

- ✅ `test-database-connection.js` - 数据库连接测试（已创建）
- ✅ `test-payment-flow-complete.js` - 完整支付流程测试（已创建）
- ✅ `DATABASE_STORAGE_ANALYSIS.md` - 详细分析文档（已创建）

### 下一步行动

1. **立即修复** (P0):
   - 添加 `vault_assets` 表定义
   - 完善文件上传 API
   - 添加存储限制检查

2. **测试验证** (P0):
   - 运行数据库连接测试
   - 运行完整支付流程测试
   - 验证所有修复是否生效

3. **部署上线** (P1):
   - 配置 Supabase 数据库
   - 配置 Vercel Blob 存储
   - 运行数据库迁移
   - 部署到 Vercel

---

**报告生成**: 2026-03-06  
**Git 提交**: 8f81eec  
**状态**: ✅ 分析完成，测试脚本已创建


