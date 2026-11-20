import "dotenv/config";
import { defineConfig } from "prisma/config";

// テーブルは abr-batch で作ったものを使う。このリポジトリではマイグレーションをしない
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
