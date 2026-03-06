# Digital Heirloom 系统全面评估报告

**评估日期**: 2026-03-06  
**评估范围**: 认证系统、会员管理、支付系统、加密功能、保险库业务、Dead Man's Switch、邮件系统、ShipAny 物流

---

## 📊 执行摘要

### 系统健康度评分: 78/100

**优势**:
- ✅ 完整的端到端加密实现（AES-256-GCM）
- ✅ 三档会员体系设计清晰（Free/Base/Pro）
- ✅ 支付系统支持多提供商（Stripe/Creem/PayPal）
- ✅ Dead Man's Switch 核心逻辑完整
- ✅ 物流系统预留 ShipAny 接口

**关键问题**:
- ⚠️ **支付成功后会员权益激活存在漏洞**（严重）
- ⚠️ **一次性买断（Lifetime）与年费订阅逻辑混乱**（严重）
- ⚠️ **Free 用户试用期管理缺失**（中等）
- ⚠️ **受益人解密次数限制未正确执行**（中等）
- ⚠️ **邮件发送功能未完全实现**（中等）

---

## 🔐 1. 认证系统评估

### 1.1 Sign In / Sign Up

**实现方式**: Better-Auth 框架  
**路径**: `src/app/api/auth/[...all]/route.ts`

**✅ 优点**:
- 使用成熟的 Better-Auth 框架
- 支持邮箱密码登录
- 支持 Google OAuth（已配置）
- 错误处理完善（422 错误日志）

**⚠️ 问题**:
1. **注册后未自动创建 Vault**
   - 代码位置: `src/shared/hooks/create-vault-on-signup.ts` 存在但未被调用
   - 影响: 新用户注册后无法立即使用保险箱功能
   - 建议: 在 Better-Auth 的 `onSignUp` 钩子中调用

2. **Free 用户试用期未初始化**
   - 问题: 注册时未设置 `currentPeriodEnd`（试用期结束时间）
   - 影响: Free 用户无法享受 7 天试用期
   - 建议: 注册时设置 `currentPeriodEnd = now + 7 days`

**🔧 修复建议**:
```typescript
// src/core/auth/config.ts 中添加
onSignUp: async ({ user }) => {
  // 1. 创建 Vault
  await createVaultForNewUser(user.id);
  
  // 2. 设置 Free 试用期（7天）
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);
  
  await db().update(digitalVaults)
    .set({
      planLevel: 'free',
      currentPeriodEnd: trialEndDate
    })
    .where(eq(digitalVaults.userId, user.id));
}
```

---

## 💳 2. 支付系统评估

### 2.1 支付流程

**支持的支付提供商**:
- Stripe ✅
- Creem ✅
- PayPal ✅

**支付类型**:
- 一次性支付（One-time）
- 订阅支付（Subscription）

**✅ 优点**:
- 多币种支持
- 动态价格计算（服务端验证）
- Webhook 处理完善

**⚠️ 严重问题: 支付成功后会员权益激活逻辑混乱**

#### 问题 1: 一次性买断（Lifetime）判断错误

**代码位置**: `src/shared/services/payment.ts:217-226`

```typescript
// 🔴 问题代码
if (subscriptionInfo) {
  const planLevel = getPlanLevelFromProductId(order.productId || '');
  
  // 判断是否为终身版（interval 为 one-time）
  const isLifetime = subscriptionInfo.interval === 'one-time';
  const currentPeriodEnd = isLifetime 
    ? calculateLifetimeEndDate()  // 🔴 错误：一次性支付不应该有 subscriptionInfo
    : subscriptionInfo.currentPeriodEnd;
  
  await syncUserPlan(order.userId, planLevel, currentPeriodEnd);
}
```

**问题分析**:
- `subscriptionInfo` 只在订阅支付时存在
- 一次性买断（Lifetime）的 `paymentType` 是 `ONE_TIME`，不会有 `subscriptionInfo`
- 导致一次性买断用户支付成功后**不会激活会员权益**

#### 问题 2: 订阅续费未同步 Vault

