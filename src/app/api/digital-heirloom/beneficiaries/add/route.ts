/**
 * POST /api/digital-heirloom/beneficiaries/add
 * 添加受益人
 */

import { NextRequest } from 'next/server';
import { respData, respErr } from '@/shared/lib/resp';
import { requireAuth } from '@/shared/lib/api-auth';
import { findDigitalVaultByUserId } from '@/shared/models/digital-vault';
import {
  createBeneficiary,
  createBeneficiaries,
} from '@/shared/models/beneficiary';
import { getUuid } from '@/shared/lib/hash';

export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const authResult = await requireAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user;

    // 查找用户的保险箱
    const vault = await findDigitalVaultByUserId(user.id);
    if (!vault) {
      return respErr('Vault not found. Create one first.');
    }

    // 解析请求体
    const body = await request.json();
    const { beneficiary, beneficiaries } = body;

    // 支持单个或批量添加
    if (beneficiary) {
      // 单个添加
      const { name, email, relationship, language, phone, receiverName, addressLine1, city, zipCode, countryCode } = beneficiary;

      if (!name || !email) {
        return respErr('name and email are required');
      }

      const newBeneficiary = await createBeneficiary({
        id: getUuid(),
        vaultId: vault.id,
        name,
        email,
        relationship: relationship || null,
        language: language || 'en',
        phone: phone || null,
        // ShipAny 物流预留字段
        receiverName: receiverName || null,
        addressLine1: addressLine1 || null,
        city: city || null,
        zipCode: zipCode || null,
        countryCode: countryCode || 'HKG',
      });

      return respData({
        beneficiary: newBeneficiary,
        message: 'Beneficiary added successfully',
      });
    } else if (beneficiaries && Array.isArray(beneficiaries)) {
      // 批量添加
      const beneficiariesData = beneficiaries.map((b: any) => ({
        name: b.name,
        email: b.email,
        relationship: b.relationship || null,
        language: b.language || 'en',
        phone: b.phone || null,
        receiverName: b.receiverName || null,
        addressLine1: b.addressLine1 || null,
        city: b.city || null,
        zipCode: b.zipCode || null,
        countryCode: b.countryCode || 'HKG',
      }));

      // 验证必需字段
      for (const b of beneficiariesData) {
        if (!b.name || !b.email) {
          return respErr('All beneficiaries must have name and email');
        }
      }

      const newBeneficiaries = await createBeneficiaries(vault.id, beneficiariesData);

      return respData({
        beneficiaries: newBeneficiaries,
        message: `${newBeneficiaries.length} beneficiaries added successfully`,
      });
    } else {
      return respErr('beneficiary or beneficiaries array is required');
    }
  } catch (error: any) {
    console.error('Add beneficiary failed:', error);
    return respErr(error.message || 'Failed to add beneficiary');
  }
}




