CREATE OR REPLACE FUNCTION public.get_pre_arrival_by_token(_token text)
 RETURNS TABLE(reservation_id uuid, guest_name text, reservation_code text, check_in date, check_out date, guests integer, rooms_summary text, guest_language text, status text, answered_at timestamp with time zone, dietary_restrictions text[], foods_to_avoid text, children_info text, special_occasion text, special_occasion_detail text, arrival_mode text, estimated_arrival_time text, transport_needs text, additional_info text, health_condition text, mobility_limitations text, continuous_medication text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation_id uuid;
  v_answered timestamptz;
BEGIN
  SELECT bt.reservation_id INTO v_reservation_id
  FROM public.booking_tokens bt
  WHERE bt.token = _token
    AND bt.type = 'pre_arrival'
    AND bt.expires_at > now();

  IF v_reservation_id IS NULL THEN
    RETURN;
  END IF;

  SELECT p.answered_at INTO v_answered
  FROM public.pre_arrival_responses p
  WHERE p.reservation_id = v_reservation_id;

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
    -- Reserva já respondida: não devolvemos respostas para edição
    CASE WHEN v_answered IS NULL THEN COALESCE(p.dietary_restrictions, '{}'::text[]) ELSE '{}'::text[] END,
    CASE WHEN v_answered IS NULL THEN p.foods_to_avoid END,
    CASE WHEN v_answered IS NULL THEN p.children_info END,
    CASE WHEN v_answered IS NULL THEN p.special_occasion END,
    CASE WHEN v_answered IS NULL THEN p.special_occasion_detail END,
    CASE WHEN v_answered IS NULL THEN p.arrival_mode END,
    CASE WHEN v_answered IS NULL THEN p.estimated_arrival_time END,
    CASE WHEN v_answered IS NULL THEN p.transport_needs END,
    CASE WHEN v_answered IS NULL THEN p.additional_info END,
    CASE WHEN v_answered IS NULL THEN p.health_condition END,
    CASE WHEN v_answered IS NULL THEN p.mobility_limitations END,
    CASE WHEN v_answered IS NULL THEN p.continuous_medication END
  FROM public.reservations r
  LEFT JOIN public.pre_arrival_responses p ON p.reservation_id = r.id
  WHERE r.id = v_reservation_id;
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