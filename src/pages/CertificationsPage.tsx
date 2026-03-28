import { Award, CheckCircle, Shield } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/UIComponents";
import ManagedContentImage from "@/components/ManagedContentImage";
import { useManagedContent } from "@/hooks/use-managed-content";
import { resolveContentImage } from "@/lib/contentMedia";
import { metadataString } from "@/lib/contentMetadata";

interface CertificationsPageProps {
  embedded?: boolean;
}

export default function CertificationsPage({ embedded = false }: CertificationsPageProps) {
  const { items: certificates } = useManagedContent("certificates");

  const primaryCertificates = certificates.slice(0, 2);
  const galleryCertificates = certificates.slice(0, 4);

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Certifications"
          subtitle="International standards and certifications demonstrating our commitment to excellence"
        />
      )}

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Our Certifications"
            title="Certified Excellence"
            subtitle="International certifications and recognitions that reinforce our quality, safety, and delivery standards."
            center
          />
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {primaryCertificates.map((certificate, index) => {
              const Icon = index === 0 ? Award : Shield;

              return (
                <div
                  key={certificate.id}
                  className="rounded-2xl border border-border bg-card p-8 shadow-elevated"
                >
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <Icon size={28} className="text-accent" />
                    </div>
                    <div>
                      <div className="font-condensed text-3xl font-extrabold leading-none text-primary">
                        {certificate.title}
                      </div>
                      <div className="mt-1 text-sm font-medium text-muted-foreground">
                        {certificate.subtitle || metadataString(certificate.metadata, "issuer")}
                      </div>
                    </div>
                  </div>
                  <div className="divider-gold mb-4" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {certificate.description}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-accent">
                    <CheckCircle size={14} />
                    {metadataString(certificate.metadata, "status", "Active")}
                  </div>
                </div>
              );
            })}

            {primaryCertificates.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No certifications are available right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              label="Quality Assurance"
              title="Our Quality Commitment"
              subtitle="Quality is embedded in every process, every project, and every team member."
              center
              light
            />
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Rigorous quality control procedures at every project phase",
                "Regular internal and external audits",
                "Continuous improvement culture across all teams",
                "Compliance with international engineering standards",
                "Comprehensive HSE management programs",
                "Award-winning workforce support facilities",
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4 text-left"
                >
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span className="text-sm text-primary-foreground/80">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Certificate Gallery"
            title="Official Certifications"
            subtitle="Browse the official certificate documents and recognition images."
            center
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {galleryCertificates.map((certificate, index) => (
              <div
                key={certificate.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ManagedContentImage
                    metadata={certificate.metadata}
                    src={resolveContentImage(certificate, index) || "/placeholder.svg"}
                    alt={certificate.title}
                    frameClassName="h-full w-full"
                    className="h-full w-full"
                  />
                </div>
              </div>
            ))}

            {galleryCertificates.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No certificate images are available right now.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
