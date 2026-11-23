import type { CompanyStatus } from "./company-status";
import type { Sector } from "@/components/sectors/sectors";

export interface CompanyCard {
  id: string;
  name: string;
  description: string;
  sectors: readonly Sector[];
  status: CompanyStatus;
}
