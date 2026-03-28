import { PageHero, SectionHeading } from "@/components/UIComponents";
import ManagedContentImage from "@/components/ManagedContentImage";
import { useManagedContent } from "@/hooks/use-managed-content";
import { buildClientLogoDisplayItems } from "@/lib/contentMedia";
import { metadataString } from "@/lib/contentMetadata";

interface ClientsPageProps {
  embedded?: boolean;
}

export default function ClientsPage({ embedded = false }: ClientsPageProps) {
  const { items: clients } = useManagedContent("clients");
  const clientCards = buildClientLogoDisplayItems(clients);

  return (
    <div>
      {!embedded && (
        <PageHero
          title="Our Clients"
          subtitle="Trusted by leading multinational companies across the GCC region"
        />
      )}

      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { num: `${Math.max(clients.length, 20)}+`, label: "Client Portfolio" },
              { num: "12+", label: "Years of Partnerships" },
              { num: "100+", label: "Projects Delivered" },
              { num: "GCC", label: "Regional Coverage" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-condensed text-4xl font-extrabold text-gold">
                  {stat.num}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-primary-foreground/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Trusted Partners"
            title="Our Valued Clients"
            subtitle="A portfolio built on trust, repeat business, and long-term delivery partnerships."
            center
          />

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {clientCards.map((client) => (
              <div
                key={client.key}
                className="rounded-xl border border-border bg-card p-4 shadow-card transition hover:shadow-lg"
              >
                <div className="flex min-h-[96px] items-center justify-center">
                  <ManagedContentImage
                    metadata={client.metadata}
                    src={client.logo}
                    alt={client.item?.title || "Client logo"}
                    frameClassName="flex h-20 w-full items-center justify-center"
                    className="h-full w-full"
                    defaultDisplay={{ fit: "contain", scale: 1 }}
                    onError={(event) => {
                      if (event.currentTarget.src !== "/placeholder.svg") {
                        event.currentTarget.src = "/placeholder.svg";
                      }
                    }}
                  />
                </div>
                {client.item && (
                  <div className="mt-4 text-center">
                    <div className="text-sm font-semibold text-foreground">{client.item.title}</div>
                    {metadataString(client.item.metadata, "sector") && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {metadataString(client.item.metadata, "sector")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
