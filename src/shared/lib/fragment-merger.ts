/**
 * Fragment Merger
 * 合并 Fragment A/B 助记词的纯函数（服务器端安全）
 * 不依赖任何 DOM API，可以在服务器端和客户端使用
 */

import { validateBIP39Mnemonic } from './recovery-kit';

/**
 * 合并 Fragment A 和 Fragment B
 */
export function mergeFragments(
  fragmentA: string[],
  fragmentB: string[]
): {
  mnemonic: string[];
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 检查数量
  if (fragmentA.length !== 12) {
    errors.push(`Fragment A must contain 12 words, found ${fragmentA.length}`);
  }

  if (fragmentB.length !== 12) {
    errors.push(`Fragment B must contain 12 words, found ${fragmentB.length}`);
  }

  if (errors.length > 0) {
    return {
      mnemonic: [],
      valid: false,
      errors,
    };
  }

  // 合并助记词
  const mergedMnemonic = [...fragmentA, ...fragmentB];

  // 验证合并后的助记词
  try {
    const mnemonicString = mergedMnemonic.join(' ');
    if (!validateBIP39Mnemonic(mnemonicString)) {
      errors.push('Merged mnemonic does not match BIP39 standard');
    }
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
  }

  return {
    mnemonic: mergedMnemonic,
    valid: errors.length === 0,
    errors,
  };
}
