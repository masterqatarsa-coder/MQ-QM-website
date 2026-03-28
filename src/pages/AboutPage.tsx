import { PageHero, SectionHeading } from "@/components/UIComponents";
import { Target, Eye, Award, Users, Shield, Zap, Star, CheckCircle } from "lucide-react";

const values = [
  { icon: Shield, title: "Integrity", desc: "We maintain the highest ethical standards in all our business dealings." },
  { icon: CheckCircle, title: "Commitment", desc: "Dedicated to delivering every project on time, on budget, and to spec." },
  { icon: Star, title: "Quality", desc: "ISO-certified processes ensuring excellence at every stage." },
  { icon: Zap, title: "Innovation", desc: "Embracing cutting-edge technology to solve complex engineering challenges." },
  { icon: Users, title: "Customer Satisfaction", desc: "Our client-first philosophy builds lasting professional relationships." },
  { icon: Award, title: "Consistency", desc: "Proven track record delivering consistent results across 12+ years." },
];

const milestones = [
  { year: "2011", event: "Qatar Masters established in Doha, Qatar" },
  { year: "2013", event: "ISO 9001 certification achieved" },
  { year: "2016", event: "Expanded MEP operations across Qatar" },
  { year: "2018", event: "ISO 45001 occupational health & safety certification" },
  { year: "2020", event: "Approved by Supreme Committee for FIFA Stadiums" },
  { year: "2022", event: "FIFA World Cup Qatar 2022 projects completed" },
  { year: "2024", event: "Master Qatar W.L.L. — Saudi Arabia Branch launched in Jeddah" },
];

interface AboutPageProps {
  embedded?: boolean;
}

export default function AboutPage({ embedded = false }: AboutPageProps) {
  return (
    <div>

      {!embedded && (
        <PageHero
        title="About Us"
        subtitle="Building trust through engineering excellence since 2011"
      />
      )}

      {/* Company Overview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <SectionHeading
              label="Our Story"
              title="From Qatar to the Kingdom of Saudi Arabia"
              subtitle="Master Qatar W.L.L. is the proud expansion of Qatar Masters — one of the most trusted engineering and MEP contracting companies in the GCC region. Since 2011, we have partnered with over 20 multinational companies on some of the most prestigious construction projects in Qatar, including FIFA World Cup stadiums, international airports, and landmark infrastructure."
              center
            />
            <p className="text-muted-foreground leading-relaxed mt-4">
              Today, we bring that same commitment to quality and client satisfaction to the Kingdom of Saudi Arabia, operating from our Jeddah office. Our passionate team of engineers and technicians go beyond being traditional vendors — we build long-term professional relationships and become an extension of our clients' teams.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-navy-800/50 rounded-xl p-8 border border-navy-700">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-5">
                <Target size={24} className="text-accent-foreground" />
              </div>
              <h3 className="font-condensed font-bold text-2xl text-primary-foreground mb-3 uppercase">
                Our Mission
              </h3>
              <div className="divider-gold mb-4" />
              <p className="text-primary-foreground/70 leading-relaxed">
                Our corporate mission is to equip ourselves with the best practices to deliver our projects with utmost quality, optimized at the satisfaction of our clients and compliance to the highest standards with zero error. We are committed to being a reliable, long-term partner for every client we serve.
              </p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-8 border border-navy-700">
              <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center mb-5">
                <Eye size={24} className="text-gold-foreground" />
              </div>
              <h3 className="font-condensed font-bold text-2xl text-primary-foreground mb-3 uppercase">
                Our Vision
              </h3>
              <div className="divider-gold mb-4" />
              <p className="text-primary-foreground/70 leading-relaxed">
                To become one of the top service providers in the construction and engineering industry across the Arabian Gulf region — upholding ethics, adopting best professional practices, and continuously innovating to meet the evolving needs of the GCC's growing infrastructure landscape.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="What Drives Us"
            title="Core Values"
            subtitle="The principles that guide every decision, every project, every relationship."
            center
          />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-card rounded-xl p-6 shadow-card hover-lift border border-border"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-accent" />
                </div>
                <h4 className="font-condensed font-bold text-xl text-primary mb-2">{title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeading
            label="Our Journey"
            title="Company Milestones"
            center
          />
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-border" />
              {milestones.map((m, i) => (
                <div key={i} className="relative flex gap-8 mb-8 last:mb-0">
                  <div className="w-16 shrink-0 text-right">
                    <span className="font-condensed font-bold text-lg text-gold">{m.year}</span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-4 h-4 rounded-full bg-accent border-4 border-background" />
                    <div className="bg-card rounded-lg p-4 shadow-card border border-border ml-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{m.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


