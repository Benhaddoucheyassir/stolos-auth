import "server-only";
import type { CompanyCard } from "@/components/company/company-card";
import type { Locale } from "./locale";

const companies: readonly (Omit<CompanyCard, "description"> & {
  description: Record<Locale, string>;
})[] = [
  {
    id: "sillage",
    name: "Sillage",
    description: {
      en: "Route planning software for urban fleets.",
      fr: "Logiciel de planification d’itinéraires pour les flottes urbaines.",
    },
    sectors: ["SOFTWARE", "TRANSPORT"],
    status: "ACTIVE",
  },
  {
    id: "solstice",
    name: "Solstice",
    description: {
      en: "Solar charging stations for shared vehicles.",
      fr: "Bornes de recharge solaire pour les véhicules partagés.",
    },
    sectors: ["ENERGY", "ECOLOGY"],
    status: "ACQUIRED",
  },
  {
    id: "atlas",
    name: "Atlas",
    description: {
      en: "Cargo bikes and equipment for local deliveries.",
      fr: "Vélos cargos et équipements pour la livraison de proximité.",
    },
    sectors: ["TRANSPORT", "INDUSTRY"],
    status: "CLOSED",
  },
];

export function getCompanyCards(locale: Locale): CompanyCard[] {
  return companies.map(({ description, ...company }) => ({
    ...company,
    description: description[locale],
  }));
}
