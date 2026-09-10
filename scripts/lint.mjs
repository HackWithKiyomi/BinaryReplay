import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const skip = new Set(["node_modules", ".next", "dist", ".git"]);
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { if (skip.has(entry.name)) continue; const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) { const text = await readFile(path, "utf8"); if (/NEXT_PUBLIC_[A-Z0-9_]*(PRIVATE|SECRET|KEY|DATABASE)/.test(text)) throw new Error(`Public secret-like environment variable in ${path}`); } } }
await walk(process.cwd()); console.log("security lint passed");