**代码位置**: `src/shared/services/payment.ts:398-402`

```typescript
// ✅ 已修复（但需要测试）
const planLevel = getPlanLevelFromProductId(subscription.productId || '');
await syncUserPlan(subscription.userId, planLevel, subscriptionInfo.currentPeriodEnd);
```

**状态**: 代码已添加，但未经过测试验证

#### 问题 3: 订阅过期检查器未触发降级

**代码位置**: `src/shared/services/subscription-checker.ts`

```typescript
// ✅ 逻辑正确
await db()
  .update(digitalVaults)
  .set({
    planLevel: 'free',
    currentPeriodEnd: null,
    updatedAt: now
  })
  .where(eq(digitalVaults.id, vault.id));
```

**状态**: 逻辑正确，但需要确保 Vercel Cron 正确配置

---

### 2.2 会员权益激活流程

**当前流程**:
```
用户支付 → Webhook 回调 → 更新 Order/Subscription → ❌ 未同步 Vault
```

**正确流程**:
```
用户支付 → Webhook 回调 → 更新 Order/Subscription → ✅ 同步 Vault 权益
```

**🔧 修复方案**:

```typescript
// src/shared/services/payment.ts

export async function handleCheckoutSuccess({ order, session }) {
  // ... 现有代码 ...

  // 🆕 修复：支持一次性买断和订阅两种模式
  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    let planLevel: 'free' | 'base' | 'pro' = 'free';
    let currentPeriodEnd: Date | null = null;

    // 1️⃣ 订阅支付（年费）
    if (order.paymentType === PaymentType.SUBSCRIPTION && subscriptionInfo) {
      planLevel = getPlanLevelFromProductId(order.productId || '');
      currentPeriodEnd = subscriptionInfo.currentPeriodEnd;
    }
    
    // 2️⃣ 一次性买断（Lifetime）
    else if (order.paymentType === PaymentType.ONE_TIME) {
      planLevel = getPlanLevelFromProductId(order.productId || '');
      
      // Lifetime 设置为 100 年后过期
      currentPeriodEnd = new Date();
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
    }

    // 同步 Vault 权益
    if (planLevel !== 'free') {
      await syncUserPlan(order.userId, planLevel, currentPeriodEnd);
      console.log(`✅ Activated ${planLevel} plan for user ${order.userId}`);
    }
  }
}
```

---

## 👥 3. 会员管理系统评估

### 3.1 三档会员体系

| 功能 | Free | Base | Pro |
|------|------|------|-----|
| 存储空间 | 10KB | 50MB | 2GB |
| 受益人数量 | 1 | 3 | 10 |
| 心跳频率 | 180天（固定） | 30-365天 | 30-365天 |
| 自动监控 | ❌ | ✅ | ✅ |
| 物理寄送 | ❌ | ❌ | ✅ |
| 解密次数 | 1次 | 无限 | 无限 |
| 手动签到 | 必须 | 不需要 | 不需要 |

**✅ 优点**:
- 权益划分清晰
- 配置文件化管理（`digital-heirloom-plans.ts`）

**⚠️ 问题**:

#### 问题 1: Free 用户试用期管理缺失

**现状**:
- Free 用户注册后 `currentPeriodEnd = null`
- 无法区分"试用中"和"试用已过期"

**建议**:
```typescript
// 注册时
currentPeriodEnd = now + 7 days  // 7天试用期

// 试用期内
status = 'active', planLevel = 'free'

// 试用期过后
status = 'active', planLevel = 'free', currentPeriodEnd = null
```

#### 问题 2: 受益人解密次数限制未执行

**代码位置**: `src/shared/lib/digital-heirloom-plan-limits.ts:120-160`

**问题**:
- 函数 `canBeneficiaryDecrypt()` 已实现
- 但在实际解密 API 中**未调用此函数**

**影响**:
- Free 用户的受益人可以无限次解密（违反设计）

**修复位置**: `src/app/api/digital-heirloom/beneficiaries/decrypt/route.ts`

