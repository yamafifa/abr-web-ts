import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function createPrisma(): PrismaClient {
  const url = new URL(process.env["DATABASE_URL"] ?? "");
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
    // MySQL 8.4 の caching_sha2_password で、再起動直後の最初のログインに必要（TLS を使わないため）。
    // 公開鍵をサーバーから受け取るので、手元の Docker の DB に接続する前提の設定
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

// 開発中はファイルを保存するたびにモジュールが読み直されるので、
// 接続が増え続けないよう globalThis に 1 つだけ持っておく
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
