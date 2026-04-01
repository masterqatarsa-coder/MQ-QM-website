import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import NotFound from "@/pages/NotFound";
import { adminRoutes } from "@/lib/adminRoutes";
import {
  fetchAdminSession,
  isHiddenAdminAccessError,
  type VerificationMethod,
  verifyAdminOtp,
} from "@/lib/cmsApi";
import { writeCachedAdminSession } from "@/lib/adminSessionCache";
import { allowsAuthenticatorOtp, allowsEmailOtp } from "@/lib/verification";

export default function AdminVerifyOtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("email");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        if (!session.pendingOtp) {
          navigate(adminRoutes.login, { replace: true });
          return;
        }

        setEmailMasked(session.emailMasked || null);
        setVerificationMethod(session.verificationMethod || "email");
      })
      .catch((sessionError) => {
        if (!cancelled && isHiddenAdminAccessError(sessionError)) {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyAdminOtp(otp);
      writeCachedAdminSession({
        authenticated: true,
        pendingOtp: false,
        admin: response.admin,
        verificationMethod,
      });
      toast.success("Admin login verified.");
      navigate(adminRoutes.dashboard, { replace: true });
    } catch (verificationError) {
      if (isHiddenAdminAccessError(verificationError)) {
        setHidden(true);
        return;
      }
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "OTP verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="admin-shell-bg flex min-h-screen items-center justify-center">
        <div className="admin-card px-6 py-4 text-sm text-muted-foreground">
          Checking verification state...
        </div>
      </div>
    );
  }

  if (hidden) {
    return <NotFound />;
  }

  const allowsAuthenticator = allowsAuthenticatorOtp(verificationMethod);
  const allowsEmail = allowsEmailOtp(verificationMethod);

  return (
    <AdminAuthShell
      eyebrow={
        allowsAuthenticator && allowsEmail
          ? "Authenticator Or Email Verification"
          : allowsAuthenticator
            ? "Authenticator Verification"
            : "Email Verification"
      }
      title={
        allowsAuthenticator && allowsEmail
          ? "Enter Verification Code"
          : allowsAuthenticator
            ? "Enter Authenticator Code"
            : "Enter OTP Code"
      }
      description={
        allowsAuthenticator && allowsEmail
          ? `Enter either the current 6-digit Google Authenticator code or the 6-digit code sent to ${emailMasked || "your admin email"}.`
          : allowsAuthenticator
            ? "Open Google Authenticator and enter the current 6-digit code for this admin account."
            : `We sent a 6-digit verification code to ${emailMasked || "your admin email"}.`
      }
      sideLabel="Protected access"
      sideTitle="A smoother verification step with the same brand rhythm."
      sideBody="The OTP screen follows the same visual system as the rest of the site, so security still feels polished and intentional."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Verifying..." : "Verify and Sign In"}
        </button>

        <button
          type="button"
          onClick={() => navigate(adminRoutes.login)}
          className="admin-btn-secondary w-full"
        >
          Back to login
        </button>
      </form>
    </AdminAuthShell>
  );
}
