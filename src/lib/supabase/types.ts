/**
 * Database types.
 *
 * Hand-written to mirror supabase/migrations/20260725000000_initial_schema.sql
 * so the app type-checks before the project is linked. Once credentials are in
 * place, replace this file wholesale with the generated version:
 *
 *   npm run db:types
 *
 * If the two ever disagree, the generated output is the truth.
 */

export type SubmissionStatus = "new" | "in_progress" | "done" | "archived";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type SermonSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
} & Timestamps;

export type Sermon = {
  id: string;
  slug: string;
  title: string;
  speaker: string | null;
  series_id: string | null;
  youtube_id: string | null;
  description: string | null;
  preached_on: string | null;
  duration_mins: number | null;
  is_published: boolean;
} & Timestamps;

export type ChurchEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_featured: boolean;
  is_published: boolean;
} & Timestamps;

export type ConnectGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  area: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  leader_name: string | null;
  is_accepting_members: boolean;
  is_published: boolean;
} & Timestamps;

export type PrayerRequest = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  request: string;
  share_with_team: boolean;
  is_urgent: boolean;
  status: SubmissionStatus;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: SubmissionStatus;
  created_at: string;
};

export type VisitPlan = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  planned_date: string | null;
  adults: number;
  children: number;
  children_ages: string | null;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
};

export type GroupJoinRequest = {
  id: string;
  group_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: SubmissionStatus;
  created_at: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

/** Columns the database fills in for us. */
type Generated = "id" | "created_at" | "updated_at";

/**
 * `Relationships` is required — supabase-js resolves a table to `never` without
 * it, which surfaces as a confusing "does not exist in type 'never[]'" error at
 * the call site rather than here.
 */
type Table<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, (Generated & keyof Row) | Optional> &
    Partial<Pick<Row, (Generated & keyof Row) | Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      sermon_series: Table<SermonSeries>;
      sermons: Table<Sermon, "is_published">;
      events: Table<ChurchEvent, "is_featured" | "is_published">;
      connect_groups: Table<
        ConnectGroup,
        "is_accepting_members" | "is_published"
      >;
      prayer_requests: Table<
        PrayerRequest,
        "share_with_team" | "is_urgent" | "status"
      >;
      contact_messages: Table<ContactMessage, "status">;
      visit_plans: Table<VisitPlan, "adults" | "children" | "status">;
      group_join_requests: Table<GroupJoinRequest, "status">;
      newsletter_subscribers: Table<
        NewsletterSubscriber,
        "confirmed_at" | "unsubscribed_at"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { submission_status: SubmissionStatus };
    CompositeTypes: Record<string, never>;
  };
};
