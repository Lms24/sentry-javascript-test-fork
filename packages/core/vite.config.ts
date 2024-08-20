import baseConfig from '@sentry-internal/vitest-config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
