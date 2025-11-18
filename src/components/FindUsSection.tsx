import { ExternalLink } from "lucide-react";

const FindUsSection = () => {
  const platforms = [
    {
      name: "Booking.com",
      logo: "https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?w=200&h=80&fit=crop",
      url: "#", // Placeholder
    },
    {
      name: "Airbnb",
      logo: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200&h=80&fit=crop",
      url: "#", // Placeholder
    },
    {
      name: "Trivago",
      logo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&h=80&fit=crop",
      url: "#", // Placeholder
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Nos Encontre Também
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserve através das principais plataformas de hospedagem
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:shadow-medium transition-all"
            >
              <div className="relative w-32 h-16 bg-card rounded overflow-hidden">
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                <span>{platform.name}</span>
                <ExternalLink className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FindUsSection;
