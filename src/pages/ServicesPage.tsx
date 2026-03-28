import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import ManagedContentImage from "@/components/ManagedContentImage";
import { PageHero, SectionHeading } from "@/components/UIComponents";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import mepElectricalWorksImg from "@/assets/MEP/electrical-works.jpg";
import mepFireFightingImg from "@/assets/MEP/fire-fighting.jpg";
import mepHvacImg from "@/assets/MEP/hvac.jpg";
import mepOverviewImg from "@/assets/MEP/mep-sector.jpg";
import mepPlumbingImg from "@/assets/MEP/plumbing.jpg";
import elvAccessControlImg from "@/assets/ELV/accesscontrollsystem.jpeg";
import elvAirflowControlImg from "@/assets/ELV/airflow-control-system.jpg";
import elvBmsImg from "@/assets/ELV/bms1.jpeg";
import elvHomeAutomationImg from "@/assets/ELV/homeautomation.jpeg";
import elvLightingControlImg from "@/assets/ELV/lighting-controll-system.jpg";
import elvPublicAddressImg from "@/assets/ELV/public-address-system.jpg";
import elvRoomPressureImg from "@/assets/ELV/rpms.jpeg";
import elvSecurityImg from "@/assets/ELV/security.jpg";
import elvStructuredCableImg from "@/assets/ELV/structured-cable-solution.jpg";
import automationSlidingDoorImg from "@/assets/doors5.jpg";
import automationSwingDoorImg from "@/assets/doors6.jpg";
import automationRevolvingDoorImg from "@/assets/doors7.jpg";
import automationRollerShutterImg from "@/assets/door8.png";
import automationHighSpeedDoorImg from "@/assets/doors9.jpg";
import tradingAcousticLouversImg from "@/assets/acoustic-louvers.jpg";
import tradingCeilingDiffusersImg from "@/assets/ceiling-diffusers.jpg";
import tradingConstantAirVolumeImg from "@/assets/constant-air-volume.jpg";
import tradingDiscValvesImg from "@/assets/disc-valves.jpg";
import tradingFireDampersImg from "@/assets/fire-dampers.jpg";
import tradingFreshAirLouversImg from "@/assets/fresh-air-louvers.jpg";
import tradingGrillesImg from "@/assets/grilles.jpg";
import tradingJetDiffusersImg from "@/assets/jet-diffusers.jpg";
import tradingLinearDiffusersImg from "@/assets/linear-diffusers.jpg";
import tradingLinearSlotDiffusersImg from "@/assets/linear-slot-diffusers.jpg";
import tradingNonReturnDampersImg from "@/assets/non-return-damper-1000x1000.png";
import tradingPressureReliefDampersImg from "@/assets/pressure-relief-dampers.jpg";
import tradingRegistersImg from "@/assets/registers.jpg";
import tradingRoundCeilingDiffusersImg from "@/assets/round-ceiling-diffusers.jpg";
import tradingSandTrapLouversImg from "@/assets/sand-trap-louvers.jpg";
import tradingSoundAttenuatorsImg from "@/assets/sound-attenuators.jpg";
import tradingSwirlDiffusersImg from "@/assets/swirl-diffusers.jpg";
import tradingVariableAirVolumeImg from "@/assets/variable-air-volume.jpg";
import tradingVolumeControlDamperImg from "@/assets/volume-control-damper.jpg";
import { useManagedContent } from "@/hooks/use-managed-content";
import { resolveContentImage } from "@/lib/contentMedia";
import { metadataSections, metadataStringList } from "@/lib/contentMetadata";
import { cn } from "@/lib/utils";

interface ServicesPageProps {
  embedded?: boolean;
}

type ServiceShowcaseItem = {
  title: string;
  image: string;
  metadata?: Record<string, unknown>;
};

type ServiceShowcaseGroup = "mep" | "elv" | "automation" | "trading";

type ServiceSliderConfig = {
  title: string;
  description: string;
  imageHeightClass: string;
  basisClass: string;
  items: ServiceShowcaseItem[];
};

