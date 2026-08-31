CREATE OR REPLACE FUNCTION public.submit_checkin(p_reservation_id uuid, p_document text, p_estimated_arrival text, p_notes text, p_accepted_terms boolean, p_token text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO booking_checkins (reservation_id, document, estimated_arrival_time, notes, accepted_terms)
  VALUES (p_reservation_id, p_document, p_estimated_arrival, p_notes, p_accepted_terms);

  UPDATE reservations
  SET checkin_completed = true,
      situacao_fnrh = CASE
        WHEN situacao_fnrh IS NULL
          OR situacao_fnrh IN ('NAO_SINCRONIZADA', 'PRECHECKIN_PENDENTE', 'DADOS_INCOMPLETOS')
        THEN 'PRECHECKIN_REALIZADO'
        ELSE situacao_fnrh
      END,
      updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_checkin(p_reservation_id uuid, p_document text, p_estimated_arrival text, p_notes text, p_accepted_terms boolean, p_token text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text, p_birth_date date DEFAULT NULL::date, p_nationality text DEFAULT NULL::text, p_city_state text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_transport_mode text DEFAULT NULL::text, p_travel_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO booking_checkins (
    reservation_id, document, estimated_arrival_time, notes, accepted_terms,
    full_name, birth_date, nationality, city_state, address, transport_mode, travel_reason
  )
  VALUES (
    p_reservation_id, p_document, p_estimated_arrival, p_notes, p_accepted_terms,
    p_full_name, p_birth_date, p_nationality, p_city_state, p_address, p_transport_mode, p_travel_reason
  );

  UPDATE reservations
  SET checkin_completed = true,
      situacao_fnrh = CASE
        WHEN situacao_fnrh IS NULL
          OR situacao_fnrh IN ('NAO_SINCRONIZADA', 'PRECHECKIN_PENDENTE', 'DADOS_INCOMPLETOS')
        THEN 'PRECHECKIN_REALIZADO'
        ELSE situacao_fnrh
      END,
      updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_pre_arrival(_token text, _language text DEFAULT 'pt'::text, _dietary_restrictions text[] DEFAULT '{}'::text[], _foods_to_avoid text DEFAULT NULL::text, _children_info text DEFAULT NULL::text, _special_occasion text DEFAULT NULL::text, _special_occasion_detail text DEFAULT NULL::text, _arrival_mode text DEFAULT NULL::text, _estimated_arrival_time text DEFAULT NULL::text, _transport_needs text DEFAULT NULL::text, _additional_info text DEFAULT NULL::text, _health_condition text DEFAULT NULL::text, _mobility_limitations text DEFAULT NULL::text, _continuous_medication text DEFAULT NULL::text)
 RETURNS TABLE(reservation_id uuid, status text, is_update boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation_id uuid;
  v_existing_answered timestamptz;
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

  -- Resposta única por reserva: não permite reenvio nem edição
  IF v_existing_answered IS NOT NULL THEN
    RAISE EXCEPTION 'JA_RESPONDIDO';
  END IF;

  INSERT INTO public.pre_arrival_responses AS par (
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
  ON CONFLICT ON CONSTRAINT pre_arrival_responses_reservation_id_key DO UPDATE SET
    status = 'answered',
    language = COALESCE(_language, 'pt'),
    answered_at = now(),
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

  -- Invalida o link após o primeiro envio
  UPDATE public.booking_tokens
  SET used = true
  WHERE token = _token AND type = 'pre_arrival';

  UPDATE public.reservations
  SET situacao_fnrh = CASE
        WHEN situacao_fnrh IS NULL
          OR situacao_fnrh IN ('NAO_SINCRONIZADA', 'PRECHECKIN_PENDENTE', 'DADOS_INCOMPLETOS')
        THEN 'PRECHECKIN_REALIZADO'
        ELSE situacao_fnrh
      END,
      updated_at = now()
  WHERE id = v_reservation_id;

  INSERT INTO public.activity_log (
    user_id, user_email, action, description, entity_type, entity_id, metadata
  ) VALUES (
    NULL,
    'guest_token',
    'pre_arrival_answered',
    'Hospede respondeu o questionario de Pre-Chegada',
    'pre_arrival_responses',
    v_reservation_id,
    jsonb_build_object('status', 'answered', 'language', COALESCE(_language, 'pt'), 'access_method', 'public_token')
  );

  RETURN QUERY SELECT v_reservation_id, 'answered'::text, false;
END;
$function$;