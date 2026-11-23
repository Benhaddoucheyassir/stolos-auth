import { notFound } from "next/navigation";
import { useIntlayer } from "next-intlayer/server";
import { Suspense, use } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isLocale, type Locale } from "@/lib/locale";

type SearchParams = Promise<{ token?: string | string[]; error?: string | string[] }>;

export default function ResetPasswordPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = use(params);
  if (!isLocale(locale)) notFound();
  const copy = useIntlayer("password-reset", locale);

  return (
    <AuthShell locale={locale}>
      <Suspense fallback={<AuthPanel data-auth-view="reset-password"><p role="status">{copy.checking.value}</p></AuthPanel>}>
        <ResetPasswordContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetPasswordContent({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  const { token, error } = await searchParams;
  const validInput = typeof token === "string" && token.trim().length > 0 && error === undefined;

  return <ResetPasswordForm key={validInput ? token : "invalid"} locale={locale} token={validInput ? token : null} />;
}
