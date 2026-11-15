import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __vcPool?: Pool;
};

function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Railway Variables: DATABASE_URL = ${{Postgres.DATABASE_URL}}",
    );
  }
  if (!globalForDb.__vcPool) {
    globalForDb.__vcPool = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.__vcPool;
}

/** Lazy — only connects when first query runs, never during `next build`. */
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool();
    const val = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(p) : val;
  },
});

export const db = drizzle(pool, { schema });
