import { useEffect, useState } from "react";
import {
  fetchContent,
  fetchHomepageContent,
  type ContentItem,
  type ContentType,
} from "@/lib/cmsApi";

type UseManagedContentOptions = {
  homepage?: boolean;
};

const CONTENT_CACHE_TTL = 5 * 60 * 1000;
const contentMemoryCache = new Map<string, ContentItem[]>();
const contentRequestCache = new Map<string, Promise<ContentItem[]>>();

function contentCacheKey(type: ContentType, homepage: boolean) {
  return `mq-managed-content:${homepage ? "homepage" : "public"}:${type}`;
}

function readCachedContent(type: ContentType, homepage: boolean): ContentItem[] | null {
  const key = contentCacheKey(type, homepage);
  const memoryCached = contentMemoryCache.get(key);

  if (memoryCached) {
    return memoryCached;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      items?: ContentItem[];
    };

    if (parsed.items && Date.now() - (parsed.savedAt ?? 0) < CONTENT_CACHE_TTL) {
      contentMemoryCache.set(key, parsed.items);
      return parsed.items;
    }
  } catch {
    window.sessionStorage.removeItem(key);
  }

  return null;
}

function writeCachedContent(type: ContentType, homepage: boolean, items: ContentItem[]) {
  const key = contentCacheKey(type, homepage);
  contentMemoryCache.set(key, items);

  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    key,
    JSON.stringify({
      savedAt: Date.now(),
      items,
    }),
  );
}

async function loadManagedContent(type: ContentType, homepage: boolean) {
  const cached = readCachedContent(type, homepage);
  if (cached) {
    return cached;
  }

  const key = contentCacheKey(type, homepage);
  const existingRequest = contentRequestCache.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const loader = homepage ? fetchHomepageContent : fetchContent;
  const request = loader(type)
    .then((response) => {
      writeCachedContent(type, homepage, response.items);
      return response.items;
    })
    .finally(() => {
      contentRequestCache.delete(key);
    });

  contentRequestCache.set(key, request);
  return request;
}

export function useManagedContent(
  type: ContentType,
  options: UseManagedContentOptions = {},
) {
  const homepage = options.homepage === true;
  const [items, setItems] = useState<ContentItem[]>(
    () => readCachedContent(type, homepage) || [],
  );
  const [loading, setLoading] = useState(() => readCachedContent(type, homepage) === null);

  useEffect(() => {
    let cancelled = false;

    loadManagedContent(type, homepage)
      .then((resolvedItems) => {
        if (!cancelled) {
          setItems(resolvedItems);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
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
  }, [homepage, type]);

  return { items, loading };
}
