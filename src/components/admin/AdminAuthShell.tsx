import type { ReactNode } from "react";
import heroImage from "@/assets/hero-construction.jpg";
import logo from "@/assets/MQ-LOGO.png";

type AdminAuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideLabel: string;
  sideTitle: string;
  sideBody: string;
  children: ReactNode;
};

const brandPoints = [
  "MEP delivery",
  "ELV integration",
  "Automation systems",
];

export default function AdminAuthShell({
  eyebrow,
  title,
  description,
  sideLabel,
  sideTitle,
  sideBody,
  children,
}: AdminAuthShellProps) {
  return (
    <div className="admin-shell-bg px-4 py-10 md:py-14">
      <div className="container mx-auto">
        <div className="grid min-h-[calc(100vh-5rem)] items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="admin-hero-card hidden min-h-[42rem] lg:flex lg:flex-col">
            <img
              src={heroImage}
              alt="Engineering operations"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-primary/80 to-secondary/55" />
            <div className="hero-grid absolute inset-0 opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,167,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,201,87,0.18),transparent_28%)]" />
            <div className="accent-orb absolute -left-16 top-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="accent-orb absolute bottom-10 right-0 h-60 w-60 rounded-full bg-gold/15 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/90 backdrop-blur-sm">
                  <img
                    src={logo}
                    alt="Master Qatar"
                    className="h-6 w-6 rounded-full bg-white/90 object-contain p-1"
                  />
                  GCC Engineering Admin
                </div>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {sideLabel}
                </div>
                <h1 className="mt-6 max-w-xl font-condensed text-5xl font-black leading-[0.92] text-white xl:text-6xl">
                  {sideTitle}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/82 xl:text-lg">
                  {sideBody}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {brandPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 backdrop-blur-xl"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/82">
                      System
                    </div>
                    <div className="mt-3 font-condensed text-2xl font-bold text-white">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-card my-auto overflow-hidden p-8 md:p-10 xl:p-12">
            <div className="max-w-xl">
              <div className="admin-kicker">{eyebrow}</div>
              <h2 className="mt-5 font-condensed text-4xl font-black leading-none text-primary md:text-5xl">
                {title}
              </h2>
              <div className="highlight-line mt-5" />
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-10">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
