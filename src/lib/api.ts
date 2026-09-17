import { defaultContent } from "@shared/default-content";
import type { SiteContent } from "@shared/types";

export async function fetchPublishedContent(): Promise<SiteContent> {
  const response = await fetch("/api/content");
  if (!response.ok) {
    return defaultContent;
  }
  return (await response.json()) as SiteContent;
}

export async function fetchAdminSession(): Promise<{
  authenticated: boolean;
  passwordConfigured: boolean;
}> {
  const response = await fetch("/api/admin/session");
  if (!response.ok) {
    return { authenticated: false, passwordConfigured: true };
  }
  return response.json();
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to sign in.");
  }
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST" });
}

export async function fetchAdminContent(): Promise<SiteContent> {
  const response = await fetch("/api/admin/content");
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to load editable content.");
  }
  return response.json();
}

export async function saveAdminContent(
  content: SiteContent,
): Promise<SiteContent> {
  const response = await fetch("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to save content.");
  }
  return response.json();
}

export async function uploadAdminImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/media", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Unable to upload the image.");
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export function encodeForm(data: Record<string, string>): string {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}
