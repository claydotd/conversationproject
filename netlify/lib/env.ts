import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

let localEnvLoaded = false;

function findEnvFile(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Vite + @netlify/vite-plugin inject site env from the Netlify UI, but do not
 * apply project `.env` into function workers. For local `npm run dev`, load
 * `.env` and let those values win so local testing matches the README.
 */
function ensureLocalEnvLoaded(): void {
  if (localEnvLoaded) return;
  localEnvLoaded = true;

  // Production / CI builds already receive env from Netlify; skip file load.
  if (process.env.NETLIFY === "true" && process.env.NETLIFY_LOCAL !== "true") {
    return;
  }

  try {
    const path = findEnvFile();
    if (!path) return;

    const raw = readFileSync(path, "utf8");
    const override = process.env.NETLIFY_LOCAL === "true";

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!key) continue;
      if (override || !process.env[key]?.trim()) {
        process.env[key] = value;
      }
    }
  } catch {
    // Missing or unreadable .env is fine (e.g. production deploys).
  }
}

export function getEnv(name: string): string | undefined {
  ensureLocalEnvLoaded();
  const fromNetlify =
    typeof Netlify !== "undefined" ? Netlify.env.get(name) : undefined;
  return fromNetlify ?? process.env[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
