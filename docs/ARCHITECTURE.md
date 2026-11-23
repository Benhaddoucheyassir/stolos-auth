# Stolos architecture decisions

## Milestone 1 · Internationalization and company cards

### Locale routing

- The URL determines the language. Intlayer builds typed dictionaries for French and English. French is the default.
- Next.js redirects / and /login to /fr/login, preserving query parameters. The localized root layout validates the locale, sets the document language, and provides Intlayer context. The exact /code route has its own utility layout in English.
- /email is internally rewritten to /fr/email by default or /en/email for ?locale=en. Both localized paths also work directly and take their language from the path. The shared preview shows the translated reset email copy and links to the existing /code helper for the generated reset link.
- Auth screen dictionaries follow their features. Future auth work should preserve the active locale in links and Better Auth reset callbacks and map server error codes to localized messages.

### Company cards

- The dataset lives in a server-only TypeScript module. Records use stable IDs and existing sector and status identifiers. Only the descriptions vary between the two API responses.
- GET /api/company-cards accepts an optional locale parameter. It defaults to fr and returns HTTP 400 for unsupported values. The response has a cards array with id, name, description, sectors, and status fields. This public read-only endpoint supplies the pre-authentication background.
- The login screen loads cards with TanStack Query using a locale-specific key. Intlayer translates sector and status identifiers at render time. The card query runs independently of the auth card.

## Milestone 2 · Shared auth shell and credentials

### Figma reference and layout

- Implemented from [Connexion](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=490-960) and [Inscription](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=498-665). The shared shell uses the SVG export of the 169 × 167 Stolos logo node, both exported glow assets, and the frame background color #1c1835. The foreground fits within 595 px and compresses its vertical spacing at shorter heights.
- Both frames contain eight visible instances of the same Doctolib example. To honor the six-card requirement, retain the top, third, and bottom placements on each edge, with the measured offsets and 552 × 160 card geometry. The six records come from the company API. The backdrop uses the Figma company icon, French description and the Santé, Logiciel, and IA labels. The left cards are Fermée, unbadged, and Vendue from top to bottom. The three retained right cards are Fermée, with the badges beyond the viewport edge at the reference width. These are exercise fixtures.
- The French headings, form captions, tab labels, and footer strings follow Figma. The Connexion submit button reads Se connecter. The Inscription frame uses “Créer mon compte” and expects email, password, and confirmation. Better Auth requires a name, so sign-up uses the email local part as the initial name. The password confirmation stays in the form.

### State and auth integration

- The locale-aware login page renders a shared AuthShell and one glass AuthCard. The company query runs independently of the form, keyed by locale. Component-prefixed CSS classes hold layout coordinates and work with the starter Turbopack stylesheet loader. Intlayer resolves sector and status labels.
- The accessible tabs select independent React Hook Form instances with Zod schemas. Switching preserves email drafts and clears passwords and stale errors. Better Auth handles credential submission. The UI maps duplicate email to its field, displays incorrect credentials and unexpected failures at form level, and respects the server retry header when available.
- A successful credential submission navigates to the localized account route, which checks the session on the server. If Better Auth requests MFA, the selected methods move into verification handoff state in the same card. The legal captions are present, and their destinations were not provided in the frames.

## Milestone 3 · Two-factor verification and recovery

- The shared shell and glass card stay mounted. The content follows the [authenticator](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=496-18), [authenticator and email](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=496-363), [email](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=496-709), and [recovery](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=512-715) frames. Intlayer provides both locales, including error and pending messages.
- Better Auth's returned methods select the available modes. App plus email starts in app mode and requests email explicitly. Email-only sends once on entry. Returning from recovery resumes the previously selected verification method. A request guard serializes sends and verifications. Successful verification opens the localized account page, which checks the session on the server.
- The six digit boxes handle keyboard focus and accept a complete paste from any position. Completion is submitted from the input event once per entry. Invalid or expired codes clear the boxes and focus the first one. Recovery uses an explicit submit and delegates single-use enforcement to Better Auth.
- Session storage retains the pending challenge identifier, available methods, active mode, and send-attempt markers. The identifier namespaces the local storage resend deadline so separate sign-ins have separate timers. The initial send is recorded before dispatch. A successful send starts a fresh 30-second countdown, and send-side HTTP 429 reconciles the deadline with the response's X-Retry-After header. A verification-side 429 uses a separate countdown. Codes and passwords remain in memory only.
- Leaving for sign-in, completing MFA, or receiving INVALID_TWO_FACTOR_COOKIE clears the persisted challenge and its resend deadline. Better Auth's cookie remains authoritative. An expired challenge displays a localized sign-in action.

## Milestone 4 · Password reset

- The localized login links to the shared-panel flow at /fr/forgot-password or /en/forgot-password. The [request](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=497-52) and [confirmation](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=498-60) views share one mounted AuthShell. Better Auth receives an absolute redirectTo built from the browser origin and the locale-specific /reset-password path. Confirmation uses the same copy for every accepted address.
- Session storage restores the confirmation recipient. Local storage holds the absolute resend deadline under a password-reset key per normalized address. Accepted sends start a 30-second cooldown. HTTP 429 updates the deadline from X-Retry-After when present. Explicit navigation back to sign-in clears the confirmation and preserves the cooldown.
- The [new-password screen](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=498-357) reads the query in a Suspense boundary. Missing tokens, Better Auth's error redirect, and INVALID_TOKEN from the save operation present a direct request-new-link action. The shared password fields use the eight-character minimum and matching confirmation. On success, the page clears the saved reset confirmation and any leftover MFA challenge, then replaces the URL with the localized login on its default Connexion tab.
- The [email template](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=500-97) is shared by /email, /email?locale=en, and the localized email routes. Development preview accepts an explicitly selected seeded account and uses its latest PASSWORD_RESET record from the same DevMail data as /code. The button and visible URL use that stored link. A plain visit renders the example template. The auth backend and /code remain the source of the reset link.
