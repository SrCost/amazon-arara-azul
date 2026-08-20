CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  category_pt text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  category_es text NOT NULL DEFAULT '',
  category_fr text NOT NULL DEFAULT '',
  category_de text NOT NULL DEFAULT '',
  name_pt text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  name_es text NOT NULL DEFAULT '',
  name_fr text NOT NULL DEFAULT '',
  name_de text NOT NULL DEFAULT '',
  short_description_pt text NOT NULL DEFAULT '',
  short_description_en text NOT NULL DEFAULT '',
  short_description_es text NOT NULL DEFAULT '',
  short_description_fr text NOT NULL DEFAULT '',
  short_description_de text NOT NULL DEFAULT '',
  full_description_pt text NOT NULL DEFAULT '',
  full_description_en text NOT NULL DEFAULT '',
  full_description_es text NOT NULL DEFAULT '',
  full_description_fr text NOT NULL DEFAULT '',
  full_description_de text NOT NULL DEFAULT '',
  duration_label_pt text NOT NULL DEFAULT '',
  duration_label_en text NOT NULL DEFAULT '',
  duration_label_es text NOT NULL DEFAULT '',
  duration_label_fr text NOT NULL DEFAULT '',
  duration_label_de text NOT NULL DEFAULT '',
  what_to_wear_pt text NOT NULL DEFAULT '',
  what_to_wear_en text NOT NULL DEFAULT '',
  what_to_wear_es text NOT NULL DEFAULT '',
  what_to_wear_fr text NOT NULL DEFAULT '',
  what_to_wear_de text NOT NULL DEFAULT '',
  what_to_bring_pt text NOT NULL DEFAULT '',
  what_to_bring_en text NOT NULL DEFAULT '',
  what_to_bring_es text NOT NULL DEFAULT '',
  what_to_bring_fr text NOT NULL DEFAULT '',
  what_to_bring_de text NOT NULL DEFAULT '',
  operational_notes_pt text NOT NULL DEFAULT '',
  operational_notes_en text NOT NULL DEFAULT '',
  operational_notes_es text NOT NULL DEFAULT '',
  operational_notes_fr text NOT NULL DEFAULT '',
  operational_notes_de text NOT NULL DEFAULT '',
  base_price_per_person numeric NOT NULL DEFAULT 0,
  photos text[] NOT NULL DEFAULT '{}'::text[],
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.experiences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiences TO authenticated;
GRANT ALL ON public.experiences TO service_role;

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experiencias ativas sao publicas"
ON public.experiences FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins podem criar experiencias"
ON public.experiences FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins podem editar experiencias"
ON public.experiences FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins podem excluir experiencias"
ON public.experiences FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_audit_experiences
AFTER INSERT OR UPDATE OR DELETE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.log_audit_activity();

CREATE INDEX idx_experiences_active_order ON public.experiences (is_active, display_order);