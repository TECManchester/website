"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Btn, BtnLink } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { recordPasswordReset } from "@/lib/actions/admin-password-reset";

type Stage = "checking" | "ready" | "invalid" | "done";

/**
 * Consumes a recovery token and sets a new password.
 *
 * The token arrives as `token_hash` and is exchanged with verifyOtp, which
 * establishes a short-lived session — that session is what authorises the
 * updateUser call underneath. Everything stays on our domain; no bouncing
 * through Supabase with tokens in the URL fragment.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenHash = params.get("token_hash");

  const [stage, setStage] = useState<Stage>(tokenHash ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A recovery token is single-use; React 18 double-invokes effects in dev and
  // a second verify would consume nothing and report failure.
  const verified = useRef(false);

  useEffect(() => {
    if (!tokenHash || verified.current) return;
    verified.current = true;

    let cancelled = false;
    createClient()
      .auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
      .then(({ error }) => {
        if (!cancelled) setStage(error ? "invalid" : "ready");
      });
    return () => {
      cancelled = true;
    };
  }, [tokenHash]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    if (password.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }

    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await recordPasswordReset();
    setStage("done");
    router.refresh();
  }

  if (stage === "checking") {
    return (
      <p className="text-grey-500 flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" /> Checking your link…
      </p>
    );
  }

  if (stage === "invalid") {
    return (
      <div>
        <h1 className="text-ink text-xl font-bold">This link won&apos;t work</h1>
        <p className="text-grey-500 mt-2 text-sm leading-relaxed">
          Reset links expire after an hour and can only be used once. Ask for a
          fresh one and it&apos;ll work.
        </p>
        <div className="mt-6">
          <BtnLink href="/admin/forgot-password" variant="green" block>
            Send a new link
          </BtnLink>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div>
        <h1 className="text-ink text-xl font-bold">Password changed</h1>
        <p className="text-grey-500 mt-2 text-sm">
          You&apos;re signed in with your new password.
        </p>
        <div className="mt-6">
          <BtnLink href="/admin" variant="green" block>
            Go to the admin
          </BtnLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-ink text-xl font-bold">Choose a new password</h1>
      <p className="text-grey-500 mt-1 mb-6 text-sm">
        At least 10 characters.
      </p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password-confirm">Confirm new password</Label>
          <Input
            id="new-password-confirm"
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
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save new password"
          )}
        </Btn>
      </form>
    </div>
  );
}