function ServiceShowcaseCarousel({
  slider,
  serviceTitle,
}: {
  slider: ServiceSliderConfig;
  serviceTitle: string;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const galleryLabel = serviceTitle === "Trading" ? "Product Gallery" : "Systems Gallery";

  useEffect(() => {
    if (!api) {
      return;
    }

    const syncState = () => {
      setActiveIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    syncState();
    api.on("select", syncState);
    api.on("reInit", syncState);

    return () => {
      api.off("select", syncState);
      api.off("reInit", syncState);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slider.items.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 3200);

    return () => window.clearInterval(interval);
  }, [api, slider.items.length]);

  return (
    <div className="services-gallery-shell">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(31,167,255,0.14),transparent_68%)]" />
      <div className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-36 w-36 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10 space-y-9">
        <div className="mx-auto max-w-4xl text-center">
          <span className="services-gallery-kicker">{galleryLabel}</span>
          <h4 className="mt-5 font-condensed text-3xl font-black leading-none text-primary md:text-4xl lg:text-[2.8rem]">
            {slider.title}
          </h4>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-[1.08rem]">
            {slider.description}
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: slider.items.length > 3,
          }}
          className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10"
        >
          <CarouselContent className="pb-3">
            {slider.items.map((item) => (
              <CarouselItem key={`${serviceTitle}-${item.title}`} className={slider.basisClass}>
                <div className="px-2 md:px-3">
                  <article className="services-gallery-card">
                    <div className="services-gallery-media">
                      <ManagedContentImage
                        metadata={item.metadata}
                        src={item.image}
                        alt={item.title}
                        frameClassName="w-full"
                        className={cn("services-gallery-image w-full", slider.imageHeightClass)}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="services-gallery-card-body">
                      <h3 className="services-gallery-title">{item.title}</h3>
                    </div>
                  </article>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="services-gallery-arrow left-1 sm:left-2 lg:-left-2" />
          <CarouselNext className="services-gallery-arrow right-1 sm:right-2 lg:-right-2" />
        </Carousel>

        {snapCount > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <div className="hidden min-w-[72px] text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/45 sm:block">
              {String(activeIndex + 1).padStart(2, "0")} / {String(snapCount).padStart(2, "0")}
            </div>
            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: snapCount }).map((_, index) => (
                <button
                  key={`${serviceTitle}-dot-${index}`}
                  type="button"
                  aria-label={`Go to ${slider.title} slide ${index + 1}`}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "services-gallery-dot",
                    activeIndex === index && "services-gallery-dot-active",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const mepShowcaseItems: ServiceShowcaseItem[] = [
  { title: "MEP Sector Overview", image: mepOverviewImg },
  { title: "Electrical Works", image: mepElectricalWorksImg },
  { title: "Plumbing Systems", image: mepPlumbingImg },
  { title: "HVAC Systems", image: mepHvacImg },
  { title: "Fire Fighting Systems", image: mepFireFightingImg },
];

const elvShowcaseItems: ServiceShowcaseItem[] = [
  { title: "Building Management Systems (BMS)", image: elvBmsImg },
  { title: "Access Control Systems", image: elvAccessControlImg },
  { title: "Security & Surveillance", image: elvSecurityImg },
  { title: "Lighting Control Systems", image: elvLightingControlImg },
  { title: "Public Address Systems", image: elvPublicAddressImg },
  { title: "Structured Cable Solutions", image: elvStructuredCableImg },
  { title: "Home Automation", image: elvHomeAutomationImg },
  { title: "Airflow Control Systems", image: elvAirflowControlImg },
  { title: "Room Pressure Monitoring Systems", image: elvRoomPressureImg },
];

const automationShowcaseItems: ServiceShowcaseItem[] = [
  { title: "Automatic Sliding Doors", image: automationSlidingDoorImg },
  { title: "Automatic Swing Doors", image: automationSwingDoorImg },
  { title: "Revolving Doors", image: automationRevolvingDoorImg },
  { title: "Roller Shutters", image: automationRollerShutterImg },
  { title: "High-Speed Doors", image: automationHighSpeedDoorImg },
];

const fallbackTradingShowcaseItems: ServiceShowcaseItem[] = [
  { title: "Fresh Air Louvers", image: tradingFreshAirLouversImg },
  { title: "Volume Control Damper", image: tradingVolumeControlDamperImg },
  { title: "Non Return Dampers", image: tradingNonReturnDampersImg },
  { title: "Acoustic Louvers", image: tradingAcousticLouversImg },
  { title: "Sound Attenuators", image: tradingSoundAttenuatorsImg },
  { title: "Pressure Relief Dampers", image: tradingPressureReliefDampersImg },
  { title: "Constant Air Volume (CAV)", image: tradingConstantAirVolumeImg },
  { title: "Sand Trap Louvers", image: tradingSandTrapLouversImg },
  { title: "Linear Slot Diffusers", image: tradingLinearSlotDiffusersImg },
  { title: "Round Ceiling Diffusers", image: tradingRoundCeilingDiffusersImg },
  { title: "Swirl Diffusers", image: tradingSwirlDiffusersImg },
  { title: "Jet Diffusers", image: tradingJetDiffusersImg },
  { title: "Ceiling Diffusers", image: tradingCeilingDiffusersImg },
  { title: "Linear Diffusers", image: tradingLinearDiffusersImg },
  { title: "Registers", image: tradingRegistersImg },
  { title: "Grilles", image: tradingGrillesImg },
  { title: "Variable Air Volume (VAV)", image: tradingVariableAirVolumeImg },
  { title: "Fire Dampers", image: tradingFireDampersImg },
  { title: "Disc Valves", image: tradingDiscValvesImg },
];

const sharedServiceGalleryImageHeight = "h-44 md:h-48";
const sharedServiceGalleryBasis = "basis-[88%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4";

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeServiceGroup(value: unknown): ServiceShowcaseGroup | null {
  const normalized = typeof value === "string" ? normalizeTitle(value) : "";

  if (normalized.includes("mep")) {
    return "mep";
  }
  if (normalized.includes("elv")) {
    return "elv";
  }
  if (normalized.includes("automation") || normalized.includes("door")) {
    return "automation";
  }
  if (normalized.includes("trading")) {
    return "trading";
  }

  return null;
}

export default function ServicesPage({ embedded = false }: ServicesPageProps) {
  const location = useLocation();
  const { items: services } = useManagedContent("services");
  const { items: serviceProducts } = useManagedContent("service_products");
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});

  const normalizedServices = useMemo(
    () =>
      services.map((service, index) => ({
        id: service.slug || `service-${service.id}`,
        title: service.title,
        image: resolveContentImage(service, index) || "/placeholder.svg",
        metadata: service.metadata,
        description: service.description || "",
        sections: metadataSections(service.metadata),
        highlights: metadataStringList(service.metadata, "highlights"),
      })),
    [services],
  );

  const groupedServiceProductItems = useMemo<Record<ServiceShowcaseGroup, ServiceShowcaseItem[]>>(() => {
    const groups: Record<ServiceShowcaseGroup, ServiceShowcaseItem[]> = {
      mep: [],
      elv: [],
      automation: [],
      trading: [],
    };

    serviceProducts.forEach((product, index) => {
      const metadataService =
        typeof product.metadata?.service === "string" ? product.metadata.service : "";
      const group =
        normalizeServiceGroup(metadataService) ||
        normalizeServiceGroup(product.slug) ||
        normalizeServiceGroup(product.title);

      if (!group) {
        return;
      }

      groups[group].push({
        title: product.title,
        image: resolveContentImage(product, index) || "/placeholder.svg",
        metadata: product.metadata,
      });
    });

    return groups;
  }, [serviceProducts]);

  const hasManagedServiceProducts = serviceProducts.length > 0;

  const serviceSliders = useMemo<Record<string, ServiceSliderConfig>>(
    () => ({
      mep: {
        title: "MEP Systems Gallery",
        description:
          "Explore our comprehensive MEP engineering solutions for building infrastructure and systems",
        imageHeightClass: sharedServiceGalleryImageHeight,
        basisClass: sharedServiceGalleryBasis,
        items: hasManagedServiceProducts ? groupedServiceProductItems.mep : mepShowcaseItems,
      },
      elv: {
        title: "ELV Systems Gallery",
        description:
          "Explore our comprehensive ELV solutions for intelligent building systems and smart infrastructure",
        imageHeightClass: sharedServiceGalleryImageHeight,
        basisClass: sharedServiceGalleryBasis,
        items: hasManagedServiceProducts ? groupedServiceProductItems.elv : elvShowcaseItems,
      },
      automation: {
        title: "Automation Door Systems",
        description:
          "Discover our range of automated entrance solutions for commercial, industrial, and logistics facilities",
        imageHeightClass: sharedServiceGalleryImageHeight,
        basisClass: sharedServiceGalleryBasis,
        items: hasManagedServiceProducts ? groupedServiceProductItems.automation : automationShowcaseItems,
      },
      trading: {
        title: "Trading Products",
        description:
          "Explore our comprehensive range of HVAC and MEP products from leading manufacturers",
        imageHeightClass: sharedServiceGalleryImageHeight,
        basisClass: sharedServiceGalleryBasis,
        items: hasManagedServiceProducts ? groupedServiceProductItems.trading : fallbackTradingShowcaseItems,
      },
    }),
    [groupedServiceProductItems, hasManagedServiceProducts],
  );

  useEffect(() => {
    if (embedded) {
      return;
    }

    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 90;
          const top = element.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [embedded, location.hash]);

  const toggle = (key: string) =>
    setExpandedSub((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Our Services"
          subtitle="End-to-end engineering and technology solutions for every stage of your project"
        />
      )}

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="What We Offer"
            title="Complete Engineering Solutions"
            subtitle="A complete view of our engineering, systems, and operations capabilities across the GCC."
            center
          />

          <div className="mt-14 space-y-20">
            {normalizedServices.map((service, index) => {
              const isEven = index % 2 === 0;
              const slider = serviceSliders[service.id];

              return (
                <div key={service.id} id={service.id} className="space-y-8">
                  <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                    <div className={isEven ? "" : "lg:order-2"}>
                      <div className="relative overflow-hidden rounded-xl shadow-elevated">
                        <ManagedContentImage
                          metadata={service.metadata}
                          src={service.image}
                          alt={service.title}
                          frameClassName="h-72 w-full"
                          className="h-72 w-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                            {service.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={isEven ? "" : "lg:order-1"}>
                      <h3 className="font-condensed text-3xl font-bold text-primary">
                        {service.title}
                      </h3>
                      <div className="divider-gold mb-4 mt-4" />
                      <p className="mb-6 leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>

                      {service.highlights.length > 0 && (
                        <div className="mb-6 grid gap-2 sm:grid-cols-2">
                          {service.highlights.map((highlight) => (
                            <div
                              key={highlight}
                              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                              {highlight}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        {service.sections.map((section) => {
                          const key = `${service.id}-${section.title}`;
                          const open = expandedSub[key] ?? true;

                          return (
                            <div key={key} className="overflow-hidden rounded-lg border border-border">
                              <button
                                type="button"
                                onClick={() => toggle(key)}
                                className="flex w-full items-center justify-between bg-muted px-4 py-3 text-left transition-colors hover:bg-muted/70"
                              >
                                <span className="text-sm font-semibold text-foreground">
                                  {section.title}
                                </span>
                                <ChevronDown
                                  size={16}
                                  className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                                />
                              </button>
                              {open && (
                                <div className="grid grid-cols-1 gap-1.5 px-4 py-3 sm:grid-cols-2">
                                  {section.items.map((item) => (
                                    <div
                                      key={item}
                                      className="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {slider && slider.items.length > 0 && (
                    <ServiceShowcaseCarousel slider={slider} serviceTitle={service.title} />
                  )}
                </div>
              );
            })}

            {normalizedServices.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No services are available right now.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
