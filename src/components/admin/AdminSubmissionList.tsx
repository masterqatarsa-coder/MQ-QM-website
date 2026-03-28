import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  Mail,
  Paperclip,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { apiBaseUrl, type SubmissionItem, type SubmissionType } from "@/lib/cmsApi";
import { buildPaginationTokens } from "@/lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ReplyDraft = {
  subject: string;
  message: string;
};

type AdminSubmissionListProps = {
  type: SubmissionType;
  items: SubmissionItem[];
  savingKey: string | null;
  replySendingKey: string | null;
  replyDrafts: Record<string, ReplyDraft>;
  siteName: string;
  onFieldChange: (
    type: SubmissionType,
    submissionId: number,
    patch: Partial<Pick<SubmissionItem, "status" | "adminNotes">>,
  ) => void;
  onSave: (type: SubmissionType, item: SubmissionItem) => void;
  onReplyDraftChange: (
    type: SubmissionType,
    submissionId: number,
    patch: Partial<ReplyDraft>,
  ) => void;
  onSendReply: (type: SubmissionType, item: SubmissionItem) => void;
};

type SubmissionFilter = "all" | "unread" | "read" | "in_progress" | "replied" | "closed";

const filterLabels: Record<SubmissionFilter, string> = {
  all: "All",
  unread: "Unread",
  read: "Read",
  in_progress: "In Progress",
  replied: "Replied",
  closed: "Closed",
};

const INBOX_PAGE_SIZE = 8;

