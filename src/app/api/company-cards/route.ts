import { getCompanyCards } from "@/lib/company-cards.server";
import { defaultLocale, isLocale } from "@/lib/locale";

export function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") ?? defaultLocale;
  if (!isLocale(locale)) {
    return Response.json({ error: "UNSUPPORTED_LOCALE" }, { status: 400 });
  }

  return Response.json({ cards: getCompanyCards(locale) });
}
