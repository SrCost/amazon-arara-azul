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
          payer_cpf: string | null
          payer_email: string | null
          payer_name: string | null
          payment_date: string | null
          payment_method: string
          refund_reason: string | null
          refunded_at: string | null
          reservation_id: string
          status: string
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
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id: string
          status?: string
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
          payer_cpf?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date?: string | null
          payment_method?: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id?: string
          status?: string
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
      reservations: {
        Row: {
          address: string | null
          birth_date: string | null
          check_in: string
          check_out: string
          country: string | null
          cpf: string | null
          created_at: string | null
          dietary_restrictions: string | null
          emergency_contact: string | null
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          id: string
          is_foreign: boolean | null
          nationality: string | null
          next_destination: string | null
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
          room_id: string
          room_name: string | null
          special_requests: string | null
          status: string | null
          total_price: number
          transaction_amount: number | null
          transaction_currency: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          check_in: string
          check_out: string
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          emergency_contact?: string | null
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests: number
          id?: string
          is_foreign?: boolean | null
          nationality?: string | null
          next_destination?: string | null
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
          room_id: string
          room_name?: string | null
          special_requests?: string | null
          status?: string | null
          total_price: number
          transaction_amount?: number | null
          transaction_currency?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          check_in?: string
          check_out?: string
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          emergency_contact?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          id?: string
          is_foreign?: boolean | null
          nationality?: string | null
          next_destination?: string | null
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
          room_id?: string
          room_name?: string | null
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
          created_at: string | null
          description_en: string
          description_es: string
          description_fr: string
          description_pt: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_guests: number
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
          created_at?: string | null
          description_en: string
          description_es: string
          description_fr: string
          description_pt: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_guests: number
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
          created_at?: string | null
          description_en?: string
          description_es?: string
          description_fr?: string
          description_pt?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_guests?: number
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
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      generate_reservation_token: {
        Args: { _reservation_id: string }
        Returns: string
      }
      get_current_user_email: { Args: never; Returns: string }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_reservation_token: {
        Args: { _reservation_id: string; _token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
    },
  },
} as const
