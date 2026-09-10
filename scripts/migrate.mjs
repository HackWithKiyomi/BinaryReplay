import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  await db.unsafe("create table if not exists binaryreplay_schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const directory = join(process.cwd(), "packages", "db", "migrations");
  const applied = new Set((await db.unsafe("select name from binaryreplay_schema_migrations")).map((row) => row.name));
  for (const name of (await readdir(directory)).filter((file) => /^\d+_.*\.sql$/.test(file)).sort()) {
    if (applied.has(name)) continue;
    await db.unsafe(await readFile(join(directory, name), "utf8"));
    await db.unsafe("insert into binaryreplay_schema_migrations (name) values ($1)", [name]);
    console.log(`applied ${name}`);
  }
  console.log("migrations complete");
} finally { await db.end({ timeout: 5 }); }
