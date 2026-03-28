export type ContentType =
  | "services"
  | "service_products"
  | "clients"
  | "jobs"
  | "gallery"
  | "projects"
  | "certificates"
  | "testimonials";
export type SubmissionType = "contact" | "career";
export type AuditHistoryScope = "admin_logins" | "panel" | "suspicious";
export type VerificationMethod = "email" | "authenticator";

export type AdminUser = {
  id: number;
  loginId: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  twoFactorEnabled: boolean;
  authenticatorEnabled: boolean;
  authenticatorPeriodSeconds: number;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
};

export type AdminSessionResponse = {
  authenticated: boolean;
  pendingOtp: boolean;
  admin?: AdminUser;
  emailMasked?: string | null;
  twoFactorEnabled?: boolean;
  verificationMethod?: VerificationMethod | null;
};

export type ContentItem = {
  id: number;
  type: ContentType;
  slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
  isPublished: boolean;
  showOnHomePage: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionReply = {
  id: number;
  subject: string;
  message: string;
  adminName: string | null;
  createdAt: string;
};

export type SubmissionItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string | null;
  message: string;
  status: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  replies: SubmissionReply[];
  visitorAlias: string;
  browser: string;
  deviceType: string;
  referrer: string | null;
  resumeFileName?: string | null;
  resumeOriginalName?: string | null;
  resumeMimeType?: string | null;
  resumeSizeBytes?: number | null;
};

export type AdminSessionActivity = {
  id: number;
  adminId: number | null;
  actorName: string | null;
  actorLoginId: string | null;
  actorRole: string | null;
  ipAddress: string;
  browser: string;
  deviceType: string;
  locationHint: string | null;
  requestFingerprint: string;
  loginAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  status: "active" | "logged_out" | "inactive";
  endedReason: string | null;
};

export type SuspiciousActivityGroup = {
  id: number;
  loginId: string | null;
  actorName: string | null;
  actorRole: string | null;
  ipAddress: string;
  browser: string;
  deviceType: string;
  locationHint: string | null;
  requestFingerprint: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  latestMessage: string;
  severity: string;
  count: number;
  types: string[];
  messages: string[];
  blocked: boolean;
};

export type DashboardSummary = {
  generatedAt: string;
  viewerRole: string;
  viewerPermissions: Record<string, boolean>;
  stats: {
    contactCount: number;
    careerCount: number;
    pageViews: number;
    formSubmissions: number;
    pendingInbox: number;
    uniqueVisitors: number;
    adminUsers: number;
    blockedIps: number;
  };
  topPages: Array<{
    page: string;
    total: number;
  }>;
  eventBreakdown: Array<{
    eventType: string;
    total: number;
  }>;
  contentBreakdown: Array<{
    type: string;
    total: number;
  }>;
  recentEvents: Array<{
    id: number;
    eventType: string;
    page: string;
    label: string | null;
    createdAt: string;
  }>;
  visitorActivity: Array<{
    visitorId: string | null;
    visitorAlias: string;
    browser: string;
    deviceType: string;
    referrer: string | null;
    firstSeen: string;
    lastSeen: string;
    lastPage: string;
    totalEvents: number;
    pageViews: number;
    formSubmissions: number;
    recentPages: string[];
    recentEvents: Array<{
      eventType: string;
      page: string;
      label: string | null;
      createdAt: string;
    }>;
    knownContact: {
      name: string;
      email: string;
      phone: string;
      source: string;
      role: string | null;
    } | null;
  }>;
  recentAdminLogins: AdminSessionActivity[];
  recentPanelActivity: AuditLog[];
  suspiciousActivity: SuspiciousActivityGroup[];
  blockedIps: string[];
  recentContacts: SubmissionItem[];
  recentCareers: SubmissionItem[];
};

export type AuditLog = {
  id: number;
  type: string;
  severity: string;
  message: string;
  actorId: number | null;
  actorName: string | null;
  actorLoginId: string | null;
  actorRole: string | null;
  ipAddress: string;
  ipHash: string;
  browser: string;
  deviceType: string;
  locationHint: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  blocked: boolean;
};

