-- 04-funcoes.sql : funcoes do banco

CREATE OR REPLACE FUNCTION public.auto_generate_reservation_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Gerar token automaticamente para nova reserva
  PERFORM generate_reservation_token(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_max_requests integer DEFAULT 10, p_window_seconds integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Tentar obter registro existente
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits WHERE key = p_key;
  
  -- Se não existe, criar novo registro
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start) 
    VALUES (p_key, 1, NOW())
    ON CONFLICT (key) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- Se a janela expirou, resetar contador
  IF v_window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE rate_limits 
    SET count = 1, window_start = NOW() 
    WHERE key = p_key;
    RETURN TRUE;
  END IF;
  
  -- Se excedeu o limite, bloquear
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador
  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.reservation_access_tokens
  WHERE expires_at < now() - interval '30 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.activity_log 
  WHERE created_at < NOW() - INTERVAL '15 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_reservation_rooms_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.reservation_rooms
  WHERE reservation_id = NEW.reservation_id;

  IF v_count > 10 THEN
    RAISE EXCEPTION 'Limite maximo de 10 acomodacoes por reserva excedido';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_reservation_token(_reservation_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _token text;
BEGIN
  -- Use full path to pgcrypto function in extensions schema
  _token := encode(extensions.gen_random_bytes(24), 'base64');
  _token := replace(replace(replace(_token, '+', ''), '/', ''), '=', '');
  
  INSERT INTO public.reservation_access_tokens (reservation_id, token)
  VALUES (_reservation_id, _token);
  
  RETURN _token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return NULL (not 'system')
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the email for the authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  RETURN user_email;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pre_arrival_admin(_reservation_id uuid)
 RETURNS TABLE(reservation_id uuid, status text, language text, first_sent_at timestamp with time zone, last_sent_at timestamp with time zone, answered_at timestamp with time zone, updated_at timestamp with time zone, reminders_sent integer, last_send_origin text, dietary_restrictions text[], foods_to_avoid text, children_info text, special_occasion text, special_occasion_detail text, arrival_mode text, estimated_arrival_time text, transport_needs text, additional_info text, can_view_health boolean, health_condition text, mobility_limitations text, continuous_medication text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_reservation_summary(p_room_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(room_id uuid, check_in date, check_out date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.room_id,
    r.check_in,
    r.check_out,
    r.status
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND (p_room_id IS NULL OR r.room_id = p_room_id)
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_reservation_safe_with_token(_reservation_id uuid, _token text)
 RETURNS TABLE(id uuid, room_name text, check_in date, check_out date, guests integer, status text, payment_status text, total_price numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate token
  IF NOT validate_reservation_token(_token, _reservation_id) THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;
  
  -- Return ONLY non-sensitive fields
  RETURN QUERY
  SELECT 
    r.id,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    r.status,
    r.payment_status,
    r.total_price,
    r.created_at
  FROM reservations r
  WHERE r.id = _reservation_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_reservation_with_token(_reservation_id uuid, _token text)
 RETURNS TABLE(id uuid, room_id uuid, room_name text, check_in date, check_out date, guests integer, guest_name text, guest_email text, guest_phone text, status text, payment_status text, payment_method text, total_price numeric, special_requests text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar token
  IF NOT validate_reservation_token(_token, _reservation_id) THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;
  
  -- Retornar dados da reserva (apenas campos necessários)
  RETURN QUERY
  SELECT 
    r.id,
    r.room_id,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.status,
    r.payment_status,
    r.payment_method,
    r.total_price,
    r.special_requests,
    r.created_at
  FROM public.reservations r
  WHERE r.id = _reservation_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_room_availability(p_room_id uuid)
 RETURNS TABLE(check_in date, check_out date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.check_in, r.check_out, r.status
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE
    AND (
      r.room_id = p_room_id
      OR EXISTS (
        SELECT 1 FROM reservation_rooms rr
        WHERE rr.reservation_id = r.id AND rr.room_id = p_room_id
      )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_room_availability_with_blocks(p_room_id uuid)
 RETURNS TABLE(check_in date, check_out date, status text, block_type text, is_blocked boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.check_in, r.check_out, r.status, NULL::text as block_type, false as is_blocked
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE
    AND (
      r.room_id = p_room_id
      OR EXISTS (
        SELECT 1 FROM reservation_rooms rr
        WHERE rr.reservation_id = r.id AND rr.room_id = p_room_id
      )
    )
  UNION ALL
  SELECT b.start_date as check_in, b.end_date as check_out, 'blocked'::text as status, b.block_type, true as is_blocked
  FROM blocked_dates b
  WHERE b.room_id = p_room_id
    AND b.end_date >= CURRENT_DATE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- First user becomes super_admin, others become regular users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT COUNT(*) FROM auth.users) = 1 THEN 'super_admin'::app_role
      ELSE 'user'::app_role
    END
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_service_role()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  )
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  action_type TEXT;
  description TEXT;
  entity_type TEXT;
BEGIN
  -- Get user email, default to 'system' for service role operations
  user_email := COALESCE(get_current_user_email(), 'system');
  
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
$function$
;

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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.submit_checkout(p_reservation_id uuid, p_rating integer, p_comment text, p_issues text, p_token text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO booking_checkouts (reservation_id, rating, comment, issues)
  VALUES (p_reservation_id, p_rating, p_comment, p_issues);

  UPDATE reservations 
  SET checkout_completed = true, 
      status = 'finished',
      updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_payment_status_to_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reservation_status TEXT;
BEGIN
  -- Map payment status to reservation payment_status
  CASE NEW.status
    WHEN 'completed' THEN reservation_status := 'paid';
    WHEN 'approved' THEN reservation_status := 'paid';
    WHEN 'paid' THEN reservation_status := 'paid';
    WHEN 'pending' THEN reservation_status := 'pending';
    WHEN 'processing' THEN reservation_status := 'processing';
    WHEN 'in_process' THEN reservation_status := 'pending';
    WHEN 'authorized' THEN reservation_status := 'pending';
    WHEN 'failed' THEN reservation_status := 'failed';
    WHEN 'rejected' THEN reservation_status := 'failed';
    WHEN 'cancelled' THEN reservation_status := 'failed';
    WHEN 'refunded' THEN reservation_status := 'refunded';
    ELSE reservation_status := 'pending';
  END CASE;

  -- Update the corresponding reservation
  UPDATE public.reservations
  SET payment_status = reservation_status,
      payment_method = NEW.payment_method,
      updated_at = NOW()
  WHERE id = NEW.reservation_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_payment_to_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Map payment status to reservation payment_status using correct English values
  UPDATE public.reservations
  SET 
    payment_status = CASE 
      WHEN NEW.status IN ('approved', 'paid', 'completed') THEN 'paid'
      WHEN NEW.status IN ('rejected', 'cancelled', 'failed') THEN 'failed'
      WHEN NEW.status IN ('pending', 'in_process', 'authorized', 'processing') THEN 'pending'
      WHEN NEW.status = 'refunded' THEN 'refunded'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.reservation_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_booking_token(p_token text, p_type text)
 RETURNS TABLE(reservation_id uuid, guest_name text, room_name text, check_in date, check_out date, guests integer, checkin_completed boolean, checkout_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.guest_name,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    COALESCE(r.checkin_completed, false),
    COALESCE(r.checkout_completed, false)
  FROM booking_tokens bt
  JOIN reservations r ON r.id = bt.reservation_id
  WHERE bt.token = p_token
    AND bt.type = p_type
    AND bt.used = false
    AND bt.expires_at > now()
    AND r.status IN ('pending', 'confirmed');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_reservation_for_guest(p_reservation_id uuid, p_email text)
 RETURNS TABLE(id uuid, guest_name text, room_name text, check_in date, check_out date, guests integer, checkin_completed boolean, checkout_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.guest_name,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    COALESCE(r.checkin_completed, false),
    COALESCE(r.checkout_completed, false)
  FROM reservations r
  WHERE r.id = p_reservation_id
    AND lower(r.guest_email) = lower(p_email)
    AND r.status IN ('pending', 'confirmed');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_reservation_token(_token text, _reservation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _valid boolean;
BEGIN
  -- Verificar se token existe, não expirou e pertence à reserva
  SELECT EXISTS (
    SELECT 1 
    FROM public.reservation_access_tokens
    WHERE token = _token
      AND reservation_id = _reservation_id
      AND expires_at > now()
  ) INTO _valid;
  
  -- Marcar token como usado se válido
  IF _valid THEN
    UPDATE public.reservation_access_tokens
    SET used_at = now()
    WHERE token = _token AND used_at IS NULL;
  END IF;
  
  RETURN _valid;
END;
$function$
;

