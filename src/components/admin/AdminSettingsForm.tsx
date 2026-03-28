import { type ReactNode, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  disableAdminAuthenticator,
  enableAdminAuthenticator,
  requestAccountUpdate,
  requestPasswordChange,
  startAdminAuthenticatorSetup,
  verifyAccountUpdateOtp,
  verifyPasswordChangeOtp,
  type AdminUser,
  type HealthSummary,
  type SiteSettings,
  type VerificationMethod,
} from "@/lib/cmsApi";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AdminUserManagement from "@/components/admin/AdminUserManagement";

type AdminSettingsFormProps = {
  admin: AdminUser | null;
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
  onSave: () => void;
  saving: boolean;
  onAdminChange: (admin: AdminUser) => void;
  health: HealthSummary | null;
  backupDownloadUrl: string;
  canManageUsers: boolean;
  users: AdminUser[];
  userSaving: boolean;
  onCreateUser: (payload: {
    name: string;
    loginId: string;
    email: string;
    phone: string;
    role: string;
    twoFactorEnabled: boolean;
    isActive: boolean;
    password: string;
    permissions?: Record<string, boolean>;
  }) => void;
  onUpdateUser: (payload: {
    id?: number;
    name: string;
    loginId: string;
    email: string;
    phone: string;
    role: string;
    twoFactorEnabled: boolean;
    isActive: boolean;
    password?: string;
    permissions?: Record<string, boolean>;
  }) => void;
  onDeleteUser: (id: number) => void;
  onUsersUpdated: (users: AdminUser[]) => void;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  revealable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "password" | "tel";
  placeholder?: string;
  autoComplete?: string;
  revealable?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          type={revealable ? (visible ? "text" : type) : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`admin-input ${revealable ? "pr-12" : ""}`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-primary"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-textarea"
      />
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-card p-5 md:p-6">
      <div className="mb-5">
        <div className="admin-kicker">Section</div>
        <h4 className="mt-4 font-condensed text-3xl font-black leading-none text-primary">
          {title}
        </h4>
        <div className="highlight-line mt-4" />
        <p className="mt-4 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function OtpVerifier({
  title,
  description,
  value,
  onChange,
  onConfirm,
  onCancel,
  confirming,
  confirmLabel,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  confirmLabel: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-4">
      <div className="text-sm font-semibold text-primary">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{description}</div>

      <div className="mt-4 flex justify-center md:justify-start">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={onChange}
          containerClassName="justify-center md:justify-start"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-11 w-11 border-slate-200 bg-white text-primary"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="admin-btn-primary disabled:opacity-70"
        >
          {confirming ? "Verifying..." : confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className="admin-btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsForm({
  admin,
  settings,
  onChange,
  onSave,
  saving,
  onAdminChange,
  health,
  backupDownloadUrl,
  canManageUsers,
  users,
  userSaving,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onUsersUpdated,
}: AdminSettingsFormProps) {
  const [accountDraft, setAccountDraft] = useState({
    loginId: "",
    email: "",
    phone: "",
  });
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountOtpPending, setAccountOtpPending] = useState(false);
  const [accountOtpEmailMasked, setAccountOtpEmailMasked] = useState<string | null>(null);
  const [accountVerificationMethod, setAccountVerificationMethod] = useState<VerificationMethod>("email");
  const [accountOtp, setAccountOtp] = useState("");
  const [accountVerifying, setAccountVerifying] = useState(false);

  const [passwordDraft, setPasswordDraft] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordOtpPending, setPasswordOtpPending] = useState(false);
  const [passwordOtpEmailMasked, setPasswordOtpEmailMasked] = useState<string | null>(null);
  const [passwordVerificationMethod, setPasswordVerificationMethod] = useState<VerificationMethod>("email");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordVerifying, setPasswordVerifying] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpDisabling, setTotpDisabling] = useState(false);

  useEffect(() => {
    setAccountDraft({
      loginId: admin?.loginId || "",
      email: admin?.email || "",
      phone: admin?.phone || "",
    });
  }, [admin?.email, admin?.loginId, admin?.phone]);

  const handleAccountUpdateRequest = async () => {
    if (!window.confirm("Do you want to request verification for these admin account changes?")) {
      return;
    }

    setAccountSubmitting(true);

    try {
      const response = await requestAccountUpdate(accountDraft);
      setAccountOtpPending(true);
      setAccountOtp("");
      setAccountOtpEmailMasked(response.emailMasked || null);
      setAccountVerificationMethod(
        response.verificationMethod === "authenticator" ? "authenticator" : "email",
      );
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start account update verification.",
      );
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleAccountUpdateVerify = async () => {
    if (accountOtp.length !== 6) {
      toast.error("Enter the full 6-digit verification code.");
      return;
    }

    setAccountVerifying(true);

    try {
      const response = await verifyAccountUpdateOtp(accountOtp);
      onAdminChange(response.admin);
      setAccountOtpPending(false);
      setAccountOtp("");
      setAccountOtpEmailMasked(null);
      setAccountVerificationMethod("email");
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify the account update code.",
      );
    } finally {
      setAccountVerifying(false);
    }
  };

  const handlePasswordChangeRequest = async () => {
    if (!window.confirm("Do you want to request verification for this password change?")) {
      return;
    }

    setPasswordSubmitting(true);

    try {
      const response = await requestPasswordChange(passwordDraft);
      setPasswordOtpPending(true);
      setPasswordOtp("");
      setPasswordOtpEmailMasked(response.emailMasked || null);
      setPasswordVerificationMethod(
        response.verificationMethod === "authenticator" ? "authenticator" : "email",
      );
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start password change verification.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handlePasswordChangeVerify = async () => {
    if (passwordOtp.length !== 6) {
      toast.error("Enter the full 6-digit verification code.");
      return;
    }

    setPasswordVerifying(true);

    try {
      const response = await verifyPasswordChangeOtp(passwordOtp);
      setPasswordDraft({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordOtpPending(false);
      setPasswordOtp("");
      setPasswordOtpEmailMasked(null);
      setPasswordVerificationMethod("email");
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify the password change code.",
      );
    } finally {
      setPasswordVerifying(false);
    }
  };

  const handleStartAuthenticatorSetup = async () => {
    setTotpLoading(true);

    try {
      const response = await startAdminAuthenticatorSetup();
      setTotpSecret(response.secret);
      setTotpUri(response.otpauthUri);
      setTotpCode("");
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start Google Authenticator setup.",
      );
    } finally {
      setTotpLoading(false);
    }
  };

  const handleEnableAuthenticator = async () => {
    if (totpCode.length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    setTotpLoading(true);

    try {
      const response = await enableAdminAuthenticator(totpCode);
      onAdminChange(response.admin);
      setTotpSecret(null);
      setTotpUri(null);
      setTotpCode("");
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to enable Google Authenticator.",
      );
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableAuthenticator = async () => {
    if (totpCode.length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    setTotpDisabling(true);

    try {
      const response = await disableAdminAuthenticator(totpCode);
      onAdminChange(response.admin);
      setTotpSecret(null);
      setTotpUri(null);
      setTotpCode("");
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to disable Google Authenticator.",
      );
    } finally {
      setTotpDisabling(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="admin-card p-5 text-sm text-muted-foreground">
        This area handles both site-wide details and admin account security. Profile changes and password changes are only applied after secondary verification with Google Authenticator or email OTP.
      </div>

      <SettingsSection
        title="Storage and Backup"
        description="Current backend storage health, upload availability, and full backup export for the live data store."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Storage mode
            </div>
            <div className="mt-3 font-condensed text-2xl font-black text-primary">
              {health?.databaseMode || "Unknown"}
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              This backend currently stores data on the server file store, not a hosted MySQL or PostgreSQL connection yet.
            </div>
          </div>

          <div className="admin-soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Mail status
            </div>
            <div className="mt-3 font-condensed text-2xl font-black text-primary">
              {health?.mailConfigured ? "Configured" : "Needs SMTP"}
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              Mail routing addresses below are editable. SMTP credentials remain server-managed for security.
            </div>
          </div>

          <div className="admin-soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Uploads
            </div>
            <div className="mt-3 font-condensed text-2xl font-black text-primary">
              {health?.uploadsAvailable ? "Ready" : "Unavailable"}
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              Resume attachments depend on the uploads directory being writable on the backend.
            </div>
          </div>

          <div className="admin-soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Store size
            </div>
            <div className="mt-3 font-condensed text-2xl font-black text-primary">
              {health ? `${Math.max(1, Math.round(health.storeSizeBytes / 1024))} KB` : "Unknown"}
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              PHP {health?.phpVersion || "Unknown"} | {health?.storeWritable ? "Writable" : "Read-only"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="admin-soft-card p-4">
            <div className="text-sm font-semibold text-primary">Infrastructure notes</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <p>Database engine changes, SQL migration, and SMTP secret rotation are intentionally kept outside this web form so production credentials are never exposed in the browser.</p>
              <p>Current storage path: <span className="font-medium text-slate-700">{health?.storePath || "Unavailable"}</span></p>
              <p>Uploads path: <span className="font-medium text-slate-700">{health?.uploadsPath || "Unavailable"}</span></p>
            </div>
          </div>

          <div className="admin-soft-card flex flex-col justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-primary">Export current backup</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Download the current live snapshot including settings, content, submissions, users, and audit history.
              </p>
            </div>

            <div className="mt-5">
              <a href={backupDownloadUrl} className="admin-btn-secondary inline-flex">
                Download Backup JSON
              </a>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Admin Account"
        description="Update the admin login ID, recovery email, and phone number. Changes are applied only after a second verification step."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Admin Login ID"
            value={accountDraft.loginId}
            onChange={(value) => setAccountDraft((current) => ({ ...current, loginId: value }))}
            autoComplete="username"
          />
          <Field
            label="Admin Email"
            value={accountDraft.email}
            onChange={(value) => setAccountDraft((current) => ({ ...current, email: value }))}
            type="email"
            autoComplete="email"
          />
          <Field
            label="Admin Phone"
            value={accountDraft.phone}
            onChange={(value) => setAccountDraft((current) => ({ ...current, phone: value }))}
            type="tel"
            autoComplete="tel"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAccountUpdateRequest}
            disabled={accountSubmitting}
            className="admin-btn-primary disabled:opacity-70"
          >
            {accountSubmitting ? "Sending Code..." : "Verify Account Changes"}
          </button>
        </div>

        {accountOtpPending && (
          <div className="mt-5">
            <OtpVerifier
              title="Confirm Admin Account Update"
              description={
                accountVerificationMethod === "authenticator"
                  ? "Enter the current 6-digit code from Google Authenticator to apply the new login ID, email, and phone number."
                  : `Enter the code sent to ${accountOtpEmailMasked || "your current admin email"} to apply the new login ID, email, and phone number.`
              }
              value={accountOtp}
              onChange={setAccountOtp}
              onConfirm={handleAccountUpdateVerify}
              onCancel={() => {
                setAccountOtpPending(false);
                setAccountOtp("");
                setAccountOtpEmailMasked(null);
                setAccountVerificationMethod("email");
              }}
              confirming={accountVerifying}
              confirmLabel="Verify and Update Account"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Change Password"
        description="Enter your current password, choose a new password, and confirm the change with Google Authenticator or email OTP."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Old Password"
            value={passwordDraft.oldPassword}
            onChange={(value) => setPasswordDraft((current) => ({ ...current, oldPassword: value }))}
            type="password"
            autoComplete="current-password"
            revealable
          />
          <Field
            label="New Password"
            value={passwordDraft.newPassword}
            onChange={(value) => setPasswordDraft((current) => ({ ...current, newPassword: value }))}
            type="password"
            autoComplete="new-password"
            revealable
          />
          <Field
            label="Confirm New Password"
            value={passwordDraft.confirmPassword}
            onChange={(value) =>
              setPasswordDraft((current) => ({ ...current, confirmPassword: value }))
            }
            type="password"
            autoComplete="new-password"
            revealable
          />
        </div>

        <div className="mt-3 text-xs leading-6 text-muted-foreground">
          If you ever forget the current password, use the forgot-password flow from the admin sign-in page.
        </div>
        <div className="mt-1 text-xs leading-6 text-muted-foreground">
          Stored passwords are hashed and cannot be displayed back from the server. Use reset flows instead of password viewing.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePasswordChangeRequest}
            disabled={passwordSubmitting}
            className="admin-btn-primary disabled:opacity-70"
          >
            {passwordSubmitting ? "Sending Code..." : "Verify Password Change"}
          </button>
        </div>

        {passwordOtpPending && (
          <div className="mt-5">
            <OtpVerifier
              title="Confirm Password Change"
              description={
                passwordVerificationMethod === "authenticator"
                  ? "Enter the current 6-digit Google Authenticator code to finalize the new password."
                  : `Enter the code sent to ${passwordOtpEmailMasked || "your admin email"} to finalize the new password.`
              }
              value={passwordOtp}
              onChange={setPasswordOtp}
              onConfirm={handlePasswordChangeVerify}
              onCancel={() => {
                setPasswordOtpPending(false);
                setPasswordOtp("");
                setPasswordOtpEmailMasked(null);
                setPasswordVerificationMethod("email");
              }}
              confirming={passwordVerifying}
              confirmLabel="Verify and Change Password"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Brand Profile"
        description="Core identity details used across the public website, including the two-brand navbar and footer identity."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Primary Brand Name"
            value={settings.site_name}
            onChange={(value) => onChange({ site_name: value })}
          />
          <Field
            label="Primary Brand Location"
            value={settings.primary_brand_location}
            onChange={(value) => onChange({ primary_brand_location: value })}
          />
          <Field
            label="Secondary Brand Name"
            value={settings.secondary_brand_name}
            onChange={(value) => onChange({ secondary_brand_name: value })}
          />
          <Field
            label="Secondary Brand Location"
            value={settings.secondary_brand_location}
            onChange={(value) => onChange({ secondary_brand_location: value })}
          />
          <Field
            label="Site Tagline"
            value={settings.site_tagline}
            onChange={(value) => onChange({ site_tagline: value })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Contact Details"
        description="Public contact information displayed on the website."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            label="Office Address"
            value={settings.office_address}
            onChange={(value) => onChange({ office_address: value })}
            rows={3}
          />
          <Field
            label="Location URL"
            value={settings.location_url}
            onChange={(value) => onChange({ location_url: value })}
            type="url"
          />
          <Field
            label="Primary Phone"
            value={settings.primary_phone}
            onChange={(value) => onChange({ primary_phone: value })}
          />
          <Field
            label="Secondary Phone"
            value={settings.secondary_phone}
            onChange={(value) => onChange({ secondary_phone: value })}
          />
          <Field
            label="Public Email"
            value={settings.primary_email}
            onChange={(value) => onChange({ primary_email: value })}
            type="email"
          />
          <Field
            label="Map Embed URL"
            value={settings.map_embed_url}
            onChange={(value) => onChange({ map_embed_url: value })}
            type="url"
          />
          <Field
            label="Weekday Hours"
            value={settings.business_hours_weekday}
            onChange={(value) => onChange({ business_hours_weekday: value })}
          />
          <Field
            label="Weekend Hours"
            value={settings.business_hours_weekend}
            onChange={(value) => onChange({ business_hours_weekend: value })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sister Company"
        description="Companion company details used in supporting website areas."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Company Name"
            value={settings.sister_company_name}
            onChange={(value) => onChange({ sister_company_name: value })}
          />
          <Field
            label="Company URL"
            value={settings.sister_company_url}
            onChange={(value) => onChange({ sister_company_url: value })}
            type="url"
          />
          <Field
            label="Location Line"
            value={settings.sister_company_location}
            onChange={(value) => onChange({ sister_company_location: value })}
          />
          <TextAreaField
            label="Company Note"
            value={settings.sister_company_note}
            onChange={(value) => onChange({ sister_company_note: value })}
            rows={3}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Social Links"
        description="Public social profiles shown in the footer."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Facebook URL"
            value={settings.facebook_url}
            onChange={(value) => onChange({ facebook_url: value })}
            type="url"
          />
          <Field
            label="LinkedIn URL"
            value={settings.linkedin_url}
            onChange={(value) => onChange({ linkedin_url: value })}
            type="url"
          />
          <Field
            label="Twitter URL"
            value={settings.twitter_url}
            onChange={(value) => onChange({ twitter_url: value })}
            type="url"
          />
          <Field
            label="Instagram URL"
            value={settings.instagram_url}
            onChange={(value) => onChange({ instagram_url: value })}
            type="url"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Mail Routing"
        description="Internal routing and sender details for form notifications and replies."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Mail From Name"
            value={settings.mail_from_name}
            onChange={(value) => onChange({ mail_from_name: value })}
          />
          <Field
            label="Mail From Email"
            value={settings.mail_from_email}
            onChange={(value) => onChange({ mail_from_email: value })}
            type="email"
          />
          <Field
            label="Contact Recipient Email"
            value={settings.contact_recipient_email}
            onChange={(value) => onChange({ contact_recipient_email: value })}
            type="email"
          />
          <Field
            label="Careers Recipient Email"
            value={settings.careers_recipient_email}
            onChange={(value) => onChange({ careers_recipient_email: value })}
            type="email"
          />
          <Field
            label="Security Alert Email"
            value={settings.security_alert_email}
            onChange={(value) => onChange({ security_alert_email: value })}
            type="email"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Control email OTP fallback, the authenticator timing used for new enrollments, and the hidden IP-restricted admin access model."
      >
        <div className="admin-soft-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-primary">
                Email OTP Verification
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                When enabled, login falls back to email OTP for accounts that do not use Google Authenticator.
              </div>
            </div>

            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <span>{settings.two_factor_auth_enabled ? "Enabled" : "Disabled"}</span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    two_factor_auth_enabled: !settings.two_factor_auth_enabled,
                  })
                }
                className={`relative h-8 w-14 rounded-full transition ${
                  settings.two_factor_auth_enabled ? "bg-emerald-400" : "bg-slate-300"
                }`}
                aria-pressed={settings.two_factor_auth_enabled}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                    settings.two_factor_auth_enabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="admin-soft-card p-4">
            <label className="mb-2 block text-sm font-semibold text-primary">
              Authenticator Code Period
            </label>
            <select
              value={String(settings.authenticator_period_seconds)}
              onChange={(event) =>
                onChange({ authenticator_period_seconds: Number(event.target.value) })
              }
              className="admin-select"
            >
              {[15, 30, 60, 90, 120].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} seconds
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This applies to future Google Authenticator enrollments. If the primary admin is
              already enrolled, disable and re-enable the authenticator to move to a new code
              period safely.
            </p>
          </div>

          <div className="admin-soft-card p-4">
            <div className="text-sm font-semibold text-primary">Hidden Admin Access</div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The login surface now lives on a hidden secure route, and disallowed visitors receive
              a page-not-found response instead of a visible admin redirect.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Allowed IP ranges are controlled from the backend environment using
              <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 text-xs text-slate-700">
                ADMIN_ALLOWED_IPS
              </code>
              and role-specific keys such as
              <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 text-xs text-slate-700">
                ADMIN_ALLOWED_IPS_ADMIN
              </code>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 admin-soft-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-semibold text-primary">
                Google Authenticator
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Protect the primary admin account with a TOTP app. When enabled, login verification uses your authenticator code instead of email OTP.
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                Status: {admin?.authenticatorEnabled ? "Enabled" : "Not enabled"}
              </div>
            </div>

            {!admin?.authenticatorEnabled ? (
              <button
                type="button"
                onClick={() => void handleStartAuthenticatorSetup()}
                disabled={totpLoading}
                className="admin-btn-secondary disabled:opacity-70"
              >
                {totpLoading ? "Preparing..." : "Set Up Authenticator"}
              </button>
            ) : null}
          </div>

          {totpSecret && !admin?.authenticatorEnabled && (
            <div className="mt-5 rounded-[1.4rem] border border-sky-200 bg-sky-50 p-4">
              <div className="text-sm font-semibold text-primary">Setup key</div>
              <div className="mt-2 break-all rounded-xl border border-sky-200 bg-white px-4 py-3 font-mono text-sm text-slate-700">
                {totpSecret}
              </div>
              <div className="mt-3 text-sm leading-6 text-muted-foreground">
                Add a new account in Google Authenticator with this setup key. If your app supports manual entry, use the current admin email/login as the account name.
              </div>
              {totpUri && (
                <div className="mt-3 text-xs break-all text-slate-500">
                  {totpUri}
                </div>
              )}

              <div className="mt-4">
                <OtpVerifier
                  title="Confirm Google Authenticator"
                  description="Enter the current 6-digit code from Google Authenticator to finish enabling it."
                  value={totpCode}
                  onChange={setTotpCode}
                  onConfirm={() => void handleEnableAuthenticator()}
                  onCancel={() => {
                    setTotpSecret(null);
                    setTotpUri(null);
                    setTotpCode("");
                  }}
                  confirming={totpLoading}
                  confirmLabel="Enable Authenticator"
                />
              </div>
            </div>
          )}

          {admin?.authenticatorEnabled && (
            <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4">
              <OtpVerifier
                title="Disable Google Authenticator"
                description="Enter a current authenticator code to disable app-based verification for the primary admin account."
                value={totpCode}
                onChange={setTotpCode}
                onConfirm={() => void handleDisableAuthenticator()}
                onCancel={() => setTotpCode("")}
                confirming={totpDisabling}
                confirmLabel="Disable Authenticator"
              />
            </div>
          )}
        </div>
      </SettingsSection>

      {canManageUsers && (
        <AdminUserManagement
          users={users}
          saving={userSaving}
          onCreate={onCreateUser}
          onUpdate={onUpdateUser}
          onDelete={onDeleteUser}
          onUsersUpdated={onUsersUpdated}
        />
      )}

      <div className="admin-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-condensed text-3xl font-black leading-none text-primary">
            Ready to publish your admin changes
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Save your latest website settings after reviewing mail routing, public contact details, and security preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="admin-btn-primary disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Website Settings"}
        </button>
      </div>
    </section>
  );
}
