"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/locale";
import { AuthPanel } from "./auth-panel";
import { clearMfaAttempt } from "./mfa-challenge-storage";
import { saveResetConfirmation } from "./reset-request-storage";

const returnLink = "self-center text-sx text-[#bdb2ec] hover:text-white focus-visible:outline-2 focus-visible:outline-primary";

export function ResetPasswordForm({ locale, token }: { locale: Locale; token: string | null }) {
  const copy = useIntlayer("password-reset");
  const id = useId();
  const inFlight = useRef(false);
  const [invalid, setInvalid] = useState(token === null);
  const [saved, setSaved] = useState(false);
  const visibilityLabels = { show: copy.show.value, hide: copy.hide.value };

  const form = useForm<{ password: string; confirmation: string }>({
    defaultValues: { password: "", confirmation: "" },
    resolver: zodResolver(z.object({
      password: z.string().min(8, copy.passwordMinimum.value),
      confirmation: z.string(),
    }).refine((values) => values.password === values.confirmation, {
      path: ["confirmation"],
      message: copy.passwordsDiffer.value,
    })),
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || saved;

  async function submit(newPassword: string) {
    if (!token || inFlight.current || saved) return;
    inFlight.current = true;
    form.clearErrors("root");

    try {
      const result = await authClient.resetPassword({ newPassword, token });
      if (result.error?.code === "INVALID_TOKEN") {
        form.reset();
        setInvalid(true);
      } else if (result.error) {
        form.setError("root", { message: copy.resetFailed.value });
      } else {
        setSaved(true);
        form.reset();
        saveResetConfirmation(null);
        clearMfaAttempt();
        window.location.replace(`/${locale}/login`);
      }
    } catch {
      form.setError("root", { message: copy.resetFailed.value });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <AuthPanel data-auth-view="reset-password" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-[36px] text-center">
        <header>
          <h1 id={`${id}-title`} className="text-lm leading-[34px] font-semibold">
            {invalid ? copy.invalidTitle.value : copy.newTitle.value}
          </h1>
          <p className="mt-[10px] text-s font-light text-white/80" role={invalid ? "alert" : undefined}>
            {invalid ? copy.invalidLink.value : copy.newHelp.value}
          </p>
        </header>
        {invalid ? (
          <Button asChild variant="primary" size="lg" alignment="center" className="min-h-[52px] rounded-[8px] font-semibold">
            <Link href={`/${locale}/forgot-password`} onClick={() => saveResetConfirmation(null)}>{copy.newLink.value}</Link>
          </Button>
        ) : (
          <form className="flex flex-col gap-m text-left" noValidate aria-busy={busy}
            onSubmit={(event) => { void form.handleSubmit(({ password }) => submit(password))(event); }}>
            <PasswordInput
              label={copy.password.value}
              visibilityLabels={visibilityLabels}
              autoComplete="new-password"
              readOnly={busy}
              errorMessage={errors.password?.message}
              {...form.register("password")}
            />
            <PasswordInput
              label={copy.confirmPassword.value}
              visibilityLabels={visibilityLabels}
              autoComplete="new-password"
              readOnly={busy}
              errorMessage={errors.confirmation?.message}
              {...form.register("confirmation")}
            />
            {errors.root?.message && <p role="alert" className="text-sx text-red-200">{errors.root.message}</p>}
            {saved && <p role="status" className="text-sx">{copy.saved.value}</p>}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              alignment="center"
              className="mt-xs min-h-[52px] rounded-[8px] font-semibold"
              isLoading={busy}
            >
              {busy ? copy.saving.value : copy.save.value}
            </Button>
          </form>
        )}
        <Link href={`/${locale}/login`} className={returnLink} aria-disabled={busy || undefined}
          onClick={(event) => {
            if (inFlight.current || saved) event.preventDefault();
            else saveResetConfirmation(null);
          }}>
          {copy.back.value}
        </Link>
      </div>
    </AuthPanel>
  );
}
