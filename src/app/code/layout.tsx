import type { ReactNode } from "react";
import { Document } from "../document";

export default function CodeLayout({ children }: { children: ReactNode }) {
  return <Document lang="en">{children}</Document>;
}
