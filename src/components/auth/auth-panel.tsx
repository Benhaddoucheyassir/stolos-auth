import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function AuthPanel({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "glassmorphism w-full rounded-[12px] bg-white/[0.03] px-[clamp(24px,4vw,58px)] py-[clamp(30px,4vh,48px)] shadow-[0_30px_40px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.15)]",
        className,
      )}
      {...props}
    />
  );
}
