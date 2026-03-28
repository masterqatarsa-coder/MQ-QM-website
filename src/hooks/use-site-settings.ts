import { useEffect, useState } from "react";
import { fetchPublicSettings, type PublicSiteSettings } from "@/lib/cmsApi";

const defaultSettings: PublicSiteSettings = {
  site_name: "Master Qatar W.L.L.",
  site_tagline: "Engineering excellence in Saudi Arabia",
  primary_brand_location: "KSA-Jeddah",
  secondary_brand_name: "QM Arabia",
  secondary_brand_location: "KSA-Jeddah",
  office_address:
    "Mezzanine Floor Office No - 1, 7653 Al-Madinah Al-Munawarah Rd, Al-Baghdadiyah Al-Sharqiyah District - 4672, Jeddah 22235",
  location_url: "",
  map_embed_url: "",
  primary_phone: "+966 539817923",
  secondary_phone: "+966 509810613",
  primary_email: "mail.masterqatar@gmail.com",
  business_hours_weekday: "8AM to 5PM",
  business_hours_weekend: "Friday - Saturday: Closed",
  sister_company_name: "Qatar Masters",
  sister_company_url: "http://www.qatarmaster.com.qa/",
  sister_company_location: "Doha, Qatar",
  sister_company_note: "Established 2011",
  facebook_url: "#",
  linkedin_url: "#",
  twitter_url: "#",
  instagram_url: "#",
};

const SITE_SETTINGS_CACHE_KEY = "mq-public-site-settings";
const SITE_SETTINGS_CACHE_TTL = 5 * 60 * 1000;

let siteSettingsMemoryCache: PublicSiteSettings | null = null;
let siteSettingsRequest: Promise<PublicSiteSettings> | null = null;

function readCachedSettings(): PublicSiteSettings | null {
  if (siteSettingsMemoryCache) {
    return siteSettingsMemoryCache;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const cached = window.sessionStorage.getItem(SITE_SETTINGS_CACHE_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as {
      savedAt?: number;
      settings?: PublicSiteSettings;
    };

    if (parsed.settings && Date.now() - (parsed.savedAt ?? 0) < SITE_SETTINGS_CACHE_TTL) {
      siteSettingsMemoryCache = parsed.settings;
      return parsed.settings;
    }
  } catch {
    window.sessionStorage.removeItem(SITE_SETTINGS_CACHE_KEY);
  }

  return null;
}

function writeCachedSettings(settings: PublicSiteSettings) {
  siteSettingsMemoryCache = settings;

  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SITE_SETTINGS_CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      settings,
    }),
  );
}

async function loadSiteSettings(): Promise<PublicSiteSettings> {
  const cached = readCachedSettings();
  if (cached) {
    return cached;
  }

  if (!siteSettingsRequest) {
    siteSettingsRequest = fetchPublicSettings()
      .then((response) => {
        const merged = {
          ...defaultSettings,
          ...response.settings,
        };
        writeCachedSettings(merged);
        return merged;
      })
      .finally(() => {
        siteSettingsRequest = null;
      });
  }

  return siteSettingsRequest;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(
    () => readCachedSettings() || defaultSettings,
  );
  const [loading, setLoading] = useState(() => readCachedSettings() === null);

  useEffect(() => {
    let cancelled = false;

    loadSiteSettings()
      .then((resolvedSettings) => {
        if (!cancelled) {
          setSettings(resolvedSettings);
        }
      })
      .catch(() => {
        // Keep the public website usable with local defaults if the API is unavailable.
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

  return { settings, loading };
}
