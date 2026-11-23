"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { SectorTag } from "@/components/sectors/sector-tag";
import type { Locale } from "@/lib/locale";
import type { CompanyCard } from "./company-card";

export function CompanyCards({ locale }: { locale: Locale }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CompanyCardList locale={locale} />
    </QueryClientProvider>
  );
}

function CompanyCardList({ locale }: { locale: Locale }) {
  const copy = useIntlayer("company-cards");
  const cards = useQuery({
    queryKey: ["company-cards", locale],
    queryFn: async ({ signal }): Promise<{ cards: CompanyCard[] }> => {
      const response = await fetch(`/api/company-cards?locale=${locale}`, { signal });
      if (!response.ok) throw new Error("Company cards request failed");
      return response.json();
    },
    staleTime: 300_000,
    retry: 1,
  });

  return (
    <section aria-labelledby="company-cards-heading" className="flex flex-col gap-m">
      <h2 id="company-cards-heading" className="text-m font-semibold">{copy.heading}</h2>
      {cards.isPending && <p role="status">{copy.loading}</p>}
      {cards.isError && (
        <div className="flex flex-wrap gap-s">
          <p role="status">{copy.error}</p>
          <button type="button" className="text-primary underline" onClick={() => void cards.refetch()}>
            {copy.retry}
          </button>
        </div>
      )}
      {cards.data && (
        <ul className="grid gap-m sm:grid-cols-2 lg:grid-cols-3">
          {cards.data.cards.map((card) => (
            <li key={card.id} className="glassmorphism flex flex-col gap-s rounded-m p-m">
              <div className="flex flex-wrap items-baseline justify-between gap-s">
                <h3 className="text-sm font-semibold">{card.name}</h3>
                {card.status !== "ACTIVE" && (
                  <span className="rounded-s bg-white/10 px-s py-xs text-xs">{copy.statuses[card.status]}</span>
                )}
              </div>
              <p className="text-sx text-white/80">{card.description}</p>
              <div className="flex flex-wrap gap-s">
                {card.sectors.map((sector) => (
                  <SectorTag key={sector} sector={sector} label={copy.sectors[sector].value} variant="empty-large" />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
