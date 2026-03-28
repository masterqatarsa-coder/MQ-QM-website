import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ClientsPage from "@/pages/ClientsPage";
import CertificationsPage from "@/pages/CertificationsPage";
import ContactPage from "@/pages/ContactPage";
import CareersPage from "@/pages/CareersPage";

const streamSections = [
  {
    id: "about",
    label: "About",
    summary: "Company story, mission, values, and GCC delivery background.",
    Component: AboutPage,
  },
  {
    id: "services",
    label: "Services",
    summary: "Scroll through the full engineering stack, including MEP, ELV, automation, FM, workforce, and trading.",
    Component: ServicesPage,
  },
  {
    id: "projects",
    label: "Projects",
    summary: "Sector experience, landmark reference projects, and capability proof points.",
    Component: ProjectsPage,
  },
  {
    id: "clients",
    label: "Clients",
    summary: "Trusted partner list, testimonials, and long-term relationship signals.",
    Component: ClientsPage,
  },
  {
    id: "certifications",
    label: "Certifications",
    summary: "ISO standards, quality systems, safety commitments, and awards.",
    Component: CertificationsPage,
  },
  {
    id: "careers",
    label: "Careers",
    summary: "Hiring focus areas, team culture, and how to share your profile with us.",
    Component: CareersPage,
  },
  {
    id: "contact",
    label: "Contact",
    summary: "Reach the team, submit an inquiry, and find the location details.",
    Component: ContactPage,
  },
] as const;

export default function CompactSiteStream() {
  return (
    <div className="lg:hidden">
      <section className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(10,35,72,0.05),transparent_38%)] px-4 py-10">
        <div className="container mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Mobile Site Flow
          </div>
          <h2 className="mt-4 max-w-2xl font-condensed text-4xl font-black leading-[0.95] text-primary">
            Keep scrolling to move through the full website without opening the menu.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The hamburger still works as a jump menu, but the whole company profile is now stacked below the homepage for compact screens.
          </p>
        </div>
      </section>

      {streamSections.map(({ id, label, summary, Component }) => (
        <div key={id} id={id} className="scroll-mt-28 border-t border-border/60 bg-background">
          <div className="container mx-auto px-4 pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {label}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{summary}</p>
          </div>
          <Component embedded />
        </div>
      ))}
    </div>
  );
}

