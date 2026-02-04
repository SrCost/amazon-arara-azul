import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Leaf, Sun, Droplet, Users, Heart, Recycle, Home } from "lucide-react";
import sustainabilityImg from "@/assets/sustainability-new.jpg";
import familiaAnfitria from "@/assets/familia-anfitria.jpg";
import { usePageMeta } from "@/hooks/usePageMeta";

const Sustainability = () => {
  usePageMeta({
    title: 'Sustentabilidade | Pousada Arara Azul – Manacapuru, AM',
    description: 'Turismo sustentável na Amazônia. Energia renovável, emprego local, conservação florestal e apoio às comunidades ribeirinhas em Manacapuru.',
  });
  const initiatives = [
    {
      icon: Sun,
      title: "Compromisso com a Sustentabilidade",
      description:
        "A luz do sol e o uso consciente dos recursos naturais fazem parte do nosso compromisso com a sustentabilidade.",
    },
    {
      icon: Droplet,
      title: "Gestão Sustentável de Água",
      description:
        "Sistemas de captação de água da chuva e tratamento biológico de efluentes protegem os rios e nascentes.",
    },
    {
      icon: Recycle,
      title: "Resíduos Zero",
      description:
        "Compostagem orgânica, reciclagem total e eliminação de plásticos descartáveis em todas as operações.",
    },
    {
      icon: Users,
      title: "Emprego Local",
      description:
        "85% de nossa equipe é da região, garantindo renda digna e desenvolvimento das comunidades ribeirinhas.",
    },
    {
      icon: Heart,
      title: "Apoio às Comunidades",
      description: "Parte da receita financia educação, saúde e projetos de geração de renda nas aldeias locais.",
    },
    {
      icon: Leaf,
      title: "Conservação Florestal",
      description: "Protegemos grandes áreas de floresta primária e apoiamos pesquisas de biodiversidade.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              Sustentabilidade e Responsabilidade
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Nosso compromisso vai além da hospitalidade: protegemos a Amazônia, valorizamos as comunidades locais e
              promovemos um turismo que regenera, não destrói.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-lg overflow-hidden shadow-strong mb-12 sm:mb-16">
            <img
              src={sustainabilityImg}
              alt="Sustentabilidade na Amazônia - Pousada Arara Azul"
              width={1200}
              height={400}
              className="w-full h-[250px] sm:h-[350px] md:h-[400px] object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Initiatives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {initiatives.map((initiative, idx) => (
              <div key={idx} className="bg-card p-5 sm:p-8 rounded-lg shadow-soft hover:shadow-medium transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-forest mb-3 sm:mb-4">
                  <initiative.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-display font-semibold mb-2 sm:mb-3 text-foreground">
                  {initiative.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{initiative.description}</p>
              </div>
            ))}
          </div>

          {/* Impact Stats */}
          <div className="bg-gradient-forest text-white rounded-lg p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-8 sm:mb-12">
              Nosso Impacto em Números
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">5.000+</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">Hectares Protegidos</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">120</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">Famílias Apoiadas</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">100%</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">Energia Renovável</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">85%</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">Equipe Local</div>
              </div>
            </div>
          </div>

          {/* Host Family Section */}
          <section className="mt-12 sm:mt-16 relative overflow-hidden">
            {/* Background decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl" />
            
            <div className="relative bg-card rounded-2xl shadow-strong p-6 sm:p-10 md:p-16">
              {/* Título com ícone */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-forest mb-4">
                  <Home className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
                  Nossa Família Anfitriã
                </h2>
                {/* Linha decorativa */}
                <div className="w-20 sm:w-24 h-1 bg-gradient-forest mx-auto mt-4 rounded-full" />
              </div>

              {/* Grid: Foto + Texto */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Foto com moldura */}
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-forest rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 blur-xl" />
                  <img
                    src={familiaAnfitria}
                    alt="Família anfitriã ribeirinha da Pousada Arara Azul"
                    className="relative w-full rounded-xl shadow-strong object-cover aspect-[4/5] sm:aspect-[3/4] group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Texto */}
                <div className="space-y-5 sm:space-y-6">
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Na Pousada Arara Azul, você é recebido por uma verdadeira família ribeirinha, a família vive às margens do Rio Negro, preservando tradições, histórias e saberes da vida amazônica.
                  </p>
                  
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Eles conhecem cada canto dos lagos de Acajatuba, os segredos da pesca, das plantas medicinais e da vida cotidiana na floresta. Com carinho e simplicidade, compartilham sua cultura: preparam refeições típicas, conduzem passeios e ensinam sobre os costumes locais.
                  </p>

                  {/* Citação em destaque */}
                  <blockquote className="relative pl-5 sm:pl-6 border-l-4 border-primary bg-primary/5 py-4 pr-4 rounded-r-lg">
                    <p className="text-base sm:text-lg text-foreground italic leading-relaxed">
                      "Cada hóspede se torna parte da história da família, participando de atividades como oficinas de artesanato, pescarias, visitas à comunidade e momentos de convivência ao redor da mesa de jantar. A hospitalidade da família ribeirinha transforma sua estadia em uma experiência única, genuína e inesquecível, conectando você à natureza e à cultura amazônica de forma autêntica."
                    </p>
                  </blockquote>
                </div>
              </div>
            </div>
          </section>

          {/* Mission Statement */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 sm:mb-6">Nossa Missão</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              Acreditamos que o turismo pode ser uma força positiva para a conservação ambiental e o desenvolvimento
              social. Cada hóspede que recebemos contribui diretamente para a proteção da floresta amazônica e para o
              bem-estar das comunidades tradicionais.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ao escolher nossas pousadas, você não está apenas vivendo uma experiência inesquecível — está investindo
              no futuro da Amazônia e de seu povo.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sustainability;
