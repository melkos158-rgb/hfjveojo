import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client (Rust-free: TypeScript query compiler + pg driver adapter).
 * One pool per process; Next.js dev hot-reload reuses the instance via globalThis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10) });
  return new PrismaClient({
    adapter,
    log: process.env.LOG_LEVEL === "debug" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Db = PrismaClient;
