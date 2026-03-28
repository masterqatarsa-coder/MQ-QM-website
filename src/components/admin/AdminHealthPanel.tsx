import { Activity, AlertTriangle, Database, Gauge, HardDrive, Mail, Shield, ShieldBan } from "lucide-react";
import type { AdminSessionActivity, DashboardSummary, HealthSummary } from "@/lib/cmsApi";

type AdminHealthPanelProps = {
  health: HealthSummary | null;
  dashboard: DashboardSummary | null;
  blockingIp: string | null;
  unlockingLoginKey: string | null;
  onBlockIp: (ipAddress: string) => void;
  onUnblockIp: (ipAddress: string) => void;
  onClearLoginLock: (loginId: string, requestFingerprint?: string) => void;
};

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

function HealthCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Database;
}) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-condensed text-3xl font-black leading-none text-primary">
            {value}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminHealthPanel({
  health,
  dashboard,
  blockingIp,
  unlockingLoginKey,
  onBlockIp,
  onUnblockIp,
  onClearLoginLock,
}: AdminHealthPanelProps) {
  return (
    <div className="space-y-6">
      <section className="admin-card p-6 md:p-7">
        <div className="admin-kicker">System Status</div>
        <h3 className="mt-4 font-condensed text-3xl font-black leading-none text-primary">
          Backend, storage, and security health
        </h3>
        <div className="highlight-line mt-4" />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HealthCard label="Database Mode" value={health?.databaseMode || "Unknown"} icon={Database} />
          <HealthCard
            label="Mail"
            value={health?.mailConfigured ? "Configured" : "Not ready"}
            icon={Mail}
          />
          <HealthCard
            label="Health Build"
            value={health ? `${health.summaryBuildMs} ms` : "Unknown"}
            icon={Gauge}
          />
          <HealthCard
            label="Blocked IPs"
            value={String(health?.blockedIps ?? dashboard?.stats.blockedIps ?? 0)}
            icon={ShieldBan}
          />
          <HealthCard
            label="Audit Events"
            value={String(health?.auditEvents ?? dashboard?.recentPanelActivity.length ?? 0)}
            icon={Shield}
          />
          <HealthCard
            label="Store Size"
            value={health ? `${Math.max(1, Math.round(health.storeSizeBytes / 1024))} KB` : "Unknown"}
            icon={HardDrive}
          />
          <HealthCard
            label="Submissions"
            value={String(health?.submissionsTotal ?? 0)}
            icon={Activity}
          />
          <HealthCard
            label="Events (24h)"
            value={String(health?.recentEvents24h ?? 0)}
            icon={Activity}
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="admin-soft-card p-4">
            <div className="text-sm font-semibold text-primary">Runtime details</div>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">PHP</div>
                <div className="mt-1">{health?.phpVersion || "Unknown"} via {health?.phpSapi || "Unknown"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Backend Time</div>
                <div className="mt-1">{formatAdminTimestamp(health?.backendTime || null)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Store Access</div>
                <div className="mt-1">
                  {health?.storeReadable ? "Readable" : "Unreadable"} | {health?.storeWritable ? "Writable" : "Read-only"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Uploads</div>
                <div className="mt-1">
                  {health?.uploadsAvailable ? "Ready" : "Unavailable"} | {health?.uploadsCount ?? 0} files
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Memory</div>
                <div className="mt-1">
                  {health?.memoryUsageMb ?? 0} MB current | {health?.peakMemoryUsageMb ?? 0} MB peak
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Opcache</div>
                <div className="mt-1">{health?.opcacheEnabled ? "Enabled" : "Disabled"}</div>
              </div>
            </div>
          </div>

          <div className="admin-soft-card p-4">
            <div className="text-sm font-semibold text-primary">Data summary</div>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Admin Users</div>
                <div className="mt-1">{health?.adminUsers ?? 0}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Content Items</div>
                <div className="mt-1">{health?.contentItems ?? 0}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tracked Events</div>
                <div className="mt-1">{health?.eventCount ?? 0}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rate Limit Buckets</div>
                <div className="mt-1">{health?.rateLimitBuckets ?? 0}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recent Admin Logins (24h)</div>
                <div className="mt-1">{health?.recentAdminLogins24h ?? 0}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Store Path</div>
                <div className="mt-1 break-all">{health?.storePath || "Unavailable"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="admin-card p-6 md:p-7">
          <div className="font-condensed text-3xl font-black leading-none text-primary">
            Recent Admin Logins
          </div>
          <div className="highlight-line mt-4" />
          <div className="mt-5 space-y-3">
            {(dashboard?.recentAdminLogins || []).length === 0 && (
              <div className="admin-empty">No admin logins recorded yet.</div>
            )}

            {(dashboard?.recentAdminLogins || []).map((session) => (
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
          <div className="font-condensed text-3xl font-black leading-none text-primary">
            Suspicious Activity
          </div>
          <div className="highlight-line mt-4" />
          <div className="mt-5 space-y-3">
            {(dashboard?.suspiciousActivity || []).length === 0 && (
              <div className="admin-empty">No suspicious activity detected.</div>
            )}

            {(dashboard?.suspiciousActivity || []).map((incident) => {
              const isBlocked = (dashboard?.blockedIps || []).includes(incident.ipAddress);
              const loginId = incident.loginId || "";
              const requestFingerprint = incident.requestFingerprint || undefined;
              const unlockKey = loginId ? `${loginId}:${requestFingerprint || "no-fingerprint"}` : null;

              return (
                <div key={incident.id} className="admin-soft-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <AlertTriangle size={16} className="text-amber-600" />
                      {incident.latestMessage}
                    </div>
                    <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {incident.count} event{incident.count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {incident.actorName || incident.loginId || "Unknown account"} | {incident.ipAddress}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {incident.browser} | {incident.deviceType} | {incident.locationHint || "Location unavailable"}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <div>First seen: {formatAdminTimestamp(incident.firstSeenAt)}</div>
                    <div>Last seen: {formatAdminTimestamp(incident.lastSeenAt)}</div>
                    <div>Blocked: {incident.blocked ? "Yes" : "No"}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {loginId && (
                      <button
                        type="button"
                        onClick={() => onClearLoginLock(loginId, requestFingerprint)}
                        disabled={unlockingLoginKey === unlockKey}
                        className="rounded-[1rem] border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                      >
                        {unlockingLoginKey === unlockKey ? "Allowing..." : "Allow Login"}
                      </button>
                    )}
                    {!isBlocked ? (
                      <button
                        type="button"
                        onClick={() => onBlockIp(incident.ipAddress)}
                        disabled={blockingIp === incident.ipAddress}
                        className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                      >
                        {blockingIp === incident.ipAddress ? "Blocking..." : "Block Request"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUnblockIp(incident.ipAddress)}
                        disabled={blockingIp === incident.ipAddress}
                        className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {blockingIp === incident.ipAddress ? "Updating..." : "Unblock"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="admin-card p-6 md:p-7">
        <div className="font-condensed text-3xl font-black leading-none text-primary">
          Blocked Clients
        </div>
        <div className="highlight-line mt-4" />
        <div className="mt-5 flex flex-wrap gap-3">
          {(dashboard?.blockedIps || []).length === 0 && (
            <div className="admin-empty">No blocked IP addresses.</div>
          )}

          {(dashboard?.blockedIps || []).map((ipAddress) => (
            <div key={ipAddress} className="admin-soft-card flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-semibold text-primary">{ipAddress}</span>
              <button
                type="button"
                onClick={() => onUnblockIp(ipAddress)}
                disabled={blockingIp === ipAddress}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 disabled:opacity-60"
              >
                {blockingIp === ipAddress ? "Updating..." : "Unblock"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
