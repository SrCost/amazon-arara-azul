-- 02-tabelas.sql : estrutura das tabelas do schema public
-- Execute depois de 01-extensoes-e-tipos.sql

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  user_email text NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  block_type text DEFAULT 'maintenance'::text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_checkins (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  document text NOT NULL,
  estimated_arrival_time text,
  notes text,
  accepted_terms boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  full_name text,
  birth_date date,
  nationality text,
  city_state text,
  address text,
  transport_mode text,
  travel_reason text
);

CREATE TABLE IF NOT EXISTS public.booking_checkouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  issues text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  token text NOT NULL,
  type text NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '48:00:00'::interval) NOT NULL,
  used boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid,
  recipient_email text NOT NULL,
  email_type text NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  resend_id text,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  last_event text,
  last_event_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  complained_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  category_pt text DEFAULT ''::text NOT NULL,
  category_en text DEFAULT ''::text NOT NULL,
  category_es text DEFAULT ''::text NOT NULL,
  category_fr text DEFAULT ''::text NOT NULL,
  category_de text DEFAULT ''::text NOT NULL,
  name_pt text NOT NULL,
  name_en text DEFAULT ''::text NOT NULL,
  name_es text DEFAULT ''::text NOT NULL,
  name_fr text DEFAULT ''::text NOT NULL,
  name_de text DEFAULT ''::text NOT NULL,
  short_description_pt text DEFAULT ''::text NOT NULL,
  short_description_en text DEFAULT ''::text NOT NULL,
  short_description_es text DEFAULT ''::text NOT NULL,
  short_description_fr text DEFAULT ''::text NOT NULL,
  short_description_de text DEFAULT ''::text NOT NULL,
  full_description_pt text DEFAULT ''::text NOT NULL,
  full_description_en text DEFAULT ''::text NOT NULL,
  full_description_es text DEFAULT ''::text NOT NULL,
  full_description_fr text DEFAULT ''::text NOT NULL,
  full_description_de text DEFAULT ''::text NOT NULL,
  duration_label_pt text DEFAULT ''::text NOT NULL,
  duration_label_en text DEFAULT ''::text NOT NULL,
  duration_label_es text DEFAULT ''::text NOT NULL,
  duration_label_fr text DEFAULT ''::text NOT NULL,
  duration_label_de text DEFAULT ''::text NOT NULL,
  what_to_wear_pt text DEFAULT ''::text NOT NULL,
  what_to_wear_en text DEFAULT ''::text NOT NULL,
  what_to_wear_es text DEFAULT ''::text NOT NULL,
  what_to_wear_fr text DEFAULT ''::text NOT NULL,
  what_to_wear_de text DEFAULT ''::text NOT NULL,
  what_to_bring_pt text DEFAULT ''::text NOT NULL,
  what_to_bring_en text DEFAULT ''::text NOT NULL,
  what_to_bring_es text DEFAULT ''::text NOT NULL,
  what_to_bring_fr text DEFAULT ''::text NOT NULL,
  what_to_bring_de text DEFAULT ''::text NOT NULL,
  operational_notes_pt text DEFAULT ''::text NOT NULL,
  operational_notes_en text DEFAULT ''::text NOT NULL,
  operational_notes_es text DEFAULT ''::text NOT NULL,
  operational_notes_fr text DEFAULT ''::text NOT NULL,
  operational_notes_de text DEFAULT ''::text NOT NULL,
  base_price_per_person numeric DEFAULT 0 NOT NULL,
  photos text[] DEFAULT '{}'::text[] NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fnrh_credentials (
  id text DEFAULT 'default'::text NOT NULL,
  api_user text NOT NULL,
  api_password text NOT NULL,
  cpf_solicitante text NOT NULL,
  env text DEFAULT 'producao'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  updated_by_email text
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  alt_text text NOT NULL,
  category text DEFAULT 'experiences'::text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bungalow_slug text,
  compression_stats jsonb
);

CREATE TABLE IF NOT EXISTS public.google_reviews_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  author_name text NOT NULL,
  rating integer NOT NULL,
  text text NOT NULL,
  profile_photo_url text,
  review_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  desktop_image_url text NOT NULL,
  mobile_image_url text,
  alt_text text DEFAULT ''::text NOT NULL,
  media_type text DEFAULT 'image'::text NOT NULL,
  object_fit text DEFAULT 'cover'::text NOT NULL,
  background_color text,
  hide_overlay boolean DEFAULT false NOT NULL,
  link_url text,
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.packages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  duration text NOT NULL,
  people integer DEFAULT 2 NOT NULL,
  description text NOT NULL,
  inclusions jsonb DEFAULT '[]'::jsonb NOT NULL,
  experiences jsonb DEFAULT '[]'::jsonb NOT NULL,
  price numeric NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid,
  payment_id uuid,
  action text NOT NULL,
  status text,
  error_code text,
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  payment_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  refunded_at timestamp with time zone,
  refund_reason text,
  mercado_pago_payment_id text,
  installments integer DEFAULT 1,
  payer_name text,
  payer_email text,
  payer_cpf text,
  mp_order_id text,
  method text,
  status_detail text,
  total_amount numeric,
  paid_amount numeric,
  transaction_id text,
  mp_payment_id text
);

