"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite } from "@/lib/actions/admin-invites";
import { createClient } from "@/lib/supabase/browser";

export function AcceptInviteForm({
  token,
  email,
  invitedName,
}: {
  token: string;
  email: string;
  invitedName: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(invitedName ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    if (password.length < 10) {
      setError("Use at least 10 characters for your password.");
      return;
    }

    setBusy(true);
    const result = await acceptInvite(token, fullName, password);
    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    // Sign them straight in — they just chose the password, so asking them to
    // type it again on a login screen is friction for no security gain.
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      router.push("/admin/login");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-ink text-xl font-bold">Set up your account</h1>
      <p className="text-grey-500 mt-1 mb-6 text-sm">
        You&apos;ve been invited to help manage the Elevation Manchester
        website. Choose a password for <b className="text-ink">{email}</b>.
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name">Your full name</Label>
          <Input
            id="invite-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-password">Choose a password</Label>
          <Input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
          />
          <p className="text-grey-500 text-xs">At least 10 characters.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-confirm">Confirm password</Label>
          <Input
            id="invite-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
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
              <Loader2 className="size-4 animate-spin" /> Setting up…
            </>
          ) : (
            "Create my account"
          )}
        </Btn>
      </form>
    </div>
  );
}
