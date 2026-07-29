import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { ChurchEvent } from "@/lib/events";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("events.manage")) redirect("/admin/events");

  const { id } = await params;
  const { data: event } = await createAdminClient()
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  return (
    <>
      <p className="eyebrow">Events</p>
      <h1 className="mt-2 mb-8 text-3xl font-bold">Edit event</h1>
      <EventForm event={event as ChurchEvent} />
    </>
  );
}
