import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";
import { isLocale } from "@/lib/locale";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AuthShell locale={locale}>
      <ForgotPasswordFlow locale={locale} />
    </AuthShell>
  );
}
