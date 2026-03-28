import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/UIComponents";
import { submitContactForm } from "@/lib/cmsApi";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface ContactPageProps {
  embedded?: boolean;
}

export default function ContactPage({ embedded = false }: ContactPageProps) {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapEmbedUrl =
    settings.map_embed_url ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d39.1843368!3d21.5014555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3cfecb435a733:0xeca822ac116fa5d3!2sMaster+Qatar!5e0!3m2!1sen!2s!4v";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Please fill in all fields before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Contact Us"
          subtitle={`Get in touch with ${settings.site_name} in ${settings.office_address}`}
          details={
            <div className="mt-6 grid max-w-2xl gap-3 text-sm text-primary-foreground/90 md:grid-cols-2">
              {settings.location_url ? (
                <a
                  href={settings.location_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left hover:border-accent/30 hover:bg-white/12"
                >
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>
                    {settings.office_address}
                    <span className="block text-xs text-muted-foreground">View on map</span>
                  </span>
                </a>
              ) : (
                <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{settings.office_address}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`tel:${settings.primary_phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left hover:border-accent/30 hover:bg-white/12"
                >
                  <Phone className="h-4 w-4 text-accent" />
                  <span>
                    {settings.primary_phone}
                    <span className="block text-xs text-muted-foreground">Call us</span>
                  </span>
                </a>
                <a
                  href={`tel:${settings.secondary_phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left hover:border-accent/30 hover:bg-white/12"
                >
                  <Phone className="h-4 w-4 text-accent" />
                  <span>
                    {settings.secondary_phone}
                    <span className="block text-xs text-muted-foreground">Call us</span>
                  </span>
                </a>
              </div>

              <a
                href={`mailto:${settings.primary_email}`}
                className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left hover:border-accent/30 hover:bg-white/12"
              >
                <Mail className="h-4 w-4 text-accent" />
                <span>
                  {settings.primary_email}
                  <span className="block text-xs text-muted-foreground">Send us an email</span>
                </span>
              </a>
            </div>
          }
        />
      )}

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <SectionHeading
                label="Reach Out"
                title="We'd Love to Hear From You"
                subtitle="Our engineering team is ready to discuss your project requirements."
              />

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: MapPin,
                    title: "Office Location",
                    body: settings.office_address,
                    href: settings.location_url,
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    body: `${settings.primary_phone} / ${settings.secondary_phone}`,
                    href: `tel:${settings.primary_phone.replace(/\s+/g, "")}`,
                  },
                  {
                    icon: Mail,
                    title: "Email",
                    body: settings.primary_email,
                    href: `mailto:${settings.primary_email}`,
                  },
                  {
                    icon: Clock,
                    title: "Business Hours",
                    body: `${settings.business_hours_weekday} | ${settings.business_hours_weekend}`,
                  },
                ].map(({ icon: Icon, title, body, href }) => (
                  <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-semibold text-foreground">{title}</div>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noreferrer" : undefined}
                          className="text-sm text-muted-foreground transition hover:text-primary"
                        >
                          {body}
                        </a>
                      ) : (
                        <div className="text-sm text-muted-foreground">{body}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={settings.sister_company_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-border bg-muted p-4 transition hover:bg-muted/70"
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Sister Company
                </div>
                <div className="font-condensed text-lg font-bold text-primary">
                  {settings.sister_company_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {settings.sister_company_location}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {settings.sister_company_note}
                </div>
              </a>
            </div>

            <div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h3 className="mb-3 text-xl font-bold text-foreground">Send a Message</h3>
                <p className="mb-5 text-sm text-muted-foreground">
                  Fill in the form and we&apos;ll get back within 1 to 2 business days.
                </p>

                {submitted ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    Thank you. Your message has been received and is now available in the admin inbox.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {error && (
                      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        required
                        className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-80 overflow-hidden bg-muted">
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${settings.site_name} office location`}
        />
      </section>
    </div>
  );
}
