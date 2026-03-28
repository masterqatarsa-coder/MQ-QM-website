import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  FilePenLine,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/MQ-LOGO.png";
import AdminContentManager, {
  type AdminContentDraft,
} from "@/components/admin/AdminContentManager";
import AdminHealthPanel from "@/components/admin/AdminHealthPanel";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import AdminSubmissionList from "@/components/admin/AdminSubmissionList";
import { adminRoutes } from "@/lib/adminRoutes";
import {
  adminBackupDownloadUrl,
  clearLoginLock,
  deleteAdminUser,
  deleteContent,
  fetchAdminBootstrap,
  fetchAdminSession,
  fetchContent,
  fetchDashboardSummary,
  fetchHealthSummary,
  fetchSubmissions,
  isHiddenAdminAccessError,
  logoutAdmin,
  saveContent,
  saveAdminUser,
  saveSettings,
  sendSubmissionReply,
  type AdminUser,
  type ContentItem,
  type ContentType,
  type DashboardSummary,
  type HealthSummary,
  type SiteSettings,
  type SubmissionItem,
  type SubmissionType,
  updateBlockedIp,
  updateSubmission,
} from "@/lib/cmsApi";
import { clearCachedAdminSession, writeCachedAdminSession } from "@/lib/adminSessionCache";
import NotFound from "@/pages/NotFound";

type AdminTab = "overview" | "contacts" | "careers" | "content" | "settings" | "health";

type ReplyDraft = {
  subject: string;
  message: string;
};

const ADMIN_BOOTSTRAP_CACHE_KEY = "mq-admin-bootstrap-cache";
const PUBLIC_SETTINGS_CACHE_KEY = "mq-public-site-settings";
const MANAGED_CONTENT_CACHE_PREFIX = "mq-managed-content:";

const emptySettings: SiteSettings = {
  site_name: "",
  site_tagline: "",
  primary_brand_location: "",
  secondary_brand_name: "",
  secondary_brand_location: "",
  office_address:
    "Mezzanine Floor Office No - 1, 7653 Al-Madinah Al-Munawarah Rd, Al-Baghdadiyah Al-Sharqiyah District - 4672, Jeddah 22235",
  location_url: "",
  map_embed_url: "",
  primary_phone: "",
  secondary_phone: "",
  primary_email: "",
  contact_recipient_email: "",
  careers_recipient_email: "",
  business_hours_weekday: "",
  business_hours_weekend: "",
  sister_company_name: "",
  sister_company_url: "",
  sister_company_location: "",
  sister_company_note: "",
  mail_from_name: "",
  mail_from_email: "",
  security_alert_email: "",
  facebook_url: "",
  linkedin_url: "",
  twitter_url: "",
  instagram_url: "",
  two_factor_auth_enabled: false,
  authenticator_period_seconds: 30,
};

const emptyContentStore: Record<ContentType, ContentItem[]> = {
  services: [],
  service_products: [],
  clients: [],
  jobs: [],
  gallery: [],
  projects: [],
  certificates: [],
  testimonials: [],
};

const emptyLoadedState: Record<ContentType, boolean> = {
  services: false,
  service_products: false,
  clients: false,
  jobs: false,
  gallery: false,
  projects: false,
  certificates: false,
  testimonials: false,
};

const tabLabels: Record<AdminTab, string> = {
  overview: "Overview",
  contacts: "Contact Inbox",
  careers: "Career Inbox",
  content: "Content Manager",
  settings: "Settings",
  health: "System Health",
};

const tabDescriptions: Record<AdminTab, string> = {
  overview: "Track website activity, form flow, and managed content health at a glance.",
  contacts: "Review, organize, and reply to website inquiries with better context.",
  careers: "Keep applications moving with notes, statuses, and reply history in one place.",
  content: "Edit the website's synced content library with images, metadata, and publishing control.",
  settings: "Manage mail routing, public site settings, and the secured admin account.",
  health: "Monitor backend status, audit events, blocked clients, and security signals.",
};

const tabIcons: Record<AdminTab, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  contacts: Mail,
  careers: BriefcaseBusiness,
  content: FilePenLine,
  settings: Settings2,
  health: HeartPulse,
};

