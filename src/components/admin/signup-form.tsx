"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAccess } from "@/lib/actions/admin-signup";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await requestAccess(fullName, email, website);
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.message);
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="bg-green-100 mx-auto grid size-12 place-items-center rounded-2xl">
          <CheckCircle2 className="text-green-600 size-6" />
        </span>
        <h1 className="text-ink mt-4 text-xl font-bold">Check your email</h1>
        <p className="text-grey-500 mt-2 text-sm leading-relaxed">
          If we can set an account up for <b className="text-ink">{email}</b>,
          there&apos;s a link on its way. Click it to choose a password and
          finish signing up.
        </p>
        <p className="text-grey-500 mt-4 text-xs leading-relaxed">
          The link expires in an hour. Nothing in your junk folder? Ask the
          communications team to invite you directly.
        </p>
        <p className="mt-6">
          <Link href="/admin/login" className="text-green-600 text-sm hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-ink text-xl font-bold">Sign up</h1>
      <p className="text-grey-500 mt-1 mb-6 text-sm leading-relaxed">
        Create an account to help manage the website. We&apos;ll email you a
        link to finish setting it up.
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Your full name</Label>
          <Input
            id="signup-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {/* Honeypot — positioned off-screen, never shown to a person. */}
        <div aria-hidden className="pointer-events-none absolute -left-[9999px]">
          <label htmlFor="signup-website">Website</label>
          <input
            id="signup-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <Btn type="submit" variant="green" size="lg" block disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send me a link"
          )}
        </Btn>
      </form>

      <p className="text-grey-500 mt-6 text-center text-[13px] leading-relaxed">
        Signing up doesn&apos;t give you access to anything on its own — a super
        admin decides what you can see and do.
      </p>
      <p className="mt-3 text-center text-[13px]">
        <Link href="/admin/login" className="text-green-600 hover:underline">
          Already have an account? Sign in
        </Link>
      </p>
    </div>
  );
}
