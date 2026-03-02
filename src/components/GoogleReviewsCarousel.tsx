import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  profile_photo_url: string | null;
  review_date: string | null;
}

const GoogleReviewsCarousel = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("google_reviews_cache")
        .select("*")
        .order("review_date", { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        setReviews(data);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const goNext = useCallback(() => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const goPrev = useCallback(() => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [isPaused, goNext, reviews.length]);

  if (loading || reviews.length === 0) return null;

  const review = reviews[currentIndex];
  const truncatedText =
    review.text.length > 300 ? review.text.slice(0, 300) + "…" : review.text;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
            O que nossos hóspedes dizem
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Avaliações reais dos nossos hóspedes no Google
          </p>
        </div>

        <div
          className="relative max-w-2xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="bg-background rounded-xl shadow-soft p-6 sm:p-8 text-center min-h-[220px] flex flex-col items-center justify-center">
            {/* Stars */}
            <div className="flex gap-1 mb-4 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating
                      ? "text-[hsl(var(--golden))] fill-[hsl(var(--golden))]"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>

            {/* Review text */}
            <p className="text-foreground text-sm sm:text-base leading-relaxed mb-4 italic">
              "{truncatedText}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 justify-center">
              {review.profile_photo_url ? (
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {review.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-foreground text-sm">
                {review.author_name}
              </span>
            </div>
          </div>

          {/* Navigation */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 bg-card shadow-md rounded-full p-2 hover:bg-muted transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 bg-card shadow-md rounded-full p-2 hover:bg-muted transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          {/* Dots */}
          <div className="flex gap-2 justify-center mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Google attribution */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Avaliações do Google
        </p>
      </div>
    </section>
  );
};

export default GoogleReviewsCarousel;
