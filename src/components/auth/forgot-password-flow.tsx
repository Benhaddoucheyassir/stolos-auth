"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useIntlayer } from "next-intlayer";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/locale";
import { AuthPanel } from "./auth-panel";
import {
  normalizeResetEmail,
  readResetConfirmation,
  readResetDeadline,
  resetDeadlineKey,
  saveResetConfirmation,
  saveResetDeadline,
} from "./reset-request-storage";

const resendMs = 30_000;
const secondary = "text-sx text-[#bdb2ec] hover:text-white focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

export function ForgotPasswordFlow({ locale }: { locale: Locale }) {
  const copy = useIntlayer("password-reset");
  const id = useId();
  const inFlight = useRef(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<{ email: string; time: number } | null>(null);
  const [now, setNow] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<"rateLimited" | "requestFailed" | null>(null);

  const { control, register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    defaultValues: { email: "" },
    resolver: zodResolver(z.object({
      email: z.string().trim().pipe(z.email(copy.emailInvalid.value)),
    })),
  });
  const draftEmail = useWatch({ control, name: "email" });
  const activeEmail = recipient ?? normalizeResetEmail(draftEmail);
  const remaining = deadline && deadline.email === activeEmail
    ? Math.max(0, Math.ceil((deadline.time - now) / 1000))
    : 0;
  const ticking = remaining > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const email = readResetConfirmation();
      setNow(Date.now());
      setRecipient(email);
      setDeadline(email ? { email, time: readResetDeadline(email) } : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (recipient) confirmationHeading.current?.focus();
  }, [recipient]);

  useEffect(() => {
    if (!ticking) return;
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 250);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ticking]);

  useEffect(() => {
    if (!activeEmail) return;
    function syncDeadline(event: StorageEvent) {
      if (event.key !== resetDeadlineKey(activeEmail)) return;
      setNow(Date.now());
      setDeadline({ email: activeEmail, time: readResetDeadline(activeEmail) });
    }
    window.addEventListener("storage", syncDeadline);
    return () => window.removeEventListener("storage", syncDeadline);
  }, [activeEmail]);

  async function requestLink(value: string) {
    if (inFlight.current) return;
    const email = normalizeResetEmail(value);
    const clock = Date.now();
    const saved = readResetDeadline(email);
    const current = deadline?.email === email ? deadline.time : 0;
    const until = Math.max(saved, current);

    if (until > clock) {
      setNow(clock);
      setDeadline({ email, time: until });
      setFeedback("rateLimited");
      return;
    }

    inFlight.current = true;
    setSending(true);
    setFeedback(null);
    let retrySeconds = 0;

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
        fetchOptions: {
          onError: ({ response }) => {
            retrySeconds = Number(response.headers.get("X-Retry-After"));
          },
        },
      });

      if (result.error && result.error.status !== 429) {
        setFeedback("requestFailed");
        return;
      }

      const time = Date.now();
      const wait = result.error && Number.isFinite(retrySeconds) && retrySeconds > 0
        ? retrySeconds * 1000
        : resendMs;
      const next = time + wait;
      saveResetDeadline(email, next);
      setNow(time);
      setDeadline({ email, time: next });

      if (result.error) {
        setFeedback("rateLimited");
      } else {
        saveResetConfirmation(email);
        setRecipient(email);
      }
    } catch {
      setFeedback("requestFailed");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <AuthPanel data-auth-view={recipient ? "reset-confirm" : "reset-request"} aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-[36px] text-center">
        <header>
          <h1 id={`${id}-title`} ref={confirmationHeading} tabIndex={recipient ? -1 : undefined}
            className="text-lm leading-[34px] font-semibold">
            {recipient ? copy.confirmTitle.value : copy.requestTitle.value}
          </h1>
          <p className="mt-[10px] text-s font-light text-white/80">
            {recipient ? copy.confirmHelp.value : copy.requestHelp.value}
          </p>
        </header>
        {recipient ? (
          <Button
            type="button"
            className={`self-center ${secondary} tabular-nums`}
            isLoading={sending}
            disabled={remaining > 0}
            onClick={() => { void requestLink(recipient); }}
          >
            {sending ? copy.sending.value : copy.resend.value}
            {remaining > 0 && ` (${remaining}s)`}
          </Button>
        ) : (
          <form className="flex flex-col gap-xl" noValidate aria-busy={sending}
            onSubmit={(event) => { void handleSubmit(({ email }) => requestLink(email))(event); }}>
            <div>
              <label htmlFor={`${id}-email`} className="sr-only">{copy.email.value}</label>
              <Input
                appearance="auth"
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                placeholder={copy.email.value}
                readOnly={sending}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                {...register("email")}
              />
              {errors.email?.message && (
                <p id={`${id}-email-error`} className="mt-xs text-left text-sx text-red-200" role="alert">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" variant="primary" size="lg" alignment="center"
              className="min-h-[52px] rounded-[8px] font-semibold" isLoading={sending} disabled={remaining > 0}>
              {sending ? copy.sending.value : copy.send.value}
            </Button>
            {remaining > 0 && <p className="text-sx tabular-nums">{copy.retryIn.value} {remaining}&nbsp;s.</p>}
          </form>
        )}
        {feedback && <p className="text-sx text-red-200" role="alert">{copy[feedback].value}</p>}
        <Link
          href={`/${locale}/login`}
          className={`self-center ${secondary}`}
          aria-disabled={sending || undefined}
          onClick={(event) => {
            if (inFlight.current) event.preventDefault();
            else saveResetConfirmation(null);
          }}
        >
          {copy.back.value}
        </Link>
      </div>
    </AuthPanel>
  );
}
