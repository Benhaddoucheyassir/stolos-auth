import "server-only";
import type { CompanyCard } from "@/components/company/company-card";
import type { Locale } from "./locale";

// The design repeats the same company fixture across the backdrop.
const company = {
  name: "Doctolib",
  description: {
    en: "Digital platform for booking medical appointments and managing consultations",
    fr: "Plateforme numérique facilitant la prise de rendez-vous médicaux et la gestion des consultations",
  },
  sectors: ["HEALTHCARE", "SOFTWARE", "ARTIFICIAL_INTELLIGENCE"],
} as const;

const instances = [
  { id: "left-top", status: "CLOSED" },
  { id: "left-middle", status: "ACTIVE" },
  { id: "left-bottom", status: "ACQUIRED" },
  { id: "right-top", status: "CLOSED" },
  { id: "right-middle", status: "CLOSED" },
  { id: "right-bottom", status: "CLOSED" },
] satisfies Pick<CompanyCard, "id" | "status">[];

export function getCompanyCards(locale: Locale): CompanyCard[] {
  return instances.map(({ id, status }) => ({
    id,
    name: company.name,
    description: company.description[locale],
    sectors: company.sectors,
    status,
  }));
}
