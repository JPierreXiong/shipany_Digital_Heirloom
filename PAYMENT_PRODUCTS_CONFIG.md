# 支付产品配置说明

**更新时间**: 2026-03-06  
**支付提供商**: Creem

---

## 📋 产品列表

### 1️⃣ 年费订阅（Annual Subscription）

#### Base Plan - $49/年
- **产品 ID**: `prod_4oN2BFtSPSpAnYcvUN0uoi`
- **价格**: $49 USD
- **有效期**: 1年
- **支付链接**: https://www.creem.io/payment/prod_4oN2BFtSPSpAnYcvUN0uoi
- **计划等级**: `base`
- **续费方式**: 自动续费（每年）

#### Pro Plan - $149/年
- **产品 ID**: `prod_4epepOcgUjSjPoWmAnBaFt`
- **价格**: $149 USD
- **有效期**: 1年
- **支付链接**: https://www.creem.io/payment/prod_4epepOcgUjSjPoWmAnBaFt
- **计划等级**: `pro`
- **续费方式**: 自动续费（每年）

---

### 2️⃣ 终身买断（Lifetime Purchase）

#### Lifetime Base - $299
- **产品 ID**: `prod_7TTyBF8uPUAGrNJ5tK8sJW`
- **价格**: $299 USD
- **有效期**: 100年+（实际永久）
- **支付链接**: https://www.creem.io/payment/prod_7TTyBF8uPUAGrNJ5tK8sJW
- **计划等级**: `base`
- **续费方式**: 无需续费（一次性购买）

#### Lifetime Pro - $499
- **产品 ID**: `prod_66sZAZLqySq4Rixu7XgYYh`
- **价格**: $499 USD
- **有效期**: 100年+（实际永久）
- **支付链接**: https://www.creem.io/payment/prod_66sZAZLqySq4Rixu7XgYYh
- **计划等级**: `pro`
- **续费方式**: 无需续费（一次性购买）

---

## 🔄 支付处理逻辑

### 年费订阅支付成功后

```typescript
// 1. 创建订单记录
order.paymentType = PaymentType.SUBSCRIPTION;

// 2. 创建订阅记录
subscription = {
  subscriptionId: session.subscriptionId,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(+1 year),  // 1年后
  interval: 'year',
  intervalCount: 1,
  status: 'active'
};

// 3. 更新 Vault
vault.planLevel = 'base' | 'pro';
vault.currentPeriodEnd = subscription.currentPeriodEnd;  // 1年后
vault.status = 'active';
```

**关键点**:
- ✅ 使用订阅信息中的 `currentPeriodEnd`
- ✅ 有效期为 1年
- ✅ 到期后自动续费

---

### 终身买断支付成功后

```typescript
// 1. 创建订单记录
order.paymentType = PaymentType.ONE_TIME;

// 2. 不创建订阅记录（一次性购买）

// 3. 计算终身有效期
const lifetimeEnd = new Date();
lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);  // 100年后

// 4. 更新 Vault
vault.planLevel = 'base' | 'pro';
vault.currentPeriodEnd = lifetimeEnd;  // 100年后
vault.status = 'active';
```

**关键点**:
- ✅ 不创建订阅记录
- ✅ 有效期设置为 100年后（实际永久）
- ✅ 无需续费

---

## 📊 支付类型对比

| 特性 | 年费订阅 | 终身买断 |
|------|---------|---------|
| 价格 | $49 (Base) / $149 (Pro) | $299 (Base) / $499 (Pro) |
| 有效期 | 1年 | 100年+ |
| 续费 | 自动续费 | 无需续费 |
| PaymentType | SUBSCRIPTION | ONE_TIME |
| 订阅记录 | ✅ 创建 | ❌ 不创建 |
| currentPeriodEnd | 订阅的 currentPeriodEnd | 100年后 |
| Creem billing_period | every-year | once |

---

## 🔧 代码实现

### 产品 ID 映射

**文件**: `src/shared/services/plan-sync.ts`

