import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import {
  requestAdminUserPasswordReset,
  verifyAdminUserPasswordResetOtp,
  type AdminUser,
  type VerificationMethod,
} from "@/lib/cmsApi";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  revealable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "password" | "tel";
  placeholder?: string;
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

type UserDraft = {
  id?: number;
  name: string;
  loginId: string;
  email: string;
  phone: string;
  role: string;
  twoFactorEnabled: boolean;
  isActive: boolean;
  password: string;
  confirmPassword: string;
};

type ResetDraft = {
  id: number | null;
  loginId: string;
  newPassword: string;
  confirmPassword: string;
  adminPassword: string;
  otp: string;
  emailMasked: string | null;
  verificationMethod: VerificationMethod;
  otpPending: boolean;
  requesting: boolean;
  verifying: boolean;
};

type AdminUserManagementProps = {
  users: AdminUser[];
  saving: boolean;
  onCreate: (payload: {
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
  onUpdate: (payload: {
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
  onDelete: (id: number) => void;
  onUsersUpdated: (users: AdminUser[]) => void;
};

const roles = [
  {
    value: "admin",
    label: "Admin (Full Access)",
    permissions: {
      overview: true,
      contacts: true,
      careers: true,
      content: true,
      settings: true,
      users: true,
      health: true,
    },
  },
  {
    value: "hr",
    label: "HR (Contacts & Careers)",
    permissions: {
      overview: true,
      contacts: true,
      careers: true,
      content: false,
      settings: false,
      users: false,
      health: false,
    },
  },
  {
    value: "staff",
    label: "Staff (Limited Access)",
    permissions: {
      overview: true,
      contacts: false,
      careers: false,
      content: false,
      settings: false,
      users: false,
      health: false,
    },
  },
  {
    value: "md",
    label: "MD (Overview Only)",
    permissions: {
      overview: true,
      contacts: false,
      careers: false,
      content: false,
      settings: false,
      users: false,
      health: false,
    },
  },
  {
    value: "ceo",
    label: "CEO (Full Read Access)",
    permissions: {
      overview: true,
      contacts: true,
      careers: true,
      content: true,
      settings: false,
      users: false,
      health: true,
    },
  },
];

function emptyDraft(): UserDraft {
  return {
    name: "",
    loginId: "",
    email: "",
    phone: "",
    role: "staff",
    twoFactorEnabled: false,
    isActive: true,
    password: "",
    confirmPassword: "",
  };
}

function emptyResetDraft(): ResetDraft {
  return {
    id: null,
    loginId: "",
    newPassword: "",
    confirmPassword: "",
    adminPassword: "",
    otp: "",
    emailMasked: null,
    verificationMethod: "email",
    otpPending: false,
    requesting: false,
    verifying: false,
  };
}

export default function AdminUserManagement({
  users,
  saving,
  onCreate,
  onUpdate,
  onDelete,
  onUsersUpdated,
}: AdminUserManagementProps) {
  const [draft, setDraft] = useState<UserDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetDraft, setResetDraft] = useState<ResetDraft>(emptyResetDraft());

  useEffect(() => {
    if (editingId === null) {
      setDraft(emptyDraft());
      return;
    }

    const user = users.find((item) => item.id === editingId);
    if (!user) {
      setEditingId(null);
      setDraft(emptyDraft());
      return;
    }

    setDraft({
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      email: user.email,
      phone: user.phone,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive,
      password: "",
      confirmPassword: "",
    });
  }, [editingId, users]);

  const handleCreate = () => {
    if (!draft.name.trim()) {
      toast.error("Enter the user's full name.");
      return;
    }
    if (!draft.loginId.trim()) {
      toast.error("Enter the user's login ID.");
      return;
    }
    if (!draft.email.trim()) {
      toast.error("Enter the user's email address.");
      return;
    }
    if (!draft.phone.trim()) {
      toast.error("Enter the user's phone number.");
      return;
    }
    if (!draft.role.trim()) {
      toast.error("Select the user's role.");
      return;
    }
    if (!draft.password.trim()) {
      toast.error("Enter a password for the user.");
      return;
    }
    if (draft.password !== draft.confirmPassword) {
      toast.error("Password and confirm password do not match.");
      return;
    }

    const roleData = roles.find((role) => role.value === draft.role);
    onCreate({
      name: draft.name,
      loginId: draft.loginId,
      email: draft.email,
      phone: draft.phone,
      role: draft.role,
      twoFactorEnabled: draft.twoFactorEnabled,
      isActive: draft.isActive,
      password: draft.password,
      permissions: roleData?.permissions || {},
    });
  };

  const handleSubmit = () => {
    if (editingId === null) {
      handleCreate();
      return;
    }

    const roleData = roles.find((role) => role.value === draft.role);
    onUpdate({
      id: draft.id,
      name: draft.name,
      loginId: draft.loginId,
      email: draft.email,
      phone: draft.phone,
      role: draft.role,
      twoFactorEnabled: draft.twoFactorEnabled,
      isActive: draft.isActive,
      permissions: roleData?.permissions || {},
    });
  };

  const beginPasswordReset = (user: AdminUser) => {
    setResetDraft({
      id: user.id,
      loginId: user.loginId,
      newPassword: "",
      confirmPassword: "",
      adminPassword: "",
      otp: "",
      emailMasked: null,
      verificationMethod: "email",
      otpPending: false,
      requesting: false,
      verifying: false,
    });
  };

  const handleRequestPasswordReset = async () => {
    if (resetDraft.id === null) {
      toast.error("Choose a user to reset first.");
      return;
    }

    if (!resetDraft.newPassword.trim() || !resetDraft.confirmPassword.trim()) {
      toast.error("Enter the new password and confirmation.");
      return;
    }

    if (!resetDraft.adminPassword.trim()) {
      toast.error("Enter your current admin password to confirm this reset.");
      return;
    }

    setResetDraft((current) => ({ ...current, requesting: true }));

    try {
      const response = await requestAdminUserPasswordReset({
        id: resetDraft.id,
        newPassword: resetDraft.newPassword,
        confirmPassword: resetDraft.confirmPassword,
        adminPassword: resetDraft.adminPassword,
      });

      setResetDraft((current) => ({
        ...current,
        otpPending: true,
        requesting: false,
        emailMasked: response.emailMasked || null,
        verificationMethod:
          response.verificationMethod === "authenticator" ? "authenticator" : "email",
        otp: "",
      }));
      toast.success(response.message);
    } catch (error) {
      setResetDraft((current) => ({ ...current, requesting: false }));
      toast.error(
        error instanceof Error ? error.message : "Unable to start password reset verification.",
      );
    }
  };

  const handleVerifyPasswordReset = async () => {
    if (resetDraft.otp.length !== 6) {
      toast.error("Enter the full 6-digit verification code.");
      return;
    }

    setResetDraft((current) => ({ ...current, verifying: true }));

    try {
      const response = await verifyAdminUserPasswordResetOtp(resetDraft.otp);
      onUsersUpdated(response.items);
      setResetDraft(emptyResetDraft());
      toast.success(response.message);
    } catch (error) {
      setResetDraft((current) => ({ ...current, verifying: false }));
      toast.error(
        error instanceof Error ? error.message : "Unable to verify the password reset code.",
      );
    }
  };

  return (
    <section className="admin-card p-5 md:p-6">
      <div className="mb-5">
        <div className="admin-kicker">Access Control</div>
        <h4 className="mt-4 font-condensed text-3xl font-black leading-none text-primary">
          User Management
        </h4>
        <div className="highlight-line mt-4" />
        <p className="mt-4 text-sm text-muted-foreground">
          Create and manage admin panel users. Passwords stay hashed in storage, so admins can set or reset them, but saved passwords are never displayed back from the server.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="admin-soft-card space-y-4 p-5">
          <div className="font-condensed text-2xl font-bold text-primary">
            {editingId === null ? "Add User" : "Edit User"}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              className="admin-input"
            />
            <input
              value={draft.loginId}
              onChange={(event) => setDraft((current) => ({ ...current, loginId: event.target.value }))}
              placeholder="Login ID"
              className="admin-input"
            />
            <input
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              className="admin-input"
              type="email"
            />
            <input
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone number"
              className="admin-input"
            />
            {editingId === null && (
              <div className="space-y-2 md:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="User Password"
                    value={draft.password}
                    onChange={(value) => setDraft((current) => ({ ...current, password: value }))}
                    type="password"
                    placeholder="Enter password for the user"
                    revealable
                  />
                  <Field
                    label="Confirm Password"
                    value={draft.confirmPassword}
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, confirmPassword: value }))
                    }
                    type="password"
                    placeholder="Re-enter the password"
                    revealable
                  />
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  This password becomes the user&apos;s actual login password and stays active until the primary admin resets it.
                </p>
              </div>
            )}
            <select
              value={draft.role}
              onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
              className="admin-select"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              value={draft.isActive ? "active" : "inactive"}
              onChange={(event) =>
                setDraft((current) => ({ ...current, isActive: event.target.value === "active" }))
              }
              className="admin-select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <label className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span>Email OTP on login (requires working mail delivery)</span>
            <button
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  twoFactorEnabled: !current.twoFactorEnabled,
                }))
              }
              className={`relative h-8 w-14 rounded-full transition ${
                draft.twoFactorEnabled ? "bg-emerald-400" : "bg-slate-300"
              }`}
              aria-pressed={draft.twoFactorEnabled}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                  draft.twoFactorEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="admin-btn-primary disabled:opacity-70"
            >
              <UserPlus size={16} />
              {editingId === null ? "Create User" : "Save User"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyDraft());
                }}
                className="admin-btn-secondary"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="admin-soft-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-condensed text-2xl font-bold text-primary">{user.name}</div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {user.role}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{user.loginId}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{user.phone || "No phone added"}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      {user.authenticatorEnabled
                        ? "Authenticator enabled"
                        : user.twoFactorEnabled
                          ? "Email OTP enabled"
                          : "Second factor disabled"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      Last login {user.lastLoginAt || "never"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(user.id)}
                    className="admin-btn-secondary"
                  >
                    <ShieldCheck size={16} />
                    Edit Access
                  </button>
                  <button
                    type="button"
                    onClick={() => beginPasswordReset(user)}
                    className="admin-btn-secondary"
                  >
                    <KeyRound size={16} />
                    Reset Password
                  </button>
                  {user.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => onDelete(user.id)}
                      className="rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {resetDraft.id === user.id && (
                <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-primary">Reset {user.loginId} password</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Enter the new password, confirm it, and then verify the reset using Google
                    Authenticator or the primary admin email OTP.
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field
                      label="New Password"
                      value={resetDraft.newPassword}
                      onChange={(value) =>
                        setResetDraft((current) => ({ ...current, newPassword: value }))
                      }
                      type="password"
                      revealable
                    />
                    <Field
                      label="Confirm Password"
                      value={resetDraft.confirmPassword}
                      onChange={(value) =>
                        setResetDraft((current) => ({ ...current, confirmPassword: value }))
                      }
                      type="password"
                      revealable
                    />
                    <div className="md:col-span-2">
                      <Field
                        label="Confirm With Admin Password"
                        value={resetDraft.adminPassword}
                        onChange={(value) =>
                          setResetDraft((current) => ({ ...current, adminPassword: value }))
                        }
                        type="password"
                        revealable
                      />
                    </div>
                  </div>

                  {!resetDraft.otpPending ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleRequestPasswordReset()}
                        disabled={resetDraft.requesting}
                        className="admin-btn-primary disabled:opacity-70"
                      >
                        {resetDraft.requesting ? "Sending Code..." : "Verify Password Reset"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetDraft(emptyResetDraft())}
                        className="admin-btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-semibold text-primary">Enter verification code</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {resetDraft.verificationMethod === "authenticator"
                          ? "Open Google Authenticator and enter the current 6-digit code for the primary admin account."
                          : `Code sent to ${resetDraft.emailMasked || "the primary admin email"}.`}
                      </div>
                      <div className="mt-4 flex justify-center md:justify-start">
                        <InputOTP
                          maxLength={6}
                          value={resetDraft.otp}
                          onChange={(value) =>
                            setResetDraft((current) => ({ ...current, otp: value }))
                          }
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
                          onClick={() => void handleVerifyPasswordReset()}
                          disabled={resetDraft.verifying}
                          className="admin-btn-primary disabled:opacity-70"
                        >
                          {resetDraft.verifying ? "Verifying..." : "Apply New Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetDraft(emptyResetDraft())}
                          className="admin-btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
