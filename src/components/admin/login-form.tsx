"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "request";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = createClient();

    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(
            error.message === "Invalid login credentials"
              ? "That email and password don't match."
              : error.message,
          );
          return;
        }
        router.push("/admin");
        router.refresh();
      } else {
        if (password.length < 10) {
          setError("Use at least 10 characters for your password.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) {
          // Auto-confirm is on: they're signed in, and land on the pending
          // screen until a super admin approves them.
          router.push("/admin/pending");
          router.refresh();
        } else {
          setNotice(
            "Request received. A super admin will review your access — check back after you've been approved.",
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Mode switch */}
      <div className="bg-grey-100 mb-6 flex rounded-full p-1">
        {(
          [
            ["sign-in", "Sign in"],
            ["request", "Request access"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "font-heading flex-1 rounded-full py-2.5 text-sm font-semibold transition",
              mode === value
                ? "text-ink shadow-card bg-white"
                : "text-grey-500 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <h1 className="text-ink text-xl font-bold">
        {mode === "sign-in" ? "Welcome back" : "Request admin access"}
      </h1>
      <p className="text-grey-500 mt-1 mb-6 text-sm">
        {mode === "sign-in"
          ? "Sign in to manage the site."
          : "Create an account — a super admin approves it and assigns your role."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "request" && (
          <div className="space-y-1.5">
            <Label htmlFor="login-name">Full name</Label>
            <Input
              id="login-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={mode === "request" ? 10 : undefined}
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
              <Loader2 className="size-4 animate-spin" /> Working…
            </>
          ) : mode === "sign-in" ? (
            "Sign in"
          ) : (
            "Request access"
          )}
        </Btn>
      </form>
    </div>
  );
}
