import { useSyncExternalStore } from "react";
import { z } from "zod";

const methodSchema = z.enum(["totp", "otp"]);
export type VerificationMethod = z.infer<typeof methodSchema>;

const challengeSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{32}$/),
  methods: z.array(methodSchema).min(1).max(2),
  method: methodSchema,
  recovery: z.boolean(),
  autoSendStarted: z.boolean(),
  emailRequested: z.boolean(),
}).refine((challenge) => challenge.methods.includes(challenge.method));

export type MfaAttempt = z.infer<typeof challengeSchema>;

const challengeKey = "stolos.mfa.challenge";
let inMemory: string | null = null;
let storageUnavailable = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function readChallenge() {
  if (storageUnavailable) return inMemory;
  try {
    return sessionStorage.getItem(challengeKey);
  } catch {
    return inMemory;
  }
}

export function useMfaAttempt() {
  const serialized = useSyncExternalStore(subscribe, readChallenge, () => null);
  if (!serialized) return null;
  try {
    return challengeSchema.safeParse(JSON.parse(serialized)).data ?? null;
  } catch {
    return null;
  }
}

export function saveMfaAttempt(attempt: MfaAttempt | null) {
  inMemory = attempt ? JSON.stringify(attempt) : null;
  try {
    if (inMemory === null) sessionStorage.removeItem(challengeKey);
    else sessionStorage.setItem(challengeKey, inMemory);
  } catch {
    storageUnavailable = true;
  }
  listeners.forEach((listener) => listener());
}

export function beginMfaAttempt(methods: VerificationMethod[]) {
  saveMfaAttempt({
    id: Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    methods,
    method: methods.includes("totp") ? "totp" : "otp",
    recovery: false,
    autoSendStarted: false,
    emailRequested: false,
  });
}

function cooldownKey(id: string) {
  return `stolos.mfa.resend.${id}`;
}

export function loadResendDeadline(id: string) {
  try {
    const value = Number(localStorage.getItem(cooldownKey(id)));
    return Number.isFinite(value) && value > Date.now() ? value : 0;
  } catch {
    return 0;
  }
}

export function saveResendDeadline(id: string, deadline: number) {
  try {
    if (deadline) localStorage.setItem(cooldownKey(id), String(deadline));
    else localStorage.removeItem(cooldownKey(id));
  } catch {
    // The active challenge still keeps the deadline in memory.
  }
}
