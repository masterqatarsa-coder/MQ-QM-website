import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle, Clock3, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { SectionHeading, StatCounter } from "@/components/UIComponents";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import acousticLouversImg from "@/assets/acoustic-louvers.jpg";
import bodySlider2 from "@/assets/bodyslider/img1.jpg";
import bodySlider4 from "@/assets/bodyslider/img4.jpg";
import bodySlider8 from "@/assets/bodyslider/img8.jpg";
import fireDampersImg from "@/assets/fire-dampers.jpg";
import freshAirLouversImg from "@/assets/fresh-air-louvers.jpg";
import heroSlide from "@/assets/hero-construction.jpg";
import linearSlotDiffusersImg from "@/assets/linear-slot-diffusers.jpg";
import mepImg from "@/assets/service-mep.jpg";
import nonReturnDampersImg from "@/assets/non-return-damper-1000x1000.png";
import pressureReliefDampersImg from "@/assets/pressure-relief-dampers.jpg";
import soundAttenuatorsImg from "@/assets/sound-attenuators.jpg";
import elvImg from "@/assets/service-elv.jpg";
import autoImg from "@/assets/door8.png";
import fmImg from "@/assets/service-fm.jpg";
import volumeControlDamperImg from "@/assets/volume-control-damper.jpg";
import airportImg from "@/assets/project-airport.jpg";
import stadiumImg from "@/assets/project-stadium.jpg";
import hotelImg from "@/assets/project-hotel.jpg";
import railImg from "@/assets/project-railway.jpg";
import { useManagedContent } from "@/hooks/use-managed-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import ManagedContentImage from "@/components/ManagedContentImage";
import { buildClientLogoDisplayItems, resolveContentImage } from "@/lib/contentMedia";
import { metadataString, metadataStringList } from "@/lib/contentMetadata";

const fallbackServices = [
  {
    title: "MEP Contracting",
    desc: "Electrical, plumbing, HVAC, and fire-fighting systems delivered with one coordinated execution team.",
    img: mepImg,
    points: ["HVAC and chilled water", "Electrical infrastructure", "Fire-fighting systems"],
  },
  {
    title: "ELV Systems",
    desc: "Integrated building intelligence, security, and communications for modern commercial and infrastructure assets.",
    img: elvImg,
    points: ["BMS and access control", "CCTV and PA systems", "Structured cabling"],
  },
  {
    title: "Automation Systems",
    desc: "Reliable automated entrances, shutters, barriers, and loading solutions designed around operational flow.",
    img: autoImg,
    points: ["Automatic doors", "Roller shutters", "Loading bay equipment"],
  },
  {
    title: "Facility Management",
    desc: "Preventive and responsive maintenance programs that keep mission-critical spaces operating at peak efficiency.",
    img: fmImg,
    points: ["HVAC servicing", "Building maintenance", "Cleaning and support"],
  },
];

const fallbackProjectShowcase = [
  {
    title: "International Airports",
    img: airportImg,
    detail: "Large-scale passenger environments with MEP and ELV coordination at infrastructure scale.",
    span: "lg:col-span-2",
  },
  {
    title: "Sports Stadiums",
    img: stadiumImg,
    detail: "High-performance venues requiring resilient systems and demanding delivery timelines.",
    span: "",
  },
  {
    title: "Luxury Hotels",
    img: hotelImg,
    detail: "Hospitality builds where guest experience depends on invisible technical precision.",
    span: "",
  },
  {
    title: "Railways and Metro",
    img: railImg,
    detail: "Transit environments that need reliability, safety, and systems integration at every layer.",
    span: "lg:col-span-2",
  },
];

const fallbackProducts = [
  {
    title: "Fresh Air Louvers",
    img: freshAirLouversImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Volume Control Damper",
    img: volumeControlDamperImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Non Return Dampers",
    img: nonReturnDampersImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Acoustic Louvers",
    img: acousticLouversImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Sound Attenuators",
    img: soundAttenuatorsImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Pressure Relief Dampers",
    img: pressureReliefDampersImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Linear Slot Diffusers",
    img: linearSlotDiffusersImg,
    service: "Trading",
    category: "HVAC",
  },
  {
    title: "Fire Dampers",
    img: fireDampersImg,
    service: "Trading",
    category: "Safety",
  },
];

const strengths = [
  "12+ years of GCC engineering expertise",
  "1,300+ skilled workforce across core disciplines",
  "20+ multinational clients served",
  "ISO-certified quality and safety systems",
  "FIFA stadium project experience",
  "Integrated delivery from supply to operations",
];