export type SecurityHistoryRecord = AuditLog | AdminSessionActivity | SuspiciousActivityGroup;

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HealthSummary = {
  databaseMode: string;
  storePath: string;
  storeReadable: boolean;
  storeWritable: boolean;
  storeSizeBytes: number;
  mailConfigured: boolean;
  uploadsPath: string;
  uploadsAvailable: boolean;
  phpVersion: string;
  backendTime: string;
  adminUsers: number;
  contactSubmissions: number;
  careerSubmissions: number;
  blockedIps: number;
  auditEvents: number;
  rateLimitBuckets: number;
  eventCount: number;
  contentItems: number;
  submissionsTotal: number;
  uploadsCount: number;
  recentEvents24h: number;
  recentAdminLogins24h: number;
  summaryBuildMs: number;
  memoryUsageMb: number;
  peakMemoryUsageMb: number;
  phpSapi: string;
  opcacheEnabled: boolean;
};

export type SiteSettings = {
  site_name: string;
  site_tagline: string;
  primary_brand_location: string;
  secondary_brand_name: string;
  secondary_brand_location: string;
  office_address: string;
  location_url: string;
  map_embed_url: string;
  primary_phone: string;
  secondary_phone: string;
  primary_email: string;
  contact_recipient_email: string;
  careers_recipient_email: string;
  business_hours_weekday: string;
  business_hours_weekend: string;
  sister_company_name: string;
  sister_company_url: string;
  sister_company_location: string;
  sister_company_note: string;
  mail_from_name: string;
  mail_from_email: string;
  security_alert_email: string;
  facebook_url: string;
  linkedin_url: string;
  twitter_url: string;
  instagram_url: string;
  two_factor_auth_enabled: boolean;
  authenticator_period_seconds: number;
};

export type PublicSiteSettings = Omit<
  SiteSettings,
  "contact_recipient_email" | "careers_recipient_email" | "mail_from_name" | "mail_from_email" | "security_alert_email" | "two_factor_auth_enabled"
>;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly data: Record<string, unknown> | null;

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function isHiddenAdminAccessError(error: unknown): boolean {
  return isApiRequestError(error) && (error.status === 403 || error.status === 404);
}

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "/api";
export const adminBackupDownloadUrl = `${apiBaseUrl}/admin/backup.php`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    cache: rest.cache ?? (body === undefined ? "no-store" : "default"),
    headers: {
      ...(!isFormData && body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  };

  const response = await fetch(`${apiBaseUrl}/${path}`, init);
  const contentType = response.headers.get("content-type") || "";
  const expectsJson = contentType.toLowerCase().includes("application/json");
  const rawBody = await response.text();
  let data: { error?: string; [key: string]: unknown } | null = null;

  if (expectsJson && rawBody.trim() !== "") {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      data = isRecord(parsed)
        ? (parsed as { error?: string; [key: string]: unknown })
        : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(data?.error || "Request failed.", response.status, data);
  }

  if (!expectsJson || data === null) {
    throw new Error(
      `Invalid API response from ${path}. Check that the PHP backend is running and VITE_API_BASE_URL points to it.`,
    );
  }

  return data as T;
}

export function fetchAdminSession() {
  return apiRequest<AdminSessionResponse>("admin/session.php");
}

export function loginAdmin(loginId: string, password: string) {
  return apiRequest<{
    message: string;
    pendingOtp: boolean;
    authenticated: boolean;
    emailMasked?: string;
    verificationMethod?: VerificationMethod | null;
    admin?: AdminUser;
  }>(
    "admin/login.php",
    {
      method: "POST",
      body: { loginId, password },
    },
  );
}

export function verifyAdminOtp(otp: string) {
  return apiRequest<{ message: string; admin: AdminUser }>("admin/verify-otp.php", {
    method: "POST",
    body: { otp },
  });
}

export function logoutAdmin() {
  return apiRequest<{ message: string }>("admin/logout.php", {
    method: "POST",
  });
}

