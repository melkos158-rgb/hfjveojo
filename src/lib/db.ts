import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client (Rust-free: TypeScript query compiler + pg driver adapter).
 * One pool per process; Next.js dev hot-reload reuses the instance via globalThis.
 *
 * DATABASE_URL may carry `?schema=<name>` (Prisma convention). The pg driver does not understand that
 * parameter, so it is stripped here and applied as the adapter schema + connection search_path instead.
 * This lets ORVIONIS live in its own schema on a database that already hosts other tables.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function connectionSettings(raw: string): { connectionString: string; schema: string } {
  try {
    const url = new URL(raw);
    const schema = url.searchParams.get("schema") ?? "public";
    url.searchParams.delete("schema");
    return { connectionString: url.toString(), schema };
  } catch {
    return { connectionString: raw, schema: "public" };
  }
}

function create(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const { connectionString, schema } = connectionSettings(raw);
  const adapter = new PrismaPg(
    {
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      options: `-c search_path=${schema}`,
    },
    { schema },
  );
  return new PrismaClient({
    adapter,
    log: process.env.LOG_LEVEL === "debug" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Db = PrismaClient;
