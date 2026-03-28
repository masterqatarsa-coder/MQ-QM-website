import {
  AlertTriangle,
  BriefcaseBusiness,
  Clock3,
  Mail,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import type {
  AdminSessionActivity,
  AuditLog,
  SubmissionItem,
  SubmissionType,
  SuspiciousActivityGroup,
} from "@/lib/cmsApi";
import { formatAuditLogMeta, formatAuditLogTitle } from "@/lib/adminActivity";
import { buildPaginationTokens } from "@/lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type AdminHistoryDialogProps = {
  open: boolean;
  title: string;
  description: string;
  mode: "audit" | "session" | "incident" | SubmissionType;
  items: AuditLog[] | AdminSessionActivity[] | SuspiciousActivityGroup[] | SubmissionItem[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onClose: () => void;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unknown time";
  }

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function previewText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function sessionStatusLabel(status: AdminSessionActivity["status"]) {
  return status === "active"
    ? "Active"
    : status === "logged_out"
      ? "Logged Out"
      : "Inactive";
}

function sessionStatusClass(status: AdminSessionActivity["status"]) {
  return status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "logged_out"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
}

export default function AdminHistoryDialog({
  open,
  title,
  description,
  mode,
  items,
  page,
  totalPages,
  total,
  loading,
  error,
  onPageChange,
  onClose,
}: AdminHistoryDialogProps) {
  if (!open) {
    return null;
  }

  const paginationTokens = buildPaginationTokens(page, totalPages);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm lg:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <section className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl lg:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              History
            </div>
            <div className="mt-2 font-condensed text-3xl font-black leading-none text-primary">
              {title}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {loading && (
            <div className="admin-empty">Loading history...</div>
          )}

          {!loading && error && (
            <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="admin-empty">No history items were found for this section.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-3">
              {mode === "audit" &&
                (items as AuditLog[]).map((item) => (
                  <div key={item.id} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        {item.severity === "warning" || item.severity === "error" ? (
                          <AlertTriangle size={16} className="text-amber-600" />
                        ) : (
                          <Shield size={16} className="text-accent" />
                        )}
                        {formatAuditLogTitle(item)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {formatAuditLogMeta(item)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.ipAddress} | {item.browser} | {item.deviceType}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.locationHint || "Location unavailable"}
                    </div>
                  </div>
                ))}

              {mode === "session" &&
                (items as AdminSessionActivity[]).map((item) => (
                  <div key={item.id} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        <Clock3 size={16} className="text-accent" />
                        {item.actorName || item.actorLoginId || "User"}
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${sessionStatusClass(item.status)}`}
                      >
                        {sessionStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {item.actorLoginId || "Unknown login"} | {item.ipAddress}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.browser} | {item.deviceType} | {item.locationHint || "Location unavailable"}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div>Login: {formatTimestamp(item.loginAt)}</div>
                      <div>Last seen: {formatTimestamp(item.lastSeenAt)}</div>
                      <div>
                        Ended: {item.endedAt ? formatTimestamp(item.endedAt) : "Still active"}
                      </div>
                    </div>
                    {item.endedReason && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {item.endedReason}
                      </div>
                    )}
                  </div>
                ))}

              {mode === "incident" &&
                (items as SuspiciousActivityGroup[]).map((item) => (
                  <div key={item.id} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        <AlertTriangle size={16} className="text-amber-600" />
                        {item.latestMessage}
                      </div>
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                        {item.count} event{item.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {(item.actorName || item.loginId || "Unknown account")} | {item.ipAddress}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.browser} | {item.deviceType} | {item.locationHint || "Location unavailable"}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div>First seen: {formatTimestamp(item.firstSeenAt)}</div>
                      <div>Last seen: {formatTimestamp(item.lastSeenAt)}</div>
                      <div>Status: {item.blocked ? "Blocked" : "Open"}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Types: {item.types.join(", ") || "Unknown"}
                    </div>
                  </div>
                ))}

              {(mode === "contact" || mode === "career") &&
                (items as SubmissionItem[]).map((item) => (
                  <div key={item.id} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        {mode === "contact" ? (
                          <Mail size={16} className="text-accent" />
                        ) : (
                          <BriefcaseBusiness size={16} className="text-accent" />
                        )}
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
                      <span>{item.email}</span>
                      <span>{item.phone}</span>
                      {mode === "career" && item.role && <span>{item.role}</span>}
                    </div>
                    <div className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
                      <UserRound size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>{previewText(item.message)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4 md:px-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Page {page} of {totalPages} | {total} total records
          </div>

          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) {
                      onPageChange(page - 1);
                    }
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {paginationTokens.map((token, index) => (
                <PaginationItem key={`${token}-${index}`}>
                  {token === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={token === page}
                      onClick={(event) => {
                        event.preventDefault();
                        onPageChange(token);
                      }}
                    >
                      {token}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) {
                      onPageChange(page + 1);
                    }
                  }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    </div>
  );
}
