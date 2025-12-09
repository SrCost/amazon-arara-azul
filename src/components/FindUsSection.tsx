import { ExternalLink } from "lucide-react";
import { SOCIAL_LINKS } from "@/config/socialLinks";

const FindUsSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Nos Encontre Também
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserve através do Airbnb
          </p>
        </div>

        <div className="flex justify-center">
          <a
            href={SOCIAL_LINKS.airbnb}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 p-8 rounded-xl border border-border hover:border-primary hover:shadow-medium transition-all bg-card"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-16 h-16 text-[#FF5A5F] group-hover:scale-110 transition-transform"
              >
                <path d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457-.265-1.143-.053-2.063.477-2.649.371-.424.848-.636 1.432-.636.583 0 1.06.212 1.432.636.53.586.742 1.506.477 2.649-.265 1.273-1.06 2.76-2.413 4.457h.008zm6.614 1.326c-.159.689-.689 1.273-1.379 1.485-.159.053-.318.053-.477.053-.477 0-.954-.159-1.379-.53-.265-.212-.53-.477-.795-.795.901-1.114 1.644-2.175 2.175-3.184.742-1.379 1.114-2.649 1.114-3.816 0-1.485-.477-2.702-1.379-3.604-1.008-1.008-2.387-1.538-4.004-1.538s-2.996.53-4.004 1.538c-.901.901-1.379 2.119-1.379 3.604 0 1.167.371 2.438 1.114 3.816.53 1.008 1.273 2.069 2.175 3.184-.265.318-.53.583-.795.795-.424.371-.901.53-1.379.53-.159 0-.318 0-.477-.053-.689-.212-1.22-.795-1.379-1.485-.106-.424-.053-.901.159-1.432.159-.371.371-.742.636-1.114-.265-.318-.53-.689-.742-1.008-.212-.318-.424-.636-.583-.954-.424.636-.795 1.326-.954 2.016-.318 1.061-.212 2.122.318 3.024.477.848 1.273 1.485 2.228 1.75.318.106.689.159 1.008.159.689 0 1.326-.212 1.91-.583.424-.265.795-.583 1.167-.954.371.371.742.689 1.167.954.583.371 1.22.583 1.91.583.318 0 .689-.053 1.008-.159.954-.265 1.75-.901 2.228-1.75.53-.901.636-1.963.318-3.024-.159-.689-.53-1.379-.954-2.016-.159.318-.371.636-.583.954-.212.318-.477.689-.742 1.008.265.371.477.742.636 1.114.212.53.265 1.008.159 1.432z"/>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-lg font-medium text-muted-foreground group-hover:text-primary transition-colors">
              <span>Airbnb</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FindUsSection;
