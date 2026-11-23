import { notFound } from "next/navigation";
import { IntlayerProvider } from "next-intlayer/server";
import { Document } from "../document";
import { isLocale, locales } from "@/lib/locale";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Document lang={locale}>
      <IntlayerProvider locale={locale}>{children}</IntlayerProvider>
    </Document>
  );
}
