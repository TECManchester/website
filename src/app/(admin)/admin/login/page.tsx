import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="bg-ink relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <span className="brand-glow top-[-180px] right-[-120px] size-[560px]" />
      <span className="brand-glow bottom-[-220px] left-[-140px] size-[480px] opacity-60" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo tone="white" />
        </div>

        <div className="shadow-card-lg rounded-2xl bg-white p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[13px] text-white/50">
          Staff area. Access requests need approval from a super admin.
        </p>
      </div>
    </main>
  );
}
