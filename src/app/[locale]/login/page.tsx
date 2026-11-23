import { useIntlayer } from "next-intlayer/server";
import { use } from "react";
import { notFound } from "next/navigation";
import { CompanyCards } from "@/components/company/company-cards";
import { isLocale } from "@/lib/locale";

export default function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = use(params);
  if (!isLocale(locale)) notFound();
  const copy = useIntlayer("login", locale);

  return (
    <main className="mx-auto flex w-full max-w-[72rem] flex-col gap-3xl p-xl">
      <h1 className="text-xl font-semibold">{copy.title}</h1>
      <CompanyCards locale={locale} />
    </main>
  );
}
