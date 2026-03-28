import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}

export function StatCounter({ value, suffix = "", label, delay = 0 }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const timer = setTimeout(() => {
      const duration = 1800;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          if (interval) clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [started, value, delay]);

  return (
    <Reveal delay={delay}>
      <div
        ref={ref}
        className="surface-panel interactive-card relative overflow-hidden rounded-[1.75rem] border border-white/8 px-4 py-4 text-center md:px-5 md:py-5"
      >
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
        <div className="font-condensed text-2xl font-black leading-none text-black md:text-3xl">
          {count}
          {suffix}
        </div>
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/70 md:text-xs">
          {label}
        </div>
      </div>
    </Reveal>
  );
}

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
}

export function SectionHeading({ label, title, subtitle, center = false, light = false }: SectionHeadingProps) {
  return (
    <Reveal className={center ? "text-center" : ""}>
      <div className={center ? "text-center" : ""}>
        {label && (
          <span className="eyebrow-label mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {label}
          </span>
        )}
        <h2
          className={cn(
            "font-condensed text-3xl font-black leading-[0.95] tracking-[0.01em] md:text-5xl lg:text-6xl",
            light ? "text-primary-foreground" : "text-primary"
          )}
        >
          {title}
        </h2>
        <div className={cn("highlight-line mt-5", center && "mx-auto")} />
        {subtitle && (
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed md:text-lg",
              center && "mx-auto",
              light ? "text-primary-foreground/82" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  );
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  bg?: string;
  details?: React.ReactNode;
}

export function PageHero({ title, subtitle, bg, details }: PageHeroProps) {
  return (
    <section
      className="relative overflow-hidden pb-12 pt-32 md:pb-16 md:pt-40"
      style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      <div className={cn("absolute inset-0", bg ? "bg-navy-950/78" : "bg-gradient-hero")} />
      <div className="hero-grid absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,167,255,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,196,54,0.2),transparent_28%)]" />
      <div className="accent-orb absolute -left-16 top-20 h-44 w-44 rounded-full bg-accent/18 blur-3xl" />
      <div className="accent-orb absolute bottom-8 right-0 h-52 w-52 rounded-full bg-gold/14 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <Reveal className="max-w-4xl">
          <h1 className="mt-4 max-w-3xl font-condensed text-4xl font-black leading-[0.92] text-primary-foreground md:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/82 md:text-xl">
              {subtitle}
            </p>
          )}
          {details && (
            <div className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              {details}
            </div>
          )}
        </Reveal>

        <Reveal delay={120} className="mt-8 flex flex-wrap gap-3">
          {[
            "MEP Delivery",
            "ELV Integration",
            "Automation Systems",
          ].map((item) => (
            <span
              key={item}
              className="metric-pill inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/84"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}