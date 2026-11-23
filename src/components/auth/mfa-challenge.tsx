"use client";

import { useIntlayer } from "next-intlayer";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  loadResendDeadline,
  saveMfaAttempt,
  saveResendDeadline,
  type MfaAttempt,
  type VerificationMethod,
} from "./mfa-challenge-storage";
import { RecoveryCodeForm } from "./recovery-code-form";
import { VerificationCodeInput } from "./verification-code-input";

const resendMs = 30_000;
const actionClass = "text-sx text-[#bdb2ec] hover:text-white focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

type Feedback = "invalid" | "invalidRecovery" | "newCodeRequired" | "rateLimited" | "sendFailed" | "verifyFailed";
type Request = "send" | "verify";

export function MfaChallenge({
  attempt, headingId, onVerified, onExpired, onBack,
}: {
  attempt: MfaAttempt;
  headingId: string;
  onVerified: () => void;
  onExpired: () => void;
  onBack: () => void;
}) {
  const copy = useIntlayer("mfa");
  const id = useId();
  const inFlight = useRef(false);
  const [request, setRequest] = useState<Request | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sent, setSent] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const [retryCode, setRetryCode] = useState<string | null>(null);
  const [resendDeadline, setResendDeadline] = useState(() => loadResendDeadline(attempt.id));
  const [verifyDeadline, setVerifyDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const both = attempt.methods.length === 2;
  const emailMode = attempt.method === "otp";
  const resendSeconds = Math.max(0, Math.ceil((resendDeadline - now) / 1000));
  const verifySeconds = Math.max(0, Math.ceil((verifyDeadline - now) / 1000));
  const ticking = resendSeconds > 0 || verifySeconds > 0;
  const busy = request !== null;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = feedback ? `${helpId} ${errorId}` : helpId;

  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    const refresh = () => setNow(Date.now());
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ticking]);

  function updateResendDeadline(deadline: number) {
    saveResendDeadline(attempt.id, deadline);
    setNow(Date.now());
    setResendDeadline(deadline);
  }

  async function sendEmail() {
    if (inFlight.current || !attempt.methods.includes("otp")) return;
    if (Date.now() < resendDeadline) return;
    inFlight.current = true;
    setRequest("send");
    clearFeedback();
    if (!emailMode) setInputVersion((version) => version + 1);
    // Record before dispatch, so a reload during the request does not send twice.
    saveMfaAttempt({ ...attempt, method: "otp", autoSendStarted: true, emailRequested: true });
    updateResendDeadline(Date.now() + resendMs);

    let retryMs = 0;
    try {
      const result = await authClient.twoFactor.sendOtp({
        fetchOptions: {
          onError: ({ response }) => { retryMs = readRetryDelay(response); },
        },
      });
      if (result.error?.code === "INVALID_TWO_FACTOR_COOKIE") {
        onExpired();
      } else if (result.error?.status === 429) {
        updateResendDeadline(Date.now() + (retryMs || resendMs));
        setFeedback("rateLimited");
      } else if (result.error) {
        updateResendDeadline(0);
        setFeedback("sendFailed");
      } else {
        updateResendDeadline(Date.now() + resendMs);
        setInputVersion((version) => version + 1);
        setSent(true);
      }
    } catch {
      // Delivery is ambiguous after a network failure. Keep the provisional deadline.
      setFeedback("sendFailed");
    } finally {
      inFlight.current = false;
      setRequest(null);
    }
  }

  const sendOnArrival = useEffectEvent(() => {
    if (emailMode && !both && !attempt.recovery && !attempt.autoSendStarted) void sendEmail();
  });
  useEffect(() => {
    const timer = window.setTimeout(() => sendOnArrival(), 0);
    return () => window.clearTimeout(timer);
  }, [attempt.id, attempt.autoSendStarted, attempt.recovery, both, emailMode]);

  function clearFeedback() {
    setFeedback(null);
    setSent(false);
    setRetryCode(null);
  }

  function changeMode(method: VerificationMethod, recovery = false) {
    if (inFlight.current || !attempt.methods.includes(method)) return;
    clearFeedback();
    setInputVersion((version) => version + 1);
    saveMfaAttempt({ ...attempt, method, recovery });
  }

  function openEmail() {
    if (attempt.emailRequested) changeMode("otp");
    else void sendEmail();
  }

  async function verify(code: string) {
    if (inFlight.current || Date.now() < verifyDeadline) return;
    inFlight.current = true;
    setRequest("verify");
    clearFeedback();

    let retryMs = 0;
    const fetchOptions = {
      onError: ({ response }: { response: Response }) => { retryMs = readRetryDelay(response); },
    };
    const body = { code, fetchOptions };

    try {
      const result = attempt.recovery
        ? await authClient.twoFactor.verifyBackupCode(body)
        : emailMode
          ? await authClient.twoFactor.verifyOtp(body)
          : await authClient.twoFactor.verifyTotp(body);

      if (result.error?.code === "INVALID_TWO_FACTOR_COOKIE") {
        onExpired();
      } else if (result.error?.status === 429) {
        const currentTime = Date.now();
        setNow(currentTime);
        setVerifyDeadline(currentTime + (retryMs || resendMs));
        setFeedback("rateLimited");
        if (!attempt.recovery) setRetryCode(code);
      } else if (result.error?.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE") {
        setFeedback("newCodeRequired");
        setInputVersion((version) => version + 1);
      } else if (
        result.error?.code === "INVALID_CODE" ||
        result.error?.code === "INVALID_BACKUP_CODE" ||
        result.error?.code === "OTP_HAS_EXPIRED"
      ) {
        setFeedback(attempt.recovery ? "invalidRecovery" : "invalid");
        if (!attempt.recovery) setInputVersion((version) => version + 1);
      } else if (result.error) {
        setFeedback("verifyFailed");
        if (!attempt.recovery) setRetryCode(code);
      } else {
        onVerified();
      }
    } catch {
      setFeedback("verifyFailed");
      if (!attempt.recovery) setRetryCode(code);
    } finally {
      inFlight.current = false;
      setRequest(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-xl text-center" aria-busy={busy}>
      <h1 id={headingId} className="text-lm leading-[34px] font-semibold">
        {attempt.recovery ? copy.recoveryTitle.value : copy.title.value}
      </h1>

      {attempt.recovery ? (
        <>
          <RecoveryCodeForm
            label={copy.recoveryLabel.value}
            submitLabel={copy.recoverySubmit.value}
            describedBy={describedBy}
            busy={busy}
            blocked={verifySeconds > 0}
            invalid={feedback === "invalidRecovery"}
            onEdit={clearFeedback}
            onSubmit={(code) => { void verify(code); }}
          />
          <button type="button" className={actionClass} disabled={busy} onClick={() => changeMode(attempt.method)}>
            {copy.useVerification.value}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-sm">
          <VerificationCodeInput
            key={inputVersion}
            label={copy.codeLabel.value}
            digitLabel={copy.digit.value}
            readOnly={busy || verifySeconds > 0}
            invalid={feedback === "invalid" || feedback === "newCodeRequired"}
            describedBy={describedBy}
            onEdit={clearFeedback}
            onComplete={(code) => { void verify(code); }}
          />
          <div className="flex flex-col items-center gap-xs">
            {both && !emailMode && (
              <button type="button" className={actionClass} disabled={busy} onClick={openEmail}>
                {attempt.emailRequested ? copy.useEmail.value : copy.sendEmail.value}
              </button>
            )}
            {emailMode && (
              <button type="button" className={`${actionClass} tabular-nums`} disabled={busy || resendSeconds > 0}
                onClick={() => { void sendEmail(); }}>
                {copy.resend.value}{resendSeconds > 0 && ` (${resendSeconds}s)`}
              </button>
            )}
            {emailMode && both && (
              <button type="button" className={actionClass} disabled={busy} onClick={() => changeMode("totp")}>
                {copy.useApp.value}
              </button>
            )}
            <button type="button" className={actionClass} disabled={busy} onClick={() => changeMode(attempt.method, true)}>
              {copy.useRecovery.value}
            </button>
          </div>
        </div>
      )}

      <p id={helpId} className="text-sx font-light text-white/80">
        {attempt.recovery ? copy.recoveryHelp.value : emailMode ? copy.emailHelp.value : both ? copy.bothHelp.value : copy.appHelp.value}
      </p>
      {feedback && <p id={errorId} className="text-sx text-red-200" role="alert">{copy[feedback].value}</p>}
      {verifySeconds > 0 && <p className="text-sx tabular-nums">{copy.retryIn.value} {verifySeconds}&nbsp;s.</p>}
      {retryCode && (
        <button type="button" className={actionClass} disabled={busy || verifySeconds > 0}
          onClick={() => { void verify(retryCode); }}>
          {copy.retryVerification.value}
        </button>
      )}
      {(request || sent) && (
        <p className="text-sx text-white/80" role="status">
          {request === "send" ? copy.sending.value : request === "verify" ? copy.verifying.value : copy.sent.value}
        </p>
      )}
      <button type="button" className={actionClass} disabled={busy} onClick={onBack}>{copy.back.value}</button>
    </div>
  );
}

export function ExpiredMfaChallenge({ headingId, onBack }: { headingId: string; onBack: () => void }) {
  const copy = useIntlayer("mfa");

  return (
    <div className="flex flex-col items-center gap-xl text-center">
      <h1 id={headingId} className="text-lm leading-[34px] font-semibold">{copy.expiredTitle.value}</h1>
      <p className="text-sx text-white/80" role="alert">{copy.expired.value}</p>
      <Button type="button" variant="primary" size="lg" onClick={onBack}>{copy.back.value}</Button>
    </div>
  );
}

function readRetryDelay(response: Response) {
  const seconds = Number(response.headers.get("X-Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
}