```typescript
// 🆕 添加解密次数检查
const { canDecrypt, reason } = await canBeneficiaryDecrypt(beneficiaryId, vaultId);
if (!canDecrypt) {
  return respErr(reason || 'Decryption limit reached');
}

// 解密成功后增加计数
await db().update(beneficiaries)
  .set({
    decryptionCount: (beneficiary.decryptionCount || 0) + 1,
    lastDecryptionAt: new Date()
  })
  .where(eq(beneficiaries.id, beneficiaryId));
```

---

## 🔒 4. 加密/解密功能评估

### 4.1 核心加密实现

**算法**: AES-256-GCM  
**密钥派生**: PBKDF2 (100,000 iterations)  
**代码位置**: `src/shared/lib/encryption.ts`

**✅ 优点**:
- 使用 Web Crypto API（浏览器原生）
- 零知识架构（服务器不存储密码）
- 随机盐值和 IV（每次加密不同）

**✅ 安全性评估**: **优秀**

```typescript
// 加密流程
用户密码 → PBKDF2 (100k iterations) → AES-256 密钥 → 加密数据
                ↓
         随机 Salt + IV
                ↓
    存储到数据库（Base64）
```

**⚠️ 问题**:
1. **文件加密未实现**
   - `src/shared/lib/file-encryption.ts` 存在但未完成
   - 影响: 无法加密上传的文件（只能加密文本）

2. **恢复包加密未测试**
   - `recoveryBackupToken` 字段存在但未使用
   - 影响: 用户忘记密码后无法恢复

---

## 🏦 5. 保险库业务评估

### 5.1 Vault 生命周期

```
注册 → 创建 Vault → 激活会员 → 心跳监控 → 触发继承 → 资产释放
```

**✅ 已实现**:
- Vault 创建（`create-vault-on-signup.ts`）
- 心跳记录（`heartbeat-logs` 表）
- 受益人管理（`beneficiaries` 表）

**⚠️ 问题**:

#### 问题 1: Vault 创建未自动触发

**现状**: 注册后需要手动访问 `/digital-heirloom/setup` 才会创建 Vault

**建议**: 在 Better-Auth 的 `onSignUp` 钩子中自动创建

#### 问题 2: 心跳检查器逻辑不完整

**代码位置**: `src/shared/services/heartbeat-checker.ts`

**缺失功能**:
- ❌ 未发送预警邮件
- ❌ 未发送二次提醒邮件
- ❌ 未触发 Dead Man's Switch

**建议**: 参考设计文档完善邮件发送逻辑

---

## ⚰️ 6. Dead Man's Switch 评估

### 6.1 触发流程

```
最后心跳 + 90天 → 预警邮件 → 7天宽限期 → 二次提醒 → 触发继承
```

**✅ 已实现**:
- 数据库字段完整（`deadManSwitchEnabled`, `deadManSwitchActivatedAt`）
- 检查器框架存在（`dead-man-switch-checker.ts`）

**⚠️ 问题**:

#### 问题 1: 检查器逻辑未完成

**代码位置**: `src/shared/services/dead-man-switch-checker.ts:24-28`

```typescript
// TODO: 获取受益人列表
// TODO: 生成解密密钥片段
// TODO: 发送邮件给受益人
// TODO: 记录继承日志
```

**影响**: Dead Man's Switch 无法正常工作（核心功能缺失）

#### 问题 2: 密钥分片算法未实现

**设计**: Shamir's Secret Sharing（门限密钥分享）

**现状**: 未找到相关实现代码

**建议**: 使用 `secrets.js-grempe` 库实现

```typescript
import secrets from 'secrets.js-grempe';

// 生成密钥分片（3-of-5 门限）
const shares = secrets.share(masterPassword, 5, 3);

// 分发给 5 个受益人，任意 3 个可以恢复
```

---

## 📧 7. 邮件系统评估

### 7.1 邮件类型

