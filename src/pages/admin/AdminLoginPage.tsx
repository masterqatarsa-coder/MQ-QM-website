import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import NotFound from "@/pages/NotFound";
import { adminRoutes } from "@/lib/adminRoutes";
import { fetchAdminSession, isHiddenAdminAccessError, loginAdmin } from "@/lib/cmsApi";
import { writeCachedAdminSession } from "@/lib/adminSessionCache";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
        if (!cancelled) {
          if (isHiddenAdminAccessError(sessionError)) {
            setHidden(true);
            return;
          }
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Unable to verify the admin session.",
          );
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
    setLoading(true);
    setError(null);

    try {
      const response = await loginAdmin(loginId.trim(), password);

      if (response.pendingOtp) {
        writeCachedAdminSession({
          authenticated: false,
          pendingOtp: true,
          emailMasked: response.emailMasked || null,
          verificationMethod: response.verificationMethod || null,
        });
        toast.success(
          response.verificationMethod === "authenticator"
            ? "Enter the code from Google Authenticator."
            : "OTP sent to the admin email.",
        );
        navigate(adminRoutes.verify, { replace: true });
        return;
      }

      if (response.authenticated) {
        writeCachedAdminSession({
          authenticated: true,
          pendingOtp: false,
          admin: response.admin,
          verificationMethod: response.verificationMethod || null,
        });
        toast.success("Login successful.");
        navigate(adminRoutes.dashboard, { replace: true });
        return;
      }

      throw new Error("Login could not be completed because the server did not confirm authentication.");
    } catch (submissionError) {
      if (isHiddenAdminAccessError(submissionError)) {
        setHidden(true);
        return;
      }
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to complete login.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="admin-shell-bg flex min-h-screen items-center justify-center">
        <div className="admin-card px-6 py-4 text-sm text-muted-foreground">
          Preparing admin login...
        </div>
      </div>
    );
  }

  if (hidden) {
    return <NotFound />;
  }

  return (
    <AdminAuthShell
      eyebrow="Secure Login"
      title="Admin Sign In"
      description="Use your admin credentials to access the dashboard. If multi-factor verification is enabled, Google Authenticator or email verification comes next."
      sideLabel="Brand matched"
      sideTitle="A control room that now looks and feels like the main website."
      sideBody="The admin flow uses the same premium blue-and-gold language, stronger visual hierarchy, and cleaner surfaces that shape the public experience."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-primary">
            Login ID
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            className="admin-input"
            placeholder="admin"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-primary">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
          className="admin-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing In..." : "Continue to Dashboard"}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Forgot the password?{" "}
          <Link
            to={adminRoutes.forgotPassword}
            className="font-semibold text-accent transition hover:text-primary"
          >
            Reset the primary admin account
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