const highlightCards = [
  {
    icon: Building2,
    title: "Integrated Delivery",
    body: "Clients work with one coordinated partner across engineering, supply, installation, and operational support.",
  },
  {
    icon: Clock3,
    title: "Operational Readiness",
    body: "We focus on dependable turnover, efficient maintenance planning, and clean handoff between project phases.",
  },
  {
    icon: Shield,
    title: "Quality and Safety",
    body: "Processes are structured around certified standards, site discipline, and long-term client confidence.",
  },
];

const partnerTicker = [
  "Siemens",
  "Honeywell",
  "Schneider Electric",
  "Johnson Controls",
  "ABB",
  "Bosch",
  "Daikin",
  "Carrier",
  "Tyco Fire",
  "ASSA ABLOY",
];

const deliverySteps = [
  {
    step: "01",
    title: "Scope the system",
    body: "We align technical requirements, timelines, and interfaces early so execution stays stable.",
  },
  {
    step: "02",
    title: "Coordinate disciplines",
    body: "Engineering, procurement, and specialist trades stay connected through one delivery structure.",
  },
  {
    step: "03",
    title: "Execute with control",
    body: "Teams work against clear milestones, quality checks, and practical site-ready decision making.",
  },
  {
    step: "04",
    title: "Support operations",
    body: "We help clients move from installation to reliable day-to-day performance without losing momentum.",
  },
];