export function requestPasswordChange(payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string; emailMasked?: string; verificationMethod?: VerificationMethod }>(
    "admin/request-password-change.php",
    {
      method: "POST",
      body: payload,
    },
  );
}

export function verifyPasswordChangeOtp(otp: string) {
  return apiRequest<{ message: string }>("admin/verify-password-change.php", {
    method: "POST",
    body: { otp },
  });
}

export function requestAccountUpdate(payload: {
  loginId: string;
  email: string;
  phone: string;
}) {
  return apiRequest<{ message: string; emailMasked?: string; verificationMethod?: VerificationMethod }>(
    "admin/request-account-update.php",
    {
      method: "POST",
      body: payload,
    },
  );
}

export function verifyAccountUpdateOtp(otp: string) {
  return apiRequest<{ message: string; admin: AdminUser }>(
    "admin/verify-account-update.php",
    {
      method: "POST",
      body: { otp },
    },
  );
}

export function requestPasswordReset(loginId: string) {
  return apiRequest<{ message: string; emailMasked?: string; verificationMethod?: VerificationMethod }>(
    "admin/request-password-reset.php",
    {
      method: "POST",
      body: { loginId },
    },
  );
}

export function verifyPasswordResetOtp(otp: string) {
  return apiRequest<{ message: string }>("admin/verify-password-reset.php", {
    method: "POST",
    body: { otp },
  });
}

