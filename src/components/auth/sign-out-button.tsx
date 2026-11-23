"use client";

import { useIntlayer } from "next-intlayer";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/locale";
import { clearMfaAttempt } from "./mfa-challenge-storage";
import { saveResetConfirmation } from "./reset-request-storage";

export function SignOutButton({ locale }: { locale: Locale }) {
  const copy = useIntlayer("auth-card");
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);

    try {
      const result = await authClient.signOut();
      if (!result.error) {
        clearMfaAttempt();
        saveResetConfirmation(null);
        window.location.replace(`/${locale}/login`);
        return;
      }
    } catch {
      // Allow retry if the sign-out request could not be completed.
    }

    inFlight.current = false;
    setPending(false);
    setFailed(true);
  }

  return (
    <div className="flex flex-col items-start gap-xs">
      <Button type="button" variant="primary" size="sm" isLoading={pending} onClick={() => { void signOut(); }}>
        {pending ? copy.signingOut.value : copy.signOut.value}
      </Button>
      {failed && <p role="alert" className="text-sx text-red-200">{copy.signOutFailed.value}</p>}
    </div>
  );
}
