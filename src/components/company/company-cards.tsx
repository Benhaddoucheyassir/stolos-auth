"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { SectorTag } from "@/components/sectors/sector-tag";
import type { Locale } from "@/lib/locale";
import type { CompanyCard } from "./company-card";
import "./company-cards.css";

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
    <section aria-labelledby="company-cards-heading">
      <h2 id="company-cards-heading" className="sr-only">{copy.heading}</h2>
      {cards.isPending && <p className="stolos-company-feedback" role="status">{copy.loading}</p>}
      {cards.isError && (
        <div className="stolos-company-feedback flex flex-wrap gap-s">
          <p role="status">{copy.error}</p>
          <button type="button" className="text-primary underline" onClick={() => void cards.refetch()}>
            {copy.retry}
          </button>
        </div>
      )}
      {cards.data && (
        <ul className="stolos-company-list">
          {cards.data.cards.map((card) => (
            <li key={card.id} data-company={card.id} className="stolos-company-card">
              <Image src="/auth/doctolib.png" width={300} height={300} alt="" className="stolos-company-watermark" unoptimized />
              <div className="stolos-company-content">
                <div className="flex items-start justify-between">
                  <h3 className="flex items-center gap-sm text-ms font-bold">
                    <Image src="/auth/doctolib.png" width={38} height={38} alt="" className="rounded-full bg-[#1379cd] p-xs" unoptimized />
                    {card.name}
                  </h3>
                  {card.status !== "ACTIVE" && (
                    <span className={`rounded-xs px-s py-xs text-xs font-medium ${card.status === "ACQUIRED" ? "bg-warning-50 text-warning" : "bg-danger-50 text-[#e75261]"}`}>
                      {copy.statuses[card.status]}
                    </span>
                  )}
                </div>
                <p className="mt-sm max-w-[378px] text-xs-plus leading-[18px]">{card.description}</p>
                <div className="mt-m flex gap-[26px]">
                  {card.sectors.map((sector) => (
                    <SectorTag key={sector} sector={sector} label={copy.sectors[sector].value} isMonochrome />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