export function completePasswordReset(payload: {
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>("admin/complete-password-reset.php", {
    method: "POST",
    body: payload,
  });
}

export function fetchDashboardSummary() {
  return apiRequest<DashboardSummary>("admin/dashboard.php");
}

export function fetchAdminBootstrap() {
  return apiRequest<{
    admin: AdminUser;
    settings: SiteSettings;
    dashboard: DashboardSummary;
    health: HealthSummary | null;
    users: AdminUser[];
  }>("admin/bootstrap.php");
}

export function fetchSubmissions(type: SubmissionType) {
  return apiRequest<{ items: SubmissionItem[] }>(`admin/submissions.php?type=${type}`);
}

export function updateSubmission(
  type: SubmissionType,
  payload: { id: number; status: string; adminNotes: string },
) {
  return apiRequest<{ message: string; items: SubmissionItem[] }>(
    `admin/submissions.php?type=${type}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function sendSubmissionReply(payload: {
  submissionType: SubmissionType;
  submissionId: number;
  subject: string;
  message: string;
}) {
  return apiRequest<{ message: string; items: SubmissionItem[] }>("admin/reply.php", {
    method: "POST",
    body: payload,
  });
}

export function fetchContent(type: ContentType, admin = false) {
  const scope = admin ? "admin" : "public";
  return apiRequest<{ items: ContentItem[] }>(`${scope}/content.php?type=${type}`);
}

export function fetchHomepageContent(type: ContentType) {
  return apiRequest<{ items: ContentItem[] }>(`public/content.php?type=${type}&homepage=1`);
}

export function saveContent(item: Partial<ContentItem> & { type: ContentType; title: string }) {
  return apiRequest<{ message: string; item: ContentItem; items: ContentItem[] }>(
    "admin/content.php",
    {
      method: "POST",
      body: item,
    },
  );
}

export function deleteContent(type: ContentType, id: number) {
  return apiRequest<{ message: string; items: ContentItem[] }>("admin/content.php", {
    method: "DELETE",
    body: { type, id },
  });
}

export function fetchSettings() {
  return apiRequest<{ settings: SiteSettings }>("admin/settings.php");
}

export function fetchPublicSettings() {
  return apiRequest<{ settings: PublicSiteSettings }>(
    "public/settings.php",
  );
}

export function saveSettings(settings: Partial<SiteSettings>) {
  return apiRequest<{ message: string; settings: SiteSettings }>("admin/settings.php", {
    method: "POST",
    body: settings,
  });
}

export function fetchAdminUsers() {
  return apiRequest<{ items: AdminUser[] }>("admin/users.php");
}

export function saveAdminUser(payload: {
  id?: number;
  action?: "create" | "save" | "reset_password";
  name?: string;
  loginId?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
}) {
  return apiRequest<{
    message: string;
    item?: AdminUser;
    items: AdminUser[];
  }>("admin/users.php", {
    method: "POST",
    body: payload,
  });
}

export function deleteAdminUser(id: number) {
  return apiRequest<{ message: string; items: AdminUser[] }>("admin/users.php", {
    method: "DELETE",
    body: { id },
  });
}

export function fetchHealthSummary() {
  return apiRequest<{ health: HealthSummary }>("admin/health.php");
}

export function fetchSecuritySummary() {
  return apiRequest<{
    suspiciousActivity: SuspiciousActivityGroup[];
    blockedIps: string[];
    recentAdminLogins: AdminSessionActivity[];
    recentPanelActivity: AuditLog[];
  }>("admin/security.php");
}

export function fetchAuditHistory(
  scope: AuditHistoryScope,
  page = 1,
  pageSize = 8,
) {
  return apiRequest<PaginatedResponse<SecurityHistoryRecord>>(
    `admin/security.php?scope=${scope}&page=${page}&pageSize=${pageSize}`,
  );
}

export function updateBlockedIp(
  action: "block" | "unblock",
  ipAddress: string,
  adminPassword?: string,
) {
  return apiRequest<{
    message: string;
    suspiciousActivity: SuspiciousActivityGroup[];
    blockedIps: string[];
    recentAdminLogins: AdminSessionActivity[];
    recentPanelActivity: AuditLog[];
  }>("admin/security.php", {
    method: "POST",
    body: { action, ipAddress, adminPassword },
  });
}

export function clearLoginLock(loginId: string, requestFingerprint?: string) {
  return apiRequest<{
    message: string;
    suspiciousActivity: SuspiciousActivityGroup[];
    blockedIps: string[];
    recentAdminLogins: AdminSessionActivity[];
    recentPanelActivity: AuditLog[];
  }>("admin/security.php", {
    method: "POST",
    body: {
      action: "clear_login_lock",
      loginId,
      requestFingerprint,
    },
  });
}

export function startAdminAuthenticatorSetup() {
  return apiRequest<{
    message: string;
    secret: string;
    otpauthUri: string;
    accountLabel: string;
    issuer: string;
    periodSeconds: number;
  }>("admin/totp.php", {
    method: "POST",
    body: { action: "start" },
  });
}

export function enableAdminAuthenticator(code: string) {
  return apiRequest<{ message: string; admin: AdminUser }>("admin/totp.php", {
    method: "POST",
    body: { action: "enable", code },
  });
}

export function disableAdminAuthenticator(code: string) {
  return apiRequest<{ message: string; admin: AdminUser }>("admin/totp.php", {
    method: "POST",
    body: { action: "disable", code },
  });
}

export function requestAdminUserPasswordReset(payload: {
  id: number;
  newPassword: string;
  confirmPassword: string;
  adminPassword: string;
}) {
  return apiRequest<{ message: string; emailMasked?: string; verificationMethod?: VerificationMethod }>(
    "admin/request-user-password-reset.php",
    {
      method: "POST",
      body: payload,
    },
  );
}

export function verifyAdminUserPasswordResetOtp(otp: string) {
  return apiRequest<{ message: string; items: AdminUser[] }>(
    "admin/verify-user-password-reset.php",
    {
      method: "POST",
      body: { otp },
    },
  );
}

export function submitContactForm(payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  return apiRequest<{ message: string }>("public/contact-submit.php", {
    method: "POST",
    body: payload,
  });
}

export function submitCareerForm(payload: {
  name: string;
  email: string;
  phone: string;
  role: string;
  message: string;
  resume: File;
}) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  formData.append("role", payload.role);
  formData.append("message", payload.message);
  formData.append("resume", payload.resume);

  return apiRequest<{ message: string }>("public/careers-submit.php", {
    method: "POST",
    body: formData,
  });
}

export function trackEvent(payload: {
  eventType: string;
  page: string;
  label?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<{ message: string }>("public/track.php", {
    method: "POST",
    body: payload,
  });
}
