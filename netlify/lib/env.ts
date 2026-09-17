export function getEnv(name: string): string | undefined {
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
