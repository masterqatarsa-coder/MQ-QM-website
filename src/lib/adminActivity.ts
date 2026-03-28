import type { AuditLog } from "@/lib/cmsApi";

type TargetUser = {
  name: string | null;
  loginId: string | null;
  role: string | null;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function displayUserLabel(name: string | null, loginId: string | null) {
  if (name && loginId && name !== loginId) {
    return `${name} (${loginId})`;
  }

  return name || loginId || "Unknown user";
}

function targetUserFromLog(log: AuditLog): TargetUser | null {
  const raw = log.details?.targetUser;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return {
    name: readString((raw as Record<string, unknown>).name),
    loginId: readString((raw as Record<string, unknown>).loginId),
    role: readString((raw as Record<string, unknown>).role),
  };
}

function attemptedLoginId(log: AuditLog) {
  return readString(log.details?.loginId);
}

export function formatAuditLogTitle(log: AuditLog) {
  const actorLabel = displayUserLabel(log.actorName, log.actorLoginId);
  const targetUser = targetUserFromLog(log);
  const targetLabel = targetUser
    ? displayUserLabel(targetUser.name, targetUser.loginId)
    : null;

  switch (log.type) {
    case "admin.user_created":
      return targetLabel ? `${targetLabel} created` : log.message;
    case "admin.user_updated":
      return targetLabel ? `${targetLabel} updated` : log.message;
    case "admin.user_deleted":
      return targetLabel ? `${targetLabel} deleted` : log.message;
    case "admin.user_password_reset":
      return targetLabel ? `${targetLabel} password reset` : log.message;
    case "auth.logout":
      return `${actorLabel} logged out`;
    case "auth.login.failed": {
      const attemptedLogin = attemptedLoginId(log);
      return attemptedLogin
        ? `Failed sign-in attempt for ${attemptedLogin}`
        : log.message;
    }
    case "security.clear_login_lock": {
      const attemptedLogin = attemptedLoginId(log);
      return attemptedLogin
        ? `Login lock cleared for ${attemptedLogin}`
        : log.message;
    }
    default:
      return log.message;
  }
}

export function formatAuditLogMeta(log: AuditLog) {
  const actorLabel = displayUserLabel(log.actorName, log.actorLoginId);
  const targetUser = targetUserFromLog(log);
  const targetLabel = targetUser
    ? displayUserLabel(targetUser.name, targetUser.loginId)
    : null;

  if (targetLabel) {
    return `Actor: ${actorLabel} | Target: ${targetLabel} | ${log.type}`;
  }

  return `${actorLabel} | ${log.type}`;
}
