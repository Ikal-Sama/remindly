/**
 * Resolves the connection string the Prisma CLI must use for migrations.
 *
 * Neon exposes every database through two endpoints:
 *
 *   pooled  `ep-xxx-pooler.<region>.<provider>` - PgBouncer in transaction mode
 *   direct  `ep-xxx.<region>.<provider>`         - a plain Postgres endpoint
 *
 * Prisma Migrate takes a Postgres *session* advisory lock
 * (`SELECT pg_advisory_lock(72707369)`) before it applies migrations. A
 * transaction-mode pooler cannot keep that lock: the statement is handed to
 * whichever backend connection happens to be free, the lock stays attached to
 * that backend once the pooled session is returned to the pool, and the next
 * migration that lands on the same backend waits for a lock nobody will
 * release. On Vercel that surfaces as:
 *
 *   P1002  The database server was reached but timed out.
 *          Timed out trying to acquire a postgres advisory lock
 *
 * Neon therefore requires migrations to run over the direct endpoint, while
 * the runtime client (`lib/prisma.ts`) keeps using the pooled one.
 */

/**
 * Explicit override, for the rare case where the direct host is not
 * derivable from `DATABASE_URL` (a proxy, a custom domain, ...).
 */
const DIRECT_URL_VARIABLE = "DIRECT_DATABASE_URL";

export function resolveMigrationUrl(): string {
  const explicit = process.env[DIRECT_URL_VARIABLE]?.trim();
  if (explicit) return explicit;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set - cannot resolve a connection string for migrations.",
    );
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("-pooler.")) return url;

    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    return parsed.toString();
  } catch {
    // A malformed URL is reported by Prisma itself with a better message
    // than anything this helper could produce.
    return url;
  }
}
