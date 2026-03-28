import type { CSSProperties } from "react";
import type { ContentItem } from "@/lib/cmsApi";

export type MetadataSection = {
  title: string;
  items: string[];
};

export type ContentImageDisplay = {
  fit: "cover" | "contain";
  scale: number;
  positionX: number;
  positionY: number;
  radius: number;
  borderWidth: number;
  borderColor: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
  fallback = "",
): string {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

export function metadataNumber(
  metadata: Record<string, unknown> | undefined,
  key: string,
  fallback = 0,
): number {
  const value = metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return fallback;
}

export function metadataStringList(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string[] {
  const value = metadata?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function metadataSections(
  metadata: Record<string, unknown> | undefined,
  key = "subsections",
): MetadataSection[] {
  const value = metadata?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const title =
        typeof entry.title === "string" && entry.title.trim() !== ""
          ? entry.title.trim()
          : "";
      const items = Array.isArray(entry.items)
        ? entry.items
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean)
        : [];

      if (!title && items.length === 0) {
        return null;
      }

      return {
        title,
        items,
      };
    })
    .filter((entry): entry is MetadataSection => entry !== null);
}

export function contentSummary(item: Pick<ContentItem, "description" | "metadata">): string {
  return item.description || metadataString(item.metadata, "summary");
}

export function contentImageDisplay(
  metadata: Record<string, unknown> | undefined,
  defaults: Partial<ContentImageDisplay> = {},
): ContentImageDisplay {
  const raw =
    metadata?.imageDisplay &&
    typeof metadata.imageDisplay === "object" &&
    !Array.isArray(metadata.imageDisplay)
      ? (metadata.imageDisplay as Record<string, unknown>)
      : undefined;

  const fit =
    raw?.fit === "contain" || raw?.fit === "cover"
      ? raw.fit
      : defaults.fit === "contain"
        ? "contain"
        : "cover";
  const scale = clamp(metadataNumber(raw, "scale", defaults.scale ? defaults.scale * 100 : 100), 60, 180) / 100;
  const positionX = clamp(metadataNumber(raw, "positionX", defaults.positionX ?? 50), 0, 100);
  const positionY = clamp(metadataNumber(raw, "positionY", defaults.positionY ?? 50), 0, 100);
  const radius = clamp(metadataNumber(raw, "radius", defaults.radius ?? 0), 0, 48);
  const borderWidth = clamp(metadataNumber(raw, "borderWidth", defaults.borderWidth ?? 0), 0, 16);
  const borderColor = metadataString(raw, "borderColor", defaults.borderColor ?? "transparent");

  return {
    fit,
    scale,
    positionX,
    positionY,
    radius,
    borderWidth,
    borderColor,
  };
}

export function contentImageFrameStyle(
  metadata: Record<string, unknown> | undefined,
  defaults: Partial<ContentImageDisplay> = {},
): CSSProperties {
  const display = contentImageDisplay(metadata, defaults);

  return {
    borderRadius: `${display.radius}px`,
    borderWidth: display.borderWidth > 0 ? `${display.borderWidth}px` : undefined,
    borderStyle: display.borderWidth > 0 ? "solid" : undefined,
    borderColor: display.borderWidth > 0 ? display.borderColor : undefined,
  };
}

export function contentImageStyle(
  metadata: Record<string, unknown> | undefined,
  defaults: Partial<ContentImageDisplay> = {},
): CSSProperties {
  const display = contentImageDisplay(metadata, defaults);

  return {
    objectFit: display.fit,
    objectPosition: `${display.positionX}% ${display.positionY}%`,
    transform: `scale(${display.scale})`,
    transformOrigin: `${display.positionX}% ${display.positionY}%`,
  };
}
