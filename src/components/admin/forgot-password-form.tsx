"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/admin-password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (result.ok) setNotice(result.message);
    else setError(result.message);
  }

  return (
    <div>
      <h1 className="text-ink text-xl font-bold">Reset your password</h1>
      <p className="text-grey-500 mt-1 mb-6 text-sm">
        Enter the email address you use to sign in and we&apos;ll send you a
        link.
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-green-600 text-sm">
            {notice}
          </p>
        )}

        <Btn type="submit" variant="green" size="lg" block disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Btn>
      </form>

      <p className="text-grey-500 mt-6 text-center text-[13px]">
        <Link href="/admin/login" className="text-green-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
