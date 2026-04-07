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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          balance_cents: number | null
          commission_rate: number | null
          created_at: string | null
          document: string | null
          followers_count: number | null
          full_name: string | null
          id: string
          instagram_handle: string | null
          niche: string | null
          pix_key: string | null
          ref_code: string | null
          status: string | null
          total_earned_cents: number | null
          user_id: string | null
        }
        Insert: {
          balance_cents?: number | null
          commission_rate?: number | null
          created_at?: string | null
          document?: string | null
          followers_count?: number | null
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          niche?: string | null
          pix_key?: string | null
          ref_code?: string | null
          status?: string | null
          total_earned_cents?: number | null
          user_id?: string | null
        }
        Update: {
          balance_cents?: number | null
          commission_rate?: number | null
          created_at?: string | null
          document?: string | null
          followers_count?: number | null
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          niche?: string | null
          pix_key?: string | null
          ref_code?: string | null
          status?: string | null
          total_earned_cents?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          affiliate_commission_cents: number | null
          affiliate_id: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          payment_status: string | null
          platform_fee_cents: number | null
          price_cents: number | null
          ref_code: string | null
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_commission_cents?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id: string
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string | null
          platform_fee_cents?: number | null
          price_cents?: number | null
          ref_code?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_commission_cents?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string | null
          platform_fee_cents?: number | null
          price_cents?: number | null
          ref_code?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          patient_name: string | null
          rating: number | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id: string
          patient_name?: string | null
          rating?: number | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_name?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          accepts_online: boolean | null
          accepts_presential: boolean | null
          address: string | null
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          calendar_link: string | null
          city: string | null
          consultation_duration: number | null
          consultation_price: number | null
          created_at: string | null
          crm_number: string | null
          crm_state: string | null
          education: string | null
          experience_years: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          plan: string | null
          slug: string | null
          specialty: string | null
          state: string | null
          tags: string[] | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepts_online?: boolean | null
          accepts_presential?: boolean | null
          address?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          calendar_link?: string | null
          city?: string | null
          consultation_duration?: number | null
          consultation_price?: number | null
          created_at?: string | null
          crm_number?: string | null
          crm_state?: string | null
          education?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          plan?: string | null
          slug?: string | null
          specialty?: string | null
          state?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepts_online?: boolean | null
          accepts_presential?: boolean | null
          address?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          calendar_link?: string | null
          city?: string | null
          consultation_duration?: number | null
          consultation_price?: number | null
          created_at?: string | null
          crm_number?: string | null
          crm_state?: string | null
          education?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          plan?: string | null
          slug?: string | null
          specialty?: string | null
          state?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          affiliate_id: string | null
          amount_cents: number | null
          created_at: string | null
          id: string
          pix_key: string | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount_cents?: number | null
          created_at?: string | null
          id: string
          pix_key?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount_cents?: number | null
          created_at?: string | null
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          affiliate_id: string | null
          appointment_id: string | null
          city_filter: string | null
          converted: boolean | null
          created_at: string | null
          doctor_id: string | null
          id: string
          ip_hash: string | null
          landing_page: string | null
          source_url: string | null
          specialty_filter: string | null
        }
        Insert: {
          affiliate_id?: string | null
          appointment_id?: string | null
          city_filter?: string | null
          converted?: boolean | null
          created_at?: string | null
          doctor_id?: string | null
          id: string
          ip_hash?: string | null
          landing_page?: string | null
          source_url?: string | null
          specialty_filter?: string | null
        }
        Update: {
          affiliate_id?: string | null
          appointment_id?: string | null
          city_filter?: string | null
          converted?: boolean | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          source_url?: string | null
          specialty_filter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_clicks_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "affiliate" | "patient"
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
      app_role: ["admin", "doctor", "affiliate", "patient"],
    },
  },
} as const
