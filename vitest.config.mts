import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json の "@/*" → "src/*" を、テストでも使えるようにする
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        // DB を使わないテスト（npm test）
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.ts"], exclude: ["src/**/*.db.test.ts"] },
      },
      {
        // 本物の DB（abr-batch の MySQL）を使うテスト（npm run test:db）。変更はトランザクションで取り消す
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          setupFiles: ["dotenv/config"],
          testTimeout: 60_000,
        },
      },
    ],
  },
});
