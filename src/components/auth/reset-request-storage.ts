const confirmationKey = "stolos.password-reset.confirmation";

export function normalizeResetEmail(email: string) {
  return email.trim().toLowerCase();
}

export function readResetConfirmation() {
  try {
    return sessionStorage.getItem(confirmationKey);
  } catch {
    return null;
  }
}

export function saveResetConfirmation(email: string | null) {
  try {
    if (email === null) sessionStorage.removeItem(confirmationKey);
    else sessionStorage.setItem(confirmationKey, email);
  } catch {
    // Verification can continue in the current view if storage is disabled.
  }
}

export function resetDeadlineKey(email: string) {
  return `stolos.password-reset.resend.${normalizeResetEmail(email)}`;
}

export function readResetDeadline(email: string) {
  try {
    const deadline = Number(localStorage.getItem(resetDeadlineKey(email)));
    return Number.isFinite(deadline) && deadline > Date.now() ? deadline : 0;
  } catch {
    return 0;
  }
}

export function saveResetDeadline(email: string, deadline: number) {
  try {
    localStorage.setItem(resetDeadlineKey(email), String(deadline));
  } catch {
    // The countdown still works in the active view.
  }
}
