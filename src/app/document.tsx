import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export function Document({ children, lang }: { children: ReactNode; lang: string }) {
  return (
    <html lang={lang} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
