import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // 允许 console.log（开发时有用）
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // 允许未使用的变量（使用下划线前缀）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // 允许 any 类型（某些场景需要）
      '@typescript-eslint/no-explicit-any': 'warn',
      // React 相关规则
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '.turbo/**',
      '*.config.{js,mjs,ts}',
      'public/**',
      '.source/**',
    ],
  },
];

export default eslintConfig;
