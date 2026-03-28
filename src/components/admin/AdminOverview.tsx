import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Database,
  Eye,
  FileText,
  Inbox,
  Mail,
  ShieldAlert,
  Users,
} from "lucide-react";
import AdminHistoryDialog from "@/components/admin/AdminHistoryDialog";
import { formatAuditLogMeta, formatAuditLogTitle } from "@/lib/adminActivity";
import {
  fetchAuditHistory,
  fetchSubmissions,
  type AdminSessionActivity,
  type AuditHistoryScope,
  type DashboardSummary,
  type SecurityHistoryRecord,
  type SubmissionItem,
} from "@/lib/cmsApi";

type AdminOverviewProps = {
  dashboard: DashboardSummary | null;
  dashboardError: string | null;
  contactCount: number;
  careerCount: number;
  refreshing: boolean;
  contacts: SubmissionItem[];
  careers: SubmissionItem[];
};

type HistoryState = {
  open: boolean;
  scope: AuditHistoryScope | "contact" | "career";
  page: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  items: SecurityHistoryRecord[] | SubmissionItem[];
  sourceItems?: SubmissionItem[];
};

const HISTORY_PAGE_SIZE = 8;

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Mail;
}) {
  return (
    <div className="admin-card relative flex min-h-[10.5rem] flex-col justify-between overflow-hidden px-5 py-5 sm:px-6">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/8 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="rounded-2xl border border-accent/10 bg-accent/10 p-3 text-accent shadow-sm shadow-accent/10">
          <Icon size={20} />
        </div>
        <div className="text-right text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/65">
          Live
        </div>
      </div>
      <div className="relative mt-6">
        <div className="font-condensed text-4xl font-black leading-none text-primary sm:text-5xl">
          {value}
        </div>
        <div className="mt-3 max-w-[11rem] text-xs font-medium uppercase leading-6 tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 className="font-condensed text-3xl font-black leading-none text-primary">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="highlight-line mt-4" />
      </div>
      {action}
    </div>
  );
}

