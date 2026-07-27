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
      connect_groups: {
        Row: {
          area: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_accepting_members: boolean
          is_published: boolean
          leader_name: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_accepting_members?: boolean
          is_published?: boolean
          leader_name?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_accepting_members?: boolean
          is_published?: boolean
          leader_name?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["submission_status"]
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          subject?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          slug: string
          starts_at: string
          summary: string | null
          time_tbc: boolean
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          slug: string
          starts_at: string
          summary?: string | null
          time_tbc?: boolean
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          slug?: string
          starts_at?: string
          summary?: string | null
          time_tbc?: boolean
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      gift_aid_declarations: {
        Row: {
          address_line1: string
          address_line2: string | null
          cancelled_at: string | null
          city: string | null
          covers_future_donations: boolean
          covers_past_four_years: boolean
          created_at: string
          declaration_accepted: boolean
          declaration_text: string
          declaration_version: string
          declared_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          postcode: string
          title: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          cancelled_at?: string | null
          city?: string | null
          covers_future_donations?: boolean
          covers_past_four_years?: boolean
          created_at?: string
          declaration_accepted?: boolean
          declaration_text: string
          declaration_version: string
          declared_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          postcode: string
          title?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          cancelled_at?: string | null
          city?: string | null
          covers_future_donations?: boolean
          covers_past_four_years?: boolean
          created_at?: string
          declaration_accepted?: boolean
          declaration_text?: string
          declaration_version?: string
          declared_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          postcode?: string
          title?: string | null
        }
        Relationships: []
      }
      group_join_requests: {
        Row: {
          created_at: string
          email: string
          group_id: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "connect_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_urgent: boolean
          name: string | null
          phone: string | null
          request: string
          share_with_team: boolean
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_urgent?: boolean
          name?: string | null
          phone?: string | null
          request: string
          share_with_team?: boolean
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_urgent?: boolean
          name?: string | null
          phone?: string | null
          request?: string
          share_with_team?: boolean
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: []
      }
      sermon_series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          created_at: string
          description: string | null
          duration_mins: number | null
          id: string
          is_published: boolean
          preached_on: string | null
          series_id: string | null
          slug: string
          speaker: string | null
          title: string
          updated_at: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_mins?: number | null
          id?: string
          is_published?: boolean
          preached_on?: string | null
          series_id?: string | null
          slug: string
          speaker?: string | null
          title: string
          updated_at?: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_mins?: number | null
          id?: string
          is_published?: boolean
          preached_on?: string | null
          series_id?: string | null
          slug?: string
          speaker?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "sermon_series"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_plans: {
        Row: {
          adults: number
          children: number
          children_ages: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          planned_date: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          adults?: number
          children?: number
          children_ages?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          planned_date?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          adults?: number
          children?: number
          children_ages?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          planned_date?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      submission_status: "new" | "in_progress" | "done" | "archived"
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
      submission_status: ["new", "in_progress", "done", "archived"],
    },
  },
} as const
