import {
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  GalleryVertical,
  Medal,
  MessageSquareQuote,
  PackageSearch,
  Wrench,
} from "lucide-react";
import ManagedContentImage from "@/components/ManagedContentImage";
import type { ContentItem, ContentType } from "@/lib/cmsApi";
import { allClientLogos, resolveContentImage } from "@/lib/contentMedia";
import { contentImageDisplay } from "@/lib/contentMetadata";

type ContentMetadata = Record<string, unknown>;

export type AdminContentDraft = {
  id?: number;
  type: ContentType;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
  isPublished: boolean;
  showOnHomePage: boolean;
  metadataText: string;
};

type AdminContentManagerProps = {
  contentType: ContentType;
  contentItems: Record<ContentType, ContentItem[]>;
  contentLoading: boolean;
  contentSaving: boolean;
  contentDraft: AdminContentDraft;
  onTypeChange: (type: ContentType) => void;
  onDraftChange: (patch: Partial<AdminContentDraft>) => void;
  onSave: () => void;
  onReset: () => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

const visibleContentTypes: ContentType[] = [
  "services",
  "service_products",
  "clients",
  "jobs",
  "projects",
  "certificates",
];

const labels: Record<ContentType, string> = {
  services: "Services",
  service_products: "Service Products",
  clients: "Clients",
  jobs: "Jobs",
  gallery: "Gallery",
  projects: "Projects",
  certificates: "Certificates",
  testimonials: "Testimonials",
};

const icons = {
  services: Wrench,
  service_products: PackageSearch,
  clients: Building2,
  jobs: BriefcaseBusiness,
  gallery: GalleryVertical,
  projects: FolderKanban,
  certificates: Medal,
  testimonials: MessageSquareQuote,
} satisfies Record<ContentType, typeof Wrench>;

const mediaEnabledTypes = new Set<ContentType>([
  "services",
  "service_products",
  "clients",
  "projects",
  "certificates",
]);

const serviceGroupOptions = [
  "MEP",
  "ELV",
  "Automation",
  "Trading",
  "Facility Management",
  "Workforce Solutions",
];

function normalizeServiceGroup(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sortServiceGroupName(value: string) {
  const knownIndex = serviceGroupOptions.findIndex(
    (option) => option.toLowerCase() === value.toLowerCase(),
  );

  return knownIndex === -1 ? `${serviceGroupOptions.length}-${value.toLowerCase()}` : `${knownIndex}-${value.toLowerCase()}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-input"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
      </label>
      {helper && (
        <div className="mb-2 text-xs leading-6 text-muted-foreground">
          {helper}
        </div>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-textarea"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-select"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  helper,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  helper?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-primary">{label}</label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      {helper && (
        <div className="mb-2 text-xs leading-6 text-muted-foreground">
          {helper}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[hsl(var(--accent))]"
      />
    </div>
  );
}

function parseMetadataText(metadataText: string): ContentMetadata | null {
  if (metadataText.trim() === "") {
    return {};
  }

  try {
    const parsed = JSON.parse(metadataText) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ContentMetadata)
      : {};
  } catch {
    return null;
  }
}

function compactMetadata(metadata: ContentMetadata): ContentMetadata {
  const next: ContentMetadata = {};

  Object.entries(metadata).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        next[key] = trimmed;
      }
      return;
    }

    if (Array.isArray(value)) {
      const cleanedArray = value
        .map((entry) => {
          if (typeof entry === "string") {
            return entry.trim();
          }

          if (entry && typeof entry === "object" && !Array.isArray(entry)) {
            return compactMetadata(entry as ContentMetadata);
          }

          return entry;
        })
        .filter((entry) => {
          if (typeof entry === "string") {
            return entry !== "";
          }

          if (entry && typeof entry === "object" && !Array.isArray(entry)) {
            return Object.keys(entry as ContentMetadata).length > 0;
          }

          return entry !== null && entry !== undefined;
        });

      if (cleanedArray.length > 0) {
        next[key] = cleanedArray;
      }
      return;
    }

    if (typeof value === "object") {
      const nested = compactMetadata(value as ContentMetadata);
      if (Object.keys(nested).length > 0) {
        next[key] = nested;
      }
      return;
    }

    next[key] = value;
  });

  return next;
}

function metadataStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];
}

function linesToStringList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringListToLines(value: unknown): string {
  return metadataStringList(value).join("\n");
}

function metadataSectionsToLines(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) {
        return "";
      }

      const title = String((section as ContentMetadata).title ?? "").trim();
      const items = metadataStringList((section as ContentMetadata).items).join(", ");

      if (!title) {
        return "";
      }

      return items ? `${title}: ${items}` : title;
    })
    .filter(Boolean)
    .join("\n");
}

function linesToMetadataSections(value: string): Array<{ title: string; items: string[] }> {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawTitle, rawItems = ""] = line.split(":");
      return {
        title: rawTitle.trim(),
        items: rawItems
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    })
    .filter((section) => section.title !== "");
}

export default function AdminContentManager({
  contentType,
  contentItems,
  contentLoading,
  contentSaving,
  contentDraft,
  onTypeChange,
  onDraftChange,
  onSave,
  onReset,
  onEdit,
  onDelete,
}: AdminContentManagerProps) {
  const parsedMetadataResult = parseMetadataText(contentDraft.metadataText);
  const metadata = parsedMetadataResult ?? {};
  const hasInvalidMetadata =
    parsedMetadataResult === null && contentDraft.metadataText.trim() !== "";

  const previewImage =
    contentDraft.imageUrl.trim() ||
    resolveContentImage({
      type: contentDraft.type,
      title: contentDraft.title,
      slug: contentDraft.slug || null,
      imageUrl: contentDraft.imageUrl || null,
      metadata,
    });
  const imageDisplay = contentImageDisplay(metadata);
  const clientLogoAssets = allClientLogos();
  const selectedClientLogoIndex =
    typeof metadata.logoIndex === "number"
      ? metadata.logoIndex
      : typeof metadata.logoIndex === "string" && metadata.logoIndex.trim() !== "" && !Number.isNaN(Number(metadata.logoIndex))
        ? Number(metadata.logoIndex)
        : null;
  const draftServiceGroup = normalizeServiceGroup(metadata.service);
  const groupedServiceProducts =
    contentType === "service_products"
      ? Object.entries(
          contentItems[contentType].reduce<Record<string, ContentItem[]>>((groups, item) => {
            const group = normalizeServiceGroup(item.metadata?.service) || "Ungrouped";
            if (!groups[group]) {
              groups[group] = [];
            }
            groups[group].push(item);
            return groups;
          }, {}),
        ).sort(([left], [right]) => sortServiceGroupName(left).localeCompare(sortServiceGroupName(right)))
      : [];

  const setMetadata = (nextMetadata: ContentMetadata) => {
    onDraftChange({
      metadataText: JSON.stringify(compactMetadata(nextMetadata), null, 2),
    });
  };

  const patchMetadata = (patch: ContentMetadata) => {
    setMetadata({ ...metadata, ...patch });
  };

  const patchImageDisplay = (patch: ContentMetadata) => {
    patchMetadata({
      imageDisplay: {
        ...(metadata.imageDisplay && typeof metadata.imageDisplay === "object" && !Array.isArray(metadata.imageDisplay)
          ? (metadata.imageDisplay as ContentMetadata)
          : {}),
        ...patch,
      },
    });
  };

  const resetImageDisplay = () => {
    const nextMetadata = { ...metadata };
    delete nextMetadata.imageDisplay;
    setMetadata(nextMetadata);
  };

  const renderMetadataFields = () => {
    switch (contentType) {
      case "services":
        return (
          <>
            <TextAreaField
              label="Highlights"
              value={stringListToLines(metadata.highlights)}
              helper="Enter one highlight per line."
              onChange={(value) => patchMetadata({ highlights: linesToStringList(value) })}
            />
            <TextAreaField
              label="Service Sections"
              value={metadataSectionsToLines(metadata.subsections)}
              helper="One section per line. Format: HVAC Systems: Chilled water, VRF, Ducting"
              onChange={(value) => patchMetadata({ subsections: linesToMetadataSections(value) })}
            />
          </>
        );
      case "service_products":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Parent Service"
                value={String(metadata.service ?? "")}
                onChange={(value) => patchMetadata({ service: value })}
                options={serviceGroupOptions}
              />
              <Field
                label="Category"
                value={String(metadata.category ?? "")}
                onChange={(value) => patchMetadata({ category: value })}
              />
            </div>
            <TextAreaField
              label="Specifications"
              value={stringListToLines(metadata.specs)}
              helper="Enter one specification per line."
              onChange={(value) => patchMetadata({ specs: linesToStringList(value) })}
            />
          </>
        );
      case "clients":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Sector"
                value={String(metadata.sector ?? "")}
                onChange={(value) => patchMetadata({ sector: value })}
              />
              <Field
                label="Country"
                value={String(metadata.country ?? "")}
                onChange={(value) => patchMetadata({ country: value })}
              />
              <Field
                label="Website"
                value={String(metadata.website ?? "")}
                onChange={(value) => patchMetadata({ website: value })}
              />
              <Field
                label="Logo Asset Index"
                type="number"
                value={selectedClientLogoIndex ? String(selectedClientLogoIndex) : ""}
                onChange={(value) =>
                  patchMetadata({
                    logoIndex: value.trim() === "" ? undefined : Number(value),
                  })
                }
              />
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-sm font-medium text-primary">Client Logo Assets</div>
              <div className="mt-1 text-xs leading-6 text-muted-foreground">
                Pick a logo asset for this client. The public site uses the same contain-fit display by default.
              </div>
              <div className="mt-4 grid max-h-[22rem] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                {clientLogoAssets.map((logo, index) => {
                  const assetIndex = index + 1;
                  const selected = selectedClientLogoIndex === assetIndex;

                  return (
                    <button
                      key={`client-asset-${assetIndex}`}
                      type="button"
                      onClick={() => patchMetadata({ logoIndex: assetIndex })}
                      className={`rounded-[1rem] border p-2 text-left transition ${
                        selected
                          ? "border-accent bg-accent/10 shadow-[0_14px_30px_-18px_rgba(23,160,255,0.35)]"
                          : "border-slate-200 bg-white hover:border-accent/30"
                      }`}
                    >
                      <ManagedContentImage
                        metadata={{}}
                        src={logo}
                        alt={`Client logo ${assetIndex}`}
                        frameClassName="flex h-16 w-full items-center justify-center"
                        className="h-full w-full"
                        defaultDisplay={{ fit: "contain", scale: 1 }}
                      />
                      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Logo {assetIndex}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
      case "jobs":
        return (
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Location"
              value={String(metadata.location ?? "")}
              onChange={(value) => patchMetadata({ location: value })}
            />
            <Field
              label="Department"
              value={String(metadata.department ?? "")}
              onChange={(value) => patchMetadata({ department: value })}
            />
            <Field
              label="Job Type"
              value={String(metadata.type ?? "")}
              onChange={(value) => patchMetadata({ type: value })}
            />
          </div>
        );
      case "projects":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Sector"
              value={String(metadata.sector ?? "")}
              onChange={(value) => patchMetadata({ sector: value })}
            />
            <Field
              label="Location"
              value={String(metadata.location ?? "")}
              onChange={(value) => patchMetadata({ location: value })}
            />
            <Field
              label="Scope"
              value={String(metadata.scope ?? "")}
              onChange={(value) => patchMetadata({ scope: value })}
            />
            <Field
              label="Year"
              value={String(metadata.year ?? "")}
              onChange={(value) => patchMetadata({ year: value })}
            />
          </div>
        );
      case "certificates":
        return (
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Issuer"
              value={String(metadata.issuer ?? "")}
              onChange={(value) => patchMetadata({ issuer: value })}
            />
            <Field
              label="Year"
              value={String(metadata.year ?? "")}
              onChange={(value) => patchMetadata({ year: value })}
            />
            <Field
              label="Status"
              value={String(metadata.status ?? "")}
              onChange={(value) => patchMetadata({ status: value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderLibraryItem = (item: ContentItem) => (
    <div key={item.id} className="admin-soft-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
            {resolveContentImage(item, item.sortOrder || 0) ? (
              <ManagedContentImage
                metadata={item.metadata}
                src={resolveContentImage(item, item.sortOrder || 0) || ""}
                alt={item.title}
                frameClassName={
                  item.type === "clients"
                    ? "flex h-full w-full items-center justify-center p-2"
                    : "h-full w-full"
                }
                className="h-full w-full"
                defaultDisplay={
                  item.type === "clients" ? { fit: "contain", scale: 1 } : undefined
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 via-accent/10 to-gold/10 px-2 text-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-primary">
                {item.title}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.isPublished
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.isPublished ? "Published" : "Draft"}
              </span>
              {item.showOnHomePage && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  Home
                </span>
              )}
              {contentType === "service_products" && normalizeServiceGroup(item.metadata?.category) && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                  {normalizeServiceGroup(item.metadata?.category)}
                </span>
              )}
            </div>
            {item.subtitle && (
              <div className="mt-1 text-sm text-slate-600">{item.subtitle}</div>
            )}
            {item.description && (
              <div className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </div>
            )}
            {Object.keys(item.metadata || {}).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(item.metadata)
                  .filter(([key]) => key !== "imageDisplay")
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                    >
                      {key}: {Array.isArray(value) ? value.length : String(value)}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="admin-btn-secondary px-3 py-2"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="admin-btn-danger px-3 py-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="admin-card p-6 md:p-7">
        <div className="mb-5 flex flex-wrap gap-2">
          {visibleContentTypes.map((type) => {
            const Icon = icons[type];

            return (
              <button
                key={type}
                type="button"
                onClick={() => onTypeChange(type)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  contentType === type
                    ? "bg-gradient-to-r from-gold to-accent text-[hsl(var(--gold-foreground))] shadow-[0_18px_34px_-18px_rgba(255,196,54,0.5)]"
                    : "border border-slate-200 bg-white/70 text-primary hover:border-accent/25 hover:bg-white"
                }`}
              >
                <Icon size={16} />
                {labels[type]}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-accent/15 bg-accent/10 px-4 py-3 text-sm text-primary">
            Manage {labels[contentType].toLowerCase()} here. Use the guided fields below for service details, job information, project metadata, and client data without writing raw JSON.
          </div>

          <Field
            label="Title"
            value={contentDraft.title}
            onChange={(value) => onDraftChange({ title: value })}
          />
          <Field
            label="Slug"
            value={contentDraft.slug}
            onChange={(value) => onDraftChange({ slug: value })}
          />
          <Field
            label="Subtitle"
            value={contentDraft.subtitle}
            onChange={(value) => onDraftChange({ subtitle: value })}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Description
            </label>
            <textarea
              rows={5}
              value={contentDraft.description}
              onChange={(event) => onDraftChange({ description: event.target.value })}
              className="admin-textarea"
            />
          </div>
          <Field
            label="Image URL"
            value={contentDraft.imageUrl}
            onChange={(value) => onDraftChange({ imageUrl: value })}
          />
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            {previewImage ? (
              <ManagedContentImage
                metadata={metadata}
                src={previewImage}
                alt={contentDraft.title || "Preview"}
                frameClassName={
                  contentType === "clients"
                    ? "flex h-48 w-full items-center justify-center p-6"
                    : "h-48 w-full"
                }
                className="h-48 w-full"
                defaultDisplay={
                  contentType === "clients" ? { fit: "contain", scale: 1 } : undefined
                }
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/5 via-accent/10 to-gold/10 px-6 text-center text-sm text-muted-foreground">
                Add an image URL to preview how this content will appear.
              </div>
            )}
          </div>
          {mediaEnabledTypes.has(contentType) && (
            <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
              <div>
                <div className="text-sm font-medium text-primary">Image Display Controls</div>
                <div className="mt-1 text-xs leading-6 text-muted-foreground">
                  Adjust crop, zoom, focus point, and border styling for this content image.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Fit"
                  value={imageDisplay.fit}
                  onChange={(value) => patchImageDisplay({ fit: value || "cover" })}
                  options={["cover", "contain"]}
                />
                <Field
                  label="Border Color"
                  value={imageDisplay.borderColor}
                  onChange={(value) => patchImageDisplay({ borderColor: value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RangeField
                  label="Zoom"
                  value={Math.round(imageDisplay.scale * 100)}
                  onChange={(value) => patchImageDisplay({ scale: value })}
                  min={60}
                  max={180}
                  suffix="%"
                />
                <RangeField
                  label="Corner Radius"
                  value={imageDisplay.radius}
                  onChange={(value) => patchImageDisplay({ radius: value })}
                  min={0}
                  max={48}
                  suffix="px"
                />
                <RangeField
                  label="Focus X"
                  value={imageDisplay.positionX}
                  onChange={(value) => patchImageDisplay({ positionX: value })}
                  min={0}
                  max={100}
                  suffix="%"
                />
                <RangeField
                  label="Focus Y"
                  value={imageDisplay.positionY}
                  onChange={(value) => patchImageDisplay({ positionY: value })}
                  min={0}
                  max={100}
                  suffix="%"
                />
                <RangeField
                  label="Border Width"
                  value={imageDisplay.borderWidth}
                  onChange={(value) => patchImageDisplay({ borderWidth: value })}
                  min={0}
                  max={16}
                  suffix="px"
                />
              </div>

              <button
                type="button"
                onClick={resetImageDisplay}
                className="admin-btn-secondary"
              >
                Reset Image Adjustments
              </button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="CTA Label"
              value={contentDraft.ctaLabel}
              onChange={(value) => onDraftChange({ ctaLabel: value })}
            />
            <Field
              label="CTA URL"
              value={contentDraft.ctaUrl}
              onChange={(value) => onDraftChange({ ctaUrl: value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Sort Order"
              type="number"
              value={String(contentDraft.sortOrder)}
              onChange={(value) => onDraftChange({ sortOrder: Number(value) || 0 })}
            />
            <div className="grid gap-3">
              <label className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white/72 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={contentDraft.isPublished}
                  onChange={(event) => onDraftChange({ isPublished: event.target.checked })}
                />
                Published on the public site
              </label>
              <label className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white/72 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={contentDraft.showOnHomePage}
                  onChange={(event) =>
                    onDraftChange({ showOnHomePage: event.target.checked })
                  }
                />
                Feature on the home page
              </label>
            </div>
          </div>
          <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
            <div>
              <div className="text-sm font-medium text-primary">Structured Details</div>
              <div className="mt-1 text-xs leading-6 text-muted-foreground">
                These fields are converted to metadata automatically when you save.
              </div>
            </div>

            {hasInvalidMetadata && (
              <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700">
                The advanced metadata JSON is not valid right now. Fix it below or use the guided fields to overwrite it safely.
              </div>
            )}

            {renderMetadataFields()}

            <details className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Advanced metadata JSON
              </summary>
              <div className="mt-3 text-xs leading-6 text-muted-foreground">
                Only use this for edge cases like extra keys or advanced internal data.
              </div>
              <textarea
                rows={8}
                value={contentDraft.metadataText}
                onChange={(event) => onDraftChange({ metadataText: event.target.value })}
                className="admin-textarea mt-3"
              />
            </details>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={contentSaving}
              className="admin-btn-primary disabled:opacity-70"
            >
              {contentSaving
                ? "Saving..."
                : contentDraft.id
                  ? "Update Item"
                  : "Create Item"}
            </button>
            <button type="button" onClick={onReset} className="admin-btn-secondary">
              Clear Form
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card p-6 md:p-7">
        <div className="admin-kicker">Library</div>
        <h3 className="mt-4 font-condensed text-3xl font-black leading-none text-primary">
          {labels[contentType]} List
        </h3>
        <div className="highlight-line mt-4" />

        <div className="mt-5 space-y-4">
          {contentLoading && <div className="admin-empty">Loading content items...</div>}

          {!contentLoading && contentItems[contentType].length === 0 && (
            <div className="admin-empty">No content items yet for this section.</div>
          )}

          {!contentLoading && contentType === "service_products" &&
            groupedServiceProducts.map(([group, items]) => (
              <details
                key={group}
                open={draftServiceGroup !== "" && draftServiceGroup.toLowerCase() === group.toLowerCase()}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
              >
                <summary className="cursor-pointer list-none px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-primary">{group}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {items.length} product{items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      Open
                    </span>
                  </div>
                </summary>
                <div className="space-y-4 border-t border-slate-200 p-4">
                  {items.map(renderLibraryItem)}
                </div>
              </details>
            ))}

          {!contentLoading && contentType !== "service_products" &&
            contentItems[contentType].map(renderLibraryItem)}

          {!contentLoading && contentType === "clients" && clientLogoAssets.length > 0 && (
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-base font-semibold text-primary">All Synced Client Logo Assets</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {clientLogoAssets.length} logo assets available
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
                {clientLogoAssets.map((logo, index) => {
                  const assetIndex = index + 1;
                  const selected = selectedClientLogoIndex === assetIndex;

                  return (
                    <button
                      key={`client-library-asset-${assetIndex}`}
                      type="button"
                      onClick={() => patchMetadata({ logoIndex: assetIndex })}
                      className={`rounded-[1rem] border p-3 text-left transition ${
                        selected
                          ? "border-accent bg-accent/10 shadow-[0_14px_30px_-18px_rgba(23,160,255,0.35)]"
                          : "border-slate-200 bg-slate-50 hover:border-accent/30"
                      }`}
                    >
                      <ManagedContentImage
                        metadata={{}}
                        src={logo}
                        alt={`Client logo ${assetIndex}`}
                        frameClassName="flex h-20 w-full items-center justify-center"
                        className="h-full w-full"
                        defaultDisplay={{ fit: "contain", scale: 1 }}
                      />
                      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Logo {assetIndex}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
