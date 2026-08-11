export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          block_type: string | null
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          reason: string | null
          room_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          reason?: string | null
          room_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          room_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_checkins: {
        Row: {
          accepted_terms: boolean
          address: string | null
          birth_date: string | null
          city_state: string | null
          created_at: string | null
          document: string
          estimated_arrival_time: string | null
          full_name: string | null
          id: string
          nationality: string | null
          notes: string | null
          reservation_id: string
          transport_mode: string | null
          travel_reason: string | null
        }
        Insert: {
          accepted_terms?: boolean
          address?: string | null
          birth_date?: string | null
          city_state?: string | null
          created_at?: string | null
          document: string
          estimated_arrival_time?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          notes?: string | null
          reservation_id: string
          transport_mode?: string | null
          travel_reason?: string | null
        }
        Update: {
          accepted_terms?: boolean
          address?: string | null
          birth_date?: string | null
          city_state?: string | null
          created_at?: string | null
          document?: string
          estimated_arrival_time?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          notes?: string | null
          reservation_id?: string
          transport_mode?: string | null
          travel_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_checkouts: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          issues: string | null
          rating: number
          reservation_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          issues?: string | null
          rating: number
          reservation_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          issues?: string | null
          rating?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_checkouts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checkouts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          reservation_id: string
          token: string
          type: string
          used: boolean
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reservation_id: string
          token: string
          type: string
          used?: boolean
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reservation_id?: string
          token?: string
          type?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_tokens_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tokens_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          complained_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: string
          last_event: string | null
          last_event_at: string | null
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          resend_id: string | null
          reservation_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          last_event?: string | null
          last_event_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          resend_id?: string | null
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          last_event?: string | null
          last_event_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          resend_id?: string | null
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt_text: string
          bungalow_slug: string | null
          category: string | null
          compression_stats: Json | null
          created_at: string | null
          display_order: number | null
          file_name: string
          id: string
          is_active: boolean | null
          storage_path: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text: string
          bungalow_slug?: string | null
          category?: string | null
          compression_stats?: Json | null
          created_at?: string | null
          display_order?: number | null
          file_name: string
          id?: string
          is_active?: boolean | null
          storage_path: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string
          bungalow_slug?: string | null
          category?: string | null
          compression_stats?: Json | null
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          id?: string
          is_active?: boolean | null
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      google_reviews_cache: {
        Row: {
          author_name: string
          id: string
          profile_photo_url: string | null
          rating: number
          review_date: string | null
          text: string
          updated_at: string | null
        }
        Insert: {
          author_name: string
          id?: string
          profile_photo_url?: string | null
          rating: number
          review_date?: string | null
          text: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          id?: string
          profile_photo_url?: string | null
          rating?: number
          review_date?: string | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          alt_text: string
          background_color: string | null
          created_at: string
          desktop_image_url: string
          display_order: number
          hide_overlay: boolean
          id: string
          is_active: boolean
          link_url: string | null
          media_type: string
          mobile_image_url: string | null
          object_fit: string
          title: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          background_color?: string | null
          created_at?: string
          desktop_image_url: string
          display_order?: number
          hide_overlay?: boolean
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          mobile_image_url?: string | null
          object_fit?: string
          title: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          background_color?: string | null
          created_at?: string
          desktop_image_url?: string
          display_order?: number
          hide_overlay?: boolean
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          mobile_image_url?: string | null
          object_fit?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string
          duration: string
          experiences: Json
          id: string
          inclusions: Json
          is_active: boolean
          name: string
          people: number
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration: string
          experiences?: Json
          id?: string
          inclusions?: Json
          is_active?: boolean
          name: string
          people?: number
          price: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string
          experiences?: Json
          id?: string
          inclusions?: Json
          is_active?: boolean
          name?: string
          people?: number
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          action: string
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          payment_id: string | null
          request_payload: Json | null
          reservation_id: string | null
          response_payload: Json | null
          status: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          payment_id?: string | null
          request_payload?: Json | null
          reservation_id?: string | null
          response_payload?: Json | null
          status?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          payment_id?: string | null
          request_payload?: Json | null
          reservation_id?: string | null
          response_payload?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments_user_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installments: number | null
          mercado_pago_payment_id: string | null
          method: string | null
          mp_order_id: string | null
          mp_payment_id: string | null
          paid_amount: number | null
          payer_cpf: string | null
          payer_email: string | null
          payer_name: string | null
          payment_date: string | null
          payment_method: string
          refund_reason: string | null
          refunded_at: string | null
          reservation_id: string
          status: string
          status_detail: string | null
          total_amount: number | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          installments?: number | null
          mercado_pago_payment_id?: string | null
          method?: string | null
          mp_order_id?: string | null
          mp_payment_id?: string | null
          paid_amount?: number | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id: string
          status?: string
          status_detail?: string | null
          total_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installments?: number | null
          mercado_pago_payment_id?: string | null
          method?: string | null
          mp_order_id?: string | null
          mp_payment_id?: string | null
          paid_amount?: number | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method?: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id?: string
          status?: string
          status_detail?: string | null
          total_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_arrival_responses: {
        Row: {
          additional_info: string | null
          answered_at: string | null
          arrival_mode: string | null
          children_info: string | null
          continuous_medication: string | null
          created_at: string
          dietary_restrictions: string[]
          estimated_arrival_time: string | null
          first_sent_at: string | null
          foods_to_avoid: string | null
          health_condition: string | null
          id: string
          language: string
          last_send_origin: string | null
          last_sent_at: string | null
          mobility_limitations: string | null
          reminders_sent: number
          reservation_id: string
          special_occasion: string | null
          special_occasion_detail: string | null
          status: string
          transport_needs: string | null
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          answered_at?: string | null
          arrival_mode?: string | null
          children_info?: string | null
          continuous_medication?: string | null
          created_at?: string
          dietary_restrictions?: string[]
          estimated_arrival_time?: string | null
          first_sent_at?: string | null
          foods_to_avoid?: string | null
          health_condition?: string | null
          id?: string
          language?: string
          last_send_origin?: string | null
          last_sent_at?: string | null
          mobility_limitations?: string | null
          reminders_sent?: number
          reservation_id: string
          special_occasion?: string | null
          special_occasion_detail?: string | null
          status?: string
          transport_needs?: string | null
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          answered_at?: string | null
          arrival_mode?: string | null
          children_info?: string | null
          continuous_medication?: string | null
          created_at?: string
          dietary_restrictions?: string[]
          estimated_arrival_time?: string | null
          first_sent_at?: string | null
          foods_to_avoid?: string | null
          health_condition?: string | null
          id?: string
          language?: string
          last_send_origin?: string | null
          last_sent_at?: string | null
          mobility_limitations?: string | null
          reminders_sent?: number
          reservation_id?: string
          special_occasion?: string | null
          special_occasion_detail?: string | null
          status?: string
          transport_needs?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_arrival_responses_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_arrival_responses_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          key: string
          window_start: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          key: string
          window_start?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          key?: string
          window_start?: string | null
        }
        Relationships: []
      }
      reservation_access_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          reservation_id: string
          token: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          reservation_id: string
          token: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          reservation_id?: string
          token?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_access_tokens_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_access_tokens_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_rooms: {
        Row: {
          created_at: string
          daily_rate: number | null
          guests: number
          id: string
          position: number
          reservation_id: string
          room_id: string
          room_name: string | null
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          guests?: number
          id?: string
          position?: number
          reservation_id: string
          room_id: string
          room_name?: string | null
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          guests?: number
          id?: string
          position?: number
          reservation_id?: string
          room_id?: string
          room_name?: string | null
          subtotal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          accepted_at: string | null
          accepted_terms: boolean | null
          address: string | null
          birth_date: string | null
          channel_reference_id: string | null
          check_in: string
          check_out: string
          checkin_completed: boolean | null
          checkout_completed: boolean | null
          country: string | null
          cpf: string | null
          created_at: string | null
          daily_rate: number | null
          dietary_restrictions: string | null
          documento_tipo: string | null
          emergency_contact: string | null
          erro_sincronizacao_fnrh: string | null
          fnrh_checkin_em: string | null
          fnrh_checkout_em: string | null
          genero: string | null
          guest_email: string
          guest_language: string
          guest_name: string
          guest_phone: string | null
          guests: number
          hospede_id_fnrh: string | null
          id: string
          is_foreign: boolean | null
          is_test: boolean | null
          link_precheckin: string | null
          mp_order_id: string | null
          mp_transaction_id: string | null
          nationality: string | null
          next_destination: string | null
          operational_notes: string | null
          operational_status: string | null
          package_id: string | null
          passport: string | null
          payer_cpf: string | null
          payer_email: string | null
          payer_name: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_qr_code: string | null
          payment_qr_code_base64: string | null
          payment_reference: string | null
          payment_status: string | null
          payment_ticket_url: string | null
          pessoa_id_fnrh: string | null
          quantidade_hospede_adulto: number | null
          quantidade_hospede_menor: number | null
          reserva_id_fnrh: string | null
          reservation_source: string | null
          room_id: string
          room_name: string | null
          situacao_fnrh: string | null
          special_requests: string | null
          status: string | null
          total_price: number
          transaction_amount: number | null
          transaction_currency: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_terms?: boolean | null
          address?: string | null
          birth_date?: string | null
          channel_reference_id?: string | null
          check_in: string
          check_out: string
          checkin_completed?: boolean | null
          checkout_completed?: boolean | null
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          daily_rate?: number | null
          dietary_restrictions?: string | null
          documento_tipo?: string | null
          emergency_contact?: string | null
          erro_sincronizacao_fnrh?: string | null
          fnrh_checkin_em?: string | null
          fnrh_checkout_em?: string | null
          genero?: string | null
          guest_email: string
          guest_language?: string
          guest_name: string
          guest_phone?: string | null
          guests: number
          hospede_id_fnrh?: string | null
          id?: string
          is_foreign?: boolean | null
          is_test?: boolean | null
          link_precheckin?: string | null
          mp_order_id?: string | null
          mp_transaction_id?: string | null
          nationality?: string | null
          next_destination?: string | null
          operational_notes?: string | null
          operational_status?: string | null
          package_id?: string | null
          passport?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_qr_code?: string | null
          payment_qr_code_base64?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payment_ticket_url?: string | null
          pessoa_id_fnrh?: string | null
          quantidade_hospede_adulto?: number | null
          quantidade_hospede_menor?: number | null
          reserva_id_fnrh?: string | null
          reservation_source?: string | null
          room_id: string
          room_name?: string | null
          situacao_fnrh?: string | null
          special_requests?: string | null
          status?: string | null
          total_price: number
          transaction_amount?: number | null
          transaction_currency?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_terms?: boolean | null
          address?: string | null
          birth_date?: string | null
          channel_reference_id?: string | null
          check_in?: string
          check_out?: string
          checkin_completed?: boolean | null
          checkout_completed?: boolean | null
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          daily_rate?: number | null
          dietary_restrictions?: string | null
          documento_tipo?: string | null
          emergency_contact?: string | null
          erro_sincronizacao_fnrh?: string | null
          fnrh_checkin_em?: string | null
          fnrh_checkout_em?: string | null
          genero?: string | null
          guest_email?: string
          guest_language?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          hospede_id_fnrh?: string | null
          id?: string
          is_foreign?: boolean | null
          is_test?: boolean | null
          link_precheckin?: string | null
          mp_order_id?: string | null
          mp_transaction_id?: string | null
          nationality?: string | null
          next_destination?: string | null
          operational_notes?: string | null
          operational_status?: string | null
          package_id?: string | null
          passport?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_qr_code?: string | null
          payment_qr_code_base64?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payment_ticket_url?: string | null
          pessoa_id_fnrh?: string | null
          quantidade_hospede_adulto?: number | null
          quantidade_hospede_menor?: number | null
          reserva_id_fnrh?: string | null
          reservation_source?: string | null
          room_id?: string
          room_name?: string | null
          situacao_fnrh?: string | null
          special_requests?: string | null
          status?: string | null
          total_price?: number
          transaction_amount?: number | null
          transaction_currency?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json | null
          beds: Json
          created_at: string | null
          description_de: string
          description_en: string
          description_es: string
          description_fr: string
          description_pt: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_guests: number
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          name_pt: string
          price_per_night: number
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          beds?: Json
          created_at?: string | null
          description_de: string
          description_en: string
          description_es: string
          description_fr: string
          description_pt: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_guests: number
          name_de: string
          name_en: string
          name_es: string
          name_fr: string
          name_pt: string
          price_per_night: number
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          beds?: Json
          created_at?: string | null
          description_de?: string
          description_en?: string
          description_es?: string
          description_fr?: string
          description_pt?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_guests?: number
          name_de?: string
          name_en?: string
          name_es?: string
          name_fr?: string
          name_pt?: string
          price_per_night?: number
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sensitive_data_access_log: {
        Row: {
          access_method: string | null
          access_type: string
          accessed_fields: string[] | null
          created_at: string | null
          id: string
          ip_address: string | null
          reservation_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_method?: string | null
          access_type: string
          accessed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reservation_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_method?: string | null
          access_type?: string
          accessed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reservation_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      packages_public: {
        Row: {
          description: string | null
          duration: string | null
          experiences: Json | null
          id: string | null
          inclusions: Json | null
          name: string | null
          people: number | null
          price: number | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          duration?: string | null
          experiences?: Json | null
          id?: string | null
          inclusions?: Json | null
          name?: string | null
          people?: number | null
          price?: number | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          duration?: string | null
          experiences?: Json | null
          id?: string | null
          inclusions?: Json | null
          name?: string | null
          people?: number | null
          price?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      payments_user_view: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string | null
          payment_method: string | null
          reservation_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          payment_method?: string | null
          reservation_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          payment_method?: string | null
          reservation_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_public_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations_public_summary: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          guest_email_masked: string | null
          guest_name_masked: string | null
          guests: number | null
          id: string | null
          payment_status: string | null
          room_id: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          guest_email_masked?: never
          guest_name_masked?: never
          guests?: number | null
          id?: string | null
          payment_status?: never
          room_id?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          guest_email_masked?: never
          guest_name_masked?: never
          guests?: number | null
          id?: string | null
          payment_status?: never
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_reservation_token: {
        Args: { _reservation_id: string }
        Returns: string
      }
      get_current_user_email: { Args: never; Returns: string }
      get_pre_arrival_admin: {
        Args: { _reservation_id: string }
        Returns: {
          additional_info: string
          answered_at: string
          arrival_mode: string
          can_view_health: boolean
          children_info: string
          continuous_medication: string
          dietary_restrictions: string[]
          estimated_arrival_time: string
          first_sent_at: string
          foods_to_avoid: string
          health_condition: string
          language: string
          last_send_origin: string
          last_sent_at: string
          mobility_limitations: string
          reminders_sent: number
          reservation_id: string
          special_occasion: string
          special_occasion_detail: string
          status: string
          transport_needs: string
          updated_at: string
        }[]
      }
      get_pre_arrival_by_token: {
        Args: { _token: string }
        Returns: {
          additional_info: string
          answered_at: string
          arrival_mode: string
          check_in: string
          check_out: string
          children_info: string
          continuous_medication: string
          dietary_restrictions: string[]
          estimated_arrival_time: string
          foods_to_avoid: string
          guest_language: string
          guest_name: string
          guests: number
          health_condition: string
          mobility_limitations: string
          reservation_code: string
          reservation_id: string
          rooms_summary: string
          special_occasion: string
          special_occasion_detail: string
          status: string
          transport_needs: string
        }[]
      }
      get_public_reservation_summary: {
        Args: { p_room_id?: string }
        Returns: {
          check_in: string
          check_out: string
          room_id: string
          status: string
        }[]
      }
      get_reservation_safe_with_token: {
        Args: { _reservation_id: string; _token: string }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          guests: number
          id: string
          payment_status: string
          room_name: string
          status: string
          total_price: number
        }[]
      }
      get_reservation_with_token: {
        Args: { _reservation_id: string; _token: string }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          payment_method: string
          payment_status: string
          room_id: string
          room_name: string
          special_requests: string
          status: string
          total_price: number
        }[]
      }
      get_room_availability: {
        Args: { p_room_id: string }
        Returns: {
          check_in: string
          check_out: string
          status: string
        }[]
      }
      get_room_availability_with_blocks: {
        Args: { p_room_id: string }
        Returns: {
          block_type: string
          check_in: string
          check_out: string
          is_blocked: boolean
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      submit_checkin:
        | {
            Args: {
              p_accepted_terms: boolean
              p_document: string
              p_estimated_arrival: string
              p_notes: string
              p_reservation_id: string
              p_token?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_accepted_terms: boolean
              p_address?: string
              p_birth_date?: string
              p_city_state?: string
              p_document: string
              p_estimated_arrival: string
              p_full_name?: string
              p_nationality?: string
              p_notes: string
              p_reservation_id: string
              p_token?: string
              p_transport_mode?: string
              p_travel_reason?: string
            }
            Returns: boolean
          }
      submit_checkout: {
        Args: {
          p_comment: string
          p_issues: string
          p_rating: number
          p_reservation_id: string
          p_token?: string
        }
        Returns: boolean
      }
      submit_pre_arrival: {
        Args: {
          _additional_info?: string
          _arrival_mode?: string
          _children_info?: string
          _continuous_medication?: string
          _dietary_restrictions?: string[]
          _estimated_arrival_time?: string
          _foods_to_avoid?: string
          _health_condition?: string
          _language?: string
          _mobility_limitations?: string
          _special_occasion?: string
          _special_occasion_detail?: string
          _token: string
          _transport_needs?: string
        }
        Returns: {
          is_update: boolean
          reservation_id: string
          status: string
        }[]
      }
      validate_booking_token: {
        Args: { p_token: string; p_type: string }
        Returns: {
          check_in: string
          check_out: string
          checkin_completed: boolean
          checkout_completed: boolean
          guest_name: string
          guests: number
          reservation_id: string
          room_name: string
        }[]
      }
      validate_reservation_for_guest: {
        Args: { p_email: string; p_reservation_id: string }
        Returns: {
          check_in: string
          check_out: string
          checkin_completed: boolean
          checkout_completed: boolean
          guest_name: string
          guests: number
          id: string
          room_name: string
        }[]
      }
      validate_reservation_token: {
        Args: { _reservation_id: string; _token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      reservation_source_type:
        | "site"
        | "whatsapp"
        | "booking"
        | "airbnb"
        | "agency"
        | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "user"],
      reservation_source_type: [
        "site",
        "whatsapp",
        "booking",
        "airbnb",
        "agency",
        "manual",
      ],
    },
  },
} as const
