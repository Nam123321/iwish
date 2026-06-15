import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/test-*.ts', 'tests/**/*.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/iwish/*.ts'],
      exclude: ['src/iwish/*.test.ts', 'src/iwish/test-*.ts', 'tests/**/*.ts'],
    },
    testTimeout: 30000,
  },
});
