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
      bookings: {
        Row: {
          address: string
          amount: number
          cooperative_id: string | null
          created_at: string
          customer_id: string
          customer_name: string
          detail: string
          id: string
          lat: number | null
          lng: number | null
          paid: boolean
          place_id: string | null
          scheduled_date: string
          service: string
          slot: string
          status: Database["public"]["Enums"]["booking_status"]
          worker_id: string | null
        }
        Insert: {
          address?: string
          amount?: number
          cooperative_id?: string | null
          created_at?: string
          customer_id: string
          customer_name?: string
          detail?: string
          id?: string
          lat?: number | null
          lng?: number | null
          paid?: boolean
          place_id?: string | null
          scheduled_date?: string
          service: string
          slot?: string
          status?: Database["public"]["Enums"]["booking_status"]
          worker_id?: string | null
        }
        Update: {
          address?: string
          amount?: number
          cooperative_id?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          detail?: string
          id?: string
          lat?: number | null
          lng?: number | null
          paid?: boolean
          place_id?: string | null
          scheduled_date?: string
          service?: string
          slot?: string
          status?: Database["public"]["Enums"]["booking_status"]
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperatives: {
        Row: {
          admin_id: string
          assignment_rule: string
          auto_approve: boolean
          categories: string[]
          city: string
          created_at: string
          id: string
          name: string
          payment_share: number
          registration: string | null
        }
        Insert: {
          admin_id: string
          assignment_rule?: string
          auto_approve?: boolean
          categories?: string[]
          city?: string
          created_at?: string
          id?: string
          name: string
          payment_share?: number
          registration?: string | null
        }
        Update: {
          admin_id?: string
          assignment_rule?: string
          auto_approve?: boolean
          categories?: string[]
          city?: string
          created_at?: string
          id?: string
          name?: string
          payment_share?: number
          registration?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          rating: number
          service: string
          worker_id: string
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          customer_id: string
          customer_name?: string
          id?: string
          rating: number
          service?: string
          worker_id: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          rating?: number
          service?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
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
      worker_profiles: {
        Row: {
          about: string
          accepting: boolean
          area: string
          base_address: string
          base_lat: number | null
          base_lng: number | null
          category_id: string
          city: string
          cooperative_id: string | null
          created_at: string
          experience: number
          full_name: string
          jobs_count: number
          languages: string[]
          membership_status: string
          rate: number
          rating: number
          reviews_count: number
          service_areas: string[]
          service_radius_km: number
          skills: string[]
          time_slots: string[]
          trade: string
          user_id: string
          verified: boolean
          work_days: string[]
        }
        Insert: {
          about?: string
          accepting?: boolean
          area?: string
          base_address?: string
          base_lat?: number | null
          base_lng?: number | null
          category_id?: string
          city?: string
          cooperative_id?: string | null
          created_at?: string
          experience?: number
          full_name?: string
          jobs_count?: number
          languages?: string[]
          membership_status?: string
          rate?: number
          rating?: number
          reviews_count?: number
          service_areas?: string[]
          service_radius_km?: number
          skills?: string[]
          time_slots?: string[]
          trade?: string
          user_id: string
          verified?: boolean
          work_days?: string[]
        }
        Update: {
          about?: string
          accepting?: boolean
          area?: string
          base_address?: string
          base_lat?: number | null
          base_lng?: number | null
          category_id?: string
          city?: string
          cooperative_id?: string | null
          created_at?: string
          experience?: number
          full_name?: string
          jobs_count?: number
          languages?: string[]
          membership_status?: string
          rate?: number
          rating?: number
          reviews_count?: number
          service_areas?: string[]
          service_radius_km?: number
          skills?: string[]
          time_slots?: string[]
          trade?: string
          user_id?: string
          verified?: boolean
          work_days?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "coop_admin"
      booking_status:
        | "requested"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["customer", "provider", "coop_admin"],
      booking_status: [
        "requested",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
