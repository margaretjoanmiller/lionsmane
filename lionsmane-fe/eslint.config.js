//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
  ...tanstackConfig,
  jsxA11y.flatConfigs.recommended,
  eslintConfigPrettier,
];