CREATE TABLE IF NOT EXISTS public.pre_arrival_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  language text DEFAULT 'pt'::text NOT NULL,
  first_sent_at timestamp with time zone,
  last_sent_at timestamp with time zone,
  answered_at timestamp with time zone,
  reminders_sent integer DEFAULT 0 NOT NULL,
  last_send_origin text,
  dietary_restrictions text[] DEFAULT '{}'::text[] NOT NULL,
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
  continuous_medication text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  preferred_language text DEFAULT 'pt'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reservation_access_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS public.reservation_experiences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  experience_name text NOT NULL,
  participants integer DEFAULT 1 NOT NULL,
  base_price_per_person numeric DEFAULT 0 NOT NULL,
  total_price numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservation_rooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reservation_id uuid NOT NULL,
  room_id uuid NOT NULL,
  room_name text,
  guests integer DEFAULT 1 NOT NULL,
  daily_rate numeric,
  subtotal numeric,
  "position" integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  room_id uuid NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL,
  total_price numeric(10,2) NOT NULL,
  status text DEFAULT 'pending'::text,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  special_requests text,
  payment_method text,
  payment_status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  room_name text,
  package_id uuid,
  cpf text,
  birth_date date,
  is_foreign boolean DEFAULT false,
  country text,
  nationality text,
  passport text,
  address text,
  next_destination text,
  dietary_restrictions text,
  emergency_contact text,
  payment_intent_id text,
  payment_qr_code text,
  payment_qr_code_base64 text,
  payment_ticket_url text,
  payer_name text,
  payer_email text,
  payer_cpf text,
  transaction_amount numeric,
  transaction_currency text DEFAULT 'BRL'::text,
  payment_reference text,
  mp_order_id text,
  mp_transaction_id text,
  accepted_terms boolean DEFAULT false,
  accepted_at timestamp with time zone,
  is_test boolean DEFAULT false,
  reservation_source text DEFAULT 'site'::text,
  operational_status text DEFAULT 'pending'::text,
  operational_notes text,
  channel_reference_id text,
  daily_rate numeric,
  checkin_completed boolean DEFAULT false,
  checkout_completed boolean DEFAULT false,
  guest_language text DEFAULT 'pt'::text NOT NULL,
  quantidade_hospede_adulto integer,
  quantidade_hospede_menor integer,
  genero text,
  documento_tipo text,
  reserva_id_fnrh uuid,
  hospede_id_fnrh uuid,
  pessoa_id_fnrh uuid,
  situacao_fnrh text,
  link_precheckin text,
  erro_sincronizacao_fnrh text,
  fnrh_checkin_em timestamp with time zone,
  fnrh_checkout_em timestamp with time zone,
  pre_checkin_email_sent boolean DEFAULT false NOT NULL,
  pre_checkin_email_sent_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  name_es text NOT NULL,
  name_fr text NOT NULL,
  description_pt text NOT NULL,
  description_en text NOT NULL,
  description_es text NOT NULL,
  description_fr text NOT NULL,
  price_per_night numeric(10,2) NOT NULL,
  max_guests integer NOT NULL,
  image_url text,
  amenities jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug text,
  name_de text NOT NULL,
  description_de text NOT NULL,
  beds jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  reservation_id uuid,
  access_type text NOT NULL,
  accessed_fields text[],
  ip_address text,
  user_agent text,
  access_method text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  module text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Chaves primarias, unicidade e validacoes
