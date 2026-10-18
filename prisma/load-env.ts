import { config } from "dotenv";

/**
 * Single source of truth for which env files the Prisma toolchain reads.
 *
 * Importing this module for its side effect loads `.env.local` first, then
 * `.env`. dotenv never overrides a value already set by an earlier file, so
 * this reproduces the precedence Next.js applies at runtime.
 *
 * Why a separate module: ES module imports are hoisted and evaluated before the
 * importing module's body runs. `lib/prisma.ts` builds its Postgres adapter at
 * module scope, so the env must be loaded during *import evaluation* - a
 * `config()` call placed in the body of `seed.ts` would run too late.
 *
 * Used by `prisma/seed.ts` and `prisma.config.ts` so both the Prisma CLI and
 * direct `tsx` invocations agree on which values win.
 */
config({ path: [".env.local", ".env"] });
