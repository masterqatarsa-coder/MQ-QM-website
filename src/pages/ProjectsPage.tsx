import { PageHero, SectionHeading } from "@/components/UIComponents";
import ManagedContentImage from "@/components/ManagedContentImage";
import { useManagedContent } from "@/hooks/use-managed-content";
import { resolveContentImage } from "@/lib/contentMedia";
import { metadataString } from "@/lib/contentMetadata";

interface ProjectsPageProps {
  embedded?: boolean;
}

const sectorHighlights = [
  {
    title: "Airports",
    desc: "International aviation facilities requiring complex MEP and ELV integration.",
  },
  {
    title: "Stadiums",
    desc: "Sports venues with advanced electrical, automation, and public address systems.",
  },
  {
    title: "Hotels & Hospitality",
    desc: "Luxury hospitality projects demanding precision MEP and building automation.",
  },
  {
    title: "Railways & Metro",
    desc: "Mass transit infrastructure with sophisticated electrical and ELV systems.",
  },
  {
    title: "Hospitals",
    desc: "Critical healthcare facilities requiring specialized MEP solutions.",
  },
  {
    title: "Commercial Buildings",
    desc: "Corporate towers, retail, and mixed-use developments across the GCC.",
  },
];

export default function ProjectsPage({ embedded = false }: ProjectsPageProps) {
  const { items: projects } = useManagedContent("projects");

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Our Projects"
          subtitle="A track record of excellence across landmark projects in the GCC region"
        />
      )}

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Industries We Serve"
            title="Sectors of Excellence"
            subtitle="Our work covers major sectors across infrastructure, hospitality, transport, healthcare, and commercial development."
            center
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sectorHighlights.map((sector) => (
              <div
                key={sector.title}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <h3 className="font-condensed text-2xl font-bold text-primary">
                  {sector.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {sector.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Notable Projects"
            title="Managed Project Portfolio"
            subtitle="Selected project highlights from our delivery portfolio."
            center
          />

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden">
                  <ManagedContentImage
                    metadata={project.metadata}
                    src={resolveContentImage(project, index) || "/placeholder.svg"}
                    alt={project.title}
                    frameClassName="h-full w-full"
                    className="h-full w-full"
                  />
                  <span className="absolute left-3 top-3 rounded bg-accent px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                    {metadataString(project.metadata, "sector", "Project")}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-condensed text-lg font-bold text-foreground">
                    {project.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {metadataString(project.metadata, "scope", "Managed project")}
                  </p>
                  {project.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No project highlights are available right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="mb-3 font-condensed text-4xl font-extrabold text-primary-foreground">
            Have a Project in Mind?
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-primary-foreground/70">
            Share your requirements and our team will get back to you with a tailored proposal.
          </p>
          <a
            href="/contact"
            className="inline-block rounded bg-gold px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-gold-foreground transition-all hover:bg-gold/85"
          >
            Discuss Your Project
          </a>
        </div>
      </section>
    </div>
  );
}
