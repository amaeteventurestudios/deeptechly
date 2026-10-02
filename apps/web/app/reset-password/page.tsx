import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Set New Password | DeepTechly",
  description: "Set a new password for your DeepTechly account."
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const { code } = await searchParams;

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Account Recovery
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Set a new password.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <Suspense fallback={null}>
            <ResetPasswordForm code={code} />
          </Suspense>
        </div>
      </section>
    </PageShell>
  );
}
