"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { MediaPicker } from "@/components/admin/media-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  saveSettings,
  type SettingsPayload,
} from "@/lib/actions/admin-settings";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-grey-100 rounded-2xl border bg-white p-6">
      <h2 className="font-heading text-ink text-lg font-bold">{title}</h2>
      {hint && <p className="text-grey-500 mt-1 text-sm">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  id,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-grey-500 text-xs">{hint}</p>}
    </div>
  );
}

const FOCAL_OPTIONS = [
  { value: "object-center", label: "Centre" },
  { value: "object-[62%_32%]", label: "Right of centre" },
  { value: "object-[70%_30%]", label: "Right" },
] as const;

export function SettingsForm({ initial }: { initial: SettingsPayload }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof SettingsPayload>(
    key: K,
    value: SettingsPayload[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await saveSettings(form);
    setBusy(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  const moveSlide = (index: number, delta: number) => {
    const next = [...form.hero];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("hero", next);
  };

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-6">
      <Section title="Church identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="st-name" label="Name" value={form.church.name}
            onChange={(v) => set("church", { ...form.church, name: v })} />
          <TextField id="st-short" label="Short name" value={form.church.shortName}
            onChange={(v) => set("church", { ...form.church, shortName: v })} />
          <TextField id="st-tagline" label="Tagline" value={form.church.tagline}
            onChange={(v) => set("church", { ...form.church, tagline: v })} />
          <TextField id="st-charity" label="Charity number" value={form.church.charityNumber}
            onChange={(v) => set("church", { ...form.church, charityNumber: v })}
            hint="Shown in the footer and on the Give page." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-mission">Mission statement</Label>
          <Textarea id="st-mission" rows={3} value={form.church.mission}
            onChange={(e) => set("church", { ...form.church, mission: e.target.value })} />
        </div>
      </Section>

      <Section title="Sunday service">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="st-day" label="Day" value={form.service.day}
            onChange={(v) => set("service", { ...form.service, day: v })} />
          <TextField id="st-time" label="Start time" value={form.service.startTime}
            onChange={(v) => set("service", { ...form.service, startTime: v })} />
          <TextField id="st-doors" label="Doors open (optional)"
            value={form.service.doorsOpen ?? ""}
            onChange={(v) => set("service", { ...form.service, doorsOpen: v || null })}
            hint="Leave blank to hide." />
        </div>
      </Section>

      <Section
        title="Address"
        hint="Changing this updates every page it appears on — homepage, footer, contact, events, maps."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="st-venue" label="Venue / building" value={form.location.venue}
            onChange={(v) => set("location", { ...form.location, venue: v })} />
          <TextField id="st-campus" label="Campus / area" value={form.location.campus}
            onChange={(v) => set("location", { ...form.location, campus: v })} />
          <TextField id="st-city" label="City" value={form.location.city}
            onChange={(v) => set("location", { ...form.location, city: v })} />
          <TextField id="st-postcode" label="Postcode" value={form.location.postcode}
            onChange={(v) => set("location", { ...form.location, postcode: v })} />
        </div>
        <TextField id="st-maps" label="Google Maps search"
          value={form.location.mapsQuery}
          onChange={(v) => set("location", { ...form.location, mapsQuery: v })}
          hint="What gets searched when someone taps 'Get directions'." />
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="st-email" label="Email" value={form.contact.email}
            onChange={(v) => set("contact", { ...form.contact, email: v })} />
          <TextField id="st-phone" label="Phone (shown)" value={form.contact.phone.label}
            onChange={(v) => set("contact", { ...form.contact, phone: { ...form.contact.phone, label: v } })} />
          <TextField id="st-tel" label="Phone (dialled)" value={form.contact.phone.tel}
            onChange={(v) => set("contact", { ...form.contact, phone: { ...form.contact.phone, tel: v } })}
            hint="International format, e.g. +447469062220" />
        </div>
      </Section>

      <Section title="Social media">
        {form.socials.map((social, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <TextField id={`st-soc-name-${i}`} label="Platform" value={social.name}
                onChange={(v) => {
                  const next = [...form.socials];
                  next[i] = { ...social, name: v };
                  set("socials", next);
                }} />
            </div>
            <div className="w-48">
              <TextField id={`st-soc-handle-${i}`} label="Handle" value={social.handle}
                onChange={(v) => {
                  const next = [...form.socials];
                  next[i] = { ...social, handle: v };
                  set("socials", next);
                }} />
            </div>
            <div className="min-w-64 flex-1">
              <TextField id={`st-soc-href-${i}`} label="Link" value={social.href}
                onChange={(v) => {
                  const next = [...form.socials];
                  next[i] = { ...social, href: v };
                  set("socials", next);
                }} />
            </div>
            <Btn type="button" variant="ghost"
              onClick={() => set("socials", form.socials.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" />
            </Btn>
          </div>
        ))}
        <Btn type="button" variant="ghost"
          onClick={() => set("socials", [...form.socials, { name: "", handle: "", href: "" }])}>
          <Plus className="size-4" /> Add platform
        </Btn>
      </Section>

      <Section title="Giving">
        <TextField id="st-paypal" label="PayPal donation link" value={form.giving.paypalUrl}
          onChange={(v) => set("giving", { ...form.giving, paypalUrl: v })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="st-bank-name" label="Account name" value={form.giving.bank.accountName}
            onChange={(v) => set("giving", { ...form.giving, bank: { ...form.giving.bank, accountName: v } })} />
          <TextField id="st-bank-no" label="Account number" value={form.giving.bank.accountNumber}
            onChange={(v) => set("giving", { ...form.giving, bank: { ...form.giving.bank, accountNumber: v } })} />
          <TextField id="st-sort" label="Sort code" value={form.giving.bank.sortCode}
            onChange={(v) => set("giving", { ...form.giving, bank: { ...form.giving.bank, sortCode: v } })} />
        </div>
        <TextField id="st-cheque" label="Cheques payable to" value={form.giving.chequePayableTo}
          onChange={(v) => set("giving", { ...form.giving, chequePayableTo: v })} />
      </Section>

      <Section
        title="Homepage banner"
        hint="The rotating full-screen images. Order here is the order they play."
      >
        <div className="space-y-4">
          {form.hero.map((slide, i) => (
            <div key={i} className="border-grey-100 flex flex-wrap items-start gap-4 rounded-xl border p-4">
              {slide.src ? (
                <div className="bg-grey-100 relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                  <Image src={slide.src} alt={slide.alt} fill sizes="128px" className="object-cover" />
                </div>
              ) : (
                <MediaPicker
                  label=""
                  value={null}
                  onChange={(url, alt) => {
                    const next = [...form.hero];
                    next[i] = { ...slide, src: url ?? "", alt: slide.alt || alt };
                    set("hero", next);
                  }}
                />
              )}
              <div className="min-w-56 flex-1 space-y-2">
                <Input
                  value={slide.alt}
                  onChange={(e) => {
                    const next = [...form.hero];
                    next[i] = { ...slide, alt: e.target.value };
                    set("hero", next);
                  }}
                  placeholder="Describe the image (alt text)"
                  aria-label={`Slide ${i + 1} description`}
                />
                <select
                  value={slide.focal ?? "object-center"}
                  onChange={(e) => {
                    const next = [...form.hero];
                    next[i] = { ...slide, focal: e.target.value };
                    set("hero", next);
                  }}
                  aria-label={`Slide ${i + 1} focal point`}
                  className="border-grey-300 h-9 rounded-lg border bg-white px-2.5 text-sm"
                >
                  {FOCAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Focus: {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1">
                <Btn type="button" variant="ghost" onClick={() => moveSlide(i, -1)} aria-label="Move up">
                  <ArrowUp className="size-4" />
                </Btn>
                <Btn type="button" variant="ghost" onClick={() => moveSlide(i, 1)} aria-label="Move down">
                  <ArrowDown className="size-4" />
                </Btn>
                <Btn type="button" variant="ghost"
                  onClick={() => set("hero", form.hero.filter((_, j) => j !== i))}
                  aria-label="Remove slide">
                  <Trash2 className="size-4" />
                </Btn>
              </div>
            </div>
          ))}
          <Btn type="button" variant="ghost"
            onClick={() => set("hero", [...form.hero, { src: "", alt: "", focal: "object-center", preTreated: false }])}>
            <Plus className="size-4" /> Add slide
          </Btn>
        </div>
      </Section>

      <div className="sticky bottom-4">
        <Btn type="submit" variant="green" size="lg" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save all settings"
          )}
        </Btn>
      </div>
    </form>
  );
}
