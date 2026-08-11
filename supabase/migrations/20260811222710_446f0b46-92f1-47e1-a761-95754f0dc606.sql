-- 1) Permitir tokens de pré-chegada
ALTER TABLE public.booking_tokens DROP CONSTRAINT IF EXISTS booking_tokens_type_check;
ALTER TABLE public.booking_tokens ADD CONSTRAINT booking_tokens_type_check
  CHECK (type = ANY (ARRAY['checkin'::text, 'checkout'::text, 'pre_arrival'::text]));

-- 2) Tabela de respostas
CREATE TABLE public.pre_arrival_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid NOT NULL UNIQUE REFERENCES public.reservations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  language text NOT NULL DEFAULT 'pt',
  first_sent_at timestamptz,
  last_sent_at timestamptz,
  answered_at timestamptz,
  reminders_sent integer NOT NULL DEFAULT 0,
  last_send_origin text,
  -- respostas nao sensiveis
  dietary_restrictions text[] NOT NULL DEFAULT '{}',
  foods_to_avoid text,
  children_info text,
  special_occasion text,
  special_occasion_detail text,
  arrival_mode text,
  estimated_arrival_time text,
  transport_needs text,
  additional_info text,
  -- respostas sensiveis (saude)
  health_condition text,
  mobility_limitations text,
  continuous_medication text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pre_arrival_status_check CHECK (status = ANY (ARRAY['pending','sent','answered','updated'])),
  CONSTRAINT pre_arrival_origin_check CHECK (last_send_origin IS NULL OR last_send_origin = ANY (ARRAY['auto','manual']))
);

GRANT SELECT ON public.pre_arrival_responses TO authenticated;
GRANT ALL ON public.pre_arrival_responses TO service_role;

ALTER TABLE public.pre_arrival_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pre-arrival responses"
  ON public.pre_arrival_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages pre-arrival responses"
  ON public.pre_arrival_responses FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_pre_arrival_responses_updated_at
  BEFORE UPDATE ON public.pre_arrival_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pre_arrival_reservation ON public.pre_arrival_responses(reservation_id);
CREATE INDEX idx_pre_arrival_status ON public.pre_arrival_responses(status);