function submissionKey(type: SubmissionType, submissionId: number) {
  return `${type}-${submissionId}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusClasses(status: string) {
  if (status === "unread") {
    return "bg-red-100 text-red-700";
  }
  if (status === "read") {
    return "bg-slate-200 text-slate-700";
  }
  if (status === "in_progress") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "replied") {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-primary/10 text-primary";
}

function formatAdminDate(value: string) {
  const parsed = new Date(value.replace(" ", "T") + "Z");

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function previewText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function formatFileSize(sizeBytes?: number | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return "Unknown size";
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function submissionHeading(type: SubmissionType, item: SubmissionItem) {
  return type === "contact"
    ? `Contact inquiry from ${item.name}`
    : `Application for ${item.role || "open position"}`;
}

function submissionFileUrl(
  type: SubmissionType,
  item: SubmissionItem,
  disposition: "attachment" | "inline" = "attachment",
) {
  if (type !== "career" || !item.resumeFileName) {
    return null;
  }

  return `${apiBaseUrl}/admin/submission-file.php?type=career&id=${item.id}&disposition=${disposition}`;
}

function canViewInlineResume(item: SubmissionItem) {
  const mimeType = (item.resumeMimeType || "").toLowerCase();
  const fileName = (item.resumeOriginalName || item.resumeFileName || "").toLowerCase();

  return mimeType === "application/pdf" || fileName.endsWith(".pdf");
}

export default function AdminSubmissionList({
  type,
  items,
  savingKey,
  replySendingKey,
  replyDrafts,
  siteName,
  onFieldChange,
  onSave,
  onReplyDraftChange,
  onSendReply,
}: AdminSubmissionListProps) {
  const [activeFilter, setActiveFilter] = useState<SubmissionFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const unreadCount = items.filter((item) => item.status === "unread").length;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleItems = items.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.status === activeFilter;
    const matchesSearch =
      normalizedSearch === "" ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.email.toLowerCase().includes(normalizedSearch) ||
      item.phone.toLowerCase().includes(normalizedSearch) ||
      (item.role || "").toLowerCase().includes(normalizedSearch) ||
      item.message.toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const selectedItem =
    visibleItems.find((item) => item.id === selectedId) ||
    items.find((item) => item.id === selectedId) ||
    null;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / INBOX_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = visibleItems.slice(
    (safePage - 1) * INBOX_PAGE_SIZE,
    safePage * INBOX_PAGE_SIZE,
  );
  const paginationTokens = buildPaginationTokens(safePage, totalPages);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchTerm, type]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleExport = () => {
    const rows = [
      [
        "ID",
        "Type",
        "Name",
        "Email",
        "Phone",
        "Role",
        "Status",
        "Admin Notes",
        "Message",
        "Resume",
        "Created At",
        "Updated At",
      ],
      ...visibleItems.map((item) => [
        String(item.id),
        type,
        item.name,
        item.email,
        item.phone,
        item.role || "",
        item.status,
        item.adminNotes,
        item.message,
        item.resumeOriginalName || "",
        item.createdAt,
        item.updatedAt,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-submissions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) {
    return (
      <div className="admin-empty">
        No {type === "contact" ? "contact messages" : "career applications"} yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <section className="admin-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-condensed text-3xl font-black leading-none text-primary">
              {type === "contact" ? "Contact inbox" : "Career inbox"}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {items.length} total messages with {unreadCount} unread and ready for review.
            </p>
          </div>

          <button type="button" onClick={handleExport} className="admin-btn-secondary">
            <Download size={16} />
            Export CSV
          </button>
        </section>

        <section className="admin-card space-y-4 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as SubmissionFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>

            <label className="relative block w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`Search ${type === "contact" ? "contact" : "career"} inbox`}
                className="admin-input pl-11"
              />
            </label>
          </div>

          <div className="space-y-3">
            {visibleItems.length === 0 && (
              <div className="admin-empty">
                No {type === "contact" ? "messages" : "applications"} match this filter.
              </div>
            )}

            {pageItems.map((item) => (
              <section key={submissionKey(type, item.id)} className="admin-soft-card px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-condensed text-2xl font-bold text-primary">
                        {item.name}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                      {type === "career" && item.role && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          {item.role}
                        </span>
                      )}
                      {type === "career" && item.resumeOriginalName && (
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                          Resume attached
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span>{item.email}</span>
                      <span>{item.phone}</span>
                      <span>{formatAdminDate(item.createdAt)}</span>
                    </div>

                    <div className="mt-3 text-sm font-semibold text-slate-800">
                      {submissionHeading(type, item)}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {previewText(item.message)}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden text-right text-xs text-muted-foreground md:block">
                      <div>{item.browser || "Browser unavailable"}</div>
                      <div>{item.deviceType || "Unknown device"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="admin-btn-secondary"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {visibleItems.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Page {safePage} of {totalPages} | {visibleItems.length} matching records
              </div>

              <Pagination className="justify-start">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (safePage > 1) {
                          setPage(safePage - 1);
                        }
                      }}
                      className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {paginationTokens.map((token, index) => (
                    <PaginationItem key={`${token}-${index}`}>
                      {token === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={token === safePage}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(token);
                          }}
                        >
                          {token}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (safePage < totalPages) {
                          setPage(safePage + 1);
                        }
                      }}
                      className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm lg:items-center">
          <div className="absolute inset-0" onClick={() => setSelectedId(null)} />
          <section className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl lg:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {type === "contact" ? "Contact detail" : "Career detail"}
                </div>
                <div className="mt-2 font-condensed text-3xl font-black leading-none text-primary">
                  {selectedItem.name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[0.72fr_1.28fr]">
              <div className="overflow-y-auto border-b border-slate-200 bg-slate-50/70 p-5 lg:border-b-0 lg:border-r md:p-6">
                <div className="space-y-4">
                  <div className="admin-soft-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(selectedItem.status)}`}
                      >
                        {statusLabel(selectedItem.status)}
                      </span>
                      {type === "career" && selectedItem.role && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          {selectedItem.role}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start gap-3">
                        <UserRound size={16} className="mt-0.5 text-accent" />
                        <div>
                          <div className="font-semibold text-primary">Applicant</div>
                          <div>{selectedItem.name}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail size={16} className="mt-0.5 text-accent" />
                        <div>
                          <div className="font-semibold text-primary">Contact</div>
                          <div>{selectedItem.email}</div>
                          <div>{selectedItem.phone}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Received
                        </div>
                        <div className="mt-1">{formatAdminDate(selectedItem.createdAt)}</div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Browser Session
                        </div>
                        <div className="mt-1">
                          {selectedItem.browser || "Unknown browser"} | {selectedItem.deviceType || "Unknown device"}
                        </div>
                        {selectedItem.referrer && (
                          <div className="mt-1 text-muted-foreground">{selectedItem.referrer}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {type === "career" && selectedItem.resumeOriginalName && (
                    <div className="admin-soft-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Resume Attachment
                          </div>
                          <div className="mt-2 font-semibold text-primary">
                            {selectedItem.resumeOriginalName}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {formatFileSize(selectedItem.resumeSizeBytes)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canViewInlineResume(selectedItem) && submissionFileUrl(type, selectedItem, "inline") && (
                            <a
                              href={submissionFileUrl(type, selectedItem, "inline") || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-btn-secondary"
                            >
                              <Eye size={16} />
                              View Online
                            </a>
                          )}

                          {submissionFileUrl(type, selectedItem) && (
                            <a
                              href={submissionFileUrl(type, selectedItem) || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-btn-secondary"
                            >
                              <Paperclip size={16} />
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="admin-soft-card p-4">
                    <label className="mb-2 block text-sm font-medium text-primary">
                      Status
                    </label>
                    <select
                      value={selectedItem.status}
                      onChange={(event) =>
                        onFieldChange(type, selectedItem.id, { status: event.target.value })
                      }
                      className="admin-select"
                    >
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="in_progress">In Progress</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>

                    <label className="mb-2 mt-4 block text-sm font-medium text-primary">
                      Admin Notes
                    </label>
                    <textarea
                      rows={5}
                      value={selectedItem.adminNotes}
                      onChange={(event) =>
                        onFieldChange(type, selectedItem.id, { adminNotes: event.target.value })
                      }
                      className="admin-textarea"
                    />

                    <button
                      type="button"
                      onClick={() => onSave(type, selectedItem)}
                      disabled={savingKey === submissionKey(type, selectedItem.id)}
                      className="admin-btn-secondary mt-4 w-full disabled:opacity-70"
                    >
                      {savingKey === submissionKey(type, selectedItem.id) ? "Saving..." : "Save Updates"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto p-5 md:p-6">
                <div className="admin-soft-card p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Message
                  </div>
                  <div className="mt-3 font-condensed text-2xl font-bold text-primary">
                    {submissionHeading(type, selectedItem)}
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedItem.message}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
                  <div className="admin-soft-card space-y-4 p-5">
                    <div className="font-condensed text-2xl font-bold text-primary">
                      Reply
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">
                        Reply Subject
                      </label>
                      <input
                        value={
                          replyDrafts[submissionKey(type, selectedItem.id)]?.subject ||
                          (type === "contact"
                            ? `Re: Your inquiry to ${siteName || "our team"}`
                            : `Re: Your application for ${selectedItem.role || "our role"}`)
                        }
                        onChange={(event) =>
                          onReplyDraftChange(type, selectedItem.id, { subject: event.target.value })
                        }
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">
                        Reply Message
                      </label>
                      <textarea
                        rows={7}
                        value={replyDrafts[submissionKey(type, selectedItem.id)]?.message || ""}
                        onChange={(event) =>
                          onReplyDraftChange(type, selectedItem.id, { message: event.target.value })
                        }
                        className="admin-textarea"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onSendReply(type, selectedItem)}
                      disabled={replySendingKey === submissionKey(type, selectedItem.id)}
                      className="admin-btn-primary disabled:opacity-70"
                    >
                      {replySendingKey === submissionKey(type, selectedItem.id) ? "Sending..." : "Send Reply"}
                    </button>
                  </div>

                  <div>
                    <div className="font-condensed text-2xl font-bold text-primary">
                      Reply History
                    </div>
                    <div className="highlight-line mt-3" />
                    <div className="mt-3 space-y-3">
                      {selectedItem.replies.length === 0 && (
                        <div className="admin-empty">No replies have been sent yet.</div>
                      )}

                      {selectedItem.replies.map((reply) => (
                        <div key={reply.id} className="admin-soft-card p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-primary">
                              {reply.subject}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatAdminDate(reply.createdAt)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {reply.adminName || "Admin reply"}
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {reply.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