```typescript
const PRODUCT_ID_TO_PLAN_LEVEL: Record<string, 'free' | 'base' | 'pro'> = {
  // 年费订阅
  'prod_4oN2BFtSPSpAnYcvUN0uoi': 'base',  // $49/year
  'prod_4epepOcgUjSjPoWmAnBaFt': 'pro',   // $149/year
  
  // 终身买断
  'prod_7TTyBF8uPUAGrNJ5tK8sJW': 'base',  // $299 lifetime
  'prod_66sZAZLqySq4Rixu7XgYYh': 'pro',   // $499 lifetime
};

const LIFETIME_PRODUCT_IDS = [
  'prod_7TTyBF8uPUAGrNJ5tK8sJW',
  'prod_66sZAZLqySq4Rixu7XgYYh',
];
```

### 支付成功处理

**文件**: `src/shared/services/payment.ts`

```typescript
// 在 handleCheckoutSuccess 函数中
const planLevel = getPlanLevelFromProductId(order.productId || '');
let currentPeriodEnd: Date | null = null;

// 1️⃣ 订阅支付（年费）
if (order.paymentType === PaymentType.SUBSCRIPTION && subscriptionInfo) {
  currentPeriodEnd = subscriptionInfo.currentPeriodEnd;
}
// 2️⃣ 一次性买断（Lifetime）
else if (order.paymentType === PaymentType.ONE_TIME) {
  currentPeriodEnd = calculateLifetimeEndDate();  // 100年后
}

// 同步 Vault 权益
if (planLevel !== 'free' && currentPeriodEnd) {
  await syncUserPlan(order.userId, planLevel, currentPeriodEnd);
}
```

---

## ✅ 验证清单

### 年费订阅测试

- [ ] 使用 Base 年费产品 ID 创建支付
- [ ] 支付成功后检查 Vault
  - [ ] planLevel = 'base'
  - [ ] currentPeriodEnd = 1年后
  - [ ] status = 'active'
- [ ] 检查订阅记录是否创建
- [ ] 1年后检查是否自动续费

### 终身买断测试

- [ ] 使用 Lifetime Base 产品 ID 创建支付
- [ ] 支付成功后检查 Vault
  - [ ] planLevel = 'base'
  - [ ] currentPeriodEnd = 100年后
  - [ ] status = 'active'
- [ ] 确认没有创建订阅记录
- [ ] 确认不会自动续费

---

## 🔍 Creem Webhook 处理

### 年费订阅事件

```
1. checkout.completed - 首次支付成功
   → 创建订阅记录
   → 更新 Vault（1年有效期）

2. subscription.paid - 续费成功
   → 更新订阅记录
   → 延长 Vault 有效期（+1年）

3. subscription.canceled - 取消订阅
   → 更新订阅状态
   → Vault 在当前周期结束后失效
```

### 终身买断事件

```
1. checkout.completed - 支付成功
   → 不创建订阅记录
   → 更新 Vault（100年有效期）

2. 无续费事件（一次性购买）
```

---

## 📝 注意事项

1. **终身买断不创建订阅记录**
   - 因为是一次性购买，不需要订阅管理
   - Creem 的 `billing_period` 为 `once`

2. **有效期设置**
   - 年费：使用 Creem 返回的 `currentPeriodEnd`
   - 终身：设置为 100年后（实际永久）

3. **续费处理**
   - 年费：Creem 自动处理续费，webhook 通知
   - 终身：无需续费，无 webhook 事件

4. **计划等级**
   - Base 和 Lifetime Base 都是 `base` 等级
   - Pro 和 Lifetime Pro 都是 `pro` 等级
   - 区别在于有效期和续费方式

---

## 🚀 部署检查

### 环境变量

```bash
CREEM_ENABLED=true
CREEM_API_KEY=your_api_key
CREEM_ENVIRONMENT=production
CREEM_SIGNING_SECRET=your_signing_secret
DEFAULT_PAYMENT_PROVIDER=creem
```

### 数据库

```sql
-- 检查 Vault 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'digital_vaults' 
AND column_name IN ('plan_level', 'current_period_end', 'status');
```

### Webhook 配置

在 Creem Dashboard 配置 Webhook URL:
```
https://shipany-digital-heirloom.vercel.app/api/payment/notify/creem
```

监听事件:
- `checkout.completed`
- `subscription.paid`
- `subscription.canceled`

---

**配置完成！** 🎉

两种支付模式已正确配置，可以开始测试！

