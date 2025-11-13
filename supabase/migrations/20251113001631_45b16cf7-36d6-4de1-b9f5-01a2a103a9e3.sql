-- Fix the audit log trigger to use UUID directly
CREATE OR REPLACE FUNCTION public.log_audit_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  action_type TEXT;
  description TEXT;
  entity_type TEXT;
BEGIN
  -- Get user email
  user_email := get_current_user_email();
  
  -- Determine entity type from table name
  entity_type := TG_TABLE_NAME;
  
  -- Build description based on operation
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    description := 'Novo registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    description := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    description := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- Insert audit log with UUID type for entity_id
  INSERT INTO public.activity_log (
    user_id,
    user_email,
    action,
    description,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    user_email,
    action_type,
    description,
    entity_type,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', NOW()
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Now create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  duration TEXT NOT NULL,
  people INTEGER NOT NULL DEFAULT 2,
  description TEXT NOT NULL,
  inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Anyone can view active packages"
ON public.packages
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage packages"
ON public.packages
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can delete packages"
ON public.packages
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create public view for packages
CREATE OR REPLACE VIEW public.packages_public AS
SELECT 
  id,
  name,
  slug,
  duration,
  people,
  description,
  price,
  inclusions,
  experiences
FROM public.packages
WHERE is_active = true;

-- Add package_id to reservations table
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_package_id ON public.reservations(package_id);

-- Trigger to update updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger for packages
CREATE TRIGGER trg_audit_packages
AFTER INSERT OR UPDATE OR DELETE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();

-- Insert the three initial packages
INSERT INTO public.packages (name, slug, duration, people, description, inclusions, experiences, price) VALUES
(
  'Pacote Japiim',
  'japiim',
  '5 dias e 4 noites',
  2,
  'Conforto, autenticidade e sabor regional. Viva a essência da floresta com acolhimento e comida caseira amazônica.',
  '["Alimentação: pensão completa", "Transporte terrestre e fluvial (ida e volta)", "Recepção amazônica de boas-vindas", "Welcome drink cortesia no Sunset Jungle Bar"]'::jsonb,
  '["Interação com botos", "Visita à aldeia local", "Caminhada na selva", "Focagem noturna de jacarés", "Nascer do sol", "Pôr do sol", "Macacos do Ariaú", "Passeio na praia de água doce", "Samaúma gigante"]'::jsonb,
  14721.00
),
(
  'Pacote Uirapuru',
  'uirapuru',
  '5 dias e 4 noites',
  2,
  'Um convite à serenidade e à cultura amazônica, com experiências únicas e gastronomia local inesquecível.',
  '["Alimentação: pensão completa", "Transporte terrestre e fluvial (ida e volta)", "Recepção amazônica de boas-vindas", "Welcome drink cortesia no Sunset Jungle Bar", "Jantar amazônico sob o Chapéu de Sol"]'::jsonb,
  '["Interação com botos", "Visita à aldeia local", "Caminhada na selva", "Focagem noturna de jacarés", "Pescaria de piranhas", "Pôr do sol no Jungle Bar", "Nascer do sol", "Doce amazônico artesanal", "Casa de farinha tradicional"]'::jsonb,
  14461.00
),
(
  'Pacote Araraúna',
  'ararauna',
  '7 dias e 6 noites',
  2,
  'O pacote mais completo e imersivo. Ideal para quem deseja mergulhar profundamente na natureza e cultura amazônica com conforto e exclusividade.',
  '["Alimentação: pensão completa", "Transporte terrestre e fluvial (ida e volta)", "Recepção amazônica de boas-vindas", "Welcome drink cortesia no Sunset Jungle Bar"]'::jsonb,
  '["Interação com botos", "Visita à aldeia local", "Caminhada na selva", "Focagem noturna de jacarés", "Pescaria de piranhas", "Nascer do sol", "Pôr do sol no Jungle Bar", "Macacos do Ariaú", "Doce amazônico artesanal", "Casa de farinha tradicional", "Passeio na cachoeira (em época de seca)", "Passeio na praia de água doce", "Samaúma gigante"]'::jsonb,
  21379.00
);