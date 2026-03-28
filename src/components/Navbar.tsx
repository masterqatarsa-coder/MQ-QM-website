import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  Package,
  Phone,
  Settings,
  Users,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { useIsCompactNav } from "@/hooks/use-compact-nav";
import { useSiteSettings } from "@/hooks/use-site-settings";
import mqLogo from "../assets/MQ-LOGO.png";

const serviceItems = [
  { label: "MEP Contracting", href: "/services#mep", icon: Zap, desc: "Electrical, plumbing, HVAC, fire fighting" },
  { label: "ELV Systems", href: "/services#elv", icon: Wifi, desc: "BMS, CCTV, access control, cabling" },
  { label: "Automation Systems", href: "/services#automation", icon: Settings, desc: "Auto doors, shutters, barriers, loading bays" },
  { label: "Facility Management", href: "/services#fm", icon: Wrench, desc: "Building maintenance and cleaning operations" },
  { label: "Workforce Solutions", href: "/services#workforce", icon: Users, desc: "Skilled manpower, HR, mobilization support" },
  { label: "Trading", href: "/services#trading", icon: Package, desc: "HVAC and engineering equipment supply" },
];

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services", children: serviceItems },
  { label: "Projects", href: "/projects" },
  { label: "Clients", href: "/clients" },
  { label: "Certifications", href: "/certifications" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isCompactNav = useIsCompactNav();
  const isHome = location.pathname === "/";
  const { settings } = useSiteSettings();

  const primaryBrandName = settings.site_name || "Master Qatar W.L.L.";
  const primaryBrandLocation = settings.primary_brand_location || "KSA-Jeddah";
  const secondaryBrandName = settings.secondary_brand_name || "QM Arabia";
  const secondaryBrandLocation = settings.secondary_brand_location || primaryBrandLocation;
  const primaryPhone = settings.primary_phone || "+966 539817923";
  const secondaryPhone = settings.secondary_phone || "+966 509810613";
  const primaryEmail = settings.primary_email || "mail.masterqatar@gmail.com";
  const siteTagline = settings.site_tagline || "Engineering and technology delivery";

  const getNavTarget = (href: string) => {
    if (!isCompactNav) {
      return href;
    }

    if (href === "/") {
      return "/";
    }

    return `/#${href.replace("/", "")}`;
  };

  const getServiceTarget = (href: string) => {
    if (!isCompactNav) {
      return href;
    }

    const [, hash] = href.split("#");
    return hash ? `/#${hash}` : "/#services";
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!servicesMenuRef.current?.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setServicesOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleServiceClick = (href: string) => {
    if (isCompactNav) {
      navigate(getServiceTarget(href));
      setServicesOpen(false);
      setMobileServicesOpen(false);
      setIsOpen(false);
      return;
    }

    const [path, hash] = href.split("#");
    if (location.pathname === path && hash) {
      const section = document.getElementById(hash);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        setServicesOpen(false);
        setMobileServicesOpen(false);
        setIsOpen(false);
        return;
      }
    }

    navigate(href);
    setServicesOpen(false);
    setMobileServicesOpen(false);
    setIsOpen(false);
  };

  const handleNavItemClick = (href: string) => {
    navigate(getNavTarget(href));
    setIsOpen(false);
    setMobileServicesOpen(false);
    setServicesOpen(false);
  };

  const servicesActive = location.pathname === "/services" || (isCompactNav && location.hash === "#services");

  const shellClasses = "border-navy-700/30 bg-white/90 shadow-[0_20px_42px_-16px_rgba(18,35,66,0.2)] backdrop-blur-2xl";
  const topBarClasses = "border-navy-600/20 bg-navy-50/70 text-navy-900";
  const topBarLeadClasses = "text-navy-900";
  const brandTitleClasses = "text-slate-900";
  const brandSubtitleClasses = "text-navy-700";
  const navIdleClasses = "text-navy-900 hover:text-navy-800";
  const navActiveClasses = "bg-navy-100 text-navy-900";
  const mobilePanelClasses = "border-navy-200/70 bg-white/96";
  const mobileButtonClasses = "border-navy-300 bg-slate-50 text-navy-900 hover:border-navy-500 hover:bg-navy-50";
  const mobileLabelClasses = "text-navy-900";
  const mobileDescClasses = "text-navy-700";
  const utilityCardClasses = "border-navy-200 bg-slate-50 text-navy-900 hover:bg-white";
  const utilityLabelClasses = "text-navy-700";

  return (
    <nav
      className="fixed inset-x-0 z-50 px-3 transition-all duration-300 md:px-5 top-0 pt-2.5"
    >
      <div className="mx-auto max-w-7xl xl:max-w-[1400px]">
        <div className={`relative rounded-[1.7rem] border transition-all duration-300 ${shellClasses}`}>
          <div className={`hidden items-center justify-between rounded-t-[1.7rem] border-b px-5 py-2 text-[11px] font-medium md:flex ${topBarClasses}`}>
            <div className="flex items-center gap-4 uppercase tracking-[0.24em]">
              <span className={`inline-flex items-center gap-2 ${topBarLeadClasses}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {siteTagline}
              </span>
            </div>
            <div className={`flex items-center gap-5 ${topBarLeadClasses}`}>
              <div className="flex items-center gap-4">
                <a href={`tel:${primaryPhone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 transition-colors hover:text-gold">
                  <Phone size={12} /> {primaryPhone}
                </a>
                <span className="text-primary-foreground/60">|</span>
                <a href={`tel:${secondaryPhone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 transition-colors hover:text-gold">
                  <Phone size={12} /> {secondaryPhone}
                </a>
              </div>
              <a href={`mailto:${primaryEmail}`} className="inline-flex items-center gap-2 transition-colors hover:text-gold">
                <Mail size={12} /> {primaryEmail}
              </a>
            </div>
          </div>

          <div className="flex h-[76px] items-center justify-between px-4 md:px-5 xl:px-6">
            <div className="group flex shrink-0 flex-row flex-nowrap gap-1 md:gap-2">
              <Link
                to="/"
                className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-2xl transition-all duration-300 hover:bg-gray-50"
              >
                <img
                  src={mqLogo}
                  alt="MQ logo"
                  className="h-8 w-8 sm:h-12 sm:w-12 lg:h-12 lg:w-19 object-contain rounded-lg"
                  loading="eager"
                  decoding="async"
                />
                <div className="min-w-0 max-w-[9.5rem] sm:max-w-none">
                  <div className={`truncate font-condensed text-[12px] font-black leading-none tracking-[0.08em] sm:text-[15px] lg:text-[18px] ${brandTitleClasses}`}>
                    {primaryBrandName}
                  </div>
                  <div className={`mt-1 truncate text-[8px] font-semibold uppercase tracking-[0.22em] ${brandSubtitleClasses} sm:text-[9px] lg:text-[10px] sm:tracking-[0.28em]`}>
                    {primaryBrandLocation}
                  </div>
                </div>
              </Link>
              <span className="flex items-center text-slate-900 font-bold text-xl leading-[4rem]">|</span>
              <Link
                to="/"
                className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-2xl transition-all duration-300 hover:bg-gray-50"
              >
                <img
                  src={mqLogo}
                  alt="MQ logo"
                  className="h-8 w-8 sm:h-12 sm:w-12 lg:h-12 lg:w-19 object-contain rounded-lg"
                  loading="eager"
                  decoding="async"
                />
                <div className="min-w-0 max-w-[9.5rem] sm:max-w-none">
                  <div className={`truncate font-condensed text-[12px] font-black leading-none tracking-[0.08em] sm:text-[15px] lg:text-[18px] ${brandTitleClasses}`}>
                    {secondaryBrandName}
                  </div>
                  <div className={`mt-1 truncate text-[8px] font-semibold uppercase tracking-[0.22em] ${brandSubtitleClasses} sm:text-[9px] lg:text-[10px] sm:tracking-[0.28em]`}>
                    {secondaryBrandLocation}
                  </div>
                </div>
              </Link>
            </div>

            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) =>
                item.children ? (
                  <div
                    key={item.label}
                    ref={servicesMenuRef}
                    className="relative z-20"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setServicesOpen((open) => !open)}
                      aria-expanded={servicesOpen}
                      aria-haspopup="menu"
                      className={`group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        servicesActive ? navActiveClasses : navIdleClasses
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${servicesOpen ? "rotate-180 text-gold" : ""}`}
                      />
                      <span
                        className={`absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent transition-opacity duration-200 ${
                          servicesActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>

                    <div
                      className={`absolute left-1/2 top-full z-30 w-[600px] -translate-x-1/2 pt-3 transition-all duration-300 ${
                        servicesOpen
                          ? "visible translate-y-0 opacity-100 pointer-events-auto"
                          : "invisible -translate-y-2 opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="rounded-[1.75rem] border p-3 backdrop-blur-2xl border-slate-200 bg-white/96 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)]">
                        <div
                          className="flex items-center justify-between rounded-[1.2rem] border px-4 py-3 border-slate-200 bg-slate-50">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                              Service matrix
                            </div>
                            <div className="mt-1 text-sm font-semibold text-navy-950">
                              Explore the full engineering stack we deliver.
                            </div>
                          </div>
                          <Link
                            to="/services"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors text-primary hover:border-primary/20 hover:text-navy-950" >
                            View all <ArrowRight size={12} />
                          </Link>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {item.children.map((child) => {
                            const Icon = child.icon;
                            return (
                              <button
                                key={child.label}
                                type="button"
                                onClick={() => handleServiceClick(child.href)}
                                className="group/item flex min-h-[108px] items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-all duration-200 hover:border-primary/18 hover:bg-white">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/14 text-accent transition-colors group-hover/item:bg-accent/22 group-hover/item:text-gold">
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold group-hover/item:text-gold text-navy-950">{child.label}</div>
                                  <div className="mt-2 text-xs leading-relaxed text-slate-600">{child.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`group relative rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      location.pathname === item.href ? navActiveClasses : navIdleClasses
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent transition-opacity duration-200 ${
                        location.pathname === item.href ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </Link>
                )
              )}

              <Link
                to="/contact"
                className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-secondary px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_20px_40px_-20px_rgba(27,160,255,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_-18px_rgba(27,160,255,0.78)]"
              >
                Request Proposal
                <ArrowRight size={15} />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition-all lg:hidden ${mobileButtonClasses}`}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <div className="relative h-4 w-5">
                <span className={`absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`absolute left-0 top-[7px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 top-[14px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 lg:hidden ${isOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className={`rounded-b-[1.7rem] border-t px-4 pb-5 pt-4 backdrop-blur-2xl ${mobilePanelClasses}`}>
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMobileServicesOpen((open) => !open)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${mobileButtonClasses}`}
                          aria-expanded={mobileServicesOpen}
                        >
                          <span className={mobileLabelClasses}>{item.label}</span>
                          <ChevronDown size={15} className={`transition-transform duration-300 ${mobileServicesOpen ? "rotate-180 text-gold" : ""}`} />
                        </button>
                        <div className={`grid transition-all duration-300 ${mobileServicesOpen ? "grid-rows-[1fr] pt-2" : "grid-rows-[0fr]"}`}>
                          <div className="overflow-hidden">
                            <div className="space-y-2 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-2">
                              <button
                                type="button"
                                onClick={() => handleNavItemClick("/services")}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white"
                              >
                                <div>
                                  <div className={`text-sm font-semibold ${mobileLabelClasses}`}>All Services</div>
                                  <div className={`mt-1 text-xs leading-relaxed ${mobileDescClasses}`}>Jump to the full services section in the mobile scroll view.</div>
                                </div>
                                <ArrowRight size={15} className="shrink-0 text-gold" />
                              </button>
                              {item.children.map((child) => {
                                const Icon = child.icon;
                                return (
                                  <button
                                    key={child.label}
                                    type="button"
                                    onClick={() => handleServiceClick(child.href)}
                                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white"
                                  >
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/14 text-accent">
                                      <Icon size={16} />
                                    </div>
                                    <div>
                                      <div className={`text-sm font-semibold ${mobileLabelClasses}`}>{child.label}</div>
                                      <div className={`mt-1 text-xs leading-relaxed ${mobileDescClasses}`}>{child.desc}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavItemClick(item.href)}
                        className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                          location.pathname === item.href || (isCompactNav && location.hash === `#${item.href.replace("/", "")}`)
                            ? "border-primary/15 bg-primary/6 text-primary"
                            : mobileButtonClasses
                        }`}
                      >
                        {item.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a href={`tel:${primaryPhone.replace(/\s+/g, "")}`} className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${utilityCardClasses}`}>
                  <span className={`mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] ${utilityLabelClasses}`}>Phone 1</span>
                  {primaryPhone}
                </a>
                <a href={`tel:${secondaryPhone.replace(/\s+/g, "")}`} className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${utilityCardClasses}`}>
                  <span className={`mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] ${utilityLabelClasses}`}>Phone 2</span>
                  {secondaryPhone}
                </a>
              </div>

              <button
                type="button"
                onClick={() => handleNavItemClick("/contact")}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-secondary px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white"
              >
                Request Proposal
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

