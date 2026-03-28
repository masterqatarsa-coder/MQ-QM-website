import { useRef, useState } from "react";
import { Clock, Mail, MapPin, Phone, User } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/UIComponents";
import { submitCareerForm, type ContentItem } from "@/lib/cmsApi";
import { useManagedContent } from "@/hooks/use-managed-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { metadataString } from "@/lib/contentMetadata";

interface CareersPageProps {
  embedded?: boolean;
}

const fallbackJobs = [
  {
    title: "MEP Project Engineer",
    description: "Lead electrical and mechanical delivery for high-rise and infrastructure projects.",
    location: "Jeddah",
    type: "Full-time",
  },
  {
    title: "ELV Systems Specialist",
    description: "Design and deploy BMS, CCTV, access control and fire alarm systems.",
    location: "Jeddah",
    type: "Full-time",
  },
  {
    title: "Facility Management Coordinator",
    description: "Manage FM operations and client service excellence for enterprise portfolios.",
    location: "Jeddah",
    type: "Full-time",
  },
  {
    title: "Site Safety Officer",
    description: "Ensure compliance with safety standards and drive safe execution on site.",
    location: "Jeddah",
    type: "Full-time",
  },
];

function jobCardFromItem(item: ContentItem) {
  return {
    title: item.title,
    description: item.description || metadataString(item.metadata, "summary"),
    location: metadataString(item.metadata, "location", "Jeddah"),
    type: metadataString(item.metadata, "type", "Full-time"),
  };
}

export default function CareersPage({ embedded = false }: CareersPageProps) {
  const { settings } = useSiteSettings();
  const { items: managedJobs } = useManagedContent("jobs");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    message: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const jobs =
    managedJobs.length > 0 ? managedJobs.map(jobCardFromItem) : fallbackJobs;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleApply = (role: string) => {
    setForm((current) => ({ ...current, role }));
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.role.trim() ||
      !form.message.trim() ||
      !resume
    ) {
      setFormError("Please fill in all fields and attach your resume before submitting.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await submitCareerForm({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        message: form.message.trim(),
        resume,
      });

      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", role: "", message: "" });
      setResume(null);
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Careers"
          subtitle={`Join ${settings.site_name} and build a future in ${settings.office_address}`}
        />
      )}

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="space-y-6">
              <SectionHeading
                label="Opportunities"
                title="Be part of our growth"
                subtitle="We are hiring engineering, operations, and delivery specialists across Saudi Arabia."
              />

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: MapPin,
                    title: "Office",
                    value: settings.office_address,
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    value: `${settings.primary_phone} / ${settings.secondary_phone}`,
                  },
                  {
                    icon: Mail,
                    title: "Email",
                    value: settings.primary_email,
                    href: `mailto:${settings.primary_email}`,
                  },
                  {
                    icon: Clock,
                    title: "Working Hours",
                    value: settings.business_hours_weekday,
                  },
                ].map(({ icon: Icon, title, value, href }) => (
                  <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-semibold text-foreground">{title}</div>
                      {href ? (
                        <a href={href} className="text-sm text-muted-foreground transition hover:text-primary">
                          {value}
                        </a>
                      ) : (
                        <div className="text-sm text-muted-foreground">{value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-6 rounded-2xl border border-border bg-card p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Open roles
                </div>
                <h3 className="mt-2 text-xl font-bold text-foreground">Current Openings</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explore current openings and submit your application directly to our team.
                </p>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-2">
                {jobs.map((job) => (
                  <div key={job.title} className="rounded-2xl border border-border bg-white/8 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-foreground">{job.title}</h4>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        {job.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{job.location}</p>
                    <p className="mt-3 text-sm text-foreground">{job.description}</p>
                    <button
                      type="button"
                      onClick={() => handleApply(job.title)}
                      className="mt-4 w-full rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>

              <div ref={formRef} className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                      <User size={28} className="text-accent" />
                    </div>
                    <h3 className="mb-2 font-condensed text-2xl font-bold text-primary">
                      Application sent
                    </h3>
                    <p className="max-w-sm text-muted-foreground">
                      Thank you for your application. Our team will review it and get back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", phone: "", role: "", message: "" });
                        setResume(null);
                      }}
                      className="mt-6 rounded bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/85"
                    >
                      Submit another application
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="mb-6 font-condensed text-2xl font-bold text-primary">Apply Now</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Your full name"
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="your@email.com"
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+966 XX XXX XXXX"
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">Desired Role</label>
                          <input
                            type="text"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            placeholder="Position you're applying for"
                            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      {formError && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Cover Message</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Tell us about your experience and strengths"
                          className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Resume Attachment
                        </label>
                        <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-input bg-background px-4 py-4 text-sm text-muted-foreground transition hover:border-accent/40 hover:bg-accent/5">
                          <span className="font-medium text-foreground">
                            {resume ? resume.name : "Upload PDF, DOC, or DOCX resume"}
                          </span>
                          <span>Maximum size: 5 MB</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(event) => setResume(event.target.files?.[0] || null)}
                            required
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-all hover:bg-primary/85 disabled:opacity-70"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
