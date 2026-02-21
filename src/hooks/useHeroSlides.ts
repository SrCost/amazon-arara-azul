import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
  id: string;
  title: string;
  desktop_image_url: string;
  mobile_image_url: string | null;
  alt_text: string;
  media_type: string;
  object_fit: string;
  background_color: string | null;
  hide_overlay: boolean;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useHeroSlides = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setSlides(data as HeroSlide[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  return { slides, loading, refetch: fetchSlides };
};

export const useHeroSlidesAdmin = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setSlides(data as HeroSlide[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  return { slides, loading, refetch: fetchSlides };
};
