import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.resolve(__dirname, "..", "src", "app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

function toRoute(pageFile: string): string {
  const rel = path.relative(APP_DIR, path.dirname(pageFile));
  const segments = rel
    .split(path.sep)
    .filter(Boolean)
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")));
  return "/" + segments.join("/");
}

/** Every route with a real page.tsx under src/app, derived fresh (never hand-maintained). */
export function listRoutes(): string[] {
  return walk(APP_DIR).map(toRoute).sort();
}
