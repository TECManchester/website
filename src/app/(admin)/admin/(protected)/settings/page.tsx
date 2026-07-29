import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminContext } from "@/lib/admin/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("settings.edit")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include settings.
        </p>
      </div>
    );
  }

  const s = await getSettings();

  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 text-3xl font-bold">Site settings</h1>
      <p className="text-grey-500 mt-2 mb-8">
        The details the whole site is built from. Change something once and it
        updates everywhere it appears.
      </p>
      <SettingsForm
        initial={{
          church: s.church,
          service: s.service,
          location: {
            venue: s.location.venue,
            campus: s.location.campus,
            city: s.location.city,
            postcode: s.location.postcode,
            mapsQuery: s.location.mapsQuery,
          },
          contact: s.contact,
          socials: s.socials,
          giving: s.giving,
          hero: s.hero,
        }}
      />
    </>
  );
}
