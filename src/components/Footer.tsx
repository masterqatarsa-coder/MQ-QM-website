import { Link } from "react-router-dom";
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import mqLogo from "../assets/MQ-LOGO.png";

const services = [
  { label: "MEP Contracting", href: "/services#mep" },
  { label: "ELV Systems", href: "/services#elv" },
  { label: "Automation Systems", href: "/services#automation" },
  { label: "Facility Management", href: "/services#fm" },
  { label: "Workforce Solutions", href: "/services#workforce" },
  { label: "Trading", href: "/services#trading" },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Clients", href: "/clients" },
  { label: "Certifications", href: "/certifications" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const { settings } = useSiteSettings();

  const primaryBrandName = settings.site_name || "Master Qatar W.L.L.";
  const primaryBrandLocation = settings.primary_brand_location || "Kingdom of Saudi Arabia";
  const secondaryBrandName = settings.secondary_brand_name || "QM Arabia";
  const secondaryBrandLocation = settings.secondary_brand_location || primaryBrandLocation;
  const officeAddress =
    settings.office_address ||
    "Mezzanine Floor Office No - 1, 7653 Al-Madinah Al-Munawarah Rd, Al-Baghdadiyah Al-Sharqiyah District - 4672, Jeddah 22235";
  const locationUrl = settings.location_url;
  const primaryPhone = settings.primary_phone || "+966 539817923";
  const secondaryPhone = settings.secondary_phone || "+966 509810613";
  const primaryEmail = settings.primary_email || "mail.masterqatar@gmail.com";
  const sisterCompanyName = settings.sister_company_name || "Qatar Masters";
  const sisterCompanyUrl = settings.sister_company_url || "#";
  const sisterCompanyLocation = settings.sister_company_location || "Doha, Qatar";
  const sisterCompanyNote = settings.sister_company_note || "Established 2011";

  const socials = [
    { label: "Facebook", icon: Facebook, href: settings.facebook_url || "#" },
    { label: "LinkedIn", icon: Linkedin, href: settings.linkedin_url || "#" },
    { label: "Twitter", icon: Twitter, href: settings.twitter_url || "#" },
    { label: "Instagram", icon: Instagram, href: settings.instagram_url || "#" },
  ];

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-primary-foreground/92">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,168,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,200,72,0.12),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,12,26,0.16),rgba(4,12,26,0.42))]" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="container relative mx-auto px-4 pb-5 pt-10 xl:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Start your next project
              </div>
              <h2 className="mt-4 font-condensed text-4xl font-black leading-none text-primary-foreground md:text-5xl">
                Build with an engineering partner that thinks in systems, not silos.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/88 md:text-base">
                From infrastructure delivery to facility operations, we help clients move from concept to execution with a sharper, more reliable experience.
              </p>
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-secondary px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_18px_40px_-18px_rgba(24,164,255,0.8)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Discuss Your Project
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:gap-4">
            <div>
              <Link
                to="/"
                className="flex w-full max-w-[24rem] items-center gap-4 rounded-[2rem] bg-white px-4 py-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                <div className="flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center">
                  <img
                    src={mqLogo}
                    alt="MQ logo"
                    className="h-[2.8rem] w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-condensed text-[1.65rem] font-black uppercase leading-none tracking-[0.08em] text-slate-900">
                    {primaryBrandName}
                  </div>
                  <div className="mt-2 truncate text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#d8a019]">
                    {primaryBrandLocation}
                  </div>
                </div>
              </Link>

              <Link
                to="/"
                className="mt-4 flex w-full max-w-[24rem] items-center gap-4 rounded-[2rem] bg-white px-4 py-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                <div className="flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center">
                  <img
                    src={mqLogo}
                    alt="MQ logo"
                    className="h-[2.8rem] w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-condensed text-[1.65rem] font-black leading-none tracking-[0.05em] text-slate-900">
                    {secondaryBrandName}
                  </div>
                  <div className="mt-2 truncate text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#d8a019]">
                    {secondaryBrandLocation}
                  </div>
                </div>
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/88">
                A trusted GCC engineering partner delivering MEP, ELV, automation, facility management, workforce, and trading solutions through one coordinated team.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {socials.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-primary-foreground/92 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/12 hover:text-gold"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/76">Services</h3>
              <div className="mt-5 space-y-3">
                {services.map((service) => (
                  <Link
                    key={service.label}
                    to={service.href}
                    className="group flex items-center gap-3 text-sm text-primary-foreground/88 transition-colors hover:text-gold"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80 transition-colors group-hover:bg-gold" />
                    {service.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/76">Explore</h3>
              <div className="mt-5 space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="group flex items-center gap-3 text-sm text-primary-foreground/88 transition-colors hover:text-gold"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80 transition-colors group-hover:bg-gold" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/76">Contact</h3>
              <div className="mt-5 space-y-4 text-sm text-primary-foreground/92">
                {locationUrl ? (
                  <a href={locationUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3 transition-colors hover:text-gold">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold">
                      <MapPin size={15} />
                    </div>
                    <span>{officeAddress}</span>
                  </a>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold">
                      <MapPin size={15} />
                    </div>
                    <span>{officeAddress}</span>
                  </div>
                )}
                <a href={`tel:${primaryPhone.replace(/\s+/g, "")}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold">
                    <Phone size={15} />
                  </div>
                  {primaryPhone}
                </a>
                <a href={`tel:${secondaryPhone.replace(/\s+/g, "")}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold">
                    <Phone size={15} />
                  </div>
                  {secondaryPhone}
                </a>
                <a href={`mailto:${primaryEmail}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold">
                    <Mail size={15} />
                  </div>
                  {primaryEmail}
                </a>
              </div>

              <a
                href={sisterCompanyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block rounded-[1.3rem] border border-white/10 bg-white/10 p-4 transition hover:bg-white/20"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/72">Sister company</div>
                <div className="mt-2 font-condensed text-xl font-bold text-primary-foreground">{sisterCompanyName}</div>
                <div className="mt-1 text-sm text-primary-foreground/82">{sisterCompanyLocation} | {sisterCompanyNote}</div>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-xs text-primary-foreground/72 md:flex-row md:items-center md:justify-between">
          <span>Copyright 2025 {primaryBrandName}. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-gold">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-gold">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-gold">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}



