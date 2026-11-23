import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { useIntlayer } from "next-intlayer/server";
import { Suspense, use } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/locale";

export default function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  if (!isLocale(locale)) notFound();
  const copy = useIntlayer("auth-card", locale);

  return (
    <main className="mx-auto w-full max-w-[36rem] p-xl">
      <Suspense fallback={<p role="status">{copy.checking.value}</p>}>
        <SignedIn locale={locale} heading={copy.signedIn.value} />
      </Suspense>
    </main>
  );
}

async function SignedIn({ locale, heading }: { locale: Locale; heading: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);

  return (
    <section className="glassmorphism flex flex-col gap-s rounded-m p-xl">
      <h1 className="text-m font-semibold">{heading}</h1>
      <p>{session.user.email}</p>
      <SignOutButton locale={locale} />
    </section>
  );
}
