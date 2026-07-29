import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("events.manage")) redirect("/admin/events");

  return (
    <>
      <p className="eyebrow">Events</p>
      <h1 className="mt-2 mb-8 text-3xl font-bold">New event</h1>
      <EventForm />
    </>
  );
}
