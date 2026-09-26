import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    include: ["tests/**/*.test.ts"],
    env: {
      APP_ENV: "test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://postgres@localhost:5432/orvionis_test",
      AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
      SIGNING_SECRET: "test-signing-secret-test-signing-secret",
      STRIPE_SECRET_KEY: "sk_test_local",
      STRIPE_WEBHOOK_SECRET: "whsec_local",
      AI_PROVIDER: "mock",
      EMAIL_PROVIDER: "console",
      GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret-not-real",
      JOBS_INLINE: "true",
      CRON_SECRET: "test-cron",
      ADMIN_EMAILS: "admin@example.com",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
