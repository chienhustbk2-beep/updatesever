import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined }

function createPrismaClient() {
  const isSqlite = process.env.DATABASE_URL?.startsWith("file:") || !process.env.DATABASE_URL;

  if (isSqlite) {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
