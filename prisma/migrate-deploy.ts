/**
 * Runs `prisma migrate deploy` and retries when the migration lock is busy.
 *
 * Prisma's schema engine takes a Postgres advisory lock before it applies
 * migrations and gives up after 10 seconds. Two deployments that reach the
 * database at the same time - a pull-request preview build and the production
 * build, for example - therefore race for that lock, and the loser fails the
 * whole deployment with:
 *
 *   P1002  Timed out trying to acquire a postgres advisory lock
 *
 * Retrying turns that race into a short wait: the second run finds the lock
 * free and, because the winner already applied the migrations, it is a no-op
 * that succeeds.
 *
 * Only lock contention is retried. Any other failure - a broken migration, a
 * missing database - is reported immediately.
 */
import { spawn } from "node:child_process";

const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 10_000;

/** Matches Prisma's `P1002` and the advisory lock message it prints. */
const LOCK_CONTENTION = /P1002|advisory lock/i;

interface MigrateResult {
  code: number;
  output: string;
}

function runMigrateDeploy(): Promise<MigrateResult> {
  return new Promise((resolve, reject) => {
    // A single command string instead of `spawn(cmd, args)`: Windows cannot
    // execute the `npx.cmd` shim without a shell, and passing arguments
    // together with `shell: true` is deprecated in Node.
    const child = spawn("npx prisma migrate deploy", {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function main(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { code, output } = await runMigrateDeploy();

    if (code === 0) {
      process.exit(0);
    }

    if (!LOCK_CONTENTION.test(output)) {
      console.error(`prisma migrate deploy failed with exit code ${code}.`);
      process.exit(code);
    }

    if (attempt === MAX_ATTEMPTS) {
      console.error(
        `prisma migrate deploy could not acquire the migration lock after ${MAX_ATTEMPTS} attempts.`,
      );
      process.exit(code);
    }

    console.warn(
      `prisma migrate deploy could not acquire the migration lock ` +
        `(attempt ${attempt}/${MAX_ATTEMPTS}). Another deployment is probably ` +
        `migrating right now - retrying in ${RETRY_DELAY_MS / 1000}s.`,
    );

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