ALTER TABLE public.blocked_dates ADD CONSTRAINT blocked_dates_block_type_check CHECK ((block_type = ANY (ARRAY['maintenance'::text, 'owner_use'::text, 'exclusive'::text, 'event'::text, 'other'::text])));
ALTER TABLE public.blocked_dates ADD CONSTRAINT valid_date_range CHECK ((end_date >= start_date));
ALTER TABLE public.booking_checkouts ADD CONSTRAINT booking_checkouts_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.booking_tokens ADD CONSTRAINT booking_tokens_type_check CHECK ((type = ANY (ARRAY['checkin'::text, 'checkout'::text, 'pre_arrival'::text])));
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text])));
ALTER TABLE public.fnrh_credentials ADD CONSTRAINT fnrh_credentials_env_check CHECK ((env = ANY (ARRAY['producao'::text, 'homologacao'::text])));
ALTER TABLE public.fnrh_credentials ADD CONSTRAINT fnrh_credentials_singleton CHECK ((id = 'default'::text));
ALTER TABLE public.google_reviews_cache ADD CONSTRAINT google_reviews_cache_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.pre_arrival_responses ADD CONSTRAINT pre_arrival_origin_check CHECK (((last_send_origin IS NULL) OR (last_send_origin = ANY (ARRAY['auto'::text, 'manual'::text]))));
ALTER TABLE public.pre_arrival_responses ADD CONSTRAINT pre_arrival_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'answered'::text, 'updated'::text])));
ALTER TABLE public.reservations ADD CONSTRAINT reservations_checkout_after_checkin CHECK ((check_out > check_in));
ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text])));
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'hosted'::text, 'finished'::text, 'no-show'::text])));
ALTER TABLE public.rooms ADD CONSTRAINT rooms_max_guests_range CHECK (((max_guests >= 1) AND (max_guests <= 10)));
ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);
ALTER TABLE public.blocked_dates ADD CONSTRAINT blocked_dates_pkey PRIMARY KEY (id);
ALTER TABLE public.booking_checkins ADD CONSTRAINT booking_checkins_pkey PRIMARY KEY (id);
ALTER TABLE public.booking_checkouts ADD CONSTRAINT booking_checkouts_pkey PRIMARY KEY (id);
ALTER TABLE public.booking_tokens ADD CONSTRAINT booking_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);
ALTER TABLE public.fnrh_credentials ADD CONSTRAINT fnrh_credentials_pkey PRIMARY KEY (id);
ALTER TABLE public.gallery_images ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);
ALTER TABLE public.google_reviews_cache ADD CONSTRAINT google_reviews_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.hero_slides ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);
ALTER TABLE public.packages ADD CONSTRAINT packages_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_logs ADD CONSTRAINT payment_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.pre_arrival_responses ADD CONSTRAINT pre_arrival_responses_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);
ALTER TABLE public.reservation_access_tokens ADD CONSTRAINT reservation_access_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.reservation_experiences ADD CONSTRAINT reservation_experiences_pkey PRIMARY KEY (id);
ALTER TABLE public.reservation_rooms ADD CONSTRAINT reservation_rooms_pkey PRIMARY KEY (id);
ALTER TABLE public.reservations ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);
ALTER TABLE public.rooms ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);
ALTER TABLE public.sensitive_data_access_log ADD CONSTRAINT sensitive_data_access_log_pkey PRIMARY KEY (id);
ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.booking_tokens ADD CONSTRAINT booking_tokens_token_key UNIQUE (token);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_slug_key UNIQUE (slug);
ALTER TABLE public.gallery_images ADD CONSTRAINT gallery_images_storage_path_key UNIQUE (storage_path);
ALTER TABLE public.packages ADD CONSTRAINT packages_slug_key UNIQUE (slug);
ALTER TABLE public.pre_arrival_responses ADD CONSTRAINT pre_arrival_responses_reservation_id_key UNIQUE (reservation_id);
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_key_key UNIQUE (key);
ALTER TABLE public.reservation_access_tokens ADD CONSTRAINT reservation_access_tokens_token_key UNIQUE (token);
ALTER TABLE public.reservation_experiences ADD CONSTRAINT reservation_experiences_reservation_id_experience_id_key UNIQUE (reservation_id, experience_id);
ALTER TABLE public.rooms ADD CONSTRAINT rooms_slug_key UNIQUE (slug);
ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_user_id_module_key UNIQUE (user_id, module);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Ligacoes entre tabelas (chaves estrangeiras)
ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.blocked_dates ADD CONSTRAINT blocked_dates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.blocked_dates ADD CONSTRAINT blocked_dates_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE public.booking_checkins ADD CONSTRAINT booking_checkins_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.booking_checkouts ADD CONSTRAINT booking_checkouts_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.booking_tokens ADD CONSTRAINT booking_tokens_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;
ALTER TABLE public.fnrh_credentials ADD CONSTRAINT fnrh_credentials_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
ALTER TABLE public.gallery_images ADD CONSTRAINT gallery_images_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
ALTER TABLE public.payment_logs ADD CONSTRAINT payment_logs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE public.payment_logs ADD CONSTRAINT payment_logs_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.pre_arrival_responses ADD CONSTRAINT pre_arrival_responses_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reservation_access_tokens ADD CONSTRAINT reservation_access_tokens_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.reservation_experiences ADD CONSTRAINT reservation_experiences_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES experiences(id);
ALTER TABLE public.reservation_experiences ADD CONSTRAINT reservation_experiences_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.reservation_rooms ADD CONSTRAINT reservation_rooms_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE public.reservation_rooms ADD CONSTRAINT reservation_rooms_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id);
ALTER TABLE public.reservations ADD CONSTRAINT reservations_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Indices adicionais
CREATE INDEX idx_activity_log_action ON public.activity_log USING btree (action);
CREATE INDEX idx_activity_log_created_at ON public.activity_log USING btree (created_at DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log USING btree (entity_type, entity_id);
CREATE INDEX idx_activity_log_entity_type ON public.activity_log USING btree (entity_type);
CREATE INDEX idx_activity_log_user_id ON public.activity_log USING btree (user_id);
CREATE INDEX idx_blocked_dates_date_range ON public.blocked_dates USING btree (start_date, end_date);
CREATE INDEX idx_blocked_dates_room_id ON public.blocked_dates USING btree (room_id);
CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at DESC);
CREATE INDEX idx_email_logs_email_type_status ON public.email_logs USING btree (email_type, status);
CREATE INDEX idx_email_logs_resend_id ON public.email_logs USING btree (resend_id);
CREATE INDEX idx_email_logs_reservation_id ON public.email_logs USING btree (reservation_id);
CREATE INDEX idx_experiences_active_order ON public.experiences USING btree (is_active, display_order);
CREATE INDEX idx_gallery_active ON public.gallery_images USING btree (is_active);
CREATE INDEX idx_gallery_bungalow ON public.gallery_images USING btree (bungalow_slug);
CREATE INDEX idx_gallery_category ON public.gallery_images USING btree (category);
CREATE INDEX idx_gallery_images_compression_stats ON public.gallery_images USING gin (compression_stats);
CREATE INDEX idx_gallery_order ON public.gallery_images USING btree (display_order);
CREATE INDEX idx_payments_mp_order_id ON public.payments USING btree (mp_order_id);
CREATE INDEX idx_payments_mp_payment_id ON public.payments USING btree (mercado_pago_payment_id);
CREATE INDEX idx_payments_payment_date ON public.payments USING btree (payment_date);
CREATE INDEX idx_payments_reservation_id ON public.payments USING btree (reservation_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (status);
CREATE INDEX idx_payments_transaction_id ON public.payments USING btree (transaction_id);
CREATE INDEX idx_pre_arrival_reservation ON public.pre_arrival_responses USING btree (reservation_id);
CREATE INDEX idx_pre_arrival_status ON public.pre_arrival_responses USING btree (status);
CREATE INDEX idx_rate_limits_key ON public.rate_limits USING btree (key);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits USING btree (window_start);
CREATE INDEX idx_reservation_tokens_expires ON public.reservation_access_tokens USING btree (expires_at);
CREATE INDEX idx_reservation_tokens_reservation ON public.reservation_access_tokens USING btree (reservation_id);
CREATE INDEX idx_reservation_tokens_token ON public.reservation_access_tokens USING btree (token);
CREATE INDEX idx_reservation_experiences_reservation ON public.reservation_experiences USING btree (reservation_id);
CREATE INDEX idx_reservation_rooms_reservation ON public.reservation_rooms USING btree (reservation_id);
CREATE INDEX idx_reservation_rooms_room ON public.reservation_rooms USING btree (room_id);
CREATE INDEX idx_reservations_check_in_out ON public.reservations USING btree (check_in, check_out);
CREATE INDEX idx_reservations_is_test ON public.reservations USING btree (is_test);
CREATE INDEX idx_reservations_operational_status ON public.reservations USING btree (operational_status);
CREATE INDEX idx_reservations_package_id ON public.reservations USING btree (package_id);
CREATE INDEX idx_reservations_payment_reference ON public.reservations USING btree (payment_reference);
CREATE INDEX idx_reservations_room_id ON public.reservations USING btree (room_id);
CREATE INDEX idx_reservations_source ON public.reservations USING btree (reservation_source);
CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);
CREATE UNIQUE INDEX idx_unique_reservation ON public.reservations USING btree (room_id, check_in, check_out, guest_email) WHERE (status <> 'cancelled'::text);
CREATE INDEX idx_rooms_slug ON public.rooms USING btree (slug) WHERE (is_active = true);
CREATE INDEX idx_sensitive_access_created ON public.sensitive_data_access_log USING btree (created_at);
CREATE INDEX idx_sensitive_access_reservation ON public.sensitive_data_access_log USING btree (reservation_id);
CREATE INDEX idx_sensitive_access_user ON public.sensitive_data_access_log USING btree (user_id);
CREATE INDEX idx_user_module_permissions_user ON public.user_module_permissions USING btree (user_id);