-- 3) Leitura publica por token
CREATE OR REPLACE FUNCTION public.get_pre_arrival_by_token(_token text)
RETURNS TABLE(
  reservation_id uuid,
  guest_name text,
  reservation_code text,
  check_in date,
  check_out date,
  guests integer,
  rooms_summary text,
  guest_language text,
  status text,
  answered_at timestamptz,
  dietary_restrictions text[],
  foods_to_avoid text,
  children_info text,
  special_occasion text,
  special_occasion_detail text,
  arrival_mode text,
  estimated_arrival_time text,
  transport_needs text,
  additional_info text,
  health_condition text,
  mobility_limitations text,
  continuous_medication text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation_id uuid;
BEGIN
  SELECT bt.reservation_id INTO v_reservation_id
  FROM public.booking_tokens bt
  WHERE bt.token = _token
    AND bt.type = 'pre_arrival'
    AND bt.expires_at > now();

  IF v_reservation_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.guest_name,
    'PAA-' || upper(substr(replace(r.id::text, '-', ''), 1, 6)),
    r.check_in,
    r.check_out,
    r.guests,
    COALESCE(
      (SELECT string_agg(COALESCE(rr.room_name, 'Bangalo'), ', ' ORDER BY rr.position)
         FROM public.reservation_rooms rr WHERE rr.reservation_id = r.id),
      r.room_name
    ),
    COALESCE(r.guest_language, 'pt'),
    COALESCE(p.status, 'sent'),
    p.answered_at,
    COALESCE(p.dietary_restrictions, '{}'::text[]),
    p.foods_to_avoid,
    p.children_info,
    p.special_occasion,
    p.special_occasion_detail,
    p.arrival_mode,
    p.estimated_arrival_time,
    p.transport_needs,
    p.additional_info,
    p.health_condition,
    p.mobility_limitations,
    p.continuous_medication
  FROM public.reservations r
  LEFT JOIN public.pre_arrival_responses p ON p.reservation_id = r.id
  WHERE r.id = v_reservation_id;
END;
$$;

-- 4) Envio/atualizacao publica por token
CREATE OR REPLACE FUNCTION public.submit_pre_arrival(
  _token text,
  _language text DEFAULT 'pt',
  _dietary_restrictions text[] DEFAULT '{}',
  _foods_to_avoid text DEFAULT NULL,
  _children_info text DEFAULT NULL,
  _special_occasion text DEFAULT NULL,
  _special_occasion_detail text DEFAULT NULL,
  _arrival_mode text DEFAULT NULL,
  _estimated_arrival_time text DEFAULT NULL,
  _transport_needs text DEFAULT NULL,
  _additional_info text DEFAULT NULL,
  _health_condition text DEFAULT NULL,
  _mobility_limitations text DEFAULT NULL,
  _continuous_medication text DEFAULT NULL
)
RETURNS TABLE(reservation_id uuid, status text, is_update boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation_id uuid;
  v_existing_answered timestamptz;
  v_new_status text;
BEGIN
  SELECT bt.reservation_id INTO v_reservation_id
  FROM public.booking_tokens bt
  WHERE bt.token = _token
    AND bt.type = 'pre_arrival'
    AND bt.expires_at > now();

  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'TOKEN_INVALIDO';
  END IF;

  SELECT p.answered_at INTO v_existing_answered
  FROM public.pre_arrival_responses p
  WHERE p.reservation_id = v_reservation_id;

  v_new_status := CASE WHEN v_existing_answered IS NULL THEN 'answered' ELSE 'updated' END;

  INSERT INTO public.pre_arrival_responses (
    reservation_id, status, language, answered_at,
    dietary_restrictions, foods_to_avoid, children_info,
    special_occasion, special_occasion_detail,
    arrival_mode, estimated_arrival_time, transport_needs, additional_info,
    health_condition, mobility_limitations, continuous_medication
  ) VALUES (
    v_reservation_id, 'answered', COALESCE(_language, 'pt'), now(),
    COALESCE(_dietary_restrictions, '{}'::text[]), _foods_to_avoid, _children_info,
    _special_occasion, _special_occasion_detail,
    _arrival_mode, _estimated_arrival_time, _transport_needs, _additional_info,
    _health_condition, _mobility_limitations, _continuous_medication
  )
  ON CONFLICT (reservation_id) DO UPDATE SET
    status = v_new_status,
    language = COALESCE(_language, 'pt'),
    answered_at = COALESCE(public.pre_arrival_responses.answered_at, now()),
    dietary_restrictions = COALESCE(_dietary_restrictions, '{}'::text[]),
    foods_to_avoid = _foods_to_avoid,
    children_info = _children_info,
    special_occasion = _special_occasion,
    special_occasion_detail = _special_occasion_detail,
    arrival_mode = _arrival_mode,
    estimated_arrival_time = _estimated_arrival_time,
    transport_needs = _transport_needs,
    additional_info = _additional_info,
    health_condition = _health_condition,
    mobility_limitations = _mobility_limitations,
    continuous_medication = _continuous_medication,
    updated_at = now();

  RETURN QUERY SELECT v_reservation_id, v_new_status, v_existing_answered IS NOT NULL;
END;
$$;

-- 5) Leitura administrativa (saude somente para super_admin, com log)
CREATE OR REPLACE FUNCTION public.get_pre_arrival_admin(_reservation_id uuid)
RETURNS TABLE(
  reservation_id uuid,
  status text,
  language text,
  first_sent_at timestamptz,
  last_sent_at timestamptz,
  answered_at timestamptz,
  updated_at timestamptz,
  reminders_sent integer,
  last_send_origin text,
  dietary_restrictions text[],
  foods_to_avoid text,
  children_info text,
  special_occasion text,
  special_occasion_detail text,
  arrival_mode text,
  estimated_arrival_time text,
  transport_needs text,
  additional_info text,
  can_view_health boolean,
  health_condition text,
  mobility_limitations text,
  continuous_medication text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_is_super boolean;
BEGIN
  v_is_super := public.has_role(auth.uid(), 'super_admin');
  v_is_admin := v_is_super OR public.has_role(auth.uid(), 'admin');

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'ACESSO_NEGADO';
  END IF;

  IF v_is_super THEN
    INSERT INTO public.sensitive_data_access_log (
      user_id, reservation_id, access_type, accessed_fields, access_method
    ) VALUES (
      auth.uid(), _reservation_id, 'pre_arrival_health',
      ARRAY['health_condition','mobility_limitations','continuous_medication'],
      'dashboard'
    );
  END IF;

  RETURN QUERY
  SELECT
    p.reservation_id,
    p.status,
    p.language,
    p.first_sent_at,
    p.last_sent_at,
    p.answered_at,
    p.updated_at,
    p.reminders_sent,
    p.last_send_origin,
    p.dietary_restrictions,
    p.foods_to_avoid,
    p.children_info,
    p.special_occasion,
    p.special_occasion_detail,
    p.arrival_mode,
    p.estimated_arrival_time,
    p.transport_needs,
    p.additional_info,
    v_is_super,
    CASE WHEN v_is_super THEN p.health_condition END,
    CASE WHEN v_is_super THEN p.mobility_limitations END,
    CASE WHEN v_is_super THEN p.continuous_medication END
  FROM public.pre_arrival_responses p
  WHERE p.reservation_id = _reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pre_arrival_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pre_arrival_by_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_pre_arrival(text, text, text[], text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pre_arrival_admin(uuid) TO authenticated, service_role;