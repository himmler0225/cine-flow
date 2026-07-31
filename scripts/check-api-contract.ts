#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FE_ROOT = join(__dirname, "../src");

const API_ROOT = join(__dirname, "../../movie-aggregator-api/src");

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function extractFePaths(source: string): string[] {
  const out: string[] = [];
  const re = /[`'"](\/api\/(?:admin|analytics|favorites|watch-history)[^`'"]*)[`'"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    out.push(m[1].replace(/\$\{[^}]+\}/g, ":param"));
  }
  return out;
}

function extractNestRoutes(source: string): string[] {
  const controller = /@Controller\(['"]([^'"]+)['"]\)/.exec(source)?.[1] ?? "";
  const methods: string[] = [];
  const re = /@(Get|Post|Patch|Put|Delete)\(['"]?([^'")\]]*)['"]?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const sub = m[2] ?? "";
    const full = `/${controller.replace(/^\//, "")}/${sub}`.replace(/\/+/g, "/").replace(/\/$/, "");
    methods.push((full || `/${controller}`).replace(/:([A-Za-z]+)/g, ":param"));
  }
  return methods;
}

const feFiles = await walk(join(FE_ROOT, "services/platform"));

const fePaths = new Set<string>();

for (const f of feFiles) {
  const src = await readFile(f, "utf8");
  for (const p of extractFePaths(src)) fePaths.add(p.split("?")[0]!);
}

const apiFiles = (await walk(join(API_ROOT, "platform"))).filter((f) =>
  f.endsWith(".controller.ts"),
);

const apiRoutes = new Set<string>();

for (const f of apiFiles) {
  const src = await readFile(f, "utf8");
  for (const r of extractNestRoutes(src)) apiRoutes.add(r);
}

const missing: string[] = [];

for (const path of [...fePaths].sort()) {
  const found = [...apiRoutes].some((r) => {
    const feParts = path.split("/");
    const apiParts = r.split("/");
    if (feParts.length !== apiParts.length) return false;
    return feParts.every(
      (part, i) => part === apiParts[i] || part === ":param" || apiParts[i] === ":param",
    );
  });
  if (!found) missing.push(path);
}

if (missing.length) {
  console.error("Contract drift — FE paths with no matching Nest route:");
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`OK — checked ${fePaths.size} FE paths against ${apiRoutes.size} Nest routes.`);
