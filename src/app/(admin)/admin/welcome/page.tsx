import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { WelcomeForm } from "@/components/admin/welcome-form";

export const metadata: Metadata = {
  title: "Finish signing up",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <main className="bg-ink relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <span className="brand-glow top-[-180px] right-[-120px] size-[560px]" />
      <span className="brand-glow bottom-[-220px] left-[-140px] size-[480px] opacity-60" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo tone="white" />
        </div>
        <div className="shadow-card-lg rounded-2xl bg-white p-8">
          {/* useSearchParams needs a boundary or the route bails to CSR. */}
          <Suspense fallback={null}>
            <WelcomeForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
