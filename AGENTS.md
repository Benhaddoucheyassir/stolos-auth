<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stolos Authentication Exercise - Source of Truth & Guardrails

## 1. Mandatory First Step
Before planning or writing any code, read BOTH README.md and Cas pratique.pdf in the repository root in full. Every functional requirement, route pattern (/login, /en/login, /fr/login, /email), MFA behavior, 30s reload-safe cooldown, 6-box OTP paste rule, and viewport requirement (1920x1080, 1400x900) defined in Cas pratique.pdf is binding.

## 2. Locked Files (DO NOT MODIFY)
Per Cas pratique.pdf and README.md, do NOT modify:
- src/lib/auth.ts
- src/lib/auth-client.ts
- src/app/api/auth/[...all]/route.ts
- src/app/code/page.tsx
- prisma/schema.prisma or the test accounts in prisma/seed.ts

## 3. Technical Guardrails from README.md
- **Package Manager:** Use Bun exclusively.
- **Tailwind Scale Warning:** src/app/globals.css overrides xs through 4xl for spacing and sizing (e.g., max-w-xl = 1.5rem). Always use explicit bracket values for widths/heights (e.g., max-w-[36rem]).
- **Company Cards Endpoint:** Create a server API route returning company cards (name, description, sectors, status) rather than hardcoding them in the frontend, and translate sector names (src/components/sectors/sectors.ts) and statuses (src/components/company/company-status.ts) in both en and fr.
- **i18n:** Use Intlayer (intlayer + next-intlayer) with URL-based locale routing (/en/* and /fr/*, plus /login redirecting to the default locale login) so no manual language switcher is needed.

## 4. Exercise Requirements

- Use the provided Figma for the authentication UI and UX. Fork the provided GitHub repository or clone and reinitialize it. Sign in to Figma and retry if Dev Mode is inaccessible. The brief allows and encourages AI assistance, gives one week for the exercise, and lists mark.samokhin@histia.net for questions.
- Use Next.js 16 App Router, Prisma + PostgreSQL, React Hook Form + Zod, TanStack Query, Better Auth, and the provided Tailwind design tokens and components. Set up locally with Bun and Docker: run `bun install`, copy `.env.example` to `.env`, run `bun run db:setup` (PostgreSQL on port 5433, migrations, client generation, and seed), then `bun run dev`. Use `bun run db:seed` to restore test accounts.
- Replace the starter preview. Keep sign-in and sign-up in one card on `/login` (default-locale redirect), `/en/login`, and `/fr/login`, using tabs that switch without a reload. Use `/en/*` and `/fr/*` for localized pages. The remaining auth page paths are flexible, except that the reset email must be visible at `/email`. Localize the application, including errors, company sectors, and statuses, in French and English.
- Use `authClient` and the provided Better Auth endpoints under `/api/auth/*`. Sign-up takes name, email, and a password of at least eight characters, and signs the user in. After successful sign-in, sign-up, or MFA as applicable, show a page that clearly indicates the user is signed in and requires an authenticated session. No particular post-login design is required.
- Replace the credential form with verification when sign-in returns `twoFactorRedirect`. Use server-returned `twoFactorMethods`: app-only (`totp`) prompts for the app code, app + email offers an email-code link in addition to app verification, and email-only (`otp`) automatically sends a code on arrival. Offer single-use recovery codes from verification and a way back to code entry.
- Use six boxes for app and email codes. Pasting a full code into any box must fill all six in order from the first box. Advance focus as digits are entered and automatically verify when all six digits are present.
- Reflect the server's 30-second resend limit for email codes and password-reset links, including after reload. Disable email-code resend for 30 seconds after each send and show a visible countdown. A new email code invalidates the prior one and expires after three minutes. A new reset link invalidates the prior one. Honor `X-Retry-After` on 429 responses. Sign-in is limited to three attempts per ten seconds and an MFA sign-in attempt expires after ten minutes.
- For forgotten passwords, collect the email and display the same confirmation whether the account exists or not. The reset link available on `/code` opens the new-password page with the token via `redirectTo?token=…`. Show clear errors for invalid, expired, or used links. Expose the reset email at `/email`. The exercise uses simulated email and authenticator data. Use `/code` to see current app codes, last email codes, recovery codes, and latest reset links.
- Provide clear localized loading and server error states even though Figma has no mockups for them. Handle `INVALID_EMAIL_OR_PASSWORD` (401), `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` (422), `INVALID_CODE` (401), `INVALID_TWO_FACTOR_COOKIE` (401), `INVALID_TOKEN` (400), and rate limiting (429).
- Build the background company cards using the supplied sector list, colors, icons, `SectorTag`, and `CompanyStatus`. Create the server endpoint and its data for the card name, description, sectors, and status. Make the page and fleet overlay responsive and verify at 1920×1080 and 1400×900.
- Verify the seeded no-MFA, app-only, app + email, and email-only flows using `none@example.com`, `app@example.com`, `both@example.com`, and `email@example.com`. All MFA accounts have recovery codes. See the README for the shared test password.

## Collaboration & Architectural Gate
- **Propose Before Implementing:** For every task or phase, inspect the relevant files/Figma frames first, then present a concise architectural proposal (folder structure, routing/state strategy, key libraries, and trade-offs) and **wait for my explicit approval** before modifying or creating code.
- **No Micromanagement Needed:** Derive exact requirements from Cas pratique.pdf, README.md, and Figma rather than waiting to be told implementation details.
- **Post-Change Walkthrough:** After implementing an approved step, briefly summarize what changed, why each architectural choice was made, and how to test it.
