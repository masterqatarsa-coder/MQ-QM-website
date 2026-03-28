import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import {
  fetchAdminSession,
  isHiddenAdminAccessError,
  type AdminSessionResponse,
} from "@/lib/cmsApi";
import {
  clearCachedAdminSession,
  readCachedAdminSession,
  writeCachedAdminSession,
} from "@/lib/adminSessionCache";

export default function AdminGuard() {
  const [session, setSession] = useState<AdminSessionResponse | null>(
    () => readCachedAdminSession(),
  );
  const [loading, setLoading] = useState(() => readCachedAdminSession() === null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAdminSession()
      .then((data) => {
        if (!cancelled) {
          setSession(data);
          writeCachedAdminSession(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setHidden(isHiddenAdminAccessError(error));
          const fallbackSession = {
            authenticated: false,
            pendingOtp: false,
          };
          setSession(fallbackSession);
          clearCachedAdminSession();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="admin-shell-bg min-h-screen" />;
  }

  if (session?.authenticated) {
    return <Outlet />;
  }

  return <NotFound />;
}
