import type { AdminSessionResponse } from "@/lib/cmsApi";

const ADMIN_SESSION_CACHE_KEY = "mq-admin-session-cache";
const ADMIN_SESSION_CACHE_TTL = 2 * 60 * 1000;

type CachedAdminSession = {
  savedAt: number;
  session: AdminSessionResponse;
};

export function readCachedAdminSession(): AdminSessionResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cached = window.sessionStorage.getItem(ADMIN_SESSION_CACHE_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as CachedAdminSession;
    if (
      parsed?.session &&
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt < ADMIN_SESSION_CACHE_TTL
    ) {
      return parsed.session;
    }
  } catch {
    // Ignore corrupt cache entries.
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_CACHE_KEY);
  return null;
}

export function writeCachedAdminSession(session: AdminSessionResponse) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    ADMIN_SESSION_CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      session,
    } satisfies CachedAdminSession),
  );
}

export function clearCachedAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_CACHE_KEY);
}
