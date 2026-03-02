import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID || "ChIJIZ49U-RjbJIRfRcHewbwWdE";

const LeaveReviewSection = () => {
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex gap-1 justify-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-6 w-6 text-[hsl(var(--golden))] fill-[hsl(var(--golden))]"
              />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Compartilhe sua experiência
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            Sua avaliação ajuda outros viajantes a descobrirem a magia da
            Amazônia. Conte como foi sua estadia na Pousada Arara Azul.
          </p>
          <Button
            size="lg"
            className="bg-gradient-forest hover:opacity-90 text-white h-14 px-8 font-semibold shadow-lg"
            asChild
          >
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
              <Star className="mr-2 h-5 w-5" />
              Avaliar no Google
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeaveReviewSection;
