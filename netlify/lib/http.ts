export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

export function errorJson(message: string, status = 400) {
  return json({ error: message }, status);
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie") ?? "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [
          part.slice(0, index),
          decodeURIComponent(part.slice(index + 1)),
        ];
      }),
  );
}

export function cookieHeader(
  name: string,
  value: string,
  req: Request,
  options: { maxAge?: number; clear?: boolean } = {},
): string {
  const secure = new URL(req.url).protocol === "https:";
  const parts = [
    `${name}=${options.clear ? "" : encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  if (options.clear) {
    parts.push("Max-Age=0");
  } else if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  return parts.join("; ");
}
