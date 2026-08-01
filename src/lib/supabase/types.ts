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
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          dismiss_hours: number
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          dismiss_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          dismiss_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          detail: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string
          draft: Json
          id: string
          page_id: string
          published: Json | null
          sort: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft?: Json
          id?: string
          page_id: string
          published?: Json | null
          sort?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft?: Json
          id?: string
          page_id?: string
          published?: Json | null
          sort?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
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
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_name: string | null
          revoked_at: string | null
          role_id: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_name?: string | null
          revoked_at?: string | null
          role_id?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_name?: string | null
          revoked_at?: string | null
          role_id?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt: string
          bytes: number | null
          created_at: string
          created_by: string | null
          height: number | null
          id: string
          mime: string | null
          path: string
          url: string
          width: number | null
        }
        Insert: {
          alt: string
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          path: string
          url: string
          width?: number | null
        }
        Update: {
          alt?: string
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          path?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      page_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          page_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "page_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role_id: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      redirects: {
        Row: {
          created_at: string
          from_slug: string
          to_slug: string
        }
        Insert: {
          created_at?: string
          from_slug: string
          to_slug: string
        }
        Update: {
          created_at?: string
          from_slug?: string
          to_slug?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          capabilities: string[]
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
        }
        Insert: {
          capabilities?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
        }
        Update: {
          capabilities?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
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
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      current_capabilities: { Args: never; Returns: string[] }
      has_capability: { Args: { cap: string }; Returns: boolean }
      prune_rate_limits: { Args: never; Returns: undefined }
    }
    Enums: {
      profile_status: "pending" | "approved" | "rejected" | "suspended"
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
      profile_status: ["pending", "approved", "rejected", "suspended"],
      submission_status: ["new", "in_progress", "done", "archived"],
    },
  },
} as const
