import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { isLocale } from "@/lib/locale";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AuthShell locale={locale}>
      <AuthCard locale={locale} />
    </AuthShell>
  );
}