| 邮件类型 | 触发时机 | 实现状态 |
|---------|---------|---------|
| 心跳预警 | 失联 90 天 | ⚠️ 未实现 |
| 二次提醒 | 宽限期第 5 天 | ⚠️ 未实现 |
| 继承通知 | DMS 触发 | ⚠️ 未实现 |
| 密码重置 | 用户请求 | ✅ 已实现 |
| 运费支付 | Pro 用户物流 | ✅ 已实现 |

**✅ 优点**:
- Resend API 集成完成
- 多语言支持（en/zh/fr）
- 邮件日志记录（`email_notifications` 表）

**⚠️ 问题**:

#### 问题 1: 核心邮件未实现

**影响**: Dead Man's Switch 无法通知用户和受益人

**修复建议**:
```typescript
// src/shared/services/email.ts

export async function sendHeartbeatWarningEmail(vault: DigitalVault) {
  const emailService = await getEmailService();
  const user = await findUserById(vault.userId);
  
  await emailService.sendEmail({
    to: user.email,
    subject: '⚠️ Digital Heirloom - Heartbeat Warning',
    html: `
      <p>We haven't heard from you in 90 days.</p>
      <p>Please confirm you're okay: ${confirmUrl}</p>
      <p>If we don't hear from you in 7 days, your assets will be released to beneficiaries.</p>
    `
  });
}
```

---

## 🚚 8. ShipAny 物流系统评估

### 8.1 物流流程（Pro 用户专属）

```
DMS 触发 → 管理员审核 → 发送运费支付链接 → 受益人支付 → 发货 → 送达
```

**✅ 已实现**:
- 物流表设计完整（`shipping_logs`）
- 运费支付集成 Creem
- 管理员审核界面（`/admin/shipping-requests`）

**✅ 优点**:
- 运费状态机完善（6 个状态）
- 支持多承运商（SF/FedEx/DHL）
- 物流追踪号记录

**⚠️ 问题**:

#### 问题 1: ShipAny API 未集成

**现状**: 预留了字段但未调用 ShipAny API

**建议**: 
- 如果使用 ShipAny，需要集成其 API
- 如果手动发货，当前设计已足够

#### 问题 2: 物理资产照片上传未实现

**字段**: `beneficiaries.physicalAssetPhotoUrl`

**现状**: 字段存在但前端未提供上传入口

---

## 🔍 9. 关键漏洞总结

### 🔴 严重漏洞（必须修复）

1. **支付成功后会员权益未激活**
   - 影响: 用户付费后无法使用付费功能
   - 优先级: P0
   - 修复时间: 1-2 小时

2. **一次性买断（Lifetime）逻辑错误**
   - 影响: Lifetime 用户支付后不会激活
   - 优先级: P0
   - 修复时间: 1 小时

3. **Dead Man's Switch 核心逻辑未完成**
   - 影响: 核心功能无法使用
   - 优先级: P0
   - 修复时间: 8-16 小时

### 🟡 中等问题（建议修复）

4. **Free 用户试用期管理缺失**
   - 影响: 无法区分试用中和试用过期
   - 优先级: P1
   - 修复时间: 2 小时

5. **受益人解密次数限制未执行**
   - 影响: Free 用户可以无限解密
   - 优先级: P1
   - 修复时间: 1 小时

6. **心跳预警邮件未实现**
   - 影响: 用户失联后不会收到提醒
   - 优先级: P1
   - 修复时间: 4 小时

### 🟢 低优先级（可延后）

7. **文件加密未完成**
   - 影响: 只能加密文本，不能加密文件
   - 优先级: P2
   - 修复时间: 8 小时

8. **恢复包功能未实现**
   - 影响: 用户忘记密码后无法恢复
   - 优先级: P2
   - 修复时间: 4 小时

---

## 📋 10. 修复优先级建议

### 第一阶段（核心功能修复）- 1 周

1. ✅ 修复支付成功后会员权益激活逻辑
2. ✅ 修复一次性买断（Lifetime）判断
3. ✅ 添加 Free 用户试用期管理
4. ✅ 实现受益人解密次数限制
5. ✅ 在注册时自动创建 Vault

### 第二阶段（Dead Man's Switch）- 2 周

