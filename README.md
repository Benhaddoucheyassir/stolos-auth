# Stolos — authentication exercise

Stolos implements bilingual sign-in, registration, two-factor verification, password reset, and sign-out using Next.js, Better Auth, Prisma, PostgreSQL, Tailwind, and Intlayer. The interface uses React Hook Form, Zod, and TanStack Query.

## Setup

Install [Bun](https://bun.sh) and start Docker with Docker Compose available. From the repository root:

```sh
bun install
cp .env.example .env
bun run db:setup
bun run dev
```

On Windows PowerShell, `Copy-Item .env.example .env` also copies the environment file. The setup command starts PostgreSQL on port 5433, applies migrations, generates the Prisma client, and seeds the test accounts. Open the URL printed by Next.js, normally `http://localhost:3000`. If you use a different origin, set `BETTER_AUTH_URL` in `.env` to match it before starting the server.

Run `bun run db:seed` to restore the seeded passwords after a password reset or replenish used recovery codes.

## What is provided

| File | Role |
|---|---|
| `src/lib/auth.ts` | Better Auth server configuration |
| `src/lib/auth-client.ts` | Better Auth client (`authClient`), with the two-factor plugin |
| `src/app/api/auth/[...all]/route.ts` | All auth endpoints, under `/api/auth` |
| `src/app/code/page.tsx` | The `/code` helper page (see below) |
| `src/app/globals.css` | Stolos design tokens (colors, text sizes, spacing, radii) and the `glassmorphism` utility |
| `src/components/ui/` | `Button`, `Input`, `PasswordInput`, adapted from the Stolos web app |
| `src/components/sectors/` | Company sectors from the Stolos web app: list, colours and icons (`sectors.ts`) and the `SectorTag` component. Translated labels come from Intlayer dictionaries. |
| `src/components/company/company-status.ts` | Company statuses from the Stolos web app (`CompanyStatus`) |

The tokens redefine part of Tailwind's scale: `text-xs` … `text-xl` follow the Stolos sizes, and the spacing names (`xs`, `s`, `sm`, `m`, `l`, `xl`, `2xl`, `3xl`, `4xl`) also apply to sizing utilities, so `max-w-xl` is 1.5rem. Use explicit values such as `max-w-[36rem]` for widths.

## Routes

| Path | What it is |
|---|---|
| `/`, `/login` | Redirect to `/fr/login`. |
| `/fr/login`, `/en/login` | Sign-in and registration tabs, with in-card MFA when required. |
| `/[locale]/forgot-password`, `/[locale]/reset-password` | Request and complete a password reset in French or English. |
| `/[locale]/account` | Signed-in page with localized sign-out. |
| `/code` | Simulated mailbox and authenticator. |
| `/email`, `/en/email`, `/fr/email` | Password reset email preview. The bare route defaults to French and accepts `?locale=en`. |
| `/api/company-cards` | Server-provided company cards for the auth backdrop. |
| `/api/auth/*` | Better Auth endpoints listed below. |

| Method | Path | Action |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Sign up |
| POST | `/api/auth/sign-in/email` | Sign in |
| POST | `/api/auth/two-factor/verify-totp` | Verify app code |
| POST | `/api/auth/two-factor/send-otp` | Send email code |
| POST | `/api/auth/two-factor/verify-otp` | Verify email code |
| POST | `/api/auth/two-factor/verify-backup-code` | Verify recovery code |
| POST | `/api/auth/request-password-reset` | Ask for a reset link |
| GET | `/api/auth/reset-password/:token` | The reset link itself: redirects to `redirectTo?token=…` |
| POST | `/api/auth/reset-password` | Set the new password |
| GET | `/api/auth/get-session` | Current session |
| POST | `/api/auth/sign-out` | Sign out |

## Test accounts

Password for all of them: `Stolos-Test-2026`

| Email | Second step at sign-in |
|---|---|
| `none@example.com` | none |
| `app@example.com` | authenticator app |
| `both@example.com` | authenticator app or email code |
| `email@example.com` | email code |

Every account with a second step also has recovery codes.

### Simulated mailbox and email preview

Keep `/code` open in another tab. It displays each account’s current authenticator code, latest email code, recovery codes, and latest password-reset link. Email delivery and authenticator codes are simulated locally.

For password reset, request a link from the login screen and open the account’s reset link on `/code`. In development, you can also open `/email`, select the seeded account, and open its latest live link from the rendered email. The account page’s **Sign out** button returns you to login for the current locale.

## Auth API

Use `authClient`; each method maps to an endpoint under `/api/auth`.

| Action | Client call | Notes |
|---|---|---|
| Sign up | `authClient.signUp.email({ name, email, password })` | Signs the user in. Password: 8 characters minimum. |
| Sign in | `authClient.signIn.email({ email, password })` | With a second step, returns `{ twoFactorRedirect: true, twoFactorMethods }` instead of a session. `twoFactorMethods` contains `"totp"` (app) and/or `"otp"` (email). |
| Verify app code | `authClient.twoFactor.verifyTotp({ code })` | |
| Send email code | `authClient.twoFactor.sendOtp()` | A new code cancels the previous one. Codes expire after 3 minutes. |
| Verify email code | `authClient.twoFactor.verifyOtp({ code })` | |
| Verify recovery code | `authClient.twoFactor.verifyBackupCode({ code })` | Each code works once. |
| Ask for a reset link | `authClient.requestPasswordReset({ email, redirectTo: "/your-page" })` | Same answer whether the account exists or not. A new link cancels the previous one. |
| Set the new password | `authClient.resetPassword({ newPassword, token })` | The link on `/code` redirects to `redirectTo?token=…`. |
| Current session | `authClient.useSession()` / `authClient.getSession()` | |
| Sign out | `authClient.signOut()` | |

### Errors to handle

Errors come back as `{ error: { status, code, message } }`.

| Case | Status | `code` |
|---|---|---|
| Wrong email or password | 401 | `INVALID_EMAIL_OR_PASSWORD` |
| Email already used at sign-up | 422 | `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` |
| Wrong or expired code | 401 | `INVALID_CODE` |
| Sign-in attempt expired (10 minutes) | 401 | `INVALID_TWO_FACTOR_COOKIE` |
| Reset link invalid, expired or already used | 400 | `INVALID_TOKEN` |
| Too many requests | 429 | — the `X-Retry-After` response header gives the seconds to wait |

The server refuses a new email code or a new reset link for **30 seconds** after the previous request (429). Sign-in is limited to 3 attempts per 10 seconds.
