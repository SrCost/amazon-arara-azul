import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Leaf, Sun, Droplet, Users, Heart, Recycle } from "lucide-react";
import sustainabilityImg from "@/assets/sustainability.jpg";

const Sustainability = () => {
  const initiatives = [
    {
      icon: Sun,
      title: "Energia 100% Solar",
      description:
        "Todas as nossas pousadas são alimentadas por energia solar, reduzindo a zero nossa pegada de carbono energética.",
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
      description:
        "Parte da receita financia educação, saúde e projetos de geração de renda nas aldeias locais.",
    },
    {
      icon: Leaf,
      title: "Conservação Florestal",
      description:
        "Protegemos 5.000 hectares de floresta primária e apoiamos pesquisas de biodiversidade.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              Sustentabilidade e Responsabilidade
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Nosso compromisso vai além da hospitalidade: protegemos a Amazônia, valorizamos as
              comunidades locais e promovemos um turismo que regenera, não destrói.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-lg overflow-hidden shadow-strong mb-16">
            <img
              src={sustainabilityImg}
              alt="Sustentabilidade na Amazônia"
              className="w-full h-[400px] object-cover"
            />
          </div>

          {/* Initiatives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {initiatives.map((initiative, idx) => (
              <div
                key={idx}
                className="bg-card p-8 rounded-lg shadow-soft hover:shadow-medium transition-all"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-forest mb-4">
                  <initiative.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 text-foreground">
                  {initiative.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{initiative.description}</p>
              </div>
            ))}
          </div>

          {/* Impact Stats */}
          <div className="bg-gradient-forest text-white rounded-lg p-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Nosso Impacto em Números
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">5.000+</div>
                <div className="text-lg opacity-90">Hectares Protegidos</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">120</div>
                <div className="text-lg opacity-90">Famílias Apoiadas</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">100%</div>
                <div className="text-lg opacity-90">Energia Renovável</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">85%</div>
                <div className="text-lg opacity-90">Equipe Local</div>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              Nossa Missão
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Acreditamos que o turismo pode ser uma força positiva para a conservação ambiental e
              o desenvolvimento social. Cada hóspede que recebemos contribui diretamente para a
              proteção da floresta amazônica e para o bem-estar das comunidades tradicionais.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ao escolher nossas pousadas, você não está apenas vivendo uma experiência
              inesquecível — está investindo no futuro da Amazônia e de seu povo.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sustainability;
