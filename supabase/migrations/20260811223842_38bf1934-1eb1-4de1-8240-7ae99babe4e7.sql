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

  -- Auditoria reaproveitando o registro de atividades existente
  INSERT INTO public.activity_log (
    user_id, user_email, action, description, entity_type, entity_id, metadata
  ) VALUES (
    NULL,
    'guest_token',
    CASE WHEN v_new_status = 'updated' THEN 'pre_arrival_updated' ELSE 'pre_arrival_answered' END,
    CASE WHEN v_new_status = 'updated'
      THEN 'Hospede atualizou o questionario de Pre-Chegada'
      ELSE 'Hospede respondeu o questionario de Pre-Chegada' END,
    'pre_arrival_responses',
    v_reservation_id,
    jsonb_build_object('status', v_new_status, 'language', COALESCE(_language, 'pt'), 'access_method', 'public_token')
  );

  RETURN QUERY SELECT v_reservation_id, v_new_status, v_existing_answered IS NOT NULL;
END;
$$;