function emptyContentDraft(type: ContentType): AdminContentDraft {
  return {
    type,
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    ctaLabel: "",
    ctaUrl: "",
    sortOrder: 0,
    isPublished: true,
    showOnHomePage: false,
    metadataText:
      type === "jobs"
        ? JSON.stringify({ location: "Jeddah" }, null, 2)
        : type === "projects"
          ? JSON.stringify({ sector: "Infrastructure", location: "Saudi Arabia" }, null, 2)
          : type === "service_products"
            ? JSON.stringify({ service: "Trading", category: "HVAC" }, null, 2)
            : JSON.stringify({}, null, 2),
  };
}

function draftFromContentItem(item: ContentItem): AdminContentDraft {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug || "",
    subtitle: item.subtitle || "",
    description: item.description || "",
    imageUrl: item.imageUrl || "",
    ctaLabel: item.ctaLabel || "",
    ctaUrl: item.ctaUrl || "",
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
    showOnHomePage: item.showOnHomePage,
    metadataText: JSON.stringify(item.metadata || {}, null, 2),
  };
}

function submissionKey(type: SubmissionType, submissionId: number) {
  return `${type}-${submissionId}`;
}

function clearPublicWebsiteCache() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PUBLIC_SETTINGS_CACHE_KEY);

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(MANAGED_CONTENT_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [refreshingLiveData, setRefreshingLiveData] = useState(false);
  const [contacts, setContacts] = useState<SubmissionItem[]>([]);
  const [careers, setCareers] = useState<SubmissionItem[]>([]);
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [careersLoaded, setCareersLoaded] = useState(false);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [careersLoading, setCareersLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettingsState] = useState<SiteSettings>(emptySettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [unlockingLoginKey, setUnlockingLoginKey] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>("services");
  const [contentItems, setContentItems] =
    useState<Record<ContentType, ContentItem[]>>(emptyContentStore);
  const [loadedContentTypes, setLoadedContentTypes] =
    useState<Record<ContentType, boolean>>(emptyLoadedState);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentDraft, setContentDraft] = useState<AdminContentDraft>(
    emptyContentDraft("services"),
  );
  const [submissionSavingKey, setSubmissionSavingKey] = useState<string | null>(null);
  const [replySendingKey, setReplySendingKey] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyDraft>>({});
  const [hiddenAccess, setHiddenAccess] = useState(false);

  const managedContentCount = Object.values(contentItems).reduce(
    (total, items) => total + items.length,
    0,
  );
  const pendingInboxCount = dashboard?.stats.pendingInbox ?? [...contacts, ...careers].filter(
    (item) => item.status === "unread" || item.status === "in_progress",
  ).length;

  const refreshLiveData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!admin) {
        return;
      }

      setRefreshingLiveData(true);

      try {
        const shouldRefreshContacts =
          admin.permissions.contacts && (activeTab === "contacts" || contactsLoaded);
        const shouldRefreshCareers =
          admin.permissions.careers && (activeTab === "careers" || careersLoaded);
        const shouldRefreshHealth =
          admin.permissions.health && (activeTab === "health" || healthLoaded);

        const requests = [
          fetchDashboardSummary(),
          shouldRefreshContacts ? fetchSubmissions("contact") : Promise.resolve(null),
          shouldRefreshCareers ? fetchSubmissions("career") : Promise.resolve(null),
          shouldRefreshHealth ? fetchHealthSummary() : Promise.resolve(null),
        ] as const;

        const [dashboardData, contactData, careerData, healthData] = await Promise.allSettled(requests);
        const hiddenDenied = [dashboardData, contactData, careerData, healthData].some(
          (result) =>
            result.status === "rejected" && isHiddenAdminAccessError(result.reason),
        );

        if (hiddenDenied) {
          clearCachedAdminSession();
          window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
          setHiddenAccess(true);
          return;
        }

        if (dashboardData.status === "fulfilled") {
          setDashboard(dashboardData.value);
          setDashboardError(null);
        } else {
          setDashboardError(
            dashboardData.reason instanceof Error
              ? dashboardData.reason.message
              : "Unable to load dashboard statistics.",
          );
        }

        if (contactData.status === "fulfilled" && contactData.value) {
          setContacts(contactData.value.items);
          setContactsLoaded(true);
        }

        if (careerData.status === "fulfilled" && careerData.value) {
          setCareers(careerData.value.items);
          setCareersLoaded(true);
        }

        if (healthData.status === "fulfilled" && healthData.value) {
          setHealth(healthData.value.health);
          setHealthLoaded(true);
        }

        if (dashboardData.status === "fulfilled") {
          window.sessionStorage.setItem(
            ADMIN_BOOTSTRAP_CACHE_KEY,
            JSON.stringify({
              savedAt: Date.now(),
              data: {
                admin,
                settings,
                dashboard: dashboardData.value,
                contacts: shouldRefreshContacts && contactData.status === "fulfilled" && contactData.value
                  ? contactData.value.items
                  : contacts,
                careers: shouldRefreshCareers && careerData.status === "fulfilled" && careerData.value
                  ? careerData.value.items
                  : careers,
                health:
                  shouldRefreshHealth && healthData.status === "fulfilled" && healthData.value
                    ? healthData.value.health
                    : health,
                users,
              },
            }),
          );
        }

        if (
          !silent &&
          dashboardData.status === "rejected" &&
          contactData.status === "rejected" &&
          careerData.status === "rejected" &&
          healthData.status === "rejected"
        ) {
          toast.error("Unable to refresh live dashboard data.");
        }
      } finally {
        setRefreshingLiveData(false);
      }
    },
    [activeTab, admin, careers, careersLoaded, contacts, contactsLoaded, health, healthLoaded, settings, users],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      const cached = window.sessionStorage.getItem(ADMIN_BOOTSTRAP_CACHE_KEY);

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            savedAt?: number;
            data?: {
              admin: AdminUser;
              settings: SiteSettings;
              dashboard: DashboardSummary;
              contacts?: SubmissionItem[];
              careers?: SubmissionItem[];
              health?: HealthSummary | null;
              users: AdminUser[];
            };
          };

          if (!cancelled && parsed.data && Date.now() - (parsed.savedAt ?? 0) < 60_000) {
            setAdmin(parsed.data.admin);
            setSettingsState(parsed.data.settings);
            setDashboard(parsed.data.dashboard);
            setContacts(parsed.data.contacts || []);
            setCareers(parsed.data.careers || []);
            setHealth(parsed.data.health || null);
            setContactsLoaded((parsed.data.contacts || []).length > 0);
            setCareersLoaded((parsed.data.careers || []).length > 0);
            setHealthLoaded(Boolean(parsed.data.health));
            setUsers(parsed.data.users);
            writeCachedAdminSession({
              authenticated: true,
              pendingOtp: false,
              admin: parsed.data.admin,
            });
          }
        } catch {
          window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
        }
      }

      try {
        const bootstrap = await fetchAdminBootstrap();

        if (cancelled) {
          return;
        }

        setAdmin(bootstrap.admin);
        setSettingsState(bootstrap.settings);
        setDashboard(bootstrap.dashboard);
        setHealth(bootstrap.health);
        setHealthLoaded(Boolean(bootstrap.health));
        setUsers(bootstrap.users);
        setDashboardError(null);
        writeCachedAdminSession({
          authenticated: true,
          pendingOtp: false,
          admin: bootstrap.admin,
        });
        window.sessionStorage.setItem(
          ADMIN_BOOTSTRAP_CACHE_KEY,
          JSON.stringify({
            savedAt: Date.now(),
            data: bootstrap,
          }),
        );
      } catch (error) {
        try {
          const session = await fetchAdminSession();

          if (cancelled) {
            return;
          }

          if (session.authenticated && session.admin) {
            setAdmin(session.admin);
            writeCachedAdminSession(session);
            setDashboardError(
              error instanceof Error
                ? error.message
                : "Unable to load the admin dashboard.",
            );
            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to load the admin dashboard.",
            );
            return;
          }

          if (session.pendingOtp) {
            clearCachedAdminSession();
            window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
            navigate(adminRoutes.verify, { replace: true });
            return;
          }

          clearCachedAdminSession();
          window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
          navigate(adminRoutes.login, { replace: true });
        } catch (sessionError) {
          if (!cancelled) {
            clearCachedAdminSession();
            window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
            if (isHiddenAdminAccessError(sessionError)) {
              setHiddenAccess(true);
              return;
            }
            navigate(adminRoutes.login, { replace: true });
          }
        }
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!admin) {
      return;
    }

    if (activeTab === "contacts" && admin.permissions.contacts && !contactsLoaded && !contactsLoading) {
      setContactsLoading(true);
      fetchSubmissions("contact")
        .then((response) => {
          setContacts(response.items);
          setContactsLoaded(true);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to load contact inbox.");
        })
        .finally(() => {
          setContactsLoading(false);
        });
    }

    if (activeTab === "careers" && admin.permissions.careers && !careersLoaded && !careersLoading) {
      setCareersLoading(true);
      fetchSubmissions("career")
        .then((response) => {
          setCareers(response.items);
          setCareersLoaded(true);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to load career inbox.");
        })
        .finally(() => {
          setCareersLoading(false);
        });
    }

    if (activeTab === "health" && admin.permissions.health && !healthLoaded && !healthLoading) {
      setHealthLoading(true);
      fetchHealthSummary()
        .then((response) => {
          setHealth(response.health);
          setHealthLoaded(true);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to load system health.");
        })
        .finally(() => {
          setHealthLoading(false);
        });
    }
  }, [
    activeTab,
    admin,
    careersLoaded,
    careersLoading,
    contactsLoaded,
    contactsLoading,
    healthLoaded,
    healthLoading,
  ]);

  useEffect(() => {
    if (!admin) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshLiveData({ silent: true });
    }, 15000);

    const handleFocus = () => {
      void refreshLiveData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshLiveData({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [admin, refreshLiveData]);

  useEffect(() => {
    if (!admin || loadedContentTypes[contentType]) {
      return;
    }

    setContentLoading(true);

    fetchContent(contentType, true)
      .then((response) => {
        setContentItems((current) => ({
          ...current,
          [contentType]: response.items,
        }));
        setLoadedContentTypes((current) => ({
          ...current,
          [contentType]: true,
        }));
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load content items.");
      })
      .finally(() => {
        setContentLoading(false);
      });
  }, [admin, contentType, loadedContentTypes]);

  useEffect(() => {
    setContentDraft(emptyContentDraft(contentType));
  }, [contentType]);

  useEffect(() => {
    if (!admin) {
      return;
    }

    const allowedTabs = (Object.keys(tabLabels) as AdminTab[]).filter((tab) => {
      if (tab === "overview") {
        return admin.permissions.overview;
      }
      if (tab === "contacts") {
        return admin.permissions.contacts;
      }
      if (tab === "careers") {
        return admin.permissions.careers;
      }
      if (tab === "content") {
        return admin.permissions.content;
      }
      if (tab === "settings") {
        return admin.permissions.settings;
      }
      if (tab === "health") {
        return admin.permissions.health;
      }
      return false;
    });

    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || "overview");
    }
  }, [activeTab, admin]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      clearCachedAdminSession();
      window.sessionStorage.removeItem(ADMIN_BOOTSTRAP_CACHE_KEY);
      navigate(adminRoutes.login, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out.");
    }
  };

  const handleSubmissionFieldChange = (
    type: SubmissionType,
    submissionId: number,
    patch: Partial<Pick<SubmissionItem, "status" | "adminNotes">>,
  ) => {
    const setter = type === "contact" ? setContacts : setCareers;
    setter((items) =>
      items.map((item) =>
        item.id === submissionId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const handleSubmissionSave = async (type: SubmissionType, item: SubmissionItem) => {
    if (!window.confirm("Do you want to save these submission updates?")) {
      return;
    }

    const key = submissionKey(type, item.id);
    setSubmissionSavingKey(key);

    try {
      const response = await updateSubmission(type, {
        id: item.id,
        status: item.status,
        adminNotes: item.adminNotes,
      });

      if (type === "contact") {
        setContacts(response.items);
      } else {
        setCareers(response.items);
      }

      toast.success("Submission updated.");
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update submission.");
    } finally {
      setSubmissionSavingKey(null);
    }
  };

  const handleReplyDraftChange = (
    type: SubmissionType,
    submissionId: number,
    patch: Partial<ReplyDraft>,
  ) => {
    const key = submissionKey(type, submissionId);
    setReplyDrafts((current) => ({
      ...current,
      [key]: {
        subject: current[key]?.subject || "",
        message: current[key]?.message || "",
        ...patch,
      },
    }));
  };

  const handleSendReply = async (type: SubmissionType, item: SubmissionItem) => {
    const key = submissionKey(type, item.id);
    const draft = replyDrafts[key] || {
      subject:
        type === "contact"
          ? `Re: Your inquiry to ${settings.site_name || "our team"}`
          : `Re: Your application for ${item.role || "our role"}`,
      message: "",
    };

    if (!draft.subject.trim() || !draft.message.trim()) {
      toast.error("Add both a reply subject and a reply message.");
      return;
    }

    if (!window.confirm(`Do you want to send this reply to ${item.email}?`)) {
      return;
    }

    setReplySendingKey(key);

    try {
      const response = await sendSubmissionReply({
        submissionType: type,
        submissionId: item.id,
        subject: draft.subject.trim(),
        message: draft.message.trim(),
      });

      if (type === "contact") {
        setContacts(response.items);
      } else {
        setCareers(response.items);
      }

      setReplyDrafts((current) => ({
        ...current,
        [key]: {
          subject: "",
          message: "",
        },
      }));

      toast.success("Reply sent.");
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setReplySendingKey(null);
    }
  };

  const handleContentSave = async () => {
    if (!window.confirm("Do you want to save these website content changes?")) {
      return;
    }

    setContentSaving(true);

    try {
      const metadata =
        contentDraft.metadataText.trim() === ""
          ? {}
          : JSON.parse(contentDraft.metadataText);

      const response = await saveContent({
        id: contentDraft.id,
        type: contentDraft.type,
        title: contentDraft.title.trim(),
        slug: contentDraft.slug.trim() || null,
        subtitle: contentDraft.subtitle.trim() || null,
        description: contentDraft.description.trim() || null,
        imageUrl: contentDraft.imageUrl.trim() || null,
        ctaLabel: contentDraft.ctaLabel.trim() || null,
        ctaUrl: contentDraft.ctaUrl.trim() || null,
        sortOrder: Number(contentDraft.sortOrder) || 0,
        isPublished: contentDraft.isPublished,
        showOnHomePage: contentDraft.showOnHomePage,
        metadata,
      });

      setContentItems((current) => ({
        ...current,
        [contentDraft.type]: response.items,
      }));
      setLoadedContentTypes((current) => ({
        ...current,
        [contentDraft.type]: true,
      }));
      setContentDraft(emptyContentDraft(contentDraft.type));
      clearPublicWebsiteCache();
      toast.success("Content saved.");
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save content.");
    } finally {
      setContentSaving(false);
    }
  };

  const handleContentDelete = async (item: ContentItem) => {
    if (!window.confirm(`Do you want to delete "${item.title}"?`)) {
      return;
    }

    setContentSaving(true);

    try {
      const response = await deleteContent(item.type, item.id);
      setContentItems((current) => ({
        ...current,
        [item.type]: response.items,
      }));
      setContentDraft(emptyContentDraft(item.type));
      clearPublicWebsiteCache();
      toast.success("Content deleted.");
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete content.");
    } finally {
      setContentSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    if (!window.confirm("Do you want to save these website settings now?")) {
      return;
    }

    setSettingsSaving(true);

    try {
      const response = await saveSettings(settings);
      setSettingsState(response.settings);
      clearPublicWebsiteCache();
      toast.success("Settings saved.");
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleUserCreate = async (payload: {
    name: string;
    loginId: string;
    email: string;
    phone: string;
    role: string;
    twoFactorEnabled: boolean;
    isActive: boolean;
    password: string;
    permissions?: Record<string, boolean>;
  }) => {
    if (!window.confirm(`Do you want to create the user "${payload.loginId}"?`)) {
      return;
    }

    setUserSaving(true);

    try {
      const response = await saveAdminUser({
        action: "create",
        ...payload,
      });
      setUsers(response.items);
      toast.success(response.message);
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create the user.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleUserUpdate = async (payload: {
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
  }) => {
    if (!window.confirm(`Do you want to update access for "${payload.loginId}"?`)) {
      return;
    }

    setUserSaving(true);

    try {
      const response = await saveAdminUser({
        action: "save",
        ...payload,
      });
      setUsers(response.items);
      toast.success(response.message);
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the user.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleUserDelete = async (id: number) => {
    const target = users.find((item) => item.id === id);
    if (!window.confirm(`Do you want to delete ${target?.loginId || "this user"}?`)) {
      return;
    }

    setUserSaving(true);

    try {
      const response = await deleteAdminUser(id);
      setUsers(response.items);
      toast.success(response.message);
      void refreshLiveData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete the user.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleIpBlockAction = async (action: "block" | "unblock", ipAddress: string) => {
    let adminPassword: string | undefined;

    if (action === "block") {
      if (!window.confirm(`Block admin access for ${ipAddress}?`)) {
        return;
      }
    }

    if (action === "unblock") {
      if (!window.confirm(`Allow admin access again for ${ipAddress}?`)) {
        return;
      }

      const providedPassword = window.prompt(
        "Enter your current admin password to confirm this unblock action.",
      );

      if (providedPassword === null) {
        return;
      }

      if (providedPassword.trim() === "") {
        toast.error("Admin password confirmation is required to unblock this IP.");
        return;
      }

      adminPassword = providedPassword;
    }

    setBlockingIp(ipAddress);

    try {
      const response = await updateBlockedIp(action, ipAddress, adminPassword);
      setDashboard((current) =>
        current
          ? {
              ...current,
              suspiciousActivity: response.suspiciousActivity,
              blockedIps: response.blockedIps,
              recentAdminLogins: response.recentAdminLogins,
              recentPanelActivity: response.recentPanelActivity,
              stats: {
                ...current.stats,
                blockedIps: response.blockedIps.length,
              },
            }
          : current,
      );
      if (health) {
        setHealth({ ...health, blockedIps: response.blockedIps.length });
      }
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the block list.");
    } finally {
      setBlockingIp(null);
    }
  };

  const handleClearLoginLock = async (loginId: string, requestFingerprint?: string) => {
    const key = `${loginId}:${requestFingerprint || "no-fingerprint"}`;
    setUnlockingLoginKey(key);

    try {
      const response = await clearLoginLock(loginId, requestFingerprint);
      setDashboard((current) =>
        current
          ? {
              ...current,
              suspiciousActivity: response.suspiciousActivity,
              blockedIps: response.blockedIps,
              recentAdminLogins: response.recentAdminLogins,
              recentPanelActivity: response.recentPanelActivity,
              stats: {
                ...current.stats,
                blockedIps: response.blockedIps.length,
              },
            }
          : current,
      );
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to clear the login lock.");
    } finally {
      setUnlockingLoginKey(null);
    }
  };

  const navTabs = (Object.keys(tabLabels) as AdminTab[]).map((tab) => ({
    tab,
    label: tabLabels[tab],
    icon: tabIcons[tab],
  })).filter(({ tab }) => {
    if (!admin) {
      return tab === "overview";
    }

    if (tab === "overview") {
      return admin.permissions.overview;
    }
    if (tab === "contacts") {
      return admin.permissions.contacts;
    }
    if (tab === "careers") {
      return admin.permissions.careers;
    }
    if (tab === "content") {
      return admin.permissions.content;
    }
    if (tab === "settings") {
      return admin.permissions.settings;
    }
    if (tab === "health") {
      return admin.permissions.health;
    }

    return false;
  });

  if (hiddenAccess) {
    return <NotFound />;
  }

  return (
    <div className="admin-shell-bg min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[18.5rem] border-r border-white/8 bg-slate-950/88 p-5 backdrop-blur-2xl lg:block">
        <div className="admin-glass-card flex h-full flex-col p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <img
                src={logo}
                alt="Master Qatar"
                className="h-7 w-7 rounded-full bg-white/85 object-contain p-1"
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Control Room
              </div>
              <div className="mt-1 text-xs text-white/70">Master Qatar Admin</div>
            </div>
          </div>

          <h1 className="mt-5 font-condensed text-3xl font-black leading-none text-white">
            Website Admin
          </h1>

          <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              Signed in as
            </div>
            <div className="mt-2 font-condensed text-2xl font-bold text-white">
              {admin?.name || "Admin"}
            </div>
            <div className="mt-1 text-xs text-white/62">{admin?.loginId}</div>
            <div className="mt-1 text-xs text-white/62">{admin?.email}</div>
          </div>

          <div className="mt-6 flex-1">
            <nav className="space-y-1.5">
              {navTabs.map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`admin-nav-button ${
                    activeTab === tab ? "admin-nav-button-active" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/84 transition hover:border-white/20 hover:bg-white/10"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative h-full w-[88vw] max-w-sm border-r border-white/10 bg-slate-950/95 p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <img
                  src={logo}
                  alt="Master Qatar"
                  className="h-7 w-7 rounded-full bg-white/85 object-contain p-1"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Control Room
                </div>
                <div className="mt-1 text-xs text-white/72">Master Qatar Admin</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <h1 className="mt-5 font-condensed text-3xl font-black leading-none text-white">
              Website Admin
            </h1>

            <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                Signed in as
              </div>
              <div className="mt-2 font-condensed text-2xl font-bold text-white">
                {admin?.name || "Admin"}
              </div>
              <div className="mt-1 text-xs text-white/62">{admin?.loginId}</div>
              <div className="mt-1 text-xs text-white/62">{admin?.email}</div>
            </div>

            <div className="mt-6 flex-1">
              <nav className="mt-6 space-y-1.5">
              {navTabs.map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileNavOpen(false);
                  }}
                  className={`admin-nav-button ${
                    activeTab === tab ? "admin-nav-button-active" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{label}</span>
                  </span>
                </button>
              ))}
            </nav>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/84 transition hover:border-white/20 hover:bg-white/10"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-[19.75rem]">
        <main className="container mx-auto flex max-w-[1380px] flex-col gap-6 px-4 py-6 lg:py-8">
          <section className="admin-card sticky top-3 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Admin Navigation
              </div>
              <div className="mt-1 font-condensed text-2xl font-black text-primary">
                {tabLabels[activeTab]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card"
            >
              <Menu size={20} />
            </button>
          </section>

          <section className="admin-hero-card px-6 py-8 md:px-8 md:py-9">
            <div className="hero-grid absolute inset-0 opacity-20" />
            <div className="accent-orb absolute -right-10 top-8 h-44 w-44 rounded-full bg-accent/18 blur-3xl" />
            <div className="accent-orb absolute bottom-0 left-10 h-36 w-36 rounded-full bg-gold/14 blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/90">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {tabLabels[activeTab]}
              </div>
              <h2 className="mt-5 max-w-3xl font-condensed text-4xl font-black leading-[0.95] text-white md:text-5xl">
                {activeTab === "overview" && "A clearer operational view of your website."}
                {activeTab === "contacts" && "Respond to inbound leads with more context and better flow."}
                {activeTab === "careers" && "Turn applications into an organized hiring pipeline."}
                {activeTab === "content" && "Update synced website content without leaving the admin panel."}
                {activeTab === "settings" && "Control brand settings, mail routing, admin account security, and panel users."}
                {activeTab === "health" && "Track backend status, audit events, suspicious attempts, and blocked clients."}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/82">
                {tabDescriptions[activeTab]}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="metric-pill rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/86">
                  {dashboard?.stats.contactCount ?? contacts.length} contacts
                </span>
                <span className="metric-pill rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/86">
                  {dashboard?.stats.careerCount ?? careers.length} careers
                </span>
                <span className="metric-pill rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/86">
                  {dashboard?.stats.pendingInbox ?? pendingInboxCount} pending
                </span>
                <span className="metric-pill rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/86">
                  {managedContentCount} managed items
                </span>
              </div>
            </div>
          </section>

          <section className="admin-card px-6 py-5 md:px-7">
            <div className="admin-kicker">{tabLabels[activeTab]}</div>
            <h3 className="mt-4 font-condensed text-3xl font-black leading-none text-primary">
              {activeTab === "overview" && "At-a-glance activity"}
              {activeTab === "contacts" && "Contact form inbox"}
              {activeTab === "careers" && "Career application inbox"}
              {activeTab === "content" && "Editable website content"}
              {activeTab === "settings" && "Site, mail, user, and account settings"}
              {activeTab === "health" && "Backend and security health"}
            </h3>
            <div className="highlight-line mt-4" />
          </section>

          {activeTab === "overview" && (
            <AdminOverview
              dashboard={dashboard}
              dashboardError={dashboardError}
              contactCount={dashboard?.stats.contactCount ?? contacts.length}
              careerCount={dashboard?.stats.careerCount ?? careers.length}
              refreshing={refreshingLiveData}
              contacts={contacts}
              careers={careers}
            />
          )}

          {activeTab === "contacts" && (
            contactsLoading && !contactsLoaded ? (
              <div className="admin-empty">Loading contact inbox...</div>
            ) : (
              <AdminSubmissionList
                type="contact"
                items={contacts}
                savingKey={submissionSavingKey}
                replySendingKey={replySendingKey}
                replyDrafts={replyDrafts}
                siteName={settings.site_name}
                onFieldChange={handleSubmissionFieldChange}
                onSave={handleSubmissionSave}
                onReplyDraftChange={handleReplyDraftChange}
                onSendReply={handleSendReply}
              />
            )
          )}

          {activeTab === "careers" && (
            careersLoading && !careersLoaded ? (
              <div className="admin-empty">Loading career inbox...</div>
            ) : (
              <AdminSubmissionList
                type="career"
                items={careers}
                savingKey={submissionSavingKey}
                replySendingKey={replySendingKey}
                replyDrafts={replyDrafts}
                siteName={settings.site_name}
                onFieldChange={handleSubmissionFieldChange}
                onSave={handleSubmissionSave}
                onReplyDraftChange={handleReplyDraftChange}
                onSendReply={handleSendReply}
              />
            )
          )}

          {activeTab === "content" && (
            <AdminContentManager
              contentType={contentType}
              contentItems={contentItems}
              contentLoading={contentLoading}
              contentSaving={contentSaving}
              contentDraft={contentDraft}
              onTypeChange={setContentType}
              onDraftChange={(patch) =>
                setContentDraft((current) => ({ ...current, ...patch }))
              }
              onSave={handleContentSave}
              onReset={() => setContentDraft(emptyContentDraft(contentType))}
              onEdit={(item) => setContentDraft(draftFromContentItem(item))}
              onDelete={handleContentDelete}
            />
          )}

          {activeTab === "settings" && (
            <AdminSettingsForm
              admin={admin}
              settings={settings}
              saving={settingsSaving}
              canManageUsers={Boolean(admin?.permissions.users)}
              users={users}
              userSaving={userSaving}
              health={health}
              backupDownloadUrl={adminBackupDownloadUrl}
              onChange={(patch) =>
                setSettingsState((current) => ({ ...current, ...patch }))
              }
              onSave={handleSettingsSave}
              onAdminChange={setAdmin}
              onCreateUser={handleUserCreate}
              onUpdateUser={handleUserUpdate}
              onDeleteUser={handleUserDelete}
              onUsersUpdated={setUsers}
            />
          )}

          {activeTab === "health" && (
            healthLoading && !healthLoaded ? (
              <div className="admin-empty">Loading system health...</div>
            ) : (
              <AdminHealthPanel
                health={health}
                dashboard={dashboard}
                blockingIp={blockingIp}
                unlockingLoginKey={unlockingLoginKey}
                onBlockIp={(ipAddress) => handleIpBlockAction("block", ipAddress)}
                onUnblockIp={(ipAddress) => handleIpBlockAction("unblock", ipAddress)}
                onClearLoginLock={handleClearLoginLock}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}