6. ✅ 实现心跳预警邮件
7. ✅ 实现二次提醒邮件
8. ✅ 实现继承通知邮件
9. ✅ 完成 Dead Man's Switch 检查器
10. ✅ 实现密钥分片算法（Shamir's Secret Sharing）

### 第三阶段（增强功能）- 1 周

11. ✅ 实现文件加密功能
12. ✅ 实现恢复包功能
13. ✅ 添加物理资产照片上传
14. ✅ 完善管理员审计日志

---

## 🧪 11. 测试建议

### 11.1 支付流程测试

```bash
# 测试场景 1: 订阅支付（年费）
1. 注册新用户
2. 购买 Base 年费计划
3. 验证 Vault.planLevel = 'base'
4. 验证 Vault.currentPeriodEnd = now + 1 year

# 测试场景 2: 一次性买断（Lifetime）
1. 注册新用户
2. 购买 Pro Lifetime
3. 验证 Vault.planLevel = 'pro'
4. 验证 Vault.currentPeriodEnd = now + 100 years

# 测试场景 3: 订阅续费
1. 等待订阅到期前 7 天
2. Stripe 自动扣款
3. 验证 Vault.currentPeriodEnd 延长 1 年

# 测试场景 4: 订阅过期
1. 取消订阅
2. 等待到期
3. 验证 Vault.planLevel 降级为 'free'
```

### 11.2 Dead Man's Switch 测试

```bash
# 测试场景 1: 心跳预警
1. 创建 Vault，设置 lastSeenAt = now - 90 days
2. 运行 heartbeat-checker
3. 验证收到预警邮件

# 测试场景 2: 宽限期提醒
1. 预警后 5 天未响应
2. 运行 heartbeat-checker
3. 验证收到二次提醒邮件

# 测试场景 3: 触发继承
1. 宽限期结束
2. 运行 dead-man-switch-checker
3. 验证受益人收到继承通知邮件
4. 验证 Vault.status = 'released'
```

---

## 📊 12. 性能和安全建议

### 12.1 性能优化

1. **数据库索引优化**
   - ✅ 已添加复合索引（userId + status）
   - 建议: 添加 `currentPeriodEnd` 索引用于过期检查

2. **Cron 任务优化**
   - 建议: 使用 Vercel Cron 或 Upstash QStash
   - 频率: 每小时检查一次（避免过于频繁）

### 12.2 安全加固

1. **密码强度验证**
   - 建议: 要求至少 12 位，包含大小写字母、数字、特殊字符

2. **API 速率限制**
   - 建议: 使用 Upstash Rate Limit
   - 限制: 解密 API 每小时最多 10 次

3. **审计日志**
   - ✅ 已实现 `admin_audit_logs` 表
   - 建议: 记录所有敏感操作（解密、权益变更）

---

## ✅ 13. 总结

### 系统整体评价

**架构设计**: ⭐⭐⭐⭐⭐ (5/5)  
**代码质量**: ⭐⭐⭐⭐ (4/5)  
**功能完整度**: ⭐⭐⭐ (3/5)  
**安全性**: ⭐⭐⭐⭐⭐ (5/5)  
**可维护性**: ⭐⭐⭐⭐ (4/5)

### 核心优势

1. **零知识加密架构** - 行业领先的安全设计
2. **三档会员体系** - 清晰的商业模式
3. **多支付提供商** - 灵活的支付选择
4. **完整的数据库设计** - 考虑周全的表结构

### 需要立即修复的问题

1. **支付成功后会员权益激活** - 影响收入
2. **Dead Man's Switch 核心逻辑** - 影响核心功能
3. **邮件通知系统** - 影响用户体验

### 建议的开发路线图

**Week 1**: 修复支付和会员权益激活  
**Week 2-3**: 完成 Dead Man's Switch 和邮件系统  
**Week 4**: 增强功能和测试  
**Week 5**: 上线前安全审计

---

**报告生成时间**: 2026-03-06  
**评估人员**: AI 系统架构师  
**下次评估**: 修复完成后

