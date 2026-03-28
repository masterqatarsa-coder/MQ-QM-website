import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import NotFound from "@/pages/NotFound";
import { adminRoutes } from "@/lib/adminRoutes";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  completePasswordReset,
  fetchAdminSession,
  isHiddenAdminAccessError,
  requestPasswordReset,
  type VerificationMethod,
  verifyPasswordResetOtp,
} from "@/lib/cmsApi";

type ResetStep = "request" | "verify" | "reset";

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ResetStep>("request");
  const [loginId, setLoginId] = useState("");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAdminSession()
      .then((session) => {
        if (cancelled) {
          return;
        }

        if (session.authenticated) {
          navigate(adminRoutes.dashboard, { replace: true });
          return;
        }

        if (session.pendingOtp) {
          navigate(adminRoutes.verify, { replace: true });
        }
      })
      .catch((sessionError) => {
        if (isHiddenAdminAccessError(sessionError)) {
          setHidden(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await requestPasswordReset(loginId.trim());
      setEmailMasked(response.emailMasked || null);
      setVerificationMethod(response.verificationMethod === "authenticator" ? "authenticator" : "email");
      setOtp("");
      setStep("verify");
      toast.success(response.message);
    } catch (requestError) {
      if (isHiddenAdminAccessError(requestError)) {
        setHidden(true);
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send the password reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyPasswordResetOtp(otp);
      setStep("reset");
      toast.success(response.message);
    } catch (verificationError) {
      if (isHiddenAdminAccessError(verificationError)) {
        setHidden(true);
        return;
      }
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to verify the password reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await completePasswordReset({
        newPassword,
        confirmPassword,
      });
      toast.success(response.message);
      navigate(adminRoutes.login, { replace: true });
    } catch (resetError) {
      if (isHiddenAdminAccessError(resetError)) {
        setHidden(true);
        return;
      }
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to complete the password reset.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="admin-shell-bg flex min-h-screen items-center justify-center">
        <div className="admin-card px-6 py-4 text-sm text-muted-foreground">
          Preparing password recovery...
        </div>
      </div>
    );
  }

  if (hidden) {
    return <NotFound />;
  }

  return (
    <AdminAuthShell
      eyebrow="Password Recovery"
      title="Reset Primary Admin Password"
      description="Request a recovery challenge, verify it with Google Authenticator or email, and then set a new password for the primary admin account."
      sideLabel="Recovery flow"
      sideTitle="Security steps that feel aligned with the rest of the website."
      sideBody="The recovery path uses the same layout, spacing, and visual confidence as the main experience while keeping the process easy to follow."
    >
      {step === "request" && (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Admin Login ID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              className="admin-input"
              placeholder="Primary admin login ID"
              autoComplete="username"
              required
            />
          </div>

          {error && (
            <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="admin-btn-primary w-full disabled:opacity-70"
          >
            {loading ? "Sending Code..." : "Send Reset Code"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {verificationMethod === "authenticator" ? (
              <>
                Open Google Authenticator and enter the current 6-digit code for this admin
                account.
              </>
            ) : (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-primary">
                  {emailMasked || "your admin email"}
                </span>.
              </>
            )}
          </p>

          <div className="flex justify-center lg:justify-start">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              containerClassName="justify-center lg:justify-start"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-12 border-slate-200 bg-white text-primary"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary flex-1 disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setOtp("");
                setError(null);
                setVerificationMethod("email");
              }}
              className="admin-btn-secondary"
            >
              Start Again
            </button>
          </div>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleCompleteReset} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="admin-input pr-12"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-primary"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="admin-input pr-12"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-primary"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="admin-btn-primary w-full disabled:opacity-70"
          >
            {loading ? "Updating Password..." : "Set New Password"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => navigate(adminRoutes.login)}
        className="admin-btn-secondary mt-6 w-full"
      >
        Back to login
      </button>
    </AdminAuthShell>
  );
}
