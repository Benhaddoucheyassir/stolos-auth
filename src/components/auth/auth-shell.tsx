import Image from "next/image";
import type { ReactNode } from "react";
import { CompanyCards } from "@/components/company/company-cards";
import type { Locale } from "@/lib/locale";
import "./auth-shell.css";

export function AuthShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <main className="stolos-auth-shell">
      <div className="stolos-auth-backdrop">
        <CompanyCards locale={locale} />
      </div>
      <div className="stolos-auth-foreground">
        <Image className="stolos-auth-logo" src="/auth/stolos.svg" alt="Stolos" width={169} height={167} unoptimized />
        {children}
      </div>
    </main>
  );
}