function formatAdminTimestamp(value: string | null) {
  if (!value) {
    return "Never";
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

function sessionStatusClass(status: AdminSessionActivity["status"]) {
  return status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "logged_out"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
}

function sessionStatusLabel(status: AdminSessionActivity["status"]) {
  return status === "active"
    ? "Active"
    : status === "logged_out"
      ? "Logged Out"
      : "Inactive";
}

function sessionIdentity(session: AdminSessionActivity) {
  const actorKey =
    session.actorLoginId ||
    (session.adminId !== null ? String(session.adminId) : "") ||
    session.actorName ||
    "unknown";
  const deviceKey =
    session.requestFingerprint ||
    `${session.browser}|${session.deviceType}|${session.ipAddress}`;

  return `${actorKey}::${deviceKey}`;
}

export default function AdminOverview({
  dashboard,
  dashboardError,
  contactCount,
  careerCount,
  refreshing,
  contacts,
  careers,
}: AdminOverviewProps) {
  const isPrimaryAdmin = dashboard?.viewerRole === "admin";
  const [history, setHistory] = useState<HistoryState>({
    open: false,
    scope: "contact",
    page: 1,
    total: 0,
    totalPages: 1,
    loading: false,
    error: null,
    items: [],
    sourceItems: [],
  });

  const visibleRecentAdminLogins = useMemo(() => {
    const sessions = dashboard?.recentAdminLogins || [];
    const keysWithCurrentState = new Set(
      sessions
        .filter((session) => session.status !== "inactive")
        .map((session) => sessionIdentity(session)),
    );

    return sessions.filter((session) => {
      if (session.status !== "inactive") {
        return true;
      }

      return !keysWithCurrentState.has(sessionIdentity(session));
    });
  }, [dashboard?.recentAdminLogins]);

  const historyMeta = useMemo(() => {
    if (history.scope === "admin_logins") {
      return {
        title: "Admin Login History",
        description: "Recent admin panel sessions grouped by user and device.",
        mode: "session" as const,
      };
    }

    if (history.scope === "panel") {
      return {
        title: "Panel Activity History",
        description: "Administrative actions and security-sensitive changes performed inside the panel.",
        mode: "audit" as const,
      };
    }

    if (history.scope === "suspicious") {
      return {
        title: "Suspicious Activity History",
        description: "Grouped warnings, failed attempts, and security anomalies recorded by the backend.",
        mode: "incident" as const,
      };
    }

    if (history.scope === "career") {
      return {
        title: "Career Submission History",
        description: "Paged history of career applications received through the website.",
        mode: "career" as const,
      };
    }

    return {
      title: "Contact Submission History",
      description: "Paged history of contact inquiries received through the website.",
      mode: "contact" as const,
    };
  }, [history.scope]);

  const loadAuditHistory = async (scope: AuditHistoryScope, page: number) => {
    setHistory((current) => ({
      ...current,
      open: true,
      scope,
      page,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetchAuditHistory(scope, page, HISTORY_PAGE_SIZE);
      setHistory({
        open: true,
        scope,
        page: response.page,
        total: response.total,
        totalPages: response.totalPages,
        loading: false,
        error: null,
        items: response.items,
      });
    } catch (error) {
      setHistory((current) => ({
        ...current,
        open: true,
        scope,
        page,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load history.",
      }));
    }
  };

  const openSubmissionHistory = async (scope: "contact" | "career") => {
    const sourceItems = scope === "contact" ? contacts : careers;
    const knownTotal =
      scope === "contact"
        ? (dashboard?.stats.contactCount ?? sourceItems.length)
        : (dashboard?.stats.careerCount ?? sourceItems.length);

    if (sourceItems.length === 0 && knownTotal > 0) {
      setHistory({
        open: true,
        scope,
        page: 1,
        total: knownTotal,
        totalPages: Math.max(1, Math.ceil(knownTotal / HISTORY_PAGE_SIZE)),
        loading: true,
        error: null,
        items: [],
        sourceItems: [],
      });

      try {
        const response = await fetchSubmissions(scope);
        const totalPages = Math.max(1, Math.ceil(response.items.length / HISTORY_PAGE_SIZE));
        setHistory({
          open: true,
          scope,
          page: 1,
          total: response.items.length,
          totalPages,
          loading: false,
          error: null,
          items: response.items.slice(0, HISTORY_PAGE_SIZE),
          sourceItems: response.items,
        });
      } catch (error) {
        setHistory((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load submission history.",
        }));
      }
      return;
    }

    const totalPages = Math.max(1, Math.ceil(sourceItems.length / HISTORY_PAGE_SIZE));

    setHistory({
      open: true,
      scope,
      page: 1,
      total: sourceItems.length,
      totalPages,
      loading: false,
      error: null,
      items: sourceItems.slice(0, HISTORY_PAGE_SIZE),
      sourceItems,
    });
  };

  useEffect(() => {
    if (!history.open || (history.scope !== "contact" && history.scope !== "career")) {
      return;
    }

    const sourceItems =
      history.sourceItems && history.sourceItems.length > 0
        ? history.sourceItems
        : history.scope === "contact"
          ? contacts
          : careers;
    const totalPages = Math.max(1, Math.ceil(sourceItems.length / HISTORY_PAGE_SIZE));
    const page = Math.min(history.page, totalPages);
    const pageItems = sourceItems.slice(
      (page - 1) * HISTORY_PAGE_SIZE,
      page * HISTORY_PAGE_SIZE,
    );

    setHistory((current) => ({
      ...current,
      page,
      total: sourceItems.length,
      totalPages,
      items: pageItems,
      sourceItems,
    }));
  }, [careers, contacts, history.open, history.page, history.scope, history.sourceItems]);

  const handleHistoryPageChange = (page: number) => {
    if (history.scope === "contact" || history.scope === "career") {
      setHistory((current) => ({ ...current, page }));
      return;
    }

    void loadAuditHistory(history.scope, page);
  };

  return (
    <>
      <div className="space-y-6">
        <section className="admin-card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-condensed text-3xl font-black leading-none text-primary">
              Live Dashboard
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Dashboard content refreshes from the backend so inbox, admin activity, and security posture stay current.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {refreshing ? "Syncing now" : "Live sync on"}
            </span>
            {dashboard?.generatedAt && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Updated {formatAdminTimestamp(dashboard.generatedAt)}
              </span>
            )}
          </div>
        </section>

        {dashboardError && (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800 shadow-card">
            Dashboard analytics could not be loaded from the PHP backend. Inbox and content tools still work, but the summary cards will stay stale until the backend responds correctly.
            <div className="mt-2 text-amber-700/85">{dashboardError}</div>
          </section>
        )}

        <section className="admin-card p-6 md:p-7">
          <SectionTitle
            title="Quick Stats"
            description={
              isPrimaryAdmin
                ? "A live summary of inquiries, applications, traffic, users, and security posture."
                : "A live summary of inquiries, applications, and current inbox workload."
            }
          />
          <div className="mt-6 grid auto-rows-fr gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] md:gap-5 xl:[grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
            <StatCard label="Contacts" value={dashboard?.stats.contactCount ?? contactCount} icon={Mail} />
            <StatCard
              label="Applications"
              value={dashboard?.stats.careerCount ?? careerCount}
              icon={BriefcaseBusiness}
            />
            <StatCard label="Page Views" value={dashboard?.stats.pageViews ?? 0} icon={Eye} />
            <StatCard label="Form Events" value={dashboard?.stats.formSubmissions ?? 0} icon={FileText} />
            <StatCard label="Pending Inbox" value={dashboard?.stats.pendingInbox ?? 0} icon={Inbox} />
            {isPrimaryAdmin && (
              <>
                <StatCard label="Visitors" value={dashboard?.stats.uniqueVisitors ?? 0} icon={Users} />
                <StatCard label="Panel Users" value={dashboard?.stats.adminUsers ?? 0} icon={Database} />
                <StatCard label="Blocked IPs" value={dashboard?.stats.blockedIps ?? 0} icon={ShieldAlert} />
              </>
            )}
          </div>
        </section>

        {isPrimaryAdmin ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <section className="admin-card p-6 md:p-7">
                <SectionTitle
                  title="Recent Admin Logins"
                  description="Latest admin sessions by user and device. Older inactive duplicates are hidden here, while full history remains available."
                  action={
                    <button
                      type="button"
                      onClick={() => void loadAuditHistory("admin_logins", 1)}
                      className="admin-btn-secondary"
                    >
                      History
                    </button>
                  }
                />
                <div className="mt-5 space-y-3">
                  {visibleRecentAdminLogins.length === 0 && (
                    <div className="admin-empty">No admin logins recorded yet.</div>
                  )}

                  {visibleRecentAdminLogins.map((session) => (
                    <div key={session.id} className="admin-soft-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-primary">
                          {session.actorName || session.actorLoginId || "User"}
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${sessionStatusClass(session.status)}`}
                        >
                          {sessionStatusLabel(session.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {session.actorLoginId || "Unknown login"} | {session.ipAddress}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {session.browser} | {session.deviceType} | {session.locationHint || "Location unavailable"}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                        <div>Login: {formatAdminTimestamp(session.loginAt)}</div>
                        <div>Last seen: {formatAdminTimestamp(session.lastSeenAt)}</div>
                        <div>
                          Ended: {session.endedAt ? formatAdminTimestamp(session.endedAt) : "Still active"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-card p-6 md:p-7">
                <SectionTitle
                  title="Panel Activity"
                  description="Recent actions performed by admin panel users."
                  action={
                    <button
                      type="button"
                      onClick={() => void loadAuditHistory("panel", 1)}
                      className="admin-btn-secondary"
                    >
                      History
                    </button>
                  }
                />
                <div className="mt-5 space-y-3">
                  {(dashboard?.recentPanelActivity || []).length === 0 && (
                    <div className="admin-empty">No panel actions recorded yet.</div>
                  )}

                  {(dashboard?.recentPanelActivity || []).map((log) => (
                    <div key={log.id} className="admin-soft-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                          <Activity size={16} className="text-accent" />
                          {formatAuditLogTitle(log)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatAdminTimestamp(log.createdAt)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {formatAuditLogMeta(log)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="admin-card p-6 md:p-7">
                <SectionTitle
                  title="Top Pages"
                  description="See which public routes are attracting the most attention."
                />
                <div className="mt-5 space-y-3">
                  {(dashboard?.topPages || []).length === 0 && (
                    <div className="admin-empty">No analytics data yet.</div>
                  )}

                  {(dashboard?.topPages || []).map((page) => (
                    <div key={page.page} className="admin-soft-card flex items-center justify-between px-4 py-4">
                      <div className="text-sm font-semibold text-primary">{page.page}</div>
                      <div className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                        {page.total}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-card p-6 md:p-7">
                <SectionTitle
                  title="Suspicious Activity"
                  description="Grouped warnings and failed attempts, merged by user, device, and IP."
                  action={
                    <button
                      type="button"
                      onClick={() => void loadAuditHistory("suspicious", 1)}
                      className="admin-btn-secondary"
                    >
                      History
                    </button>
                  }
                />
                <div className="mt-5 space-y-3">
                  {(dashboard?.suspiciousActivity || []).length === 0 && (
                    <div className="admin-empty">No suspicious activity detected.</div>
                  )}

                  {(dashboard?.suspiciousActivity || []).map((incident) => (
                    <div key={incident.id} className="admin-soft-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-primary">{incident.latestMessage}</div>
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                          {incident.count} event{incident.count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {(incident.actorName || incident.loginId || "Unknown account")} | {incident.ipAddress}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {incident.browser} | {incident.deviceType} | {incident.locationHint || "Location unavailable"}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                        <div>First seen: {formatAdminTimestamp(incident.firstSeenAt)}</div>
                        <div>Last seen: {formatAdminTimestamp(incident.lastSeenAt)}</div>
                        <div>Blocked: {incident.blocked ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="admin-card p-6 md:p-7">
              <SectionTitle
                title="Recent Contact Leads"
                description="The latest contact inquiries needing attention."
                action={
                  <button
                    type="button"
                      onClick={() => void openSubmissionHistory("contact")}
                    className="admin-btn-secondary"
                  >
                    History
                  </button>
                }
              />
              <div className="mt-5 space-y-3">
                {(dashboard?.recentContacts || []).length === 0 && (
                  <div className="admin-empty">No contact leads yet.</div>
                )}

                {(dashboard?.recentContacts || []).map((item) => (
                  <div key={`contact-${item.id}`} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatAdminTimestamp(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{item.email}</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {item.message.slice(0, 140)}{item.message.length > 140 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-card p-6 md:p-7">
              <SectionTitle
                title="Recent Applications"
                description="The latest career applications coming into the hiring inbox."
                action={
                  <button
                    type="button"
                      onClick={() => void openSubmissionHistory("career")}
                    className="admin-btn-secondary"
                  >
                    History
                  </button>
                }
              />
              <div className="mt-5 space-y-3">
                {(dashboard?.recentCareers || []).length === 0 && (
                  <div className="admin-empty">No applications yet.</div>
                )}

                {(dashboard?.recentCareers || []).map((item) => (
                  <div key={`career-${item.id}`} className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-primary">
                        {item.name} | {item.role || "Role not set"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatAdminTimestamp(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{item.email}</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {item.message.slice(0, 140)}{item.message.length > 140 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <AdminHistoryDialog
        open={history.open}
        title={historyMeta.title}
        description={historyMeta.description}
        mode={historyMeta.mode}
        items={history.items}
        page={history.page}
        totalPages={history.totalPages}
        total={history.total}
        loading={history.loading}
        error={history.error}
        onPageChange={handleHistoryPageChange}
        onClose={() =>
          setHistory((current) => ({
            ...current,
            open: false,
            error: null,
            sourceItems: [],
          }))
        }
      />
    </>
  );
}
