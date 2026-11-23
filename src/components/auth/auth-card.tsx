"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIntlayer } from "next-intlayer";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useEffect, type KeyboardEvent } from "react";
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/locale";
import {
  beginMfaAttempt,
  saveMfaAttempt,
  saveResendDeadline,
  useMfaAttempt,
  type VerificationMethod,
} from "./mfa-challenge-storage";
import { ExpiredMfaChallenge, MfaChallenge } from "./mfa-challenge";

const modes = ["signIn", "signUp"] as const;
type Mode = (typeof modes)[number];
type Credentials = { email: string; password: string; confirmPassword: string };
const defaultValues: Credentials = { email: "", password: "", confirmPassword: "" };

export function AuthCard({ locale }: { locale: Locale }) {
  const copy = useIntlayer("auth-card");
  const router = useRouter();
  const id = useId();
  const tabRefs = useRef<Partial<Record<Mode, HTMLButtonElement>>>({});
  const requestInFlight = useRef(false);
  const [mode, setMode] = useState<Mode>("signIn");
  const attempt = useMfaAttempt();
  const [mfaExpired, setMfaExpired] = useState(false);
  const [opening, setOpening] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);

  const email = z.string().trim().pipe(z.email(copy.emailInvalid.value));
  const signIn = useForm<Credentials>({
    defaultValues,
    resolver: zodResolver(z.object({
      confirmPassword: z.string(),
      email,
      password: z.string().min(1, copy.passwordRequired.value),
    })),
  });
  const signUp = useForm<Credentials>({
    defaultValues,
    resolver: zodResolver(z.object({
      confirmPassword: z.string().min(1, copy.passwordRequired.value),
      email,
      password: z.string().min(8, copy.passwordMinimum.value),
    }).refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"], message: copy.passwordsDiffer.value,
    })),
  });

  const isSignUp = mode === "signUp";
  const form = isSignUp ? signUp : signIn;
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || opening;

  useEffect(() => {
    if (retrySeconds === null) return;
    const timeout = setTimeout(() => setRetrySeconds(retrySeconds > 1 ? retrySeconds - 1 : null), 1000);
    return () => clearTimeout(timeout);
  }, [retrySeconds]);

  function selectTab(next: Mode) {
    if (busy || requestInFlight.current || next === mode) return;
    const other = next === "signUp" ? signUp : signIn;
    const currentEmail = form.getValues("email");
    if (currentEmail && !other.getValues("email")) other.setValue("email", currentEmail);
    form.resetField("password");
    if (isSignUp) form.resetField("confirmPassword");
    form.clearErrors();
    setMode(next);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (busy || requestInFlight.current) return;
    const next = event.key === "Home" ? "signIn" : event.key === "End" ? "signUp" : isSignUp ? "signIn" : "signUp";
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  const submit: SubmitHandler<Credentials> = async (values) => {
    if (requestInFlight.current || opening || retrySeconds !== null) return;
    requestInFlight.current = true;
    form.clearErrors("root");
    let retryAfter: string | null = null;

    try {
      const fetchOptions = {
        onError: ({ response }: { response: Response }) => {
          retryAfter = response.headers.get("X-Retry-After");
        },
      };
      const credentials = { email: values.email, password: values.password };
      const result = isSignUp
        ? await authClient.signUp.email({ ...credentials, name: values.email.slice(0, values.email.lastIndexOf("@")), fetchOptions })
        : await authClient.signIn.email({ ...credentials, fetchOptions });

      if (result.error) {
        const { status, code } = result.error;
        if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" && isSignUp) {
          form.setError("email", { message: copy.duplicateEmail.value }, { shouldFocus: true });
        } else if (status === 429) {
          const seconds = Number(retryAfter);
          if (Number.isFinite(seconds) && seconds > 0) setRetrySeconds(Math.ceil(seconds));
          form.setError("root", { message: copy.rateLimited.value });
        } else {
          form.setError("root", {
            message: code === "INVALID_EMAIL_OR_PASSWORD" ? copy.invalidCredentials.value : copy.genericError.value,
          });
        }
        return;
      }

      const data = result.data;
      form.resetField("password");
      if (isSignUp) form.resetField("confirmPassword");
      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        const offered = "twoFactorMethods" in data && Array.isArray(data.twoFactorMethods) ? data.twoFactorMethods : [];
        const methods = [...new Set(offered.filter((value): value is VerificationMethod => value === "totp" || value === "otp"))];
        if (methods.length) beginMfaAttempt(methods);
        else form.setError("root", { message: copy.genericError.value });
        return;
      }
      if (!data) {
        form.setError("root", { message: copy.genericError.value });
        return;
      }
      setOpening(true);
      router.replace(`/${locale}/account`);
    } catch {
      form.setError("root", { message: copy.genericError.value });
    } finally {
      requestInFlight.current = false;
    }
  };

  function clearChallenge() {
    if (attempt) saveResendDeadline(attempt.id, 0);
    saveMfaAttempt(null);
  }

  function returnToSignIn() {
    clearChallenge();
    setMfaExpired(false);
    setMode("signIn");
  }

  return (
    <section className="glassmorphism w-full rounded-[12px] bg-white/[0.03] px-[clamp(24px,4vw,58px)] py-[clamp(30px,4vh,48px)] shadow-[0_30px_40px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.15)]" data-auth-view={attempt ? (attempt.recovery ? "recovery" : attempt.method) : undefined}
      aria-labelledby={`${id}-heading`}>
      {attempt ? (
        <MfaChallenge
          key={attempt.id}
          attempt={attempt}
          headingId={`${id}-heading`}
          onBack={returnToSignIn}
          onExpired={() => {
            clearChallenge();
            setMfaExpired(true);
          }}
          onVerified={() => {
            clearChallenge();
            setOpening(true);
            router.replace(`/${locale}/account`);
          }}
        />
      ) : mfaExpired ? (
        <ExpiredMfaChallenge headingId={`${id}-heading`} onBack={returnToSignIn} />
      ) : (
        <>
          <header className="mb-[clamp(28px,4.45vh,48px)] text-center">
            <h1 id={`${id}-heading`} className="text-lm leading-[34px] font-semibold">{isSignUp ? copy.signUpTitle : copy.signInTitle}</h1>
            <p className="mt-[10px] text-s font-light text-white/80">{isSignUp ? copy.signUpSubtitle : copy.signInSubtitle}</p>
          </header>
          <div role="tablist" aria-label={copy.tabs.value} className="mb-xl flex justify-center gap-[32px] border-b border-white/40">
            {modes.map((tab) => (
              <button
                key={tab}
                ref={(node) => { if (node) tabRefs.current[tab] = node; }}
                id={`${id}-${tab}-tab`}
                type="button"
                role="tab"
                aria-selected={tab === mode}
                aria-controls={`${id}-${tab}-panel`}
                aria-disabled={busy || undefined}
                tabIndex={tab === mode ? 0 : -1}
                onClick={() => selectTab(tab)}
                onKeyDown={onTabKey}
                className="-mb-px border-b-2 border-transparent px-m py-sm text-sx text-white/90 aria-selected:border-[#a99be8] aria-selected:text-[#a99be8] focus-visible:outline-2 focus-visible:outline-primary"
              >
                {copy[tab]}
              </button>
            ))}
          </div>
          {modes.map((tab) => (
            <div key={tab} id={`${id}-${tab}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`} hidden={tab !== mode}>
              {tab === mode && (
                <form noValidate onSubmit={(event) => void form.handleSubmit(submit)(event)} aria-busy={busy} className="flex flex-col gap-m">
                  <TextField id={`${id}-email`} label={copy.email.value} error={errors.email?.message}
                    type="email" autoComplete="email" readOnly={busy} input={form.register("email")} />
                  <PasswordInput id={`${id}-password`} label={copy.password.value} errorMessage={errors.password?.message}
                    autoComplete={isSignUp ? "new-password" : "current-password"} readOnly={busy}
                    visibilityLabels={{ show: copy.show.value, hide: copy.hide.value }} {...form.register("password")} />
                  {isSignUp ? (
                    <PasswordInput id={`${id}-confirm-password`} label={copy.confirmPassword.value} errorMessage={errors.confirmPassword?.message}
                      autoComplete="new-password" readOnly={busy} visibilityLabels={{ show: copy.show.value, hide: copy.hide.value }}
                      {...form.register("confirmPassword")} />
                  ) : (
                    <button type="button" disabled className="self-start text-sx text-[#bdb2ec]">{copy.forgot}</button>
                  )}
                  {errors.root?.message && (
                    <p role="alert" className="text-sx text-red-200">
                      {errors.root.message}
                    </p>
                  )}
                  {retrySeconds !== null && <p className="text-sx tabular-nums">{copy.rateWait} {retrySeconds}&nbsp;s.</p>}
                  <Button type="submit" variant="primary" size="lg" alignment="center" className="mt-m min-h-[52px] rounded-[8px] font-semibold" isLoading={busy} disabled={retrySeconds !== null}>
                    {opening ? copy.opening : isSubmitting ? copy.pending : isSignUp ? copy.signUpSubmit : copy.signInSubmit}
                  </Button>
                  <span className="sr-only" role="status">{opening ? copy.opening : isSubmitting ? copy.pending : null}</span>
                </form>
              )}
              {tab === mode && (
                <footer className="mt-[32px] flex flex-wrap justify-center gap-xs text-center text-sx text-white/80">
                  <span>{copy.terms}</span><span aria-hidden="true">|</span><span>{copy.privacy}</span>
                </footer>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function TextField({ id, label, error, type = "text", autoComplete, readOnly, input }: {
  id: string;
  label: string;
  error?: string;
  type?: "text" | "email";
  autoComplete: string;
  readOnly: boolean;
  input: UseFormRegisterReturn;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Input appearance="auth" id={id} type={type} autoComplete={autoComplete} readOnly={readOnly} placeholder={label}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error && <p id={`${id}-error`} role="alert" className="text-sx text-red-200">{error}</p>}
    </div>
  );
}