export default function HomePage() {
  const [showAllClients, setShowAllClients] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { settings } = useSiteSettings();
  const { items: managedServices } = useManagedContent("services", { homepage: true });
  const { items: managedServiceProducts } = useManagedContent("service_products");
  const { items: managedProjects } = useManagedContent("projects", { homepage: true });
  const { items: managedClients } = useManagedContent("clients");

  const heroSlides = [heroSlide, bodySlider2, bodySlider8, bodySlider4];
  const services =
    managedServices.length > 0
      ? managedServices.map((item, index) => ({
          title: item.title,
          desc: item.description || fallbackServices[index % fallbackServices.length]?.desc || "",
          img:
            resolveContentImage(item, index) ||
            fallbackServices[index % fallbackServices.length]?.img,
          metadata: item.metadata,
          points:
            metadataStringList(item.metadata, "highlights").slice(0, 3).length > 0
              ? metadataStringList(item.metadata, "highlights").slice(0, 3)
              : fallbackServices[index % fallbackServices.length]?.points || [],
        }))
      : fallbackServices;
  const featuredProducts =
    managedServiceProducts.length > 0
      ? managedServiceProducts.map((item, index) => ({
          title: item.title,
          img: resolveContentImage(item, index) || fallbackProducts[index % fallbackProducts.length]?.img,
          service: metadataString(item.metadata, "service", "Product"),
          category: metadataString(item.metadata, "category", ""),
          metadata: item.metadata,
        }))
      : fallbackProducts;
  const projectShowcase =
    managedProjects.length > 0
      ? managedProjects.slice(0, 4).map((item, index) => ({
          title: item.title,
          img:
            resolveContentImage(item, index) ||
            fallbackProjectShowcase[index % fallbackProjectShowcase.length]?.img,
          metadata: item.metadata,
          detail:
            item.description ||
            fallbackProjectShowcase[index % fallbackProjectShowcase.length]?.detail ||
            "",
          span: index === 0 || index === 3 ? "lg:col-span-2" : "",
        }))
      : fallbackProjectShowcase;
  const clientLogos = buildClientLogoDisplayItems(managedClients);
  const marqueeClientLogos = clientLogos;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <img
              key={index}
              src={slide}
              alt={`Hero slide ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              sizes="100vw"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/40 via-primary/25 to-secondary/15" />
        <div className="hero-grid absolute inset-0 opacity-8" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,167,255,0.26),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,201,87,0.18),transparent_28%)]" />
        <div className="accent-orb absolute -left-20 top-28 h-60 w-60 rounded-full bg-accent/16 blur-3xl" />
        <div className="accent-orb absolute right-0 top-48 h-56 w-56 rounded-full bg-gold/14 blur-3xl" />

        <div className="container relative z-10 mx-auto grid min-h-screen items-center gap-12 px-4 pb-16 pt-32 lg:grid-cols-[1.1fr_0.9fr] lg:pt-40">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {settings.site_tagline}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 max-w-4xl font-condensed text-5xl font-black leading-[0.88] text-white md:text-7xl xl:text-[5.5rem]">
                A sharper digital face for
                <span className="block text-white">
                  {settings.site_name} & {settings.secondary_brand_name}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl font-bold">
                {settings.site_name} & {settings.secondary_brand_name} brings MEP, ELV, automation, facility management, and workforce delivery together under one disciplined team for high-stakes projects across the GCC.
              </p>
            </Reveal>

            <Reveal delay={220} className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-secondary px-7 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_24px_40px_-18px_rgba(23,160,255,0.75)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Explore Services
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-secondary px-7 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_24px_40px_-18px_rgba(23,160,255,0.75)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Book a Consultation
                <ArrowRight size={16} />
              </Link>
            </Reveal>

            <Reveal delay={300} className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 p-6 rounded-[2rem] border border-white/10 bg-black/20 backdrop-blur-xl">
              {highlightCards.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-xl"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-gold">
                    <Icon size={20} />
                  </div>
                  <div className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/92">
                    {title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/74">{body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        <div className="relative z-10 border-y border-white/10 bg-navy-950/36 backdrop-blur-md">
          <div className="overflow-hidden py-4">
            <div className="ticker-track flex min-w-max items-center gap-8 px-4">
              {[...partnerTicker, ...partnerTicker].map((partner, index) => (
                <div key={`${partner}-${index}`} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/76">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
            <StatCounter value={12} suffix="+" label="Years of Expertise" delay={0} />
            <StatCounter value={1300} suffix="+" label="Professional Workforce" delay={80} />
            <StatCounter value={20} suffix="+" label="MNC Client Portfolio" delay={160} />
            <StatCounter value={6000} suffix="+" label="Sq. Mtr. Award Camp" delay={240} />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionHeading
                label="Who We Are"
                title="Engineering excellence across the GCC."
                subtitle="Master Qatar W.L.L. is the Saudi expansion of a trusted Qatar-based engineering business with proven delivery across infrastructure, hospitality, transport, healthcare, and public-sector projects."
              />

              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-black">
                  We bring MEP, ELV, automation, facility management, and workforce support together under one disciplined structure, helping clients move from planning to execution with better coordination and stronger delivery control.
                </p>
              </Reveal>

              <Reveal delay={180} className="mt-8 grid gap-3 sm:grid-cols-2">
                {strengths.map((strength) => (
                  <div key={strength} className="surface-panel rounded-[1.35rem] border border-white/60 px-4 py-4 text-sm text-black">
                    <div className="flex items-start gap-3">
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>{strength}</span>
                    </div>
                  </div>
                ))}
              </Reveal>

            </div>

            <Reveal delay={140}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="surface-panel rounded-[1.8rem] border border-white/60 p-6 sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Delivery focus</div>
                  <div className="mt-3 font-condensed text-3xl font-black leading-none text-primary">Built for complex projects, tight timelines, and long-term client confidence.</div>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-black">
                    Our teams work across engineering, procurement, installation, commissioning, and operations support, giving clients one accountable delivery partner from start to finish.
                  </p>
                </div>
                {highlightCards.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="interactive-card surface-panel relative overflow-hidden rounded-[1.8rem] border border-white/60 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                      <Icon size={20} />
                    </div>
                    <div className="mt-5 font-condensed text-2xl font-bold text-primary">{title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-black">{body}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-10">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-navy-950/20 p-4">
              <div className="client-marquee flex items-center gap-6 whitespace-nowrap">
                {[...marqueeClientLogos, ...marqueeClientLogos].map((client, index) => (
                  <div key={`${client.logo}-${index}`} className="flex-none w-48 rounded-xl border border-white/20 bg-white/10 p-4 transition hover:scale-[1.04] hover:border-white/40">
                    <ManagedContentImage
                      metadata={client.metadata}
                      src={client.logo}
                      alt={client.item?.title || `Client logo ${index + 1}`}
                      frameClassName="flex h-14 w-full items-center justify-center"
                      className="h-full w-full"
                      defaultDisplay={{ fit: "contain", scale: 1 }}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        if (event.currentTarget.src !== "/placeholder.svg") {
                          event.currentTarget.src = "/placeholder.svg";
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllClients((prev) => !prev)}
                className="rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                {showAllClients ? "Hide all clients" : "View all clients"}
              </button>
            </div>

            {showAllClients && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
                <div className="relative mx-auto mt-10 mb-10 w-full max-w-6xl rounded-[2rem] border border-white/20 bg-white p-5 shadow-[0_20px_80px_rgba(13,15,23,0.35)] sm:p-8">
                  <button
                    type="button"
                    onClick={() => setShowAllClients(false)}
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
                    aria-label="Close client modal"
                  >
                    ✕
                  </button>

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Our Clients</h3>
                    <p className="mt-1 text-sm text-slate-500">Explore the full client portfolio in one place.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {clientLogos.map((client, index) => (
                      <div key={`all-${client.logo}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <ManagedContentImage
                          metadata={client.metadata}
                          src={client.logo}
                          alt={client.item?.title || `Client logo ${index + 1}`}
                          frameClassName="mx-auto flex h-16 w-full items-center justify-center"
                          className="h-full w-full"
                          defaultDisplay={{ fit: "contain", scale: 1 }}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            if (event.currentTarget.src !== "/placeholder.svg") {
                              event.currentTarget.src = "/placeholder.svg";
                            }
                          }}
                        />
                        {client.item?.title && (
                          <div className="mt-3 text-xs font-semibold text-slate-600">
                            {client.item.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-muted py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Core Services"
            title="Integrated services across engineering, systems, and operations."
            subtitle="Explore the full range of capabilities covering MEP, ELV, automation, facility management, workforce solutions, and specialist supply."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 80}>
                <div className="group interactive-card surface-panel relative h-full overflow-hidden rounded-[1.8rem] border border-white/70">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={service.img}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      className="hidden"
                    />
                    <ManagedContentImage
                      metadata={service.metadata}
                      src={service.img}
                      alt={service.title}
                      frameClassName="h-full w-full transition-transform duration-500 group-hover:scale-105"
                      className="h-full w-full"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/18 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="font-condensed text-2xl font-bold text-white">{service.title}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
                    <div className="mt-5 space-y-2">
                      {service.points.map((point) => (
                        <div key={point} className="flex items-center gap-2 text-sm text-primary/75">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {point}
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/services"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent transition-colors hover:text-primary"
                    >
                      Learn More
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Featured Products
                </div>
                <h3 className="mt-3 font-condensed text-3xl font-black leading-none text-primary">
                  Products that support our HVAC and engineering supply scope.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A rotating selection of dampers, louvers, diffusers, and related equipment used across our project and supply portfolio.
                </p>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent transition-colors hover:text-primary"
              >
                View All Services
                <ArrowRight size={14} />
              </Link>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: featuredProducts.length > 4,
              }}
              className="px-12"
            >
              <CarouselContent>
                {featuredProducts.map((product) => (
                  <CarouselItem
                    key={product.title}
                    className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <div className="surface-panel h-full overflow-hidden rounded-[1.8rem] border border-white/70">
                      <div className="h-52 overflow-hidden">
                        <ManagedContentImage
                          metadata={product.metadata}
                          src={product.img}
                          alt={product.title}
                          frameClassName="h-full w-full transition-transform duration-500 hover:scale-105"
                          className="h-full w-full"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                            {product.service}
                          </span>
                          {product.category && (
                            <span className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                              {product.category}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 font-condensed text-2xl font-bold text-primary">
                          {product.title}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 border-primary/20 bg-white text-primary hover:bg-primary/5" />
              <CarouselNext className="right-0 border-primary/20 bg-white text-primary hover:bg-primary/5" />
            </Carousel>
          </div>
        </div>
      </section>

      <section className="bg-primary py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <SectionHeading
                label="How We Work"
                title="A clearer story from first conversation to long-term support."
                subtitle="Our delivery model is built to reduce coordination gaps, protect timelines, and keep quality visible at every stage."
                light
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {deliverySteps.map((item, index) => (
                <Reveal key={item.step} delay={index * 80}>
                  <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/82">Step {item.step}</div>
                    <div className="mt-3 font-condensed text-2xl font-bold text-white">{item.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-white/78">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Project Types"
            title="Project experience across major sectors."
            subtitle="Our portfolio covers transport, hospitality, sports, healthcare, and commercial developments across the region."
            center
          />
          <div className="mt-18 grid gap-8 lg:grid-cols-3">
            {projectShowcase.map((project, index) => (
              <Reveal key={project.title} delay={index * 90} className={project.span}>
                <div className="interactive-card group relative h-[28rem] overflow-hidden rounded-[2.5rem] border border-white/80 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:border-white/95">
                  <ManagedContentImage
                    metadata={project.metadata}
                    src={project.img}
                    alt={project.title}
                    frameClassName="h-full w-full transition-all duration-700 group-hover:scale-105 group-hover:rotate-1"
                    className="h-full w-full"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/96 via-navy-900/30 to-transparent group-hover:from-navy-950/98" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/12 backdrop-blur-sm px-4 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-gold shadow-lg">
                      <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                      Sector focus
                    </div>
                    <div className="mt-6 font-condensed text-4xl font-black text-white md:text-5xl leading-tight">
                      {project.title}
                    </div>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 font-medium">{project.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero px-6 py-10 text-white shadow-hero md:px-10 md:py-12">
              <div className="hero-grid absolute inset-0 opacity-20" />
              <div className="accent-orb absolute -right-10 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-accent/16 blur-3xl" />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    Let&apos;s Build
                  </div>
                  <h2 className="mt-5 max-w-2xl font-condensed text-4xl font-black leading-none md:text-5xl">
                    Ready to discuss your next project?
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/82">
                    Speak with our team about engineering delivery, specialist systems, product supply, or long-term operational support for your upcoming scope.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-gold px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-gold-foreground transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Contact Us
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/projects"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-white/14 bg-white/6 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
                  >
                    View Projects
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